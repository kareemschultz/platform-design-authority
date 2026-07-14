import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
	type AuditPrivacyOverlay,
	type AuditRepository,
	type AuditStoredRecord,
	createAuditApplication,
	retentionDisposition,
} from "./index";

function digest(value: string): Promise<string> {
	return Promise.resolve(createHash("sha256").update(value).digest("hex"));
}

const ERASED_ACTOR = /^erased_/u;

function harness() {
	const records: AuditStoredRecord[] = [];
	const overlays: AuditPrivacyOverlay[] = [];
	const repository: AuditRepository = {
		addPrivacyOverlay(overlay) {
			const index = overlays.findIndex(
				(item) =>
					item.scopeKey === overlay.scopeKey &&
					item.subjectType === overlay.subjectType &&
					item.subjectDigest === overlay.subjectDigest
			);
			if (index >= 0) {
				overlays[index] = overlay;
			} else {
				overlays.push(overlay);
			}
			return Promise.resolve();
		},
		findBySourceEvent: (sourceEventId) =>
			Promise.resolve(
				records.find((record) => record.sourceEventId === sourceEventId) ?? null
			),
		getScopeHead: (scopeKey) =>
			Promise.resolve(
				records
					.filter((record) => record.scopeKey === scopeKey)
					.sort((left, right) => right.sequence - left.sequence)[0] ?? null
			),
		insert(record) {
			if (
				record.sourceEventId &&
				records.some((item) => item.sourceEventId === record.sourceEventId)
			) {
				return Promise.resolve("duplicate");
			}
			records.push(record);
			return Promise.resolve("inserted");
		},
		listPrivacyOverlays: (scopeKey) =>
			Promise.resolve(overlays.filter((item) => item.scopeKey === scopeKey)),
		listScopeRecords: (scopeKey) =>
			Promise.resolve(records.filter((record) => record.scopeKey === scopeKey)),
		listTenant: (query) =>
			Promise.resolve(
				records.filter(
					(record) =>
						record.scopeType === "Tenant" &&
						record.tenantId === query.tenantId &&
						(!query.action || record.action === query.action) &&
						(!query.actorUserId || record.actorUserId === query.actorUserId) &&
						(!query.occurredAfter ||
							record.occurredAt >= query.occurredAfter) &&
						(!query.occurredBefore || record.occurredAt <= query.occurredBefore)
				)
			),
		lockScope: () => Promise.resolve(),
	};
	let id = 0;
	const createAuditId = (kind: "record" | "privacy-overlay") => {
		id += 1;
		return `audit_${kind.replace("-", "_")}_${String(id).padStart(6, "0")}`;
	};
	const application = createAuditApplication({
		clock: () => new Date("2026-07-13T12:00:00.000Z"),
		hasher: { digest },
		ids: {
			create: createAuditId,
		},
		repository,
		unitOfWork: { execute: (operation) => operation(repository) },
	});
	return { application, overlays, records, repository };
}

describe("Platform Audit", () => {
	test("redacts prohibited content at write and maintains a valid chain", async () => {
		const { application, records } = harness();
		await application.append({
			action: "platform.role-assignment.granted.v1",
			actorType: "human",
			actorUserId: "auth_user_audit_0001",
			changeSummary: {
				nested: { password: "not-for-audit" },
				note: "safe",
			},
			classification: "Restricted",
			correlationId: "correlation_audit_append_0001",
			metadata: { authorization: "Bearer secret-token", safe: true },
			occurredAt: new Date("2026-07-13T11:00:00.000Z"),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetId: "role_assignment_0001",
			targetType: "RoleAssignment",
			tenantId: "tenant_audit_a",
		});
		expect(records[0]?.metadata).toEqual({
			authorization: "[REDACTED]",
			safe: true,
		});
		expect(records[0]?.changeSummary).toEqual({
			nested: { password: "[REDACTED]" },
			note: "safe",
		});
		expect(
			await application.verifyScope({
				scopeType: "Tenant",
				tenantId: "tenant_audit_a",
			})
		).toBe(true);
	});

	test("detects tampering without exposing a mutation API", async () => {
		const { application, records } = harness();
		await application.append({
			action: "platform.membership.suspended.v1",
			actorType: "human",
			classification: "Restricted",
			correlationId: "correlation_audit_tamper_0001",
			occurredAt: new Date("2026-07-13T11:00:00.000Z"),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetType: "Membership",
			tenantId: "tenant_audit_a",
		});
		if (records[0]) {
			records[0].outcome = "failure";
		}
		expect(
			await application.verifyScope({
				scopeType: "Tenant",
				tenantId: "tenant_audit_a",
			})
		).toBe(false);
	});

	test("ingests a platform event idempotently without fabricated tenant scope", async () => {
		const { application, records } = harness();
		const event = {
			actorId: "auth_user_audit_0001",
			aggregateId: "session_audit_0001",
			classification: "Confidential",
			correlationId: "correlation_audit_event_0001",
			data: {
				authUserId: "auth_user_audit_0001",
				current: true,
				reasonCode: "user_requested",
				revokedAt: "2026-07-13T11:00:00.000Z",
				sessionId: "session_audit_0001",
			},
			id: "event_audit_session_0001",
			name: "platform.session.revoked.v1",
			occurredAt: "2026-07-13T11:00:00.000Z",
			producerNamespace: "platform",
			publishedAt: "2026-07-13T11:00:01.000Z",
			retentionClass: "platform-security-evidence",
			schemaRef: "schemas/events/platform.session.revoked.v1.schema.json",
			schemaVersion: "1.0.0",
			scopeType: "Platform" as const,
		};
		await application.ingestEvent(event);
		await application.ingestEvent(event);
		expect(records).toHaveLength(1);
		expect(records[0]).toMatchObject({
			scopeKey: "platform",
			scopeType: "Platform",
		});
		expect(records[0]).not.toHaveProperty("tenantId");
	});

	test("audits audit access and cannot cross tenant or include platform evidence", async () => {
		const { application } = harness();
		await Promise.all(
			["tenant_audit_a", "tenant_audit_b"].map((tenantId) =>
				application.append({
					action: "test.action",
					actorType: "service",
					classification: "Internal",
					correlationId: `correlation_${tenantId}`,
					occurredAt: new Date("2026-07-13T10:00:00.000Z"),
					outcome: "success",
					retentionClass: "test",
					scopeType: "Tenant",
					sourceChannel: "test",
					targetType: "Test",
					tenantId,
				})
			)
		);
		await application.ingestEvent({
			classification: "Confidential",
			data: {},
			id: "event_global_audit_0001",
			name: "platform.session.revoked.v1",
			occurredAt: "2026-07-13T10:00:00.000Z",
			producerNamespace: "platform",
			publishedAt: "2026-07-13T10:00:01.000Z",
			retentionClass: "test",
			schemaRef: "schemas/events/platform.session.revoked.v1.schema.json",
			schemaVersion: "1.0.0",
			scopeType: "Platform",
		});
		const page = await application.listTenant({
			actorUserId: "auth_user_audit_reader_0001",
			correlationId: "correlation_audit_read_0001",
			page: { limit: 50, tenantId: "tenant_audit_a" },
		});
		expect(page.items.every((item) => item.scopeType === "Tenant")).toBe(true);
		expect(page.items.every((item) => item.tenantId === "tenant_audit_a")).toBe(
			true
		);
		expect(
			page.items.some((item) => item.action === "platform.audit-records.read")
		).toBe(true);
	});

	test("applies an irreversible privacy overlay and appends transformation evidence", async () => {
		const { application, records } = harness();
		await application.append({
			action: "test.identity.action",
			actorType: "human",
			actorUserId: "auth_user_erasure_0001",
			classification: "Restricted",
			correlationId: "correlation_audit_privacy_0001",
			occurredAt: new Date("2026-07-13T10:00:00.000Z"),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetType: "Identity",
			tenantId: "tenant_audit_a",
		});
		await application.applyPrivacyTransformation({
			actorUserId: "auth_user_privacy_admin_0001",
			correlationId: "correlation_audit_privacy_0002",
			privacyCaseId: "privacy_case_audit_0001",
			scope: { scopeType: "Tenant", tenantId: "tenant_audit_a" },
			subjectId: "auth_user_erasure_0001",
			subjectType: "AuthUser",
			transformationVersion: "1.0.0",
		});
		const page = await application.listTenant({
			actorUserId: "auth_user_audit_reader_0001",
			correlationId: "correlation_audit_read_0002",
			page: {
				action: "test.identity.action",
				limit: 50,
				tenantId: "tenant_audit_a",
			},
		});
		expect(page.items[0]?.actorUserId).toMatch(ERASED_ACTOR);
		expect(page.items[0]?.privacyCaseId).toBe("privacy_case_audit_0001");
		expect(
			records.some((record) => record.action.includes("privacy-transformed"))
		).toBe(true);
	});

	test("retention never treats a held record as deletion-eligible", () => {
		expect(
			retentionDisposition(
				{ legalHoldId: "hold_audit_0001", retentionUntil: null },
				new Date("2026-07-13T12:00:00.000Z")
			)
		).toBe("legal_hold");
		expect(
			retentionDisposition(
				{ retentionUntil: new Date("2027-07-13T00:00:00.000Z") },
				new Date("2026-07-13T12:00:00.000Z")
			)
		).toBe("retain");
	});
});
