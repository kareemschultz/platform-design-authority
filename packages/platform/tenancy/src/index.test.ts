import { describe, expect, test } from "bun:test";

import {
	createTenancyService,
	type EventAppendPort,
	type InvitationRecord,
	type MembershipRecord,
	type PendingEvent,
	type TenancyRepository,
} from "./index";

function serviceWith(
	repository: TenancyRepository,
	events: PendingEvent[] = []
) {
	let sequence = 0;
	const eventPort: EventAppendPort = {
		append(event) {
			events.push(event);
			return Promise.resolve("inserted");
		},
	};
	return createTenancyService({
		clock: () => new Date("2026-07-13T12:00:00.000Z"),
		contextTtlMs: 60_000,
		ids: {
			create(kind) {
				sequence += 1;
				return `${kind}_unit_${sequence}`;
			},
		},
		unitOfWork: {
			execute: (operation) => operation({ events: eventPort, repository }),
		},
	});
}

describe("Platform Tenancy application rules", () => {
	test("makes invitations idempotent without publishing contact data", async () => {
		const invitations = new Map<string, InvitationRecord>();
		const repository = {
			createInvitation(record: InvitationRecord, idempotencyKey: string) {
				invitations.set(idempotencyKey, record);
				return Promise.resolve(record);
			},
			getInvitationByIdempotency(_tenantId: string, idempotencyKey: string) {
				return Promise.resolve(invitations.get(idempotencyKey) ?? null);
			},
		} as unknown as TenancyRepository;
		const events: PendingEvent[] = [];
		const service = serviceWith(repository, events);
		const input = {
			actorUserId: "user_tenant_admin_0001",
			correlationId: "correlation_unit_0001",
			email: "Invitee@Example.Test",
			idempotencyKey: "idempotency_invite_0001",
			organizationId: "organization_unit_0001",
			roleIds: ["role_cashier_0001"],
			tenantId: "tenant_unit_test_0001",
		};

		const first = await service.createInvitation(input);
		const repeated = await service.createInvitation(input);

		expect(repeated.id).toBe(first.id);
		expect(first.email).toBe("invitee@example.test");
		expect(events).toHaveLength(1);
		expect(events[0]?.data).not.toHaveProperty("email");
		expect(events[0]?.data.inviteeReference).toBe(first.inviteeReference);
	});

	test("rejects idempotency-key reuse for a different invitation", async () => {
		const existing: InvitationRecord = {
			createdAt: new Date("2026-07-13T12:00:00.000Z"),
			email: "first@example.test",
			expiresAt: new Date("2026-07-15T12:00:00.000Z"),
			id: "invitation_unit_0001",
			inviteeReference: "invitee_reference_0001",
			organizationId: "organization_unit_0001",
			roleIds: [],
			state: "Pending",
			tenantId: "tenant_unit_test_0001",
		};
		const repository = {
			getInvitationByIdempotency: async () => existing,
		} as unknown as TenancyRepository;
		const service = serviceWith(repository);

		await expect(
			service.createInvitation({
				actorUserId: "user_tenant_admin_0001",
				correlationId: "correlation_unit_0002",
				email: "different@example.test",
				idempotencyKey: "idempotency_invite_0001",
				organizationId: "organization_unit_0001",
				roleIds: [],
				tenantId: "tenant_unit_test_0001",
			})
		).rejects.toMatchObject({ code: "idempotency_conflict" });
		await expect(
			service.createInvitation({
				actorUserId: "user_tenant_admin_0001",
				correlationId: "correlation_unit_0002",
				email: existing.email,
				idempotencyKey: "idempotency_invite_0001",
				organizationId: existing.organizationId,
				roleIds: ["role_changed_0001"],
				tenantId: existing.tenantId,
			})
		).rejects.toMatchObject({ code: "idempotency_conflict" });
	});

	test("supports separate tab contexts and validates selected locations", async () => {
		const membership: MembershipRecord = {
			authUserId: "user_multitab_000001",
			id: "membership_unit_0001",
			organizationId: "organization_unit_0001",
			roleAssignmentIds: [],
			state: "Active",
			tenantId: "tenant_unit_test_0001",
			version: 1,
		};
		const contexts = new Map<
			string,
			Awaited<
				ReturnType<ReturnType<typeof createTenancyService>["setActiveContext"]>
			>
		>();
		const repository = {
			getLocation: async (tenantId: string, locationId: string) =>
				tenantId === membership.tenantId &&
				locationId === "location_unit_test_0001"
					? {
							id: locationId,
							name: "Unit Store",
							organizationId: membership.organizationId,
							state: "Active" as const,
							tenantId,
							timezone: "America/Guyana",
							type: "Store" as const,
							version: 1,
						}
					: null,
			getMembershipForOrganization: async () => membership,
			getOrganization: async () => ({
				id: membership.organizationId,
				name: "Unit Organization",
				state: "Active" as const,
				tenantId: membership.tenantId,
				version: 1,
			}),
			getTenant: async () => ({
				id: membership.tenantId,
				name: "Unit Tenant",
				state: "Active" as const,
				version: 1,
			}),
			issueActiveContext: (
				record: Parameters<TenancyRepository["issueActiveContext"]>[0]
			) => {
				contexts.set(record.contextId, record);
				return Promise.resolve(record);
			},
		} as unknown as TenancyRepository;
		const service = serviceWith(repository);

		const tabOne = await service.setActiveContext({
			authUserId: membership.authUserId,
			idempotencyKey: "idempotency_context_0001",
			locationId: "location_unit_test_0001",
			organizationId: membership.organizationId,
			sessionId: "session_unit_test_0001",
		});
		const tabTwo = await service.setActiveContext({
			authUserId: membership.authUserId,
			idempotencyKey: "idempotency_context_0002",
			organizationId: membership.organizationId,
			sessionId: "session_unit_test_0001",
		});

		expect(tabOne.contextId).not.toBe(tabTwo.contextId);
		expect(contexts).toHaveLength(2);
		await expect(
			service.setActiveContext({
				authUserId: membership.authUserId,
				idempotencyKey: "idempotency_context_0003",
				locationId: "location_other_tenant_0001",
				organizationId: membership.organizationId,
				sessionId: "session_unit_test_0001",
			})
		).rejects.toMatchObject({ code: "wrong_tenant" });
		await expect(
			service.setActiveContext({
				authUserId: membership.authUserId,
				branchId: "branch_unvalidated_0001",
				idempotencyKey: "idempotency_context_0004",
				organizationId: membership.organizationId,
				sessionId: "session_unit_test_0001",
			})
		).rejects.toMatchObject({ code: "not_found" });
	});

	test("rejects expired active context during identity resolution", async () => {
		const repository = {
			getActiveContext: async () => ({
				authUserId: "user_context_owner_0001",
				contextId: "context_expired_0001",
				expiresAt: new Date("2026-07-13T11:59:59.000Z"),
				idempotencyKey: "idempotency_context_0005",
				issuedAt: new Date("2026-07-13T11:00:00.000Z"),
				organizationId: "organization_unit_0001",
				sessionId: "session_unit_test_0001",
				tenantId: "tenant_unit_test_0001",
			}),
		} as unknown as TenancyRepository;
		const service = serviceWith(repository);

		await expect(
			service.getCurrentIdentity({
				activeContextId: "context_expired_0001",
				assuranceLevel: "aal1",
				authUserId: "user_context_owner_0001",
				sessionId: "session_unit_test_0001",
			})
		).rejects.toMatchObject({ code: "context_expired" });
	});

	test("rejects a path user that does not own the tenant membership", async () => {
		const membership: MembershipRecord = {
			authUserId: "user_actual_owner_0001",
			id: "membership_unit_0001",
			organizationId: "organization_unit_0001",
			roleAssignmentIds: [],
			state: "Active",
			tenantId: "tenant_unit_test_0001",
			version: 1,
		};
		const repository = {
			getCommandReceipt: async () => null,
			getMembership: async () => membership,
		} as unknown as TenancyRepository;
		const events: PendingEvent[] = [];
		const service = serviceWith(repository, events);

		await expect(
			service.suspendMembership({
				actorUserId: "user_tenant_admin_0001",
				correlationId: "correlation_unit_0003",
				idempotencyKey: "idempotency_suspend_0001",
				membershipId: membership.id,
				reason: "test",
				revokeSessionsWhenNoActiveMembershipsRemain: true,
				targetAuthUserId: "user_substituted_0001",
				tenantId: membership.tenantId,
				version: 1,
			})
		).rejects.toMatchObject({ code: "wrong_tenant" });
		expect(events).toHaveLength(0);
	});
});
