import { describe, expect, test } from "bun:test";
import type { CapabilityId } from "@meridian/contracts-capabilities";

import {
	createEntitlementApplication,
	createEntitlementEvaluator,
	EntitlementError,
	type EntitlementRecord,
	type EntitlementRepository,
} from "./index";

const now = new Date("2026-07-14T12:00:00.000Z");

function entitlement(
	capabilityId: CapabilityId,
	overrides: Partial<EntitlementRecord> = {}
): EntitlementRecord {
	return {
		capabilityId,
		dependencies: [],
		exclusions: [],
		id: `entitlement_${capabilityId.replace(".", "_")}`,
		limits: {},
		source: "Migration",
		startsAt: new Date("2026-07-01T00:00:00.000Z"),
		state: "Active",
		tenantId: "tenant_entitlement_test",
		version: 1,
		...overrides,
	};
}

describe("current entitlement policy", () => {
	test("reloads current state, honors organization overrides, and denies stale grants", async () => {
		let records: EntitlementRecord[] = [
			entitlement("commerce.pos"),
			entitlement("commerce.pos", {
				id: "entitlement_pos_org",
				organizationId: "organization_entitlement_test",
				state: "Suspended",
			}),
		];
		let loads = 0;
		const evaluator = createEntitlementEvaluator({
			clock: () => now,
			state: {
				load() {
					loads += 1;
					return Promise.resolve(records);
				},
			},
		});

		expect(
			await evaluator.decide({
				access: "Read",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "allow" });
		expect(
			await evaluator.decide({
				access: "Read",
				capabilityId: "commerce.pos",
				organizationId: "organization_entitlement_test",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "deny", reason: "inactive" });

		records = [entitlement("commerce.pos", { state: "Revoked" })];
		expect(
			await evaluator.decide({
				access: "Read",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "deny", reason: "inactive" });
		records = [
			entitlement("commerce.pos", {
				startsAt: new Date("2026-07-15T00:00:00.000Z"),
			}),
		];
		expect(
			await evaluator.decide({
				access: "Read",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "deny", reason: "not_started" });
		records = [
			entitlement("commerce.pos", {
				endsAt: new Date("2026-07-14T12:00:00.000Z"),
			}),
		];
		expect(
			await evaluator.decide({
				access: "Read",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "deny", reason: "expired" });
		expect(loads).toBe(5);
	});

	test("enforces dependencies, exclusions, hard limits, and grace read-only state", async () => {
		const evaluator = createEntitlementEvaluator({
			clock: () => now,
			state: {
				load() {
					return Promise.resolve([
						entitlement("platform.authorization"),
						entitlement("catalog.products"),
						entitlement("commerce.pos", {
							dependencies: ["platform.authorization"],
							exclusions: ["catalog.products"],
							limits: { locations: 2 },
							state: "Grace",
						}),
					]);
				},
			},
		});
		expect(
			await evaluator.decide({
				access: "Read",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "deny", reason: "excluded" });

		const graceEvaluator = createEntitlementEvaluator({
			clock: () => now,
			state: {
				load() {
					return Promise.resolve([
						entitlement("platform.authorization"),
						entitlement("commerce.pos", {
							dependencies: ["platform.authorization"],
							limits: { locations: 2 },
							state: "Grace",
						}),
					]);
				},
			},
		});
		expect(
			await graceEvaluator.decide({
				access: "Write",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "allow_read_only" });
		expect(
			await graceEvaluator.decide({
				access: "Read",
				capabilityId: "commerce.pos",
				projectedUsage: { locations: 3 },
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "deny", reason: "limit_reached" });
		const graceDependencyEvaluator = createEntitlementEvaluator({
			clock: () => now,
			state: {
				load: () =>
					Promise.resolve([
						entitlement("platform.authorization", { state: "Grace" }),
						entitlement("commerce.pos", {
							dependencies: ["platform.authorization"],
						}),
					]),
			},
		});
		expect(
			await graceDependencyEvaluator.decide({
				access: "Write",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).toMatchObject({ outcome: "deny", reason: "dependency_missing" });
		await expect(
			graceEvaluator.requireEntitlement({
				access: "Write",
				capabilityId: "commerce.pos",
				tenantId: "tenant_entitlement_test",
			})
		).rejects.toBeInstanceOf(EntitlementError);
	});

	test("keeps entitlement inspection permission separate from runtime access", async () => {
		const rows = [entitlement("platform.entitlements")];
		const repository = {
			list() {
				return Promise.resolve({ items: rows, nextCursor: null });
			},
		} as unknown as EntitlementRepository;
		let permissionOutcome: "allow" | "deny" = "deny";
		const application = createEntitlementApplication({
			activeContexts: {
				requireActiveContext() {
					return Promise.resolve({
						organizationId: "organization_entitlement_test",
						tenantId: "tenant_entitlement_test",
					});
				},
			},
			permissions: {
				requirePermission() {
					return Promise.resolve(
						permissionOutcome === "allow"
							? {
									matchedAssignments: ["assignment_entitlement_test"],
									outcome: "allow" as const,
									permission: "platform.entitlement.read",
								}
							: { outcome: "deny" as const, reason: "no_assignment" as const }
					);
				},
			},
			repository,
		});
		await expect(
			application.list({
				authUserId: "user_entitlement_test",
				contextId: "context_entitlement_test",
				page: { limit: 50 },
				sessionId: "session_entitlement_test",
			})
		).rejects.toMatchObject({ code: "authorization_denied" });
		permissionOutcome = "allow";
		expect(
			await application.list({
				authUserId: "user_entitlement_test",
				contextId: "context_entitlement_test",
				page: { limit: 50 },
				sessionId: "session_entitlement_test",
			})
		).toMatchObject({ items: [{ capabilityId: "platform.entitlements" }] });
	});
});
