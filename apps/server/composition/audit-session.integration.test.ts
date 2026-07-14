import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import type { EventEnvelope } from "@meridian/contracts-events";
import { createAuditRepository } from "@meridian/persistence-platform-audit-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import {
	createIdentityPersistence,
	createIdentitySessionRepository,
} from "@meridian/persistence-platform-identity-postgres";
import { createAuditApplication } from "@meridian/platform-audit";
import {
	createIdentityAuth,
	createIdentitySessionApplication,
} from "@meridian/platform-identity";
import { env } from "@meridian/tooling-env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { Pool } from "pg";
import type {
	IdentitySessionService,
	PermissionAuthorizer,
	ServerApplication,
} from "../src/context";
import { createContext } from "../src/context";
import { appRouter } from "../src/router";
import { runMigrationStreams } from "./migrations";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_pr7_${randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const databaseUrl = new URL(env.DATABASE_URL);
databaseUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
const ERASED_ACTOR = /^erased_/u;
const SESSION_COOKIE_PATTERN = /better-auth\.session_token=([^;]+)/u;
let pool: Pool;

const testAuthorizer = {
	decide: () => Promise.resolve({ outcome: "deny", reason: "no_assignment" }),
	requirePermission: () =>
		Promise.resolve({ outcome: "deny", reason: "no_assignment" }),
} as PermissionAuthorizer;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function sha256(value: string): Promise<string> {
	return Promise.resolve(createHash("sha256").update(value).digest("hex"));
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	pool = new Pool({
		allowExitOnIdle: true,
		connectionString: databaseUrl.toString(),
		max: 8,
	});
	await runMigrationStreams(pool);
	await pool.query(
		`INSERT INTO "user" (id, email, email_verified, name) VALUES
		 ('auth_user_pr7_owner_0001', 'owner.pr7@example.com', true, 'PR7 Owner'),
		 ('auth_user_pr7_other_0001', 'other.pr7@example.com', true, 'PR7 Other')`
	);
});

afterAll(async () => {
	await pool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

function sessionApplication(options?: { failOutbox?: boolean }) {
	const createEventId = () =>
		`event_session_pr7_${randomUUID().replaceAll("-", "")}`;
	return createIdentitySessionApplication({
		clock: () => new Date(),
		fingerprint: sha256,
		ids: {
			create: createEventId,
		},
		repository: createIdentitySessionRepository(pool),
		unitOfWork: createPostgresUnitOfWork(pool, (client) => ({
			events: options?.failOutbox
				? {
						append: () => Promise.reject(new Error("simulated outbox failure")),
					}
				: createPostgresOutbox(client),
			repository: createIdentitySessionRepository(client),
		})),
	});
}

async function readPublishedOutboxEvent(
	idempotencyKey: string
): Promise<EventEnvelope> {
	const result = await pool.query<{
		actorId: string | null;
		aggregateId: string | null;
		capabilityId: string | null;
		causationId: string | null;
		classification: string;
		correlationId: string | null;
		data: Record<string, unknown>;
		id: string;
		legalEntityId: null;
		locationId: null;
		name: string;
		occurredAt: Date;
		organizationId: null;
		producerNamespace: string;
		purpose: string | null;
		retentionClass: string;
		schemaRef: string;
		schemaVersion: string;
		scopeType: "Platform";
		sourceChannel: string | null;
		traceId: string | null;
	}>(
		`SELECT actor_id AS "actorId", aggregate_id AS "aggregateId",
		 capability_id AS "capabilityId", causation_id AS "causationId",
		 classification, correlation_id AS "correlationId", data, id,
		 legal_entity_id AS "legalEntityId", location_id AS "locationId", name,
		 occurred_at AS "occurredAt", organization_id AS "organizationId",
		 producer_namespace AS "producerNamespace", purpose,
		 retention_class AS "retentionClass", schema_ref AS "schemaRef",
		 schema_version AS "schemaVersion", scope_type AS "scopeType",
		 source_channel AS "sourceChannel", trace_id AS "traceId"
		 FROM platform_event_outbox WHERE idempotency_key = $1`,
		[idempotencyKey]
	);
	const [row] = result.rows;
	if (!row) {
		throw new Error("Expected the committed outbox event");
	}
	return {
		...row,
		occurredAt: row.occurredAt.toISOString(),
		publishedAt: new Date().toISOString(),
		scopeType: "Platform",
	};
}

function auditApplication() {
	let id = 0;
	const createAuditId = (kind: "record" | "privacy-overlay") => {
		id += 1;
		return `audit_${kind.replace("-", "_")}_pr7_${String(id).padStart(8, "0")}`;
	};
	const repository = createAuditRepository(pool);
	return createAuditApplication({
		clock: () => new Date(),
		hasher: { digest: sha256 },
		ids: {
			create: createAuditId,
		},
		repository,
		unitOfWork: createPostgresUnitOfWork(pool, (client) =>
			createAuditRepository(client)
		),
	});
}

async function insertSession(input: {
	id: string;
	ipAddress?: string;
	token: string;
	userAgent?: string;
	userId?: string;
}) {
	await pool.query(
		`INSERT INTO session (id, token, user_id, expires_at, ip_address, user_agent, updated_at)
		 VALUES ($1, $2, $3, now() + interval '1 day', $4, $5, now())`,
		[
			input.id,
			input.token,
			input.userId ?? "auth_user_pr7_owner_0001",
			input.ipAddress ?? null,
			input.userAgent ?? null,
		]
	);
}

describe("PR7 session revocation and Audit persistence", () => {
	test("lists safe account-owned summaries and hides raw client evidence", async () => {
		await insertSession({
			id: "session_pr7_safe_0001",
			ipAddress: "198.51.100.44",
			token: "token-pr7-safe-0001",
			userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/140.0.0.0",
		});
		await insertSession({
			id: "session_pr7_other_0001",
			token: "token-pr7-other-0001",
			userId: "auth_user_pr7_other_0001",
		});
		const page = await sessionApplication().list({
			authUserId: "auth_user_pr7_owner_0001",
			currentSessionId: "session_pr7_safe_0001",
			page: { limit: 50 },
		});
		expect(
			page.items.some((item) => item.id === "session_pr7_other_0001")
		).toBe(false);
		const serialized = JSON.stringify(page);
		expect(serialized).toContain("198.51.100.x");
		expect(serialized).not.toContain("198.51.100.44");
		expect(serialized).not.toContain("140.0.0.0");
		expect(serialized).not.toContain("token-pr7");
	});

	test("rolls back the revocation and receipt if durable outbox evidence fails", async () => {
		await insertSession({
			id: "session_pr7_rollback_0001",
			token: "token-pr7-rollback-0001",
		});
		let failure: unknown;
		try {
			await sessionApplication({ failOutbox: true }).revoke({
				authUserId: "auth_user_pr7_owner_0001",
				correlationId: "correlation_pr7_rollback_0001",
				currentSessionId: "session_pr7_safe_0001",
				idempotencyKey: "idempotency_pr7_rollback_0001",
				sessionId: "session_pr7_rollback_0001",
			});
		} catch (error) {
			failure = error;
		}
		expect((failure as Error).message).toBe("simulated outbox failure");
		const result = await pool.query<{ receipts: number; sessions: number }>(
			`SELECT
			 (SELECT count(*)::int FROM session WHERE id = 'session_pr7_rollback_0001') AS sessions,
			 (SELECT count(*)::int FROM platform_identity_session_command_receipt WHERE idempotency_key = 'idempotency_pr7_rollback_0001') AS receipts`
		);
		expect(result.rows[0]).toEqual({ receipts: 0, sessions: 1 });
	});

	test("commits one platform-scoped revocation fact and is idempotent", async () => {
		await insertSession({
			id: "session_pr7_revoke_0001",
			token: "token-pr7-revoke-0001",
		});
		const application = sessionApplication();
		const input = {
			authUserId: "auth_user_pr7_owner_0001",
			correlationId: "correlation_pr7_revoke_0001",
			currentSessionId: "session_pr7_safe_0001",
			idempotencyKey: "idempotency_pr7_revoke_0001",
			sessionId: "session_pr7_revoke_0001",
		};
		await application.revoke(input);
		await application.revoke(input);
		const result = await pool.query<{
			outbox: number;
			receipts: number;
			sessions: number;
			scope_type: string | null;
			tenant_id: string | null;
		}>(
			`SELECT
			 (SELECT count(*)::int FROM session WHERE id = 'session_pr7_revoke_0001') AS sessions,
			 (SELECT count(*)::int FROM platform_identity_session_command_receipt WHERE idempotency_key = 'idempotency_pr7_revoke_0001') AS receipts,
			 (SELECT count(*)::int FROM platform_event_outbox WHERE idempotency_key = 'idempotency_pr7_revoke_0001') AS outbox,
			 (SELECT scope_type FROM platform_event_outbox WHERE idempotency_key = 'idempotency_pr7_revoke_0001') AS scope_type,
			 (SELECT tenant_id FROM platform_event_outbox WHERE idempotency_key = 'idempotency_pr7_revoke_0001') AS tenant_id`
		);
		expect(result.rows[0]).toEqual({
			outbox: 1,
			receipts: 1,
			scope_type: "Platform",
			sessions: 0,
			tenant_id: null,
		});
	});

	test("does not revoke another account's session and rejects invalid mixed scope", async () => {
		await sessionApplication().revoke({
			authUserId: "auth_user_pr7_owner_0001",
			correlationId: "correlation_pr7_other_0001",
			currentSessionId: "session_pr7_safe_0001",
			idempotencyKey: "idempotency_pr7_other_0001",
			sessionId: "session_pr7_other_0001",
		});
		const other = await pool.query(
			"SELECT id FROM session WHERE id = 'session_pr7_other_0001'"
		);
		expect(other.rowCount).toBe(1);
		let invalidScopeFailure: unknown;
		try {
			await pool.query(
				`INSERT INTO platform_event_outbox
				 (id, name, occurred_at, tenant_id, scope_type, producer_namespace, schema_version, schema_ref, classification, retention_class, data)
				 VALUES ('event_invalid_scope_0001', 'platform.session.revoked.v1', now(), 'tenant_fake', 'Platform', 'platform', '1.0.0', 'schemas/events/platform.session.revoked.v1.schema.json', 'Confidential', 'test', '{}'::jsonb)`
			);
		} catch (error) {
			invalidScopeFailure = error;
		}
		expect(invalidScopeFailure).toBeInstanceOf(Error);
	});

	test("measures database-current revocation propagation below the 60 second p95 budget", async () => {
		const application = sessionApplication();
		const measureSample = async (index: number) => {
			const suffix = String(index).padStart(4, "0");
			const sessionId = `session_pr7_latency_${suffix}`;
			await insertSession({
				id: sessionId,
				token: `token-pr7-latency-${suffix}`,
			});
			const started = performance.now();
			await application.revoke({
				authUserId: "auth_user_pr7_owner_0001",
				correlationId: `correlation_pr7_latency_${suffix}`,
				currentSessionId: "session_pr7_safe_0001",
				idempotencyKey: `idempotency_pr7_latency_${suffix}`,
				sessionId,
			});
			const current = await pool.query("SELECT 1 FROM session WHERE id = $1", [
				sessionId,
			]);
			expect(current.rowCount).toBe(0);
			return performance.now() - started;
		};
		const samples = await Promise.all(
			Array.from({ length: 40 }, (_, index) => measureSample(index))
		);
		samples.sort((left, right) => left - right);
		const p50 =
			samples[Math.ceil(samples.length * 0.5) - 1] ?? Number.POSITIVE_INFINITY;
		const p95 =
			samples[Math.ceil(samples.length * 0.95) - 1] ?? Number.POSITIVE_INFINITY;
		const maximum = samples.at(-1) ?? Number.POSITIVE_INFINITY;
		expect(samples).toHaveLength(40);
		expect(p50).toBeLessThanOrEqual(p95);
		expect(p95).toBeLessThanOrEqual(maximum);
		expect(p95).toBeLessThanOrEqual(60_000);
	});

	test("measures independent protected-HTTP rejection after Better Auth session revocation", async () => {
		const auth = createIdentityAuth({
			authUrl: "http://localhost:3000",
			corsOrigin: "http://localhost:3001",
			displayName: "WS1 verification",
			nodeEnv: "test",
			persistence: createIdentityPersistence(pool),
			secret: "ws1-verification-secret-at-least-32-characters",
			sendTwoFactorOtp: () => Promise.reject(new Error("not configured")),
			trustedOrigins: ["http://localhost:3001"],
		});
		const identity: IdentitySessionService = {
			getSession: ({ headers }) => auth.api.getSession({ headers }),
		};
		const application = {
			getCurrentIdentity: ({
				authUserId,
				sessionId,
			}: {
				authUserId: string;
				sessionId: string;
			}) =>
				Promise.resolve({
					activeContext: null,
					assuranceLevel: "aal1" as const,
					authUserId,
					memberships: [],
					partyId: null,
					sessionId,
				}),
		} as unknown as ServerApplication;
		const api = new OpenAPIHandler(appRouter, {
			plugins: [
				new OpenAPIReferencePlugin({
					schemaConverters: [new ZodToJsonSchemaConverter()],
				}),
			],
		});
		const httpApp = new Hono();
		httpApp.use("/api-reference/*", async (context, next) => {
			const requestContext = await createContext({
				application,
				authorizer: testAuthorizer,
				context,
				identity,
			});
			const result = await api.handle(context.req.raw, {
				context: requestContext,
				prefix: "/api-reference",
			});
			if (result.matched) {
				return context.newResponse(result.response.body, result.response);
			}
			await next();
		});

		const revocationApplication = sessionApplication();
		const measureSample = async (index: number) => {
			const suffix = String(index).padStart(4, "0");
			const signUpResponse = await auth.handler(
				new Request("http://localhost:3000/api/auth/sign-up/email", {
					body: JSON.stringify({
						email: `independent-client.pr9.${suffix}@example.com`,
						name: `Independent Client ${suffix}`,
						password: "WS1-verification-password-0001",
					}),
					headers: { "content-type": "application/json" },
					method: "POST",
				})
			);
			expect(signUpResponse.status).toBe(200);
			const sessionCookie = signUpResponse.headers
				.get("set-cookie")
				?.match(SESSION_COOKIE_PATTERN)?.[1];
			expect(sessionCookie).toBeDefined();
			const cookieHeader = `better-auth.session_token=${sessionCookie}`;
			const authenticatedSession = await identity.getSession({
				headers: new Headers({ cookie: cookieHeader }),
			});
			expect(authenticatedSession).not.toBeNull();
			const beforeRevocation = await httpApp.request("/api-reference/v1/me", {
				headers: { cookie: cookieHeader },
			});
			expect(beforeRevocation.status).toBe(200);
			await revocationApplication.revoke({
				authUserId: authenticatedSession?.user.id ?? "",
				correlationId: `correlation_pr9_http_revocation_${suffix}`,
				currentSessionId: authenticatedSession?.session.id ?? "",
				idempotencyKey: `idempotency_pr9_http_revocation_${suffix}`,
				sessionId: authenticatedSession?.session.id ?? "",
			});
			const committedAt = performance.now();
			const afterRevocation = await httpApp.request("/api-reference/v1/me", {
				headers: { cookie: cookieHeader },
			});
			expect(afterRevocation.status).toBe(401);
			return performance.now() - committedAt;
		};
		const samples = await Promise.all(
			Array.from({ length: 40 }, (_, index) => measureSample(index))
		);
		samples.sort((left, right) => left - right);
		const p50 =
			samples[Math.ceil(samples.length * 0.5) - 1] ?? Number.POSITIVE_INFINITY;
		const p95 =
			samples[Math.ceil(samples.length * 0.95) - 1] ?? Number.POSITIVE_INFINITY;
		const maximum = samples.at(-1) ?? Number.POSITIVE_INFINITY;
		expect(samples).toHaveLength(40);
		expect(p50).toBeLessThanOrEqual(p95);
		expect(p95).toBeLessThanOrEqual(maximum);
		expect(p95).toBeLessThanOrEqual(60_000);
	}, 90_000);

	test("ingests the committed revocation outbox fact before tenant-isolated audit, privacy, and tamper checks", async () => {
		const application = auditApplication();
		await insertSession({
			id: "session_pr7_audit_chain_0001",
			token: "token-pr7-audit-chain-0001",
		});
		await sessionApplication().revoke({
			authUserId: "auth_user_pr7_owner_0001",
			correlationId: "correlation_pr7_audit_chain_0001",
			currentSessionId: "session_pr7_safe_0001",
			idempotencyKey: "idempotency_pr7_audit_chain_0001",
			sessionId: "session_pr7_audit_chain_0001",
		});
		const emittedRevocation = await readPublishedOutboxEvent(
			"idempotency_pr7_audit_chain_0001"
		);
		const ingestedRevocation = await application.ingestEvent(emittedRevocation);
		expect(ingestedRevocation.sourceEventId).toBe(emittedRevocation.id);
		expect(ingestedRevocation.changeSummary).toEqual(emittedRevocation.data);
		await application.append({
			action: "platform.role-assignment.granted.v1",
			actorType: "human",
			actorUserId: "auth_user_pr7_owner_0001",
			changeSummary: { password: "must-redact", safe: "kept" },
			classification: "Restricted",
			correlationId: "correlation_pr7_audit_a_0001",
			legalHoldId: "legal_hold_pr7_0001",
			metadata: { authorization: "Bearer must-redact" },
			occurredAt: new Date(),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetId: "role_assignment_pr7_0001",
			targetType: "RoleAssignment",
			tenantId: "tenant_pr7_a",
		});
		await application.append({
			action: "tenant-b-only",
			actorType: "service",
			classification: "Internal",
			correlationId: "correlation_pr7_audit_b_0001",
			occurredAt: new Date(),
			outcome: "success",
			retentionClass: "test",
			scopeType: "Tenant",
			sourceChannel: "test",
			targetType: "Test",
			tenantId: "tenant_pr7_b",
		});
		await application.applyPrivacyTransformation({
			actorUserId: "auth_user_pr7_owner_0001",
			correlationId: "correlation_pr7_privacy_0001",
			privacyCaseId: "privacy_case_pr7_0001",
			scope: { scopeType: "Tenant", tenantId: "tenant_pr7_a" },
			subjectId: "auth_user_pr7_owner_0001",
			subjectType: "AuthUser",
			transformationVersion: "1.0.0",
		});
		const page = await application.listTenant({
			actorUserId: "auth_user_pr7_owner_0001",
			correlationId: "correlation_pr7_audit_read_0001",
			page: { limit: 50, tenantId: "tenant_pr7_a" },
		});
		expect(page.items.every((item) => item.tenantId === "tenant_pr7_a")).toBe(
			true
		);
		expect(page.items.some((item) => item.action === "tenant-b-only")).toBe(
			false
		);
		expect(page.items.some((item) => item.scopeType === "Platform")).toBe(
			false
		);
		expect(
			page.items.some((item) => item.action === "platform.audit-records.read")
		).toBe(true);
		expect(
			page.items.find(
				(item) => item.action === "platform.role-assignment.granted.v1"
			)?.actorUserId
		).toMatch(ERASED_ACTOR);
		const raw = await pool.query<{
			change_summary: Record<string, unknown>;
			legal_hold_id: string | null;
			metadata: Record<string, unknown>;
		}>(
			"SELECT change_summary, metadata, legal_hold_id FROM platform_audit_record WHERE action = 'platform.role-assignment.granted.v1'"
		);
		expect(raw.rows[0]?.change_summary.password).toBe("[REDACTED]");
		expect(raw.rows[0]?.metadata.authorization).toBe("[REDACTED]");
		expect(raw.rows[0]?.legal_hold_id).toBe("legal_hold_pr7_0001");
		expect(
			await application.verifyScope({
				scopeType: "Tenant",
				tenantId: "tenant_pr7_a",
			})
		).toBe(true);
		await pool.query(
			"UPDATE platform_audit_record SET outcome = 'failure' WHERE action = 'platform.role-assignment.granted.v1'"
		);
		expect(
			await application.verifyScope({
				scopeType: "Tenant",
				tenantId: "tenant_pr7_a",
			})
		).toBe(false);
	});
});
