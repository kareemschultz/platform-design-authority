import { describe, expect, test } from "bun:test";
import type { OutboxAppendPort, OutboxEvent } from "./index";

describe("OutboxAppendPort", () => {
	test("keeps the canonical envelope intact at the boundary", async () => {
		let observedId = "";
		const port: OutboxAppendPort = {
			append: (envelope) => {
				observedId = envelope.id;
				return Promise.resolve("inserted");
			},
		};
		const event: OutboxEvent = {
			classification: "Internal",
			data: {},
			id: "evt_01K0PERSISTENCE",
			name: "platform.membership.activated.v1",
			occurredAt: "2026-07-13T00:00:00.000Z",
			producerNamespace: "platform",
			retentionClass: "platform-security-evidence",
			schemaRef: "schemas/events/platform.membership.activated.v1.schema.json",
			schemaVersion: "1.0.0",
			tenantId: "tenant_demo",
		};

		expect(await port.append(event)).toBe("inserted");
		expect(observedId).toBe(event.id);
	});
});
