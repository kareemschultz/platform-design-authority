import { randomUUID } from "node:crypto";
import {
	createPosApplication,
	createPosService,
	type PosCatalogPort,
	PosError,
	type PosIdFactory,
} from "@meridian/domain-pos";
import { createPricingEngine } from "@meridian/engine-pricing";
import { createTaxEngine } from "@meridian/engine-tax";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createPosRepository } from "@meridian/persistence-pos-postgres";
import type { AppendAuditInput } from "@meridian/platform-audit";
import { AuthorizationError } from "@meridian/platform-authorization";

import { auditApplication } from "./audit";
import { permissionAuthorizer } from "./authorization";
import { catalogService } from "./catalog";
import { entitlementEvaluator } from "./entitlements";
import {
	createReturnInventoryMovementAdapter,
	createSaleInventoryMovementAdapter,
} from "./inventory";
import {
	createDepositReferenceAllocator,
	createReceiptNumberAllocator,
} from "./numbering";
import { partyIdentityLinkDirectory } from "./party";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

const ids: PosIdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createPosRepository(client),
}));

/**
 * WS3 PR2's ONE shared unit of work for `sale.complete` (frozen control
 * plan "Read first"): one `createPostgresUnitOfWork`, one `PoolClient`,
 * one transaction spanning the sale commit, receipt numbering, and the
 * synchronous Inventory stock movement — never split across separate
 * transactions the way `platform-import-export`'s `OpeningStock` target
 * commit is. Every other POS command keeps using the plain `unitOfWork`
 * above.
 */
const saleUnitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	inventory: createSaleInventoryMovementAdapter(client),
	numbering: createReceiptNumberAllocator(client),
	repository: createPosRepository(client),
}));

/**
 * WS3 PR3's shared unit of work for `return.approve`, `voidReceipt`, and
 * `reissueReceipt` (frozen control plan §6.3, "Read first" — mirrors
 * `saleUnitOfWork` exactly): one `createPostgresUnitOfWork`, one
 * `PoolClient`, one transaction spanning the Return/Void commit, receipt
 * numbering, and the synchronous compensating Inventory movement.
 * `reissueReceipt` never invokes `inventory`; it shares this unit of work
 * anyway rather than standing up a third transactional wiring point purely
 * to omit one unused port (see the domain package's `PosServiceOptions.
 * returnUnitOfWork` doc comment).
 */
const returnUnitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	inventory: createReturnInventoryMovementAdapter(client),
	numbering: createReceiptNumberAllocator(client),
	repository: createPosRepository(client),
}));

/**
 * WS3 PR4's shared unit of work for `deposit.create` ONLY (frozen control
 * plan §6.6, mirrors `saleUnitOfWork`'s "one shared unit of work"
 * discipline): one `createPostgresUnitOfWork`, one `PoolClient`, one
 * transaction spanning the deposit-reservation commit and the
 * organization-scoped deposit-reference allocation. `confirmDeposit` never
 * touches Numbering — it uses the plain `unitOfWork` above.
 */
const depositUnitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	numbering: createDepositReferenceAllocator(client),
	repository: createPosRepository(client),
}));

const parties = {
	async requireActorPartyId(input: {
		authUserId: string;
		organizationId: string;
		tenantId: string;
	}) {
		const partyId = await partyIdentityLinkDirectory.findActivePartyId(input);
		if (!partyId) {
			throw new PosError(
				"invalid_reference",
				"Actor has no active Party identity link for the active organization"
			);
		}
		return partyId;
	},
};

/** Product name/reference lookup for the sale-line snapshot. Reads go
 * through the same `catalogService` Inventory's own `references` port
 * already uses (top-level pool, not the sale's transactional client — a
 * cross-domain READ, not a write participating in the sale's atomicity). */
const products: PosCatalogPort = {
	async requireProduct(input) {
		const product = await catalogService.getProduct(
			input.tenantId,
			input.productId
		);
		if (!input.variantId) {
			return { productName: product.name };
		}
		const variant = product.variants.find(
			(candidate) => candidate.id === input.variantId
		);
		if (!variant) {
			throw new PosError(
				"invalid_reference",
				"Variant does not belong to the Product"
			);
		}
		return { productName: `${product.name} — ${variant.name}` };
	},
};

export const posService = createPosService({
	clock: () => new Date(),
	depositUnitOfWork,
	ids,
	parties,
	pricing: createPricingEngine(),
	products,
	returnUnitOfWork,
	saleUnitOfWork,
	tax: createTaxEngine(),
	unitOfWork,
});

const baseApplication = createPosApplication({
	activeContexts: {
		async requireActiveContext(input) {
			const context = await tenancyService.requireContext(input);
			return {
				// WS3 remediation R2, Finding B: previously dropped here even
				// though `tenancyService.requireContext` already resolves it
				// (`ActiveContextRecord.locationId`, set by `switchContext`) —
				// the domain layer's by-ID lookups now use this to additionally
				// scope session/sale reads and mutations to the caller's active
				// location, on top of organization scope, for a location-scoped
				// actor. `undefined` for an organization-scoped-only actor is a
				// no-op filter, never a deny-everything or allow-everything.
				locationId: context.locationId,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			};
		},
	},
	entitlements: entitlementEvaluator,
	permissions: permissionAuthorizer,
	service: posService,
});

// ---------------------------------------------------------------------------
// WS3 remediation R4, P2 item 3 / Finding C's own closing criterion
// ("denial produces the required Audit evidence but no business effect"):
// every maker/checker approval flow persists a real Platform Audit record
// with `outcome: "denied"` for a REJECTED authority/control attempt —
// self-approval separation (`PosError` code `approval_separation`, thrown
// by `posService`) or a denied permission (`AuthorizationError`, thrown by
// `authorize()` inside `createPosApplication` before `posService` is ever
// reached). Both branches never dispatch to the service/unit-of-work, so
// no business event is ever emitted alongside the denial — the audit
// record is the ONLY effect. A failure while WRITING the audit record
// itself must never mask or replace the real denial the caller already
// sees: it is caught and dropped, never rethrown in place of the original
// error (CLAUDE.md §14 prohibits silent contradiction resolution, but this
// is not resolving anything — the original denial still propagates
// unchanged; only the best-effort evidence write is allowed to fail
// quietly rather than turn a governed 403/409 into an unrelated 500).
// ---------------------------------------------------------------------------

interface ApprovalDenialInput {
	actorUserId: string;
	contextId: string;
	correlationId: string;
	sessionId: string;
}

export type DenialReasonCode = "approval_separation" | "permission_denied";

export function classifyApprovalDenial(
	error: unknown
): DenialReasonCode | null {
	if (error instanceof AuthorizationError) {
		return "permission_denied";
	}
	if (error instanceof PosError && error.code === "approval_separation") {
		return "approval_separation";
	}
	return null;
}

export interface DenialAuditPort {
	append: (input: AppendAuditInput) => Promise<unknown>;
}

export interface DenialAuditContextResolver {
	requireContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{
		locationId?: string | null;
		organizationId: string;
		tenantId: string;
	}>;
}

/** Exported for direct unit coverage of the classification/best-effort
 * contract without a live database — the live-PG proof (a real Audit row,
 * read back) lives in `pos.integration.test.ts` against this exact
 * function, wired to a real `auditApplication`/`tenancyService`. */
export function withApprovalDenialAudit<
	TInput extends ApprovalDenialInput,
	TResult,
>(options: {
	action: string;
	audit: DenialAuditPort;
	contexts: DenialAuditContextResolver;
	fn: (input: TInput) => Promise<TResult>;
	targetId: (input: TInput) => string;
	targetType: string;
}): (input: TInput) => Promise<TResult> {
	return async (input: TInput): Promise<TResult> => {
		try {
			return await options.fn(input);
		} catch (error) {
			const reasonCode = classifyApprovalDenial(error);
			if (reasonCode) {
				await recordDenialBestEffort({
					action: options.action,
					audit: options.audit,
					contexts: options.contexts,
					input,
					reasonCode,
					targetId: options.targetId(input),
					targetType: options.targetType,
				});
			}
			throw error;
		}
	};
}

async function recordDenialBestEffort(params: {
	action: string;
	audit: DenialAuditPort;
	contexts: DenialAuditContextResolver;
	input: ApprovalDenialInput;
	reasonCode: DenialReasonCode;
	targetId: string;
	targetType: string;
}): Promise<void> {
	try {
		const context = await params.contexts.requireContext({
			authUserId: params.input.actorUserId,
			contextId: params.input.contextId,
			sessionId: params.input.sessionId,
		});
		await params.audit.append({
			action: params.action,
			actorType: "human",
			actorUserId: params.input.actorUserId,
			classification: "Confidential",
			correlationId: params.input.correlationId,
			locationId: context.locationId ?? undefined,
			metadata: { reasonCode: params.reasonCode },
			occurredAt: new Date(),
			organizationId: context.organizationId,
			outcome: "denied",
			reasonCode: params.reasonCode,
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetId: params.targetId,
			targetType: params.targetType,
			tenantId: context.tenantId,
		});
	} catch {
		// Best-effort only — see the block comment above. The caller's
		// original denial error is always rethrown regardless.
	}
}

/** `posApplication` re-exported with the five maker/checker approval
 * flows wrapped for denial-audit persistence. Every OTHER method on
 * `baseApplication` (opens, creates, reads, closes, sale completion) is
 * unchanged — audit coverage here is bounded to Finding C's five approval
 * flows, not every POS operation, per the remediation directive's own
 * scoping ("rejected authority/control attempts", read together with
 * Finding C's specific closing criterion). */
export const posApplication = {
	...baseApplication,
	approveCashVariance: withApprovalDenialAudit({
		action: "commerce.cash-variance.approve.denied",
		audit: auditApplication,
		contexts: tenancyService,
		fn: baseApplication.approveCashVariance,
		targetId: (
			input: Parameters<typeof baseApplication.approveCashVariance>[0]
		) => input.registerSessionId,
		targetType: "RegisterSession",
	}),
	approvePriceOverride: withApprovalDenialAudit({
		action: "commerce.price-override.approve.denied",
		audit: auditApplication,
		contexts: tenancyService,
		fn: baseApplication.approvePriceOverride,
		targetId: (
			input: Parameters<typeof baseApplication.approvePriceOverride>[0]
		) => input.overrideId,
		targetType: "PriceOverride",
	}),
	approveRefund: withApprovalDenialAudit({
		action: "commerce.refund.approve.denied",
		audit: auditApplication,
		contexts: tenancyService,
		fn: baseApplication.approveRefund,
		targetId: (input: Parameters<typeof baseApplication.approveRefund>[0]) =>
			input.refundId,
		targetType: "Refund",
	}),
	approveReturn: withApprovalDenialAudit({
		action: "commerce.return.approve.denied",
		audit: auditApplication,
		contexts: tenancyService,
		fn: baseApplication.approveReturn,
		targetId: (input: Parameters<typeof baseApplication.approveReturn>[0]) =>
			input.returnId,
		targetType: "Return",
	}),
	confirmDeposit: withApprovalDenialAudit({
		action: "commerce.deposit.confirm.denied",
		audit: auditApplication,
		contexts: tenancyService,
		fn: baseApplication.confirmDeposit,
		targetId: (input: Parameters<typeof baseApplication.confirmDeposit>[0]) =>
			input.depositId,
		targetType: "Deposit",
	}),
};

/**
 * `/registers/{registerId}/safe-drops` and `/registers/{registerId}/cash-
 * movements` share one permission and one domain command
 * (`commerce.cash-movement.create`) per the frozen WS3 control plan §4/§6 —
 * a safe drop is a cash movement with the `SafeDrop` reason code and
 * `PaidOut` direction fixed by the transport, not a caller choice.
 */
export const posTransportApplication = {
	approveCashVariance: posApplication.approveCashVariance,
	approveRefund: posApplication.approveRefund,
	approveReturn: posApplication.approveReturn,
	approveSalePriceOverride: posApplication.approvePriceOverride,
	closeRegister: posApplication.closeRegister,
	completeSale: posApplication.completeSale,
	confirmDeposit: posApplication.confirmDeposit,
	createCashMovement: posApplication.createCashMovement,
	createDeposit: posApplication.createDeposit,
	createRefund: posApplication.createRefund,
	createReturn: posApplication.createReturn,
	createSafeDrop: (
		input: Omit<
			Parameters<typeof posApplication.createCashMovement>[0],
			"direction" | "reasonCode"
		>
	) =>
		posApplication.createCashMovement({
			...input,
			direction: "PaidOut",
			reasonCode: "SafeDrop",
		}),
	createSale: posApplication.createSale,
	getCashVariance: posApplication.getCashVariance,
	getDeposit: posApplication.getDeposit,
	getReceipt: posApplication.getReceipt,
	getReceiptByNumber: posApplication.getReceiptByNumber,
	getRefund: posApplication.getRefund,
	getRegisterSession: posApplication.getRegisterSession,
	getReturn: posApplication.getReturn,
	getSaleForReturn: posApplication.getSaleForReturn,
	holdSale: posApplication.holdSale,
	// WS3 remediation R3b, Item 7 (server-backed discovery): each wrapper
	// below reshapes the router's flat `input.query` (cursor/limit/state/
	// locationId, matching `PageQuerySchema` in `packages/contracts/
	// platform-api`) into the domain application layer's `{page, filters}`
	// split — the SAME reshaping `listInventoryAdjustments` already does in
	// this same pattern, applied to POS's five pending-approval/
	// confirmation queues.
	listCashVariances: (
		input: Omit<
			Parameters<typeof posApplication.listCashVariances>[0],
			"filters" | "page"
		> & {
			page: {
				cursor?: string;
				limit: number;
				locationId?: string;
				state?: "Open" | "Closing" | "Closed";
			};
		}
	) => {
		const { locationId, state, ...page } = input.page;
		return posApplication.listCashVariances({
			...input,
			filters: { locationId, state },
			page,
		});
	},
	listDeposits: (
		input: Omit<
			Parameters<typeof posApplication.listDeposits>[0],
			"filters" | "page"
		> & {
			page: {
				cursor?: string;
				limit: number;
				state?: "Prepared" | "Reconciled";
			};
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listDeposits({ ...input, filters: { state }, page });
	},
	listPriceOverrides: (
		input: Omit<
			Parameters<typeof posApplication.listPriceOverrides>[0],
			"filters" | "page"
		> & {
			page: { cursor?: string; limit: number; state?: "Pending" | "Approved" };
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listPriceOverrides({
			...input,
			filters: { state },
			page,
		});
	},
	listRefunds: (
		input: Omit<
			Parameters<typeof posApplication.listRefunds>[0],
			"filters" | "page"
		> & {
			page: { cursor?: string; limit: number; state?: "Requested" | "Posted" };
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listRefunds({ ...input, filters: { state }, page });
	},
	listReturns: (
		input: Omit<
			Parameters<typeof posApplication.listReturns>[0],
			"filters" | "page"
		> & {
			page: { cursor?: string; limit: number; state?: "Pending" | "Completed" };
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listReturns({ ...input, filters: { state }, page });
	},
	openRegister: posApplication.openRegister,
	reissueReceipt: posApplication.reissueReceipt,
	requestSalePriceOverride: posApplication.requestPriceOverride,
	voidReceipt: posApplication.voidReceipt,
};
