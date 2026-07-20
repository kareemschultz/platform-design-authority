import type {
	AccountantHandoffExport,
	Product,
	SaleLineInput,
	SaleTaxCategory,
} from "@meridian/contracts-platform-api";
import {
	IdentifierSchema,
	type RegisterSession,
	RegisterSessionSchema,
	type Sale,
	SaleSchema,
} from "@meridian/contracts-platform-api";
import { z } from "zod";

import type { DownloadEnvironment } from "./imports";

// ---------------------------------------------------------------------------
// WS3 PR5: web POS pure logic. The frozen control plan's contract surface
// (docs/blueprint/17-Roadmap/WS3_POS_CASH_IMPLEMENTATION_PLAN.md §8) registers
// NO read/list endpoint for RegisterSession, Sale, Return, Refund, or
// Deposit — only `commerce.receipt.read` and `platform.export.read` are GET
// operations. Every other POS resource is a client-tracked workflow state the
// browser that performed the maker action holds locally between the command
// responses it already received, exactly like a physical POS terminal holds
// its own open shift/sale in local memory. This module is the persistence and
// math layer for that model; it is NOT a substitute server read model. A
// browser that did not originate a resource cannot look it up here — the only
// cross-browser handoff the contract supports is a human reading an ID (and,
// for cash-variance, a version) from one screen into another, which is why
// every approval surface in this stage is an ID-entry form (see
// register-pages.tsx / sale-pages.tsx / returns-pages.tsx / deposit-pages.tsx).
// ---------------------------------------------------------------------------

export const POS_CURRENCY = "GYD";

export function formatMoneyMinor(
	amountMinor: number,
	currency: string
): string {
	return new Intl.NumberFormat("en-GY", {
		currency,
		style: "currency",
	}).format(amountMinor / 100);
}

export function addMinor(...amounts: number[]): number {
	return amounts.reduce((sum, amount) => sum + amount, 0);
}

/** Change owed on a cash tender: never negative (validation rejects an
 * insufficient tender before completion; this is a display-safety floor). */
export function changeDueMinor(
	tenderedMinor: number,
	totalMinor: number
): number {
	return Math.max(0, tenderedMinor - totalMinor);
}

export function isSufficientCashTender(
	tenderedMinor: number,
	totalMinor: number
): boolean {
	return tenderedMinor >= totalMinor;
}

const MAJOR_UNIT_INPUT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

/** Parses a decimal major-unit amount (what a person types, e.g. "12.50")
 * into an integer minor-unit amount. Returns null for anything that is not
 * an unambiguous non-negative amount with at most 2 fractional digits —
 * money never round-trips through binary floating point (CLAUDE.md §7). */
export function parseMoneyInputToMinor(value: string): number | null {
	const trimmed = value.trim();
	if (!MAJOR_UNIT_INPUT_PATTERN.test(trimmed)) {
		return null;
	}
	const [major, fraction = ""] = trimmed.split(".");
	const minor = `${fraction}00`.slice(0, 2);
	return Number.parseInt(major, 10) * 100 + Number.parseInt(minor, 10);
}

export function formatMinorAsMajorInput(amountMinor: number): string {
	const sign = amountMinor < 0 ? "-" : "";
	const absolute = Math.abs(amountMinor);
	return `${sign}${Math.trunc(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// WS3 remediation R3b, Item 6 (validation closure — export date range).
// `ExportCreatePage` previously called `new Date(value.periodStart)
// .toISOString()` directly on unvalidated form input: an unparsable date
// string (e.g. "not-a-date", or a value emptied mid-edit) produces
// `Invalid Date`, and `Invalid Date#toISOString()` THROWS
// `RangeError: Invalid time value` — an uncaught exception during
// `onSubmit`, not a validation error. These helpers make date parsing safe
// (never throw, always return null on anything unparsable) and let the
// export form's zod schema enforce start <= end BEFORE ever constructing a
// request body.
// ---------------------------------------------------------------------------

/** Parses a date-only or datetime input string into an ISO-8601 instant
 * string, never throwing. Returns null for anything `Date` cannot parse
 * into a finite time value (mirrors `Number.isFinite(date.getTime())`,
 * the standard safe way to detect `Invalid Date` without relying on
 * `toISOString()`'s own throw as control flow). */
export function parseDateInputToIsoInstant(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}
	const date = new Date(trimmed);
	if (!Number.isFinite(date.getTime())) {
		return null;
	}
	return date.toISOString();
}

/** True only when both dates parse AND start is not after end. Bounds an
 * export request to a well-formed, non-inverted period before it is ever
 * sent — the server's own period validation remains authoritative, this is
 * the client-side pre-check that stops an obviously-invalid range (and the
 * `Invalid Date` throw) before a request is even built. */
export function isValidExportDateRange(
	periodStart: string,
	periodEnd: string
): boolean {
	const start = parseDateInputToIsoInstant(periodStart);
	const end = parseDateInputToIsoInstant(periodEnd);
	return start !== null && end !== null && start <= end;
}

// ---------------------------------------------------------------------------
// Register session: client-accumulated cash ledger. `RegisterSessionSchema`
// and `CashMovementSchema` never return a running total, so the "running
// expected cash" surface the stage spec requires is this browser tab's own
// tally, seeded from the opening float and appended to as this browser
// observes cash-affecting command responses (movements, safe drops, cash
// sale completions, posted cash refunds). Explicitly session-local, not a
// server aggregate — labelled as such in the session-view UI.
// ---------------------------------------------------------------------------

export type CashLedgerEntryKind =
	| "CashRefund"
	| "CashSale"
	| "OpeningFloat"
	| "PaidIn"
	| "PaidOut"
	| "SafeDrop";

export interface CashLedgerEntry {
	amountMinor: number;
	id: string;
	kind: CashLedgerEntryKind;
	occurredAt: string;
}

export function openingLedgerEntry(session: RegisterSession): CashLedgerEntry {
	return {
		amountMinor: session.openingFloat.amountMinor,
		id: `opening_${session.id}`,
		kind: "OpeningFloat",
		occurredAt: session.openedAt,
	};
}

export function ledgerEntryMinor(
	kind: CashLedgerEntryKind,
	amountMinor: number
) {
	return kind === "PaidOut" || kind === "SafeDrop" || kind === "CashRefund"
		? -Math.abs(amountMinor)
		: Math.abs(amountMinor);
}

export function runningExpectedCashMinor(ledger: CashLedgerEntry[]): number {
	return addMinor(...ledger.map((entry) => entry.amountMinor));
}

// ---------------------------------------------------------------------------
// Session-local persistence. sessionStorage holds untrusted persisted input:
// every read is parsed against the SAME zod schema the server response used,
// exactly the `parseCursorTrail` discipline (`operations.ts`) — a malformed
// or tampered value degrades to "not found" rather than throwing or being
// trusted as-is.
// ---------------------------------------------------------------------------

const REGISTER_STORAGE_PREFIX = "platform.pos.register.";
const SALE_STORAGE_PREFIX = "platform.pos.sale.";
const MAKER_STORAGE_PREFIX = "platform.pos.maker.";
const ACTIVE_REGISTER_KEY = "platform.pos.active-register-id";

const RegisterWorkspaceSchema = z.object({
	ledger: z
		.array(
			z.object({
				amountMinor: z.number().int(),
				id: z.string().max(200),
				kind: z.enum([
					"CashRefund",
					"CashSale",
					"OpeningFloat",
					"PaidIn",
					"PaidOut",
					"SafeDrop",
				]),
				occurredAt: z.string().max(64),
			})
		)
		.max(500),
	session: RegisterSessionSchema,
});

function storageAvailable(): boolean {
	return typeof sessionStorage !== "undefined";
}

function readJson(key: string): unknown {
	if (!storageAvailable()) {
		return null;
	}
	const raw = sessionStorage.getItem(key);
	if (!raw || raw.length > 200_000) {
		return null;
	}
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

function writeJson(key: string, value: unknown): void {
	if (!storageAvailable()) {
		return;
	}
	try {
		sessionStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage unavailable or quota exceeded: the workspace simply will not
		// survive a reload. Commands remain server-authoritative regardless.
	}
}

export interface RegisterWorkspace {
	ledger: CashLedgerEntry[];
	session: RegisterSession;
}

export function saveRegisterWorkspace(workspace: RegisterWorkspace): void {
	writeJson(`${REGISTER_STORAGE_PREFIX}${workspace.session.id}`, workspace);
	if (storageAvailable()) {
		sessionStorage.setItem(ACTIVE_REGISTER_KEY, workspace.session.id);
	}
}

export function loadRegisterWorkspace(
	registerSessionId: string
): RegisterWorkspace | null {
	const parsed = RegisterWorkspaceSchema.safeParse(
		readJson(`${REGISTER_STORAGE_PREFIX}${registerSessionId}`)
	);
	return parsed.success ? parsed.data : null;
}

export function loadActiveRegisterWorkspaceId(): string | null {
	if (!storageAvailable()) {
		return null;
	}
	const value = sessionStorage.getItem(ACTIVE_REGISTER_KEY);
	return value && IdentifierSchema.safeParse(value).success ? value : null;
}

export function clearRegisterWorkspace(registerSessionId: string): void {
	if (!storageAvailable()) {
		return;
	}
	sessionStorage.removeItem(`${REGISTER_STORAGE_PREFIX}${registerSessionId}`);
	if (sessionStorage.getItem(ACTIVE_REGISTER_KEY) === registerSessionId) {
		sessionStorage.removeItem(ACTIVE_REGISTER_KEY);
	}
}

export function saveSaleWorkspace(sale: Sale): void {
	writeJson(`${SALE_STORAGE_PREFIX}${sale.id}`, sale);
}

export function loadSaleWorkspace(saleId: string): Sale | null {
	const parsed = SaleSchema.safeParse(
		readJson(`${SALE_STORAGE_PREFIX}${saleId}`)
	);
	return parsed.success ? parsed.data : null;
}

export function clearSaleWorkspace(saleId: string): void {
	if (!storageAvailable()) {
		return;
	}
	sessionStorage.removeItem(`${SALE_STORAGE_PREFIX}${saleId}`);
}

// ---------------------------------------------------------------------------
// Maker/checker self-approval hiding. Session-local best-effort UX only: the
// server enforces the maker != checker rule authoritatively (frozen control
// plan §6) regardless of what this browser remembers. Keyed on `actorUserId`
// (Better Auth id), matching the server's own comparison field exactly —
// never `partyId`, which is a different identifier space.
// ---------------------------------------------------------------------------

export type MakerResourceKind =
	| "cash-variance"
	| "deposit"
	| "price-override"
	| "refund"
	| "return";

export function recordMakerActor(
	kind: MakerResourceKind,
	resourceId: string,
	actorUserId: string
): void {
	if (
		!(storageAvailable() && IdentifierSchema.safeParse(actorUserId).success)
	) {
		return;
	}
	sessionStorage.setItem(
		`${MAKER_STORAGE_PREFIX}${kind}.${resourceId}`,
		actorUserId
	);
}

export function knownMakerActor(
	kind: MakerResourceKind,
	resourceId: string
): string | null {
	if (!storageAvailable()) {
		return null;
	}
	const value = sessionStorage.getItem(
		`${MAKER_STORAGE_PREFIX}${kind}.${resourceId}`
	);
	return value && IdentifierSchema.safeParse(value).success ? value : null;
}

/** True only when THIS browser locally recorded itself as the maker for this
 * resource. False (i.e. "show the approve control") whenever the maker is
 * unknown to this browser — including the ordinary case of a genuinely
 * different checker browser, which never recorded anything for this id. */
export function isKnownSelfApproval(
	kind: MakerResourceKind,
	resourceId: string,
	currentActorUserId: string | null | undefined
): boolean {
	if (!currentActorUserId) {
		return false;
	}
	const maker = knownMakerActor(kind, resourceId);
	return maker !== null && maker === currentActorUserId;
}

// ---------------------------------------------------------------------------
// Return line bounds: `commerce.return.create` performs the cumulative-
// returned-quantity check server-side (frozen control plan §6.3); this is a
// client-side mirror so the return form can bound quantity inputs before
// submission, using ONLY data this browser already holds locally (a cached
// Sale plus any Return responses this browser has observed for it — no
// server read exists to refresh this independently, a disclosed prototype
// limit reflected in the UI copy).
// ---------------------------------------------------------------------------

export function outstandingReturnableQuantity(
	saleLineQuantity: string,
	alreadyReturnedQuantity: string
): number {
	const total = Number.parseFloat(saleLineQuantity);
	const returned = Number.parseFloat(alreadyReturnedQuantity);
	if (!(Number.isFinite(total) && Number.isFinite(returned))) {
		return 0;
	}
	return Math.max(0, total - returned);
}

export const SALE_TAX_CATEGORIES = [
	"GY_STANDARD_14",
	"GY_ZERO_RATED",
	"GY_EXEMPT",
	"GY_OUT_OF_SCOPE",
] as const;

export const SALE_TAX_CATEGORY_LABELS: Record<
	(typeof SALE_TAX_CATEGORIES)[number],
	string
> = {
	GY_EXEMPT: "Exempt (prototype, non-statutory)",
	GY_OUT_OF_SCOPE: "Out of scope (prototype, non-statutory)",
	GY_STANDARD_14: "Standard 14% (prototype, non-statutory)",
	GY_ZERO_RATED: "Zero-rated (prototype, non-statutory)",
};

export function canEditSaleLines(sale: Pick<Sale, "state">): boolean {
	return sale.state === "Open" || sale.state === "Held";
}

export function saleHasPendingPriceOverride(sale: Sale): boolean {
	return sale.lines.some((line) => line.priceOverrideState === "Pending");
}

export function canCompleteSale(sale: Sale): boolean {
	return (
		sale.state !== "Completed" &&
		sale.lines.length > 0 &&
		!saleHasPendingPriceOverride(sale)
	);
}

// ---------------------------------------------------------------------------
// Sale cart: the frozen control plan's contract surface registers NO
// add-line/remove-line/edit-line endpoint against an already-created Sale —
// only `commerce.sale.create` (which requires the full, final line array
// up front, `CreateSaleSchema.lines.min(1)`) and `commerce.price-override.*`
// (which mutates a line's PRICE only, never its quantity or presence). The
// "qty edit/remove BEFORE completion only" surface the stage spec requires
// is therefore this browser's own LOCAL, unsubmitted cart: a cashier
// searches/adds/edits/removes draft lines with zero server calls, then one
// `sale.create` call submits the finished cart atomically. Once created, a
// line's quantity is fixed for the life of the Sale — only its PRICE can
// change, through the price-override maker/checker pair.
// ---------------------------------------------------------------------------

export interface CartLineDraft {
	discountAmountMinor: number;
	key: string;
	productId: string;
	productName: string;
	quantity: string;
	taxCategory: SaleTaxCategory;
	unit: string;
	/** Raw decimal major-unit text as typed ("12.50"), kept as a string (not
	 * a pre-parsed minor integer) so the price `<Input>` stays a normal
	 * CONTROLLED field the cashier can type into character-by-character —
	 * reformatting on every keystroke (e.g. re-rendering "1.00" mid-type)
	 * would break the keyboard-first entry the stage spec requires. Parsed
	 * on demand with `cartLineUnitPriceMinor`, mirroring `PosMoneyField`'s
	 * own string-first pattern. */
	unitPriceInput: string;
	variantId: string | null;
}

/** Parses a draft line's raw price text; null when not yet a valid amount
 * (e.g. empty, or mid-edit). */
export function cartLineUnitPriceMinor(line: CartLineDraft): number | null {
	return parseMoneyInputToMinor(line.unitPriceInput);
}

/** Client-side ESTIMATE only (unitPrice × quantity, minus any line
 * discount) — never tax-inclusive. The server's `engine.pricing`/
 * `engine.tax` computation on `sale.create` is the one authoritative total;
 * this exists so the cart screen can show a running subtotal before that
 * round-trip, and callers must label it as an estimate, never as the sale
 * total (CLAUDE.md §14 — no fabricated evidence presented as authoritative). */
export function cartLineEstimatedSubtotalMinor(line: CartLineDraft): number {
	const quantity = Number.parseFloat(line.quantity);
	const unitPriceMinor = cartLineUnitPriceMinor(line);
	if (!Number.isFinite(quantity) || quantity <= 0 || unitPriceMinor === null) {
		return 0;
	}
	const gross = Math.round(unitPriceMinor * quantity);
	return Math.max(0, gross - line.discountAmountMinor);
}

export function cartSubtotalEstimateMinor(lines: CartLineDraft[]): number {
	return addMinor(...lines.map((line) => cartLineEstimatedSubtotalMinor(line)));
}

export function toSaleLineInput(line: CartLineDraft): SaleLineInput {
	const unitPriceMinor = cartLineUnitPriceMinor(line) ?? 0;
	return {
		discountAmount:
			line.discountAmountMinor > 0
				? { amountMinor: line.discountAmountMinor, currency: POS_CURRENCY }
				: undefined,
		productId: line.productId,
		quantity: line.quantity,
		taxCategory: line.taxCategory,
		unit: line.unit,
		unitPrice: { amountMinor: unitPriceMinor, currency: POS_CURRENCY },
		variantId: line.variantId ?? undefined,
	};
}

// ---------------------------------------------------------------------------
// WS3 remediation R3, Finding F: the barcode-scan Enter-to-add DECISION,
// extracted as a pure function so the race fix's correctness (which
// product a given lookup response resolves to) is unit-testable without a
// DOM/React harness — `sale-pages.tsx`'s `ProductLookup` awaits an
// imperative `queryClient.fetchQuery` keyed to the EXACT scanned value and
// calls this resolver on ITS OWN response only, never on shared reactive
// `useQuery` state, which is what let a slow earlier response's stale data
// add the wrong product for a faster later scan before this fix.
// ---------------------------------------------------------------------------

export type BarcodeScanOutcome =
	| { kind: "added"; product: Product; variantId: string }
	| { kind: "ambiguous" }
	| { kind: "no-match" };

/** A barcode lookup auto-adds only when it resolves to exactly one Product
 * with exactly one Variant — anything else (no match, or a genuinely
 * ambiguous multi-product/multi-variant result) must never silently pick
 * one; the caller shows visible+accessible feedback for both cases. */
export function resolveBarcodeScan(products: Product[]): BarcodeScanOutcome {
	if (products.length === 0) {
		return { kind: "no-match" };
	}
	const [only] = products;
	if (products.length === 1 && only && only.variants.length === 1) {
		const [variant] = only.variants;
		if (variant) {
			return { kind: "added", product: only, variantId: variant.id };
		}
	}
	return { kind: "ambiguous" };
}

export function isValidCartLineDraft(line: CartLineDraft): boolean {
	const quantity = Number.parseFloat(line.quantity);
	const unitPriceMinor = cartLineUnitPriceMinor(line);
	return (
		line.productId.length > 0 &&
		Number.isFinite(quantity) &&
		quantity > 0 &&
		unitPriceMinor !== null &&
		unitPriceMinor > 0
	);
}

// ---------------------------------------------------------------------------
// Generic maker-resource workspace: return/refund/deposit IDs this browser
// created, kept ONLY so this tab can show "you created this" context and
// cross-link to the matching approval-lookup form. Not a substitute for a
// server read (none is registered for these resources) — a second browser
// approving a resource it did not create never sees this list, which is the
// intended maker/checker separation.
// ---------------------------------------------------------------------------

const CREATED_RESOURCE_PREFIX = "platform.pos.created.";

export interface CreatedResourceRecord {
	createdAt: string;
	id: string;
	label: string;
}

export function recordCreatedResource(
	kind: MakerResourceKind,
	record: CreatedResourceRecord
): void {
	if (!storageAvailable()) {
		return;
	}
	const key = `${CREATED_RESOURCE_PREFIX}${kind}`;
	const existing = z
		.array(
			z.object({
				createdAt: z.string().max(64),
				id: z.string().max(200),
				label: z.string().max(200),
			})
		)
		.max(50)
		.safeParse(readJson(key));
	const list = existing.success ? existing.data : [];
	writeJson(key, [record, ...list].slice(0, 50));
}

export function listCreatedResources(
	kind: MakerResourceKind
): CreatedResourceRecord[] {
	const parsed = z
		.array(
			z.object({
				createdAt: z.string().max(64),
				id: z.string().max(200),
				label: z.string().max(200),
			})
		)
		.max(50)
		.safeParse(readJson(`${CREATED_RESOURCE_PREFIX}${kind}`));
	return parsed.success ? parsed.data : [];
}

// ---------------------------------------------------------------------------
// Accountant-handoff export download. `createAccountantHandoffExport`
// returns the full artifact (including `payload`) synchronously in the
// command response — there is no separate async job to poll (verified
// against `apps/server/composition/finance-handoff.ts`). "Download of the
// artifact" is therefore a client-side Blob of the returned JSON payload,
// mirroring `downloadCorrectionReport`'s established pattern exactly
// (`apps/web/src/lib/imports.ts`) rather than inventing a second one.
// ---------------------------------------------------------------------------

function browserDownloadEnvironment(): DownloadEnvironment {
	return {
		createObjectUrl: (blob) => URL.createObjectURL(blob),
		revokeObjectUrl: (url) => URL.revokeObjectURL(url),
		trigger: (url, fileName) => {
			const anchor = document.createElement("a");
			anchor.download = fileName;
			anchor.href = url;
			anchor.click();
		},
	};
}

export function downloadAccountantHandoffExport(
	exportRecord: AccountantHandoffExport,
	environment = browserDownloadEnvironment()
): void {
	const content = JSON.stringify(
		{
			contentHash: exportRecord.contentHash,
			legalEntityId: exportRecord.legalEntityId,
			payload: exportRecord.payload,
			periodEnd: exportRecord.periodEnd,
			periodStart: exportRecord.periodStart,
			ruleVersion: exportRecord.ruleVersion,
			schemaVersion: exportRecord.schemaVersion,
		},
		null,
		2
	);
	const blob = new Blob([content], { type: "application/json" });
	const objectUrl = environment.createObjectUrl(blob);
	try {
		environment.trigger(
			objectUrl,
			`accountant-handoff-${exportRecord.id}.json`
		);
	} finally {
		environment.revokeObjectUrl(objectUrl);
	}
}
