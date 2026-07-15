import { z } from "zod";

export const IdentifierSchema = z.string().regex(/^[A-Za-z0-9_-]{12,64}$/);
export const InstantSchema = z.iso.datetime({ offset: true });
export const NullableIdentifierSchema = IdentifierSchema.nullable();

export const ActiveContextSchema = z.object({
	authUserId: IdentifierSchema,
	branchId: NullableIdentifierSchema.optional(),
	contextId: IdentifierSchema,
	delegationId: NullableIdentifierSchema.optional(),
	expiresAt: InstantSchema,
	issuedAt: InstantSchema,
	legalEntityId: NullableIdentifierSchema.optional(),
	locationId: NullableIdentifierSchema.optional(),
	organizationId: IdentifierSchema,
	partyId: NullableIdentifierSchema.optional(),
	tenantId: IdentifierSchema,
});

export const ActiveContextRequestSchema = z.object({
	branchId: NullableIdentifierSchema.optional(),
	legalEntityId: NullableIdentifierSchema.optional(),
	locationId: NullableIdentifierSchema.optional(),
	organizationId: IdentifierSchema,
});

export const MembershipSummarySchema = z.object({
	membershipId: IdentifierSchema,
	organizationId: IdentifierSchema,
	roleAssignmentIds: z.array(IdentifierSchema).default([]),
	state: z.enum(["Invited", "Provisioning", "Active", "Suspended", "Ended"]),
	tenantId: IdentifierSchema,
	version: z.number().int().min(1),
});

export const CurrentIdentitySchema = z.object({
	activeContext: ActiveContextSchema.nullable().optional(),
	assuranceLevel: z.enum(["aal1", "aal2", "phishing-resistant"]),
	authUserId: IdentifierSchema,
	memberships: z.array(MembershipSummarySchema),
	partyId: NullableIdentifierSchema.optional(),
	sessionId: IdentifierSchema,
});

export const OrganizationSchema = z.object({
	id: IdentifierSchema,
	locale: z.string().max(35).optional(),
	name: z.string().min(1).max(200),
	state: z.enum(["Provisioning", "Active", "Suspended", "Archived"]),
	tenantId: IdentifierSchema,
	timezone: z.string().max(100).optional(),
	version: z.number().int().min(1),
});

export const UpdateOrganizationRequestSchema = z
	.object({
		locale: z.string().max(35).optional(),
		name: z.string().min(1).max(200).optional(),
		timezone: z.string().max(100).optional(),
		version: z.number().int().min(1),
	})
	.refine(
		(value) =>
			value.name !== undefined ||
			value.timezone !== undefined ||
			value.locale !== undefined,
		{ message: "At least one mutable organization field is required" }
	);

export const LocationSchema = z.object({
	id: IdentifierSchema,
	name: z.string().min(1).max(200),
	organizationId: IdentifierSchema,
	state: z.enum(["Active", "Suspended", "Archived"]),
	tenantId: IdentifierSchema,
	timezone: z.string().max(100),
	type: z.enum(["Store", "Warehouse", "Office", "Mobile", "Virtual", "Other"]),
	version: z.number().int().min(1),
});

export const SessionSummarySchema = z.object({
	createdAt: InstantSchema,
	current: z.boolean(),
	deviceLabel: z.string().max(100).nullable().optional(),
	expiresAt: InstantSchema,
	id: IdentifierSchema,
	ipAddressMasked: z.string().max(64).nullable().optional(),
	updatedAt: InstantSchema,
	userAgentSummary: z.string().max(200).nullable().optional(),
});

export const UserSummarySchema = z.object({
	authenticationState: z.enum(["Active", "Suspended"]),
	authUserId: IdentifierSchema,
	displayName: z.string().max(200).optional(),
	email: z.email(),
	memberships: z.array(MembershipSummarySchema),
	partyId: NullableIdentifierSchema.optional(),
});

export const CreateUserInvitationRequestSchema = z.object({
	email: z.email(),
	expiresAt: InstantSchema.nullable().optional(),
	organizationId: IdentifierSchema,
	partyId: NullableIdentifierSchema.optional(),
	roleIds: z
		.array(IdentifierSchema)
		.min(1)
		.refine((ids) => new Set(ids).size === ids.length, {
			message: "roleIds must be unique",
		}),
});

export const UserInvitationSchema = z.object({
	createdAt: InstantSchema,
	email: z.email(),
	expiresAt: InstantSchema,
	failureCode: z.string().max(100).nullable().optional(),
	id: IdentifierSchema,
	organizationId: IdentifierSchema,
	state: z.enum([
		"Pending",
		"Provisioning",
		"Delivered",
		"Accepted",
		"Failed",
		"Cancelled",
		"Expired",
	]),
	tenantId: IdentifierSchema,
});

export const SuspendTenantMembershipRequestSchema = z.object({
	membershipId: IdentifierSchema,
	reason: z.string().min(1).max(500),
	revokeSessionsWhenNoActiveMembershipsRemain: z.boolean().default(true),
	version: z.number().int().min(1),
});

export const RoleSchema = z.object({
	description: z.string().max(500).nullable().optional(),
	id: IdentifierSchema,
	name: z.string().min(1).max(120),
	permissionIds: z.array(z.string()).default([]),
	state: z.enum(["Active", "Inactive"]),
	tenantId: IdentifierSchema,
	version: z.number().int().min(1),
});

export const ScopeTypeSchema = z.enum([
	"Tenant",
	"Organization",
	"LegalEntity",
	"Branch",
	"Location",
]);

export const CreateRoleAssignmentRequestSchema = z.object({
	endsAt: InstantSchema.nullable().optional(),
	membershipId: IdentifierSchema,
	roleId: IdentifierSchema,
	scopeId: NullableIdentifierSchema.optional(),
	scopeType: ScopeTypeSchema,
	startsAt: InstantSchema,
});

export const RoleAssignmentSchema = CreateRoleAssignmentRequestSchema.extend({
	id: IdentifierSchema,
	state: z.enum(["Active", "Revoked", "Expired"]),
	tenantId: IdentifierSchema,
	version: z.number().int().min(1),
});

export const EntitlementSchema = z.object({
	capabilityId: z.string().regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/),
	dependencies: z
		.array(z.string().regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/))
		.default([]),
	endsAt: InstantSchema.nullable().optional(),
	exclusions: z
		.array(z.string().regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/))
		.default([]),
	id: IdentifierSchema,
	limits: z
		.record(z.string().min(1).max(100), z.number().int().nonnegative())
		.default({}),
	organizationId: NullableIdentifierSchema.optional(),
	source: z.enum([
		"PlatformSubscription",
		"ManualGrant",
		"Trial",
		"Migration",
		"AddOn",
		"Contract",
		"PartnerPolicy",
	]),
	startsAt: InstantSchema,
	state: z.enum([
		"Pending",
		"Trial",
		"Active",
		"Grace",
		"Suspended",
		"Expired",
		"Revoked",
		"Archived",
	]),
	tenantId: IdentifierSchema,
	version: z.number().int().min(1),
});

export const PartySchema = z.object({
	classification: z.enum(["Internal", "Confidential", "Restricted"]),
	displayName: z.string().min(1).max(300),
	id: IdentifierSchema,
	state: z.enum(["Active", "Inactive", "Merged", "Restricted"]),
	tenantId: IdentifierSchema,
	type: z.enum(["Person", "Organization"]),
	version: z.number().int().min(1),
});

export const CreatePersonPartySchema = z.object({
	displayName: z.string().min(1).max(300),
	email: z.email().optional(),
	phone: z.string().max(50).optional(),
});

export const CreateOrganizationPartySchema = z.object({
	displayName: z.string().min(1).max(300),
	email: z.email().nullable().optional(),
	phone: z.string().max(50).nullable().optional(),
	registeredName: z.string().max(300).nullable().optional(),
});

export const UpdatePartyRequestSchema = z
	.object({
		displayName: z.string().min(1).max(300).optional(),
		state: z.enum(["Active", "Inactive", "Restricted"]).optional(),
		version: z.number().int().min(1),
	})
	.refine(
		(value) => value.displayName !== undefined || value.state !== undefined,
		{
			message: "At least one mutable Party field is required",
		}
	);

export const CreatePartyIdentityLinkRequestSchema = z.object({
	authUserId: IdentifierSchema,
	membershipId: IdentifierSchema,
	partyId: IdentifierSchema,
});

export const PlatformIdentityLinkSchema = z.object({
	authUserId: IdentifierSchema,
	createdAt: InstantSchema,
	id: IdentifierSchema,
	membershipId: IdentifierSchema,
	partyId: IdentifierSchema,
	state: z.enum(["Active", "Suspended", "Ended"]),
	tenantId: IdentifierSchema,
	version: z.number().int().min(1),
});

const AuditRecordCommonSchema = z.object({
	action: z.string().max(200),
	actorPartyId: NullableIdentifierSchema.optional(),
	actorType: z.enum([
		"human",
		"service",
		"device",
		"integration",
		"automation",
		"ai",
		"support",
	]),
	actorUserId: NullableIdentifierSchema.optional(),
	approvalId: z.string().max(128).nullable().optional(),
	causationId: z.string().max(128).nullable().optional(),
	changeSummary: z.record(z.string(), z.unknown()).nullable().optional(),
	classification: z.enum(["Internal", "Confidential", "Restricted"]),
	correlationId: z.string().min(12).max(128),
	delegationId: NullableIdentifierSchema.optional(),
	id: IdentifierSchema,
	metadata: z.record(z.string(), z.unknown()),
	occurredAt: InstantSchema,
	originalActorId: z.string().nullable().optional(),
	outcome: z.enum(["success", "denied", "failure"]),
	privacyCaseId: z.string().max(128).nullable().optional(),
	privacyTransformationVersion: z.string().max(50).nullable().optional(),
	reasonCode: z.string().max(100).nullable().optional(),
	retentionClass: z.string().max(100),
	sourceChannel: z.string().max(100),
	targetId: z.string().max(200).nullable().optional(),
	targetType: z.string().max(200),
});

export const AuditRecordSchema = z.discriminatedUnion("scopeType", [
	AuditRecordCommonSchema.extend({
		locationId: NullableIdentifierSchema.optional(),
		organizationId: NullableIdentifierSchema.optional(),
		scopeType: z.literal("Tenant"),
		tenantId: IdentifierSchema,
	}),
	AuditRecordCommonSchema.extend({
		locationId: z.null().optional(),
		organizationId: z.null().optional(),
		scopeType: z.literal("Platform"),
		tenantId: z.null().optional(),
	}),
]);

export const AuthorizationDecisionSchema = z.discriminatedUnion("outcome", [
	z.object({
		matchedAssignments: z.array(IdentifierSchema),
		outcome: z.literal("allow"),
		permission: z.string(),
	}),
	z.object({
		outcome: z.literal("deny"),
		reason: z.enum([
			"not_authenticated",
			"wrong_tenant",
			"no_assignment",
			"scope_mismatch",
			"assignment_inactive",
			"policy_denied",
		]),
	}),
	z.object({ outcome: z.literal("require_approval"), policyId: z.string() }),
	z.object({
		assuranceLevel: z.string(),
		outcome: z.literal("require_step_up"),
	}),
	z.object({
		fieldPolicyId: z.string(),
		outcome: z.literal("allow_masked"),
		permission: z.string(),
	}),
	z.object({
		limitPolicyId: z.string(),
		outcome: z.literal("allow_with_limit"),
		permission: z.string(),
	}),
	z.object({
		outcome: z.literal("allow_read_only"),
		permission: z.string(),
		policyId: z.string(),
	}),
]);

export const ProductStateSchema = z.enum([
	"Draft",
	"Active",
	"Suspended",
	"Discontinued",
	"Archived",
]);

export const ProductIdentifierTypeSchema = z.enum([
	"SKU",
	"GTIN",
	"UPC",
	"EAN",
	"Alias",
	"External",
]);

export const ProductIdentifierSchemeSchema = z.enum([
	"Tenant",
	"GTIN-8",
	"GTIN-12",
	"GTIN-13",
	"GTIN-14",
]);

export const ProductIdentifierInputSchema = z.object({
	scheme: ProductIdentifierSchemeSchema,
	type: ProductIdentifierTypeSchema,
	value: z.string().min(1).max(128),
});

export const ProductIdentifierSchema = ProductIdentifierInputSchema.extend({
	id: IdentifierSchema,
});

export const CreateProductVariantSchema = z.object({
	identifiers: z.array(ProductIdentifierInputSchema).max(20),
	name: z.string().min(1).max(300),
});

export const UpdateProductIdentifierSchema =
	ProductIdentifierInputSchema.extend({ id: IdentifierSchema.optional() });

export const UpdateProductVariantSchema = z.object({
	id: IdentifierSchema.optional(),
	identifiers: z.array(UpdateProductIdentifierSchema).max(20),
	name: z.string().min(1).max(300),
});

export const ProductVariantSchema = z.object({
	id: IdentifierSchema,
	identifiers: z.array(ProductIdentifierSchema).max(20),
	name: z.string().min(1).max(300),
});

export const ProductSchema = z.object({
	id: IdentifierSchema,
	name: z.string().min(1).max(300),
	state: ProductStateSchema,
	variants: z.array(ProductVariantSchema).min(1).max(50),
	version: z.number().int().min(1),
});

export const CreateProductSchema = z.object({
	name: z.string().min(1).max(300),
	variants: z.array(CreateProductVariantSchema).min(1).max(50),
});

export const UpdateProductSchema = z
	.object({
		name: z.string().min(1).max(300).optional(),
		variants: z.array(UpdateProductVariantSchema).min(1).max(50).optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one mutable Product field is required",
	});

export const TransitionReasonSchema = z.object({
	reason: z.string().min(1).max(500),
});

export const DecimalQuantitySchema = z
	.string()
	.regex(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/);

export const PositiveDecimalQuantitySchema = z
	.string()
	.regex(/^(?!0(?:\.0{1,6})?$)(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/);

export const QuantityLineSchema = z.object({
	conversionSourceId: NullableIdentifierSchema.optional(),
	productId: IdentifierSchema,
	quantity: PositiveDecimalQuantitySchema,
	unit: z.string().min(1).max(50),
});

export const StockBalanceSchema = z.object({
	asOf: InstantSchema,
	available: DecimalQuantitySchema,
	locationId: IdentifierSchema,
	onHand: DecimalQuantitySchema,
	productId: IdentifierSchema,
	reconciled: z.boolean().optional(),
	unit: z.string().min(1).max(50),
});

export const CreateInventoryAdjustmentSchema = z.object({
	conversionSourceId: NullableIdentifierSchema.optional(),
	locationId: IdentifierSchema,
	productId: IdentifierSchema,
	quantity: DecimalQuantitySchema,
	reason: z.string().min(1).max(500),
	unit: z.string().min(1).max(50),
});

export const InventoryAdjustmentSchema = CreateInventoryAdjustmentSchema.extend(
	{
		id: IdentifierSchema,
		state: z.enum([
			"Draft",
			"PendingApproval",
			"Approved",
			"Posted",
			"Reversed",
			"Rejected",
		]),
		version: z.number().int().min(1),
	}
);

export const CreateStockCountSchema = z.object({
	blind: z.boolean().default(true),
	locationId: IdentifierSchema,
});

export const StockCountSchema = CreateStockCountSchema.extend({
	id: IdentifierSchema,
	state: z.enum([
		"Draft",
		"InProgress",
		"Submitted",
		"Approved",
		"Posted",
		"Rejected",
	]),
	version: z.number().int().min(1),
});

export const CreateStockTransferSchema = z
	.object({
		destinationLocationId: IdentifierSchema,
		lines: z.array(QuantityLineSchema).min(1),
		sourceLocationId: IdentifierSchema,
	})
	.refine((value) => value.sourceLocationId !== value.destinationLocationId, {
		message: "Transfer source and destination must differ",
	});

export const StockTransferSchema = z.object({
	destinationLocationId: IdentifierSchema,
	id: IdentifierSchema,
	lines: z.array(QuantityLineSchema).min(1),
	sourceLocationId: IdentifierSchema,
	state: z.enum([
		"Draft",
		"Dispatched",
		"PartiallyReceived",
		"Received",
		"Exception",
		"Cancelled",
	]),
	version: z.number().int().min(1),
});

export const ImportJobSchema = z.object({
	id: IdentifierSchema,
	state: z.enum([
		"Uploaded",
		"Validating",
		"ReadyForApproval",
		"Approved",
		"Committing",
		"Completed",
		"Failed",
		"Cancelled",
	]),
	version: z.number().int().min(1),
});

export const ProblemSchema = z.object({
	code: z.enum([
		"validation",
		"authentication",
		"authorization",
		"entitlement",
		"conflict",
		"state_transition",
		"rate_limit",
		"provider_uncertainty",
		"dependency_unavailable",
		"internal_failure",
	]),
	correlationId: z.string().min(12).max(128),
	detail: z.string().max(1000).nullable().optional(),
	fieldErrors: z
		.array(
			z.object({
				code: z.string().max(100),
				field: z.string().max(200),
				messageKey: z.string(),
			})
		)
		.optional(),
	nextAction: z
		.enum([
			"retry",
			"reauthenticate",
			"step_up",
			"request_approval",
			"contact_support",
		])
		.nullable()
		.optional(),
	retryable: z.boolean(),
	safeMessageKey: z.string(),
	status: z.number().int(),
	title: z.string(),
	type: z.string(),
	uncertainty: z.boolean(),
});

export const pageOf = <T extends z.ZodType>(item: T) =>
	z.object({
		items: z.array(item),
		nextCursor: z.string().nullable(),
	});

export const PagedOrganizationsSchema = pageOf(OrganizationSchema);
export const PagedLocationsSchema = pageOf(LocationSchema);
export const PagedSessionsSchema = pageOf(SessionSummarySchema);
export const PagedUsersSchema = pageOf(UserSummarySchema);
export const PagedRolesSchema = pageOf(RoleSchema);
export const PagedEntitlementsSchema = pageOf(EntitlementSchema);
export const PagedPartiesSchema = pageOf(PartySchema);
export const PagedAuditRecordsSchema = pageOf(AuditRecordSchema);
export const PagedProductsSchema = pageOf(ProductSchema);
export const PagedInventoryAdjustmentsSchema = pageOf(
	InventoryAdjustmentSchema
);
export const PagedStockCountsSchema = pageOf(StockCountSchema);
export const PagedStockTransfersSchema = pageOf(StockTransferSchema);

export type ActiveContext = z.infer<typeof ActiveContextSchema>;
export type ActiveContextRequest = z.infer<typeof ActiveContextRequestSchema>;
export type AuditRecord = z.infer<typeof AuditRecordSchema>;
export type AuthorizationDecision = z.infer<typeof AuthorizationDecisionSchema>;
export type CreateRoleAssignmentRequest = z.infer<
	typeof CreateRoleAssignmentRequestSchema
>;
export type CreateUserInvitationRequest = z.infer<
	typeof CreateUserInvitationRequestSchema
>;
export type CurrentIdentity = z.infer<typeof CurrentIdentitySchema>;
export type Entitlement = z.infer<typeof EntitlementSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type MembershipSummary = z.infer<typeof MembershipSummarySchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type Party = z.infer<typeof PartySchema>;
export type CreatePersonParty = z.infer<typeof CreatePersonPartySchema>;
export type CreateOrganizationParty = z.infer<
	typeof CreateOrganizationPartySchema
>;
export type UpdatePartyRequest = z.infer<typeof UpdatePartyRequestSchema>;
export type CreatePartyIdentityLinkRequest = z.infer<
	typeof CreatePartyIdentityLinkRequestSchema
>;
export type PlatformIdentityLink = z.infer<typeof PlatformIdentityLinkSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type RoleAssignment = z.infer<typeof RoleAssignmentSchema>;
export type SessionSummary = z.infer<typeof SessionSummarySchema>;
export type UserInvitation = z.infer<typeof UserInvitationSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type SuspendTenantMembershipRequest = z.infer<
	typeof SuspendTenantMembershipRequestSchema
>;
export type UpdateOrganizationRequest = z.infer<
	typeof UpdateOrganizationRequestSchema
>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type CreateProductVariant = z.infer<typeof CreateProductVariantSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductIdentifier = z.infer<typeof ProductIdentifierSchema>;
export type ProductIdentifierInput = z.infer<
	typeof ProductIdentifierInputSchema
>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type TransitionReason = z.infer<typeof TransitionReasonSchema>;
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
export type UpdateProductIdentifier = z.infer<
	typeof UpdateProductIdentifierSchema
>;
export type UpdateProductVariant = z.infer<typeof UpdateProductVariantSchema>;
export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;
export type StockBalance = z.infer<typeof StockBalanceSchema>;
export type StockCount = z.infer<typeof StockCountSchema>;
export type StockTransfer = z.infer<typeof StockTransferSchema>;
