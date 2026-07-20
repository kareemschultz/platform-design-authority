import { z } from "zod";

export const IdentifierSchema = z.string().regex(/^[A-Za-z0-9_-]{12,64}$/);
export const InstantSchema = z.iso.datetime({ offset: true });
export const NullableIdentifierSchema = IdentifierSchema.nullable();
export const SemanticVersionSchema = z
	.string()
	.regex(/^[0-9]+\.[0-9]+\.[0-9]+$/);
export const PositiveSequenceSchema = z.string().regex(/^[1-9][0-9]*$/);
export const EventNameSchema = z
	.string()
	.regex(/^[a-z][a-z0-9-]*\.[a-z0-9-]+\.[a-z0-9-]+\.v[1-9][0-9]*$/);

export const CreateEventReplayRequestSchema = z
	.object({
		consumerId: IdentifierSchema,
		consumerSchemaVersion: SemanticVersionSchema,
		eventNames: z.array(EventNameSchema).min(1).max(25),
		firstSequence: PositiveSequenceSchema,
		lastSequence: PositiveSequenceSchema,
		purpose: z.string().min(1).max(500),
	})
	.strict()
	.refine(
		(value) => new Set(value.eventNames).size === value.eventNames.length,
		{
			message: "Event names must be unique",
			path: ["eventNames"],
		}
	);

export const EventReplayRequestSchema = z.object({
	consumerId: IdentifierSchema,
	consumerSchemaVersion: SemanticVersionSchema,
	eventNames: z.array(EventNameSchema).min(1).max(25),
	firstSequence: PositiveSequenceSchema,
	id: IdentifierSchema,
	lastSequence: PositiveSequenceSchema,
	requestedAt: InstantSchema,
	state: z.enum([
		"Pending",
		"Running",
		"Completed",
		"PartiallyCompleted",
		"Rejected",
		"Failed",
	]),
});

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
	archivedAt: InstantSchema.nullable(),
	archiveReason: z.string().max(500).nullable(),
	createdAt: InstantSchema,
	id: IdentifierSchema,
	name: z.string().min(1).max(300),
	state: ProductStateSchema,
	updatedAt: InstantSchema,
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

// WS3 remediation R4, P2 item 1 ("quantity precision/digit limits"): the
// integer part is bounded to at most 12 digits (0-999,999,999,999) — the
// fraction part was already bounded to 6 digits. Neither bound existed
// before this fix, so an unbounded numeric-string integer part could reach
// the request boundary and only be rejected (or worse, silently truncated
// by a later `Number(...)` parse) deep inside the domain layer instead of
// at the Zod boundary CLAUDE.md §11 requires. No real POS/Inventory
// quantity approaches this bound; it is a hardening ceiling, not a
// business rule.
export const DecimalQuantitySchema = z
	.string()
	.regex(/^-?(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,6})?$/);

export const PositiveDecimalQuantitySchema = z
	.string()
	.regex(/^(?!0(?:\.0{1,6})?$)(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,6})?$/);

export const NonNegativeDecimalQuantitySchema = z
	.string()
	.regex(/^(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,6})?$/);

export const QuantityLineSchema = z.object({
	conversionSourceId: NullableIdentifierSchema.optional(),
	productId: IdentifierSchema,
	quantity: PositiveDecimalQuantitySchema,
	unit: z.string().min(1).max(50),
	variantId: NullableIdentifierSchema.optional(),
});

export const StockBalanceSchema = z.object({
	asOf: InstantSchema,
	available: DecimalQuantitySchema,
	locationId: IdentifierSchema,
	onHand: DecimalQuantitySchema,
	productId: IdentifierSchema,
	reconciled: z.boolean(),
	reconciliationState: z.enum(["Current", "RequiresReview"]),
	reserved: NonNegativeDecimalQuantitySchema,
	source: z.literal("InventoryLedgerProjection"),
	unit: z.string().min(1).max(50),
	variantId: NullableIdentifierSchema.optional(),
});

export const CreateInventoryAdjustmentSchema = z.object({
	conversionSourceId: NullableIdentifierSchema.optional(),
	locationId: IdentifierSchema,
	productId: IdentifierSchema,
	quantity: DecimalQuantitySchema,
	reason: z.string().min(1).max(500),
	unit: z.string().min(1).max(50),
	variantId: NullableIdentifierSchema.optional(),
});

export const InventoryAdjustmentSchema = CreateInventoryAdjustmentSchema.extend(
	{
		approvedByUserId: NullableIdentifierSchema,
		createdAt: InstantSchema,
		createdByUserId: IdentifierSchema,
		id: IdentifierSchema,
		movementId: NullableIdentifierSchema,
		postedAt: InstantSchema.nullable(),
		reversalMovementId: NullableIdentifierSchema,
		state: z.enum([
			"Draft",
			"PendingApproval",
			"Approved",
			"Posted",
			"Reversed",
			"Rejected",
		]),
		updatedAt: InstantSchema,
		version: z.number().int().min(1),
	}
);

export const CreateStockCountSchema = z.object({
	blind: z.boolean().default(true),
	locationId: IdentifierSchema,
});

export const SubmitStockCountLineSchema = z
	.object({
		conversionSourceId: NullableIdentifierSchema.optional(),
		observedQuantity: NonNegativeDecimalQuantitySchema,
		productId: IdentifierSchema,
		unit: z.string().min(1).max(50),
		variantId: NullableIdentifierSchema.optional(),
	})
	.strict();

export const SubmitStockCountSchema = z
	.object({
		lines: z.array(SubmitStockCountLineSchema).min(1).max(5000),
	})
	.strict();

export const SaveStockCountDraftLinesSchema = z
	.object({
		lines: z.array(SubmitStockCountLineSchema).max(5000),
	})
	.strict();

export const StockCountLineSchema = SubmitStockCountLineSchema.extend({
	expectedQuantity: DecimalQuantitySchema.nullable(),
	id: IdentifierSchema,
	movementId: NullableIdentifierSchema,
	varianceQuantity: DecimalQuantitySchema.nullable(),
});

export const StockCountSchema = CreateStockCountSchema.extend({
	approvedByUserId: NullableIdentifierSchema,
	createdAt: InstantSchema,
	createdByUserId: IdentifierSchema,
	id: IdentifierSchema,
	lines: z.array(StockCountLineSchema),
	postedAt: InstantSchema.nullable(),
	state: z.enum([
		"Draft",
		"InProgress",
		"Submitted",
		"Approved",
		"Posted",
		"Rejected",
	]),
	submittedByUserId: NullableIdentifierSchema,
	updatedAt: InstantSchema,
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

export const StockTransferLineSchema = z.object({
	conversionSourceId: NullableIdentifierSchema.optional(),
	dispatchedQuantity: NonNegativeDecimalQuantitySchema,
	exceptionQuantity: NonNegativeDecimalQuantitySchema,
	id: IdentifierSchema,
	productId: IdentifierSchema,
	receivedQuantity: NonNegativeDecimalQuantitySchema,
	remainingQuantity: NonNegativeDecimalQuantitySchema,
	requestedQuantity: PositiveDecimalQuantitySchema,
	unit: z.string().min(1).max(50),
	variantId: NullableIdentifierSchema.optional(),
});

export const ReceiveStockTransferLineSchema = z
	.object({
		lineId: IdentifierSchema,
		receivedQuantity: PositiveDecimalQuantitySchema,
	})
	.strict();

export const ReceiveStockTransferSchema = z
	.object({
		exceptionReason: z.string().min(1).max(500).nullable().optional(),
		lines: z.array(ReceiveStockTransferLineSchema).min(1).max(500),
		outcome: z.enum(["Accepted", "Exception"]),
	})
	.strict()
	.superRefine((value, context) => {
		if (value.outcome === "Exception" && !value.exceptionReason) {
			context.addIssue({
				code: "custom",
				message: "Exception receipts require an exception reason",
				path: ["exceptionReason"],
			});
		}
		if (value.outcome === "Accepted" && value.exceptionReason) {
			context.addIssue({
				code: "custom",
				message: "Accepted receipts cannot carry an exception reason",
				path: ["exceptionReason"],
			});
		}
	});

export const StockTransferSchema = z.object({
	createdAt: InstantSchema,
	createdByUserId: IdentifierSchema,
	destinationLocationId: IdentifierSchema,
	dispatchedAt: InstantSchema.nullable(),
	dispatchedByUserId: NullableIdentifierSchema,
	exceptionReason: z.string().max(500).nullable(),
	id: IdentifierSchema,
	lines: z.array(StockTransferLineSchema).min(1),
	receivedAt: InstantSchema.nullable(),
	receivedByUserId: NullableIdentifierSchema,
	sourceLocationId: IdentifierSchema,
	state: z.enum([
		"Draft",
		"Dispatched",
		"PartiallyReceived",
		"Received",
		"Exception",
		"Cancelled",
	]),
	updatedAt: InstantSchema,
	version: z.number().int().min(1),
});

// ---------------------------------------------------------------------------
// WS3 PR1: RegisterSession and CashMovement (commerce.register-management,
// commerce.cash-management). Money uses explicit currency and integer
// minor-unit semantics per CLAUDE.md §7 — never binary floating point.
// ---------------------------------------------------------------------------

// WS3 remediation R4, P2 item 1 ("safe-integer money checks ... at every
// relevant boundary"): `.safe()` (int + within [MIN_SAFE_INTEGER,
// MAX_SAFE_INTEGER]) matches the SAME `Number.MAX_SAFE_INTEGER` ceiling
// `packages/domains/pos/src/index.ts`'s `MAX_MINOR_AMOUNT` already
// enforces deep inside the domain layer — before this fix, an
// out-of-safe-range `amountMinor` passed THIS Zod boundary and only
// failed several layers later. Sign is intentionally left unconstrained
// here (direction is carried by a separate field, e.g. CashMovement's
// `direction`, not by the sign of `amountMinor`) — this bounds magnitude
// only, matching the domain layer's own non-negating check shape.
export const MoneySchema = z.object({
	amountMinor: z.number().safe(),
	currency: z.string().regex(/^[A-Z]{3}$/),
});

export const OpenRegisterRequestSchema = z
	.object({
		currency: z.string().regex(/^[A-Z]{3}$/),
		openingFloat: MoneySchema,
	})
	.strict();

export const CloseRegisterRequestSchema = z
	.object({
		countedCash: MoneySchema,
		reason: z.string().min(1).max(500).optional(),
	})
	.strict();

export const RegisterSessionSchema = z.object({
	closedAt: InstantSchema.nullable(),
	closeReason: z.string().max(500).nullable(),
	countedCash: MoneySchema.nullable(),
	currency: z.string().regex(/^[A-Z]{3}$/),
	expectedCash: MoneySchema.nullable(),
	id: IdentifierSchema,
	locationId: IdentifierSchema,
	openedAt: InstantSchema,
	openerPartyId: IdentifierSchema,
	openingFloat: MoneySchema,
	registerId: IdentifierSchema,
	state: z.enum(["Open", "Closing", "Closed"]),
	variance: MoneySchema.nullable(),
	varianceApprovalRequired: z.boolean(),
	varianceApprovedAt: InstantSchema.nullable(),
	varianceApproverPartyId: NullableIdentifierSchema,
	version: z.number().int().min(1),
});

export const CreateCashMovementRequestSchema = z
	.object({
		amount: MoneySchema,
		direction: z.enum(["PaidIn", "PaidOut"]),
		note: z.string().min(1).max(500).optional(),
		reasonCode: z.enum(["PaidIn", "PaidOut", "Other"]),
		referenceId: NullableIdentifierSchema.optional(),
	})
	.strict();

export const CreateSafeDropRequestSchema = z
	.object({
		amount: MoneySchema,
		note: z.string().min(1).max(500).optional(),
	})
	.strict();

export const CashMovementSchema = z.object({
	amount: MoneySchema,
	createdAt: InstantSchema,
	direction: z.enum(["PaidIn", "PaidOut"]),
	id: IdentifierSchema,
	note: z.string().max(500).nullable(),
	reasonCode: z.enum(["PaidIn", "PaidOut", "SafeDrop", "Refund", "Other"]),
	referenceId: NullableIdentifierSchema,
	registerId: IdentifierSchema,
	sessionId: IdentifierSchema,
});

// ---------------------------------------------------------------------------
// WS3 PR2: Sale, PriceOverride, Receipt (commerce.order-management,
// commerce.receipts). Quantity follows the same PositiveDecimalQuantity
// convention Inventory already uses; money stays integer-minor-unit per
// CLAUDE.md §7.
// ---------------------------------------------------------------------------

export const SaleTaxCategorySchema = z.enum([
	"GY_STANDARD_14",
	"GY_ZERO_RATED",
	"GY_EXEMPT",
	"GY_OUT_OF_SCOPE",
]);

export const SaleLineInputSchema = z.object({
	discountAmount: MoneySchema.nullable().optional(),
	productId: IdentifierSchema,
	quantity: PositiveDecimalQuantitySchema,
	taxCategory: SaleTaxCategorySchema.optional(),
	unit: z.string().min(1).max(40),
	unitPrice: MoneySchema,
	variantId: NullableIdentifierSchema.optional(),
});

// WS3 remediation R4, P2 item 1 ("bounded array lengths ... at every
// relevant boundary"): matches the bound Inventory's
// `ReceiveStockTransferLineSchema` array already carries (`.max(500)`) —
// before this fix, `CreateSaleSchema.lines` had NO upper bound at all.
export const CreateSaleSchema = z
	.object({
		currency: z.string().regex(/^[A-Z]{3}$/),
		customerPartyId: NullableIdentifierSchema.optional(),
		lines: z.array(SaleLineInputSchema).min(1).max(500),
		registerId: IdentifierSchema,
	})
	.strict();

export const TenderReferenceSchema = z.object({
	amount: MoneySchema,
	referenceId: NullableIdentifierSchema.optional(),
	type: z.enum(["Cash", "PaymentIntent", "StoredValue"]),
});

export const CompleteSaleRequestSchema = z
	.object({
		/** Realizes `commerce.exchanges` (frozen control plan §6.5): names
		 * an ALREADY-`Completed` Return this sale replaces, sharing the
		 * same register. No dedicated exchange permission or endpoint
		 * exists; omitting this field is an ordinary sale completion. */
		exchangeOfReturnId: NullableIdentifierSchema.optional(),
		// WS3 remediation R4, P2 item 1: bounded — a real split-tender sale
		// never approaches this; before this fix `tenders` had no upper bound.
		tenders: z.array(TenderReferenceSchema).min(1).max(20),
	})
	.strict();

export const RequestPriceOverrideSchema = z
	.object({
		lineId: IdentifierSchema,
		reason: z.string().min(1).max(500),
		requestedPrice: MoneySchema,
	})
	.strict();

/** WS3 remediation R3b, Item 7 (server-backed discovery). Surfaces the
 * `pos_price_override` row `getPriceOverride`/`createPriceOverride` already
 * persist (WS3 PR2) as a first-class read for `listPriceOverridesContract`
 * — until this addition no endpoint ever returned a PriceOverride on its
 * own; only the owning `Sale.lines[].priceOverrideId`/`priceOverrideState`
 * disclosed its existence. */
export const PriceOverrideSchema = z.object({
	approvedAt: InstantSchema.nullable(),
	id: IdentifierSchema,
	lineId: IdentifierSchema,
	reason: z.string(),
	requestedAt: InstantSchema,
	requestedPrice: MoneySchema,
	saleId: IdentifierSchema,
	state: z.enum(["Pending", "Approved"]),
	version: z.number().int().min(1),
});

export const SaleLineSchema = z.object({
	discount: MoneySchema,
	gross: MoneySchema,
	id: IdentifierSchema,
	lineTotal: MoneySchema,
	nonStatutory: z.literal(true),
	priceOverrideId: NullableIdentifierSchema,
	priceOverrideState: z.enum(["Pending", "Approved"]).nullable(),
	productId: IdentifierSchema,
	productName: z.string(),
	quantity: PositiveDecimalQuantitySchema,
	tax: MoneySchema,
	taxableBase: MoneySchema,
	taxCategory: SaleTaxCategorySchema,
	unit: z.string(),
	unitPrice: MoneySchema,
	variantId: NullableIdentifierSchema,
});

export const SaleSchema = z.object({
	change: MoneySchema.nullable(),
	completedAt: InstantSchema.nullable(),
	currency: z.string().regex(/^[A-Z]{3}$/),
	customerPartyId: NullableIdentifierSchema,
	discount: MoneySchema,
	gross: MoneySchema,
	heldAt: InstantSchema.nullable(),
	id: IdentifierSchema,
	lines: z.array(SaleLineSchema),
	receiptId: NullableIdentifierSchema,
	registerId: IdentifierSchema,
	sessionId: IdentifierSchema,
	state: z.enum(["Open", "Held", "Completed"]),
	tax: MoneySchema,
	tendered: MoneySchema.nullable(),
	total: MoneySchema,
	version: z.number().int().min(1),
});

export const ReceiptLineSchema = z.object({
	discount: MoneySchema,
	lineTotal: MoneySchema,
	nonStatutory: z.literal(true),
	productName: z.string(),
	quantity: PositiveDecimalQuantitySchema,
	tax: MoneySchema,
	taxableBase: MoneySchema,
	taxCategory: SaleTaxCategorySchema,
	unit: z.string(),
	unitPrice: MoneySchema,
});

export const ReceiptSchema = z.object({
	cashierPartyId: IdentifierSchema,
	currency: z.string().regex(/^[A-Z]{3}$/),
	id: IdentifierSchema,
	issuedAt: InstantSchema,
	kind: z.enum(["Sale", "Return", "Reissue"]),
	lines: z.array(ReceiptLineSchema),
	originalReceiptId: NullableIdentifierSchema,
	priceSuppressed: z.boolean(),
	receiptNumber: z.string(),
	registerId: IdentifierSchema,
	returnId: NullableIdentifierSchema,
	saleId: NullableIdentifierSchema,
	tenders: z.array(TenderReferenceSchema),
	total: MoneySchema.nullable(),
});

// ---------------------------------------------------------------------------
// WS3 PR3: Return, Refund, Void, Reissue, Exchange (commerce.returns,
// commerce.refunds, commerce.receipts). Exchange has no dedicated schema:
// it rides `CompleteSaleRequestSchema`'s optional `exchangeOfReturnId` and
// surfaces on the ordinary `SaleSchema` response, per frozen control plan
// §6.5 (no new permission or endpoint is invented for it).
// ---------------------------------------------------------------------------

export const ReturnLineInputSchema = z
	.object({
		quantity: PositiveDecimalQuantitySchema,
		saleLineId: IdentifierSchema,
	})
	.strict();

export const CreateReturnSchema = z
	.object({
		// WS3 remediation R4, P2 item 1: bounded to the SAME 500-line ceiling
		// as `CreateSaleSchema.lines` — a return can never exceed its
		// originating sale's own (now-bounded) line count.
		lines: z.array(ReturnLineInputSchema).min(1).max(500),
		reason: z.string().min(1).max(500),
		saleId: IdentifierSchema,
	})
	.strict();

export const ReturnLineSchema = z.object({
	discount: MoneySchema,
	gross: MoneySchema,
	id: IdentifierSchema,
	lineTotal: MoneySchema,
	nonStatutory: z.literal(true),
	productId: IdentifierSchema,
	productName: z.string(),
	quantity: PositiveDecimalQuantitySchema,
	saleLineId: IdentifierSchema,
	tax: MoneySchema,
	taxableBase: MoneySchema,
	taxCategory: SaleTaxCategorySchema,
	unit: z.string(),
	unitPrice: MoneySchema,
	variantId: NullableIdentifierSchema,
});

export const ReturnSchema = z.object({
	approvedAt: InstantSchema.nullable(),
	createdAt: InstantSchema,
	currency: z.string().regex(/^[A-Z]{3}$/),
	exchangeSaleId: NullableIdentifierSchema,
	id: IdentifierSchema,
	lines: z.array(ReturnLineSchema),
	mode: z.enum(["Return", "Void"]),
	reason: z.string(),
	receiptId: NullableIdentifierSchema,
	registerId: IdentifierSchema,
	saleId: IdentifierSchema,
	state: z.enum(["Pending", "Completed"]),
	totalRefundable: MoneySchema,
	version: z.number().int().min(1),
});

export const CreateRefundSchema = z
	.object({
		returnId: IdentifierSchema,
	})
	.strict();

export const RefundSchema = z.object({
	amount: MoneySchema,
	approvedAt: InstantSchema.nullable(),
	cashMovementId: NullableIdentifierSchema,
	id: IdentifierSchema,
	registerId: IdentifierSchema,
	requestedAt: InstantSchema,
	returnId: IdentifierSchema,
	state: z.enum(["Requested", "Posted"]),
	version: z.number().int().min(1),
});

export const ReissueReceiptRequestSchema = z
	.object({
		priceSuppressed: z.boolean().optional(),
	})
	.strict();

export const VoidReceiptRequestSchema = z
	.object({
		reason: z.string().min(1).max(500).optional(),
	})
	.strict();

// ---------------------------------------------------------------------------
// WS3 PR4: Deposit (commerce.deposit.create/.confirm, frozen control plan
// §6.6) and the accountant-handoff export (platform.export.create/.read,
// FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md/PDA-DOM-026).
// ---------------------------------------------------------------------------

export const CreateDepositSchema = z
	.object({
		countedAmount: MoneySchema,
		currency: z.string().regex(/^[A-Z]{3}$/),
		sourceShiftIds: z.array(IdentifierSchema).min(1),
	})
	.strict();

export const DepositSchema = z.object({
	amount: MoneySchema,
	confirmedAt: InstantSchema.nullable(),
	confirmerPartyId: NullableIdentifierSchema,
	depositReference: z.string(),
	id: IdentifierSchema,
	preparedAt: InstantSchema,
	preparerPartyId: IdentifierSchema,
	sourceShiftIds: z.array(IdentifierSchema),
	state: z.enum(["Prepared", "Reconciled"]),
	version: z.number().int().min(1),
});

export const AccountantHandoffRequestSchema = z
	.object({
		currency: z.string().regex(/^[A-Z]{3}$/),
		legalEntityId: IdentifierSchema,
		periodEnd: InstantSchema,
		periodStart: InstantSchema,
		timezone: z.string().min(1).max(100),
	})
	.strict();

export const AccountantHandoffExportSchema = z.object({
	contentHash: z.string(),
	currency: z.string().regex(/^[A-Z]{3}$/),
	generatedAt: InstantSchema,
	id: IdentifierSchema,
	idempotencyKey: z.string(),
	kind: z.literal("AccountantHandoff"),
	legalEntityId: IdentifierSchema,
	organizationId: IdentifierSchema,
	// The full accountant export package; `payload.postingBatch` validates
	// against schemas/finance/finance-handoff-v1.schema.json — that JSON
	// Schema file remains the single source of truth for its shape, not
	// re-encoded a second time as zod here.
	payload: z.record(z.string(), z.unknown()),
	periodEnd: InstantSchema,
	periodStart: InstantSchema,
	ruleVersion: z.string(),
	schemaVersion: z.string(),
	tenantId: IdentifierSchema,
	timezone: z.string(),
});

export const CsvImportManifestSchema = z.object({
	decimalSeparator: z.enum([".", ","]),
	defaultUnit: z.string().min(1).max(50).optional(),
	delimiter: z.enum([",", ";", "\t", "|"]),
	encoding: z.literal("UTF-8"),
	locale: z.string().min(2).max(35),
	newline: z.enum(["LF", "CRLF"]),
	quote: z.literal('"'),
	timezone: z.string().min(1).max(100),
});

export const CreateCsvImportSchema = z.object({
	content: z.string().min(1).max(1_048_576),
	contentType: z.literal("text/csv"),
	fileName: z.string().min(1).max(200),
	manifest: CsvImportManifestSchema,
	sha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
});

export const ImportCountsSchema = z.object({
	applied: z.number().int().min(0).max(1000),
	failed: z.number().int().min(0).max(1000),
	rejected: z.number().int().min(0).max(1000),
	skipped: z.number().int().min(0).max(1000),
	total: z.number().int().min(0).max(1000),
	valid: z.number().int().min(0).max(1000),
	warning: z.number().int().min(0).max(1000),
});

export const ImportJobSchema = z.object({
	acceptedAt: InstantSchema.nullable(),
	acceptedByUserId: NullableIdentifierSchema,
	approvedAt: InstantSchema.nullable(),
	approvedByUserId: NullableIdentifierSchema,
	cancelledAt: InstantSchema.nullable(),
	cancelledByUserId: NullableIdentifierSchema,
	completedAt: InstantSchema.nullable(),
	counts: ImportCountsSchema,
	createdAt: InstantSchema,
	createdByUserId: IdentifierSchema,
	failureCode: z.string().max(100).nullable(),
	humanReference: z.string().min(1).max(100),
	id: IdentifierSchema,
	lastCompletedRow: z.number().int().min(0).max(1000),
	manifest: CsvImportManifestSchema,
	numberAllocationId: IdentifierSchema,
	numberSequenceVersion: z.number().int().min(1),
	reconciliationState: z.enum([
		"Pending",
		"Reconciled",
		"Mismatch",
		"Accepted",
	]),
	scannerResult: z.enum(["Clean", "Blocked", "Unavailable"]),
	sourceFileName: z.string().min(1).max(200),
	sourceSha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
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
	target: z.enum(["Product", "OpeningStock"]),
	updatedAt: InstantSchema,
	version: z.number().int().min(1),
});

export const PagedImportsSchema = z.object({
	items: z.array(ImportJobSchema).max(200),
	nextCursor: z.string().nullable(),
});

export const ImportFindingSchema = z.object({
	code: z.string().min(1).max(100),
	field: z.string().max(100).nullable(),
	rowNumber: z.number().int().min(1).max(1000),
	severity: z.enum(["Info", "Warning", "Error"]),
	sourceKey: z.string().min(1).max(128),
});

export const ImportFindingsSchema = z.object({
	importId: IdentifierSchema,
	items: z.array(ImportFindingSchema).max(200),
	nextCursor: z.string().nullable(),
});

export const ImportCorrectionReportSchema = z.object({
	content: z.string().max(524_288),
	contentDisposition: z.string().min(1).max(300),
	contentType: z.literal("text/csv"),
	fileName: z.string().min(1).max(220),
	schemaVersion: z.literal("1.0.0"),
	sha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
});

export const ImportPurgeResultSchema = z.object({
	findings: z.number().int().min(0).max(5000),
	rows: z.number().int().min(0).max(1000),
	waves: z.number().int().min(0).max(100),
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
export const PagedStockBalancesSchema = pageOf(StockBalanceSchema);
export const PagedInventoryAdjustmentsSchema = pageOf(
	InventoryAdjustmentSchema
);
export const PagedStockCountsSchema = pageOf(StockCountSchema);
export const PagedStockTransfersSchema = pageOf(StockTransferSchema);
/** WS3 remediation R3b, Item 7 (server-backed discovery — pending
 * approval/read queues). One `pageOf(...)` per approval/confirm surface
 * that previously required copying an opaque ID between users/browsers. */
export const PagedPriceOverridesSchema = pageOf(PriceOverrideSchema);
export const PagedReturnsSchema = pageOf(ReturnSchema);
export const PagedRefundsSchema = pageOf(RefundSchema);
export const PagedDepositsSchema = pageOf(DepositSchema);
export const PagedRegisterSessionsSchema = pageOf(RegisterSessionSchema);

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
export type CreateEventReplayRequest = z.infer<
	typeof CreateEventReplayRequestSchema
>;
export type EventReplayRequest = z.infer<typeof EventReplayRequestSchema>;
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
export type CreateCsvImport = z.infer<typeof CreateCsvImportSchema>;
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
export type ImportCorrectionReport = z.infer<
	typeof ImportCorrectionReportSchema
>;
export type ImportFinding = z.infer<typeof ImportFindingSchema>;
export type ImportFindings = z.infer<typeof ImportFindingsSchema>;
export type ImportJob = z.infer<typeof ImportJobSchema>;
export type ImportPurgeResult = z.infer<typeof ImportPurgeResultSchema>;
export type PagedImports = z.infer<typeof PagedImportsSchema>;
export type CreateInventoryAdjustment = z.infer<
	typeof CreateInventoryAdjustmentSchema
>;
export type CreateStockCount = z.infer<typeof CreateStockCountSchema>;
export type CreateStockTransfer = z.infer<typeof CreateStockTransferSchema>;
export type PagedStockBalances = z.infer<typeof PagedStockBalancesSchema>;
export type SaveStockCountDraftLines = z.infer<
	typeof SaveStockCountDraftLinesSchema
>;
export type StockBalance = z.infer<typeof StockBalanceSchema>;
export type StockCount = z.infer<typeof StockCountSchema>;
export type StockTransfer = z.infer<typeof StockTransferSchema>;
export type ReceiveStockTransfer = z.infer<typeof ReceiveStockTransferSchema>;
export type SubmitStockCount = z.infer<typeof SubmitStockCountSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type OpenRegisterRequest = z.infer<typeof OpenRegisterRequestSchema>;
export type CloseRegisterRequest = z.infer<typeof CloseRegisterRequestSchema>;
export type RegisterSession = z.infer<typeof RegisterSessionSchema>;
export type CreateCashMovementRequest = z.infer<
	typeof CreateCashMovementRequestSchema
>;
export type CreateSafeDropRequest = z.infer<typeof CreateSafeDropRequestSchema>;
export type CashMovement = z.infer<typeof CashMovementSchema>;
export type SaleTaxCategory = z.infer<typeof SaleTaxCategorySchema>;
export type SaleLineInput = z.infer<typeof SaleLineInputSchema>;
export type CreateSale = z.infer<typeof CreateSaleSchema>;
export type TenderReference = z.infer<typeof TenderReferenceSchema>;
export type CompleteSaleRequest = z.infer<typeof CompleteSaleRequestSchema>;
export type RequestPriceOverride = z.infer<typeof RequestPriceOverrideSchema>;
export type SaleLine = z.infer<typeof SaleLineSchema>;
export type Sale = z.infer<typeof SaleSchema>;
export type ReceiptLine = z.infer<typeof ReceiptLineSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;
export type ReturnLineInput = z.infer<typeof ReturnLineInputSchema>;
export type CreateReturn = z.infer<typeof CreateReturnSchema>;
export type ReturnLine = z.infer<typeof ReturnLineSchema>;
export type Return = z.infer<typeof ReturnSchema>;
export type CreateRefund = z.infer<typeof CreateRefundSchema>;
export type Refund = z.infer<typeof RefundSchema>;
export type ReissueReceiptRequest = z.infer<typeof ReissueReceiptRequestSchema>;
export type VoidReceiptRequest = z.infer<typeof VoidReceiptRequestSchema>;
export type CreateDeposit = z.infer<typeof CreateDepositSchema>;
export type Deposit = z.infer<typeof DepositSchema>;
export type PriceOverride = z.infer<typeof PriceOverrideSchema>;
export type AccountantHandoffRequest = z.infer<
	typeof AccountantHandoffRequestSchema
>;
export type AccountantHandoffExport = z.infer<
	typeof AccountantHandoffExportSchema
>;
