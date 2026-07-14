import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { createAuditRepository } from "@meridian/persistence-platform-audit-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createIdentitySessionRepository } from "@meridian/persistence-platform-identity-postgres";
import { createAuditApplication } from "@meridian/platform-audit";
import { createIdentitySessionApplication } from "@meridian/platform-identity";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";
import { runMigrationStreams } from "./migrations";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_pr7_${randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const databaseUrl = new URL(env.DATABASE_URL);
databaseUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
const ERASED_ACTOR = /^erased_/u;
let pool: Pool;

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
	let id = 0;
	const createEventId = () => {
		id += 1;
		return `event_session_pr7_${String(id).padStart(8, "0")}`;
	};
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
			Array.from({ length: 20 }, (_, index) => measureSample(index))
		);
		samples.sort((left, right) => left - right);
		const p95 =
			samples[Math.ceil(samples.length * 0.95) - 1] ?? Number.POSITIVE_INFINITY;
		expect(p95).toBeLessThanOrEqual(60_000);
	});

	test("persists tenant-isolated audit-of-access, privacy overlays, and tamper evidence", async () => {
		const application = auditApplication();
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
		await application.ingestEvent({
			actorId: "auth_user_pr7_owner_0001",
			classification: "Confidential",
			data: { sessionId: "session_pr7_revoke_0001" },
			id: "event_pr7_audit_global_0001",
			name: "platform.session.revoked.v1",
			occurredAt: new Date().toISOString(),
			producerNamespace: "platform",
			publishedAt: new Date().toISOString(),
			retentionClass: "platform-security-evidence",
			schemaRef: "schemas/events/platform.session.revoked.v1.schema.json",
			schemaVersion: "1.0.0",
			scopeType: "Platform",
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
