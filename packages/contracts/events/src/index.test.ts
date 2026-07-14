import { describe, expect, test } from "bun:test";
import type { EventEnvelope } from "./envelope";
import type { EventName } from "./index";
import { EVENT_NAMES, EVENT_OWNERS } from "./index";

const EVENT_NAME_PATTERN =
	/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.v[1-9][0-9]*$/;

describe("@meridian/contracts-events EVENT_NAMES", () => {
	test("every event name matches the canonical <namespace>.<entity>.<fact>.v<major> shape", () => {
		for (const name of EVENT_NAMES) {
			expect(name).toMatch(EVENT_NAME_PATTERN);
		}
	});

	test("every event name has a registered owner", () => {
		for (const name of EVENT_NAMES) {
			expect(EVENT_OWNERS[name]).toBeTruthy();
		}
	});
});

describe("EventEnvelope", () => {
	test("a sample envelope literal satisfies the EventEnvelope shape", () => {
		const sampleName: EventName = EVENT_NAMES[0];
		const sample: EventEnvelope<{ amount: number }> = {
			actorId: null,
			aggregateId: null,
			capabilityId: null,
			causationId: null,
			classification: "internal",
			correlationId: null,
			data: { amount: 100 },
			id: "evt_01HZY7X4K3QW9J2N6R8T0V5B1C",
			idempotencyKey: null,
			legalEntityId: null,
			locationId: null,
			name: sampleName,
			occurredAt: "2026-07-12T00:00:00.000Z",
			organizationId: null,
			producerNamespace: sampleName.split(".")[0] ?? sampleName,
			publishedAt: "2026-07-12T00:00:00.100Z",
			purpose: null,
			retentionClass: "platform-security-evidence",
			schemaRef: `schemas/events/${sampleName}.schema.json`,
			schemaVersion: "1.0.0",
			scopeType: "Tenant",
			sourceChannel: null,
			tenantId: "tenant_demo",
			traceId: null,
		};

		expect(sample.name).toBe(sampleName);
		expect(sample.data.amount).toBe(100);
	});

	test("represents a registered platform-global fact without fabricated tenant scope", () => {
		const sample: EventEnvelope<{ sessionId: string }> = {
			classification: "Confidential",
			data: { sessionId: "session_global_0001" },
			id: "evt_platform_session_revoked_0001",
			name: "platform.session.revoked.v1",
			occurredAt: "2026-07-13T00:00:00.000Z",
			producerNamespace: "platform",
			publishedAt: "2026-07-13T00:00:00.100Z",
			retentionClass: "platform-security-evidence",
			schemaRef: "schemas/events/platform.session.revoked.v1.schema.json",
			schemaVersion: "1.0.0",
			scopeType: "Platform",
		};

		expect(sample.tenantId).toBeUndefined();
	});
});
