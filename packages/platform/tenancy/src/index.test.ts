import { describe, expect, test } from "bun:test";

import {
	createTenancyApplication,
	createTenancyService,
	type EventAppendPort,
	type InvitationRecord,
	type MembershipRecord,
	type PendingEvent,
	type PermissionDecisionPort,
	type RoleAssignmentRecord,
	type RoleRecord,
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

	test("grants one tenant-scoped role assignment and publishes one safe event", async () => {
		const membership: MembershipRecord = {
			authUserId: "user_role_target_0001",
			id: "membership_role_target_0001",
			organizationId: "organization_unit_0001",
			roleAssignmentIds: [],
			state: "Active",
			tenantId: "tenant_unit_test_0001",
			version: 1,
		};
		const role: RoleRecord = {
			description: "Tenant administration",
			id: "role_tenant_admin_0001",
			name: "Tenant Administrator",
			permissionIds: ["platform.role.assign", "platform.role.read"],
			state: "Active",
			tenantId: membership.tenantId,
			version: 1,
		};
		const receipts = new Map<
			string,
			Parameters<TenancyRepository["recordCommandReceipt"]>[0]
		>();
		const assignments: RoleAssignmentRecord[] = [];
		const repository = {
			completeCommandReceipt(
				record: Parameters<TenancyRepository["completeCommandReceipt"]>[0]
			) {
				receipts.set(record.idempotencyKey, record);
				return Promise.resolve(record);
			},
			createRoleAssignment(record: RoleAssignmentRecord) {
				assignments.push(record);
				return Promise.resolve(record);
			},
			getCommandReceipt: async (
				_tenantId: string,
				_operation: string,
				idempotencyKey: string
			) => receipts.get(idempotencyKey) ?? null,
			getMembership: async () => membership,
			getRole: async () => role,
			recordCommandReceipt(
				record: Parameters<TenancyRepository["recordCommandReceipt"]>[0]
			) {
				const existing = receipts.get(record.idempotencyKey);
				if (existing) {
					return Promise.resolve({ inserted: false, record: existing });
				}
				receipts.set(record.idempotencyKey, record);
				return Promise.resolve({ inserted: true, record });
			},
		} as unknown as TenancyRepository;
		const events: PendingEvent[] = [];
		const service = serviceWith(repository, events);
		const command = {
			actorUserId: "user_tenant_admin_0001",
			body: {
				membershipId: membership.id,
				roleId: role.id,
				scopeType: "Tenant" as const,
				startsAt: new Date("2026-07-13T12:00:00.000Z"),
			},
			correlationId: "correlation_role_assignment_0001",
			idempotencyKey: "idempotency_role_assignment_0001",
			tenantId: membership.tenantId,
		};

		const created = await service.grantRoleAssignment(command);
		const replayed = await service.grantRoleAssignment(command);

		expect(replayed.id).toBe(created.id);
		expect(assignments).toHaveLength(1);
		expect(events).toHaveLength(1);
		expect(events[0]?.name).toBe("platform.role-assignment.granted.v1");
		expect(events[0]?.data).not.toHaveProperty("permissionIds");
		await expect(
			service.grantRoleAssignment({
				...command,
				body: { ...command.body, roleId: "role_substituted_0001" },
			})
		).rejects.toMatchObject({ code: "idempotency_conflict" });
	});

	test("binds administrative permission checks to target and requested scopes", async () => {
		const tenantId = "tenant_admin_scope_0001";
		const organizationId = "organization_admin_scope_0001";
		const siblingOrganizationId = "organization_admin_scope_0002";
		const context = {
			authUserId: "user_admin_scope_0001",
			contextId: "context_admin_scope_0001",
			expiresAt: new Date("2026-07-13T13:00:00.000Z"),
			idempotencyKey: "context-admin-scope-0001",
			issuedAt: new Date("2026-07-13T12:00:00.000Z"),
			organizationId,
			sessionId: "session_admin_scope_0001",
			tenantId,
		};
		const membership = (
			id: string,
			organization: string
		): MembershipRecord => ({
			authUserId: `user_${id}`,
			id,
			organizationId: organization,
			roleAssignmentIds: [],
			state: "Active",
			tenantId,
			version: 1,
		});
		const localTarget = membership(
			"membership_admin_scope_0001",
			organizationId
		);
		const siblingTarget = membership(
			"membership_admin_scope_0002",
			siblingOrganizationId
		);
		let mutationDispatched = false;
		let listedTenantId: string | undefined;
		const service = {
			getMembershipForAdministration: (input: { membershipId: string }) =>
				Promise.resolve(
					input.membershipId === localTarget.id ? localTarget : siblingTarget
				),
			grantRoleAssignment: () => {
				mutationDispatched = true;
				return Promise.reject(new Error("role mutation must remain denied"));
			},
			listOrganizations: (input: { tenantId: string }) => {
				listedTenantId = input.tenantId;
				return Promise.resolve({ items: [], nextCursor: null });
			},
			requireContext: () => Promise.resolve(context),
			suspendMembership: () => {
				mutationDispatched = true;
				return Promise.reject(new Error("suspension must remain denied"));
			},
		} as unknown as ReturnType<typeof createTenancyService>;
		const permissionChecks: Parameters<
			PermissionDecisionPort["requirePermission"]
		>[0][] = [];
		const permissions: PermissionDecisionPort = {
			requirePermission(input) {
				permissionChecks.push(input);
				if (
					input.resourceScope?.scopeType !== "Organization" ||
					input.resourceScope.scopeId !== organizationId
				) {
					return Promise.reject(
						Object.assign(new Error("scope denied"), {
							code: "authorization_denied" as const,
						})
					);
				}
				return Promise.resolve({
					matchedAssignments: ["assignment_admin_scope_0001"],
					outcome: "allow",
					permission: input.permission,
				});
			},
		};
		const application = createTenancyApplication({
			directory: { findUsers: async () => [] },
			permissions,
			projection: {
				projectInvitation: async () => undefined,
				projectOrganization: async () => undefined,
				removeMembership: async () => undefined,
			},
			service,
		});
		const assignmentInput = {
			actorUserId: context.authUserId,
			body: {
				membershipId: localTarget.id,
				roleId: "role_admin_scope_0001",
				scopeType: "Tenant" as const,
				startsAt: "2026-07-13T12:00:00.000Z",
			},
			contextId: context.contextId,
			correlationId: "correlation_admin_scope_0001",
			idempotencyKey: "idempotency_admin_scope_0001",
			sessionId: context.sessionId,
		};

		await expect(
			application.createRoleAssignment(assignmentInput)
		).rejects.toMatchObject({ code: "authorization_denied" });
		await expect(
			application.createRoleAssignment({
				...assignmentInput,
				body: { ...assignmentInput.body, membershipId: siblingTarget.id },
			})
		).rejects.toMatchObject({ code: "authorization_denied" });
		await expect(
			application.suspendMembership({
				actorUserId: context.authUserId,
				body: {
					membershipId: siblingTarget.id,
					reason: "scope regression",
					revokeSessionsWhenNoActiveMembershipsRemain: true,
					version: 1,
				},
				contextId: context.contextId,
				correlationId: "correlation_admin_scope_0002",
				idempotencyKey: "idempotency_admin_scope_0002",
				sessionId: context.sessionId,
				targetAuthUserId: siblingTarget.authUserId,
			})
		).rejects.toMatchObject({ code: "authorization_denied" });
		await application.listOrganizations({
			authUserId: context.authUserId,
			contextId: context.contextId,
			page: { limit: 20 },
			sessionId: context.sessionId,
		});

		expect(mutationDispatched).toBe(false);
		expect(listedTenantId).toBe(tenantId);
		expect(permissionChecks.map((check) => check.resourceScope)).toEqual([
			{ scopeId: organizationId, scopeType: "Organization" },
			{ scopeId: undefined, scopeType: "Tenant" },
			{ scopeId: siblingOrganizationId, scopeType: "Organization" },
			{ scopeId: siblingOrganizationId, scopeType: "Organization" },
			{ scopeId: organizationId, scopeType: "Organization" },
		]);
	});
});
