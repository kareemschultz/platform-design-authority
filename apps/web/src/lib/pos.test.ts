import { beforeEach, describe, expect, test } from "bun:test";

import {
	addMinor,
	type CartLineDraft,
	canCompleteSale,
	canEditSaleLines,
	cartLineEstimatedSubtotalMinor,
	cartLineUnitPriceMinor,
	cartSubtotalEstimateMinor,
	changeDueMinor,
	clearRegisterWorkspace,
	clearSaleWorkspace,
	downloadAccountantHandoffExport,
	formatMinorAsMajorInput,
	formatMoneyMinor,
	isKnownSelfApproval,
	isSufficientCashTender,
	isValidCartLineDraft,
	knownMakerActor,
	ledgerEntryMinor,
	listCreatedResources,
	loadActiveRegisterWorkspaceId,
	loadRegisterWorkspace,
	loadSaleWorkspace,
	openingLedgerEntry,
	outstandingReturnableQuantity,
	parseMoneyInputToMinor,
	recordCreatedResource,
	recordMakerActor,
	resolveBarcodeScan,
	runningExpectedCashMinor,
	saleHasPendingPriceOverride,
	saveRegisterWorkspace,
	saveSaleWorkspace,
	toSaleLineInput,
} from "./pos";

// bun:test runs without a DOM; pos.ts targets the browser's real
// `sessionStorage`. This minimal in-memory polyfill exercises the exact
// same Web Storage surface the browser provides (getItem/setItem/
// removeItem), so the persistence + defensive-parse tests below observe
// real storage round-trips rather than mocking pos.ts's own functions.
class MemoryStorage {
	private readonly store = new Map<string, string>();
	getItem(key: string): string | null {
		return this.store.has(key) ? (this.store.get(key) ?? null) : null;
	}
	removeItem(key: string): void {
		this.store.delete(key);
	}
	setItem(key: string, value: string): void {
		this.store.set(key, value);
	}
}

beforeEach(() => {
	Object.defineProperty(globalThis, "sessionStorage", {
		configurable: true,
		value: new MemoryStorage(),
	});
});

const REGISTER_SESSION_ID = "register_session_000000000001";
const REGISTER_ID = "register_000000000000000001";
const LOCATION_ID = "location_000000000000000001";
const OPENER_PARTY_ID = "party_opener_00000000000001";
const ACTOR_A = "auth_user_actor_a_0000000001";
const ACTOR_B = "auth_user_actor_b_0000000001";

function registerSession(overrides: Record<string, unknown> = {}) {
	return {
		closedAt: null,
		closeReason: null,
		countedCash: null,
		currency: "GYD",
		expectedCash: null,
		id: REGISTER_SESSION_ID,
		locationId: LOCATION_ID,
		openedAt: "2026-07-18T09:00:00.000Z",
		openerPartyId: OPENER_PARTY_ID,
		openingFloat: { amountMinor: 10_000, currency: "GYD" },
		registerId: REGISTER_ID,
		state: "Open",
		variance: null,
		varianceApprovalRequired: false,
		varianceApprovedAt: null,
		varianceApproverPartyId: null,
		version: 1,
		...overrides,
	};
}

function sale(overrides: Record<string, unknown> = {}) {
	return {
		change: null,
		completedAt: null,
		currency: "GYD",
		customerPartyId: null,
		discount: { amountMinor: 0, currency: "GYD" },
		gross: { amountMinor: 1000, currency: "GYD" },
		heldAt: null,
		id: "sale_000000000000000001",
		lines: [],
		receiptId: null,
		registerId: REGISTER_ID,
		sessionId: REGISTER_SESSION_ID,
		state: "Open",
		tax: { amountMinor: 140, currency: "GYD" },
		tendered: null,
		total: { amountMinor: 1140, currency: "GYD" },
		version: 1,
		...overrides,
	};
}

function saleLine(overrides: Record<string, unknown> = {}) {
	return {
		discount: { amountMinor: 0, currency: "GYD" },
		gross: { amountMinor: 1000, currency: "GYD" },
		id: "sale_line_00000000000000001",
		lineTotal: { amountMinor: 1140, currency: "GYD" },
		nonStatutory: true,
		priceOverrideId: null,
		priceOverrideState: null,
		productId: "product_00000000000000001",
		productName: "Test Product",
		quantity: "1",
		tax: { amountMinor: 140, currency: "GYD" },
		taxableBase: { amountMinor: 1000, currency: "GYD" },
		taxCategory: "GY_STANDARD_14",
		unit: "each",
		unitPrice: { amountMinor: 1000, currency: "GYD" },
		variantId: null,
		...overrides,
	};
}

describe("money math", () => {
	test("formats GYD minor units as currency", () => {
		expect(formatMoneyMinor(114_000, "GYD")).toContain("1,140");
	});

	test("addMinor sums signed amounts", () => {
		expect(addMinor(1000, -400, 250)).toBe(850);
	});

	test("changeDueMinor never returns negative", () => {
		expect(changeDueMinor(500, 1000)).toBe(0);
		expect(changeDueMinor(1500, 1000)).toBe(500);
	});

	test("isSufficientCashTender requires tendered >= total", () => {
		expect(isSufficientCashTender(999, 1000)).toBe(false);
		expect(isSufficientCashTender(1000, 1000)).toBe(true);
	});

	test("parseMoneyInputToMinor parses whole and fractional decimal amounts", () => {
		expect(parseMoneyInputToMinor("12.50")).toBe(1250);
		expect(parseMoneyInputToMinor("12")).toBe(1200);
		expect(parseMoneyInputToMinor("0.05")).toBe(5);
		expect(parseMoneyInputToMinor("1200000")).toBe(120_000_000);
	});

	test("parseMoneyInputToMinor rejects negative, empty, and malformed input", () => {
		expect(parseMoneyInputToMinor("-5")).toBeNull();
		expect(parseMoneyInputToMinor("")).toBeNull();
		expect(parseMoneyInputToMinor("abc")).toBeNull();
		expect(parseMoneyInputToMinor("12.5.0")).toBeNull();
		expect(parseMoneyInputToMinor("12.555")).toBeNull();
	});

	test("formatMinorAsMajorInput round-trips through parseMoneyInputToMinor", () => {
		expect(formatMinorAsMajorInput(1250)).toBe("12.50");
		expect(formatMinorAsMajorInput(5)).toBe("0.05");
		expect(parseMoneyInputToMinor(formatMinorAsMajorInput(98_765))).toBe(
			98_765
		);
	});
});

describe("cash ledger", () => {
	test("openingLedgerEntry mirrors the opening float", () => {
		const entry = openingLedgerEntry(registerSession() as never);
		expect(entry.amountMinor).toBe(10_000);
		expect(entry.kind).toBe("OpeningFloat");
	});

	test("ledgerEntryMinor signs paid-out, safe-drop, and refund negative", () => {
		expect(ledgerEntryMinor("PaidIn", 500)).toBe(500);
		expect(ledgerEntryMinor("PaidOut", 500)).toBe(-500);
		expect(ledgerEntryMinor("SafeDrop", 500)).toBe(-500);
		expect(ledgerEntryMinor("CashRefund", 500)).toBe(-500);
		expect(ledgerEntryMinor("CashSale", 500)).toBe(500);
	});

	test("runningExpectedCashMinor sums the ledger", () => {
		const total = runningExpectedCashMinor([
			{ amountMinor: 10_000, id: "a", kind: "OpeningFloat", occurredAt: "" },
			{ amountMinor: 500, id: "b", kind: "PaidIn", occurredAt: "" },
			{ amountMinor: -200, id: "c", kind: "PaidOut", occurredAt: "" },
		]);
		expect(total).toBe(10_300);
	});
});

describe("register workspace persistence", () => {
	test("round-trips a valid workspace through sessionStorage", () => {
		const session = registerSession();
		saveRegisterWorkspace({
			ledger: [openingLedgerEntry(session as never)],
			session: session as never,
		});
		const loaded = loadRegisterWorkspace(REGISTER_SESSION_ID);
		if (!loaded) {
			throw new Error("expected a persisted register workspace");
		}
		expect(loaded.session.id).toBe(REGISTER_SESSION_ID);
		expect(loaded.ledger).toHaveLength(1);
		expect(loadActiveRegisterWorkspaceId()).toBe(REGISTER_SESSION_ID);
		clearRegisterWorkspace(REGISTER_SESSION_ID);
		expect(loadRegisterWorkspace(REGISTER_SESSION_ID)).toBeNull();
		expect(loadActiveRegisterWorkspaceId()).toBeNull();
	});

	test("rejects a tampered/malformed stored workspace instead of trusting it", () => {
		sessionStorage.setItem(
			`platform.pos.register.${REGISTER_SESSION_ID}`,
			JSON.stringify({ ledger: "not-an-array", session: { id: "x" } })
		);
		expect(loadRegisterWorkspace(REGISTER_SESSION_ID)).toBeNull();
		sessionStorage.removeItem(`platform.pos.register.${REGISTER_SESSION_ID}`);
	});
});

describe("sale workspace persistence", () => {
	test("round-trips a valid sale through sessionStorage", () => {
		const currentSale = sale();
		saveSaleWorkspace(currentSale as never);
		expect(loadSaleWorkspace(currentSale.id)?.id).toBe(currentSale.id);
		clearSaleWorkspace(currentSale.id);
		expect(loadSaleWorkspace(currentSale.id)).toBeNull();
	});

	test("rejects malformed stored sale JSON", () => {
		sessionStorage.setItem("platform.pos.sale.sale_bad", "{not valid json");
		expect(loadSaleWorkspace("sale_bad")).toBeNull();
		sessionStorage.removeItem("platform.pos.sale.sale_bad");
	});
});

describe("maker/checker self-approval hiding", () => {
	test("is false when no maker is known locally (ordinary different-checker case)", () => {
		expect(isKnownSelfApproval("return", "return_unknown_0001", ACTOR_A)).toBe(
			false
		);
	});

	test("is true only when the current browser recorded itself as the maker", () => {
		recordMakerActor("return", "return_0000000000001", ACTOR_A);
		expect(knownMakerActor("return", "return_0000000000001")).toBe(ACTOR_A);
		expect(isKnownSelfApproval("return", "return_0000000000001", ACTOR_A)).toBe(
			true
		);
		expect(isKnownSelfApproval("return", "return_0000000000001", ACTOR_B)).toBe(
			false
		);
	});

	test("does not persist an actor id failing the identifier shape", () => {
		recordMakerActor("deposit", "deposit_0000000000001", "not an id!!");
		expect(knownMakerActor("deposit", "deposit_0000000000001")).toBeNull();
	});
});

describe("return line bounds", () => {
	test("caps outstanding quantity at zero and mirrors the server check", () => {
		expect(outstandingReturnableQuantity("5", "2")).toBe(3);
		expect(outstandingReturnableQuantity("5", "5")).toBe(0);
		expect(outstandingReturnableQuantity("5", "9")).toBe(0);
	});

	test("treats unparsable quantities as zero rather than throwing", () => {
		expect(outstandingReturnableQuantity("not-a-number", "1")).toBe(0);
	});
});

describe("sale state gates", () => {
	test("canEditSaleLines allows Open and Held, not Completed", () => {
		expect(canEditSaleLines({ state: "Open" })).toBe(true);
		expect(canEditSaleLines({ state: "Held" })).toBe(true);
		expect(canEditSaleLines({ state: "Completed" })).toBe(false);
	});

	test("saleHasPendingPriceOverride detects a Pending line", () => {
		const withPending = sale({
			lines: [saleLine({ priceOverrideState: "Pending" })],
		});
		expect(saleHasPendingPriceOverride(withPending as never)).toBe(true);
	});

	test("canCompleteSale blocks completion while an override is Pending (frozen control plan §6.2)", () => {
		const blocked = sale({
			lines: [saleLine({ priceOverrideState: "Pending" })],
		});
		expect(canCompleteSale(blocked as never)).toBe(false);

		const clear = sale({ lines: [saleLine()] });
		expect(canCompleteSale(clear as never)).toBe(true);

		const empty = sale({ lines: [] });
		expect(canCompleteSale(empty as never)).toBe(false);

		const completed = sale({ lines: [saleLine()], state: "Completed" });
		expect(canCompleteSale(completed as never)).toBe(false);
	});
});

function cartLine(overrides: Partial<CartLineDraft> = {}): CartLineDraft {
	return {
		discountAmountMinor: 0,
		key: "line_1",
		productId: "product_00000000000000001",
		productName: "Test Product",
		quantity: "2",
		taxCategory: "GY_STANDARD_14",
		unit: "each",
		unitPriceInput: "10.00",
		variantId: null,
		...overrides,
	};
}

describe("sale cart drafts", () => {
	test("cartLineUnitPriceMinor parses the draft's raw price text", () => {
		expect(cartLineUnitPriceMinor(cartLine({ unitPriceInput: "10.00" }))).toBe(
			1000
		);
		expect(cartLineUnitPriceMinor(cartLine({ unitPriceInput: "" }))).toBeNull();
		expect(
			cartLineUnitPriceMinor(cartLine({ unitPriceInput: "not-money" }))
		).toBeNull();
	});

	test("cartLineEstimatedSubtotalMinor multiplies price by quantity minus discount", () => {
		expect(cartLineEstimatedSubtotalMinor(cartLine())).toBe(2000);
		expect(
			cartLineEstimatedSubtotalMinor(
				cartLine({ discountAmountMinor: 300, quantity: "2" })
			)
		).toBe(1700);
	});

	test("cartLineEstimatedSubtotalMinor treats a non-positive or unparsable quantity as zero", () => {
		expect(cartLineEstimatedSubtotalMinor(cartLine({ quantity: "0" }))).toBe(0);
		expect(
			cartLineEstimatedSubtotalMinor(cartLine({ quantity: "not-a-number" }))
		).toBe(0);
	});

	test("cartLineEstimatedSubtotalMinor never returns a negative amount", () => {
		expect(
			cartLineEstimatedSubtotalMinor(
				cartLine({
					discountAmountMinor: 5000,
					quantity: "1",
					unitPriceInput: "10.00",
				})
			)
		).toBe(0);
	});

	test("cartLineEstimatedSubtotalMinor treats an unparsable price as zero (mid-edit input)", () => {
		expect(
			cartLineEstimatedSubtotalMinor(cartLine({ unitPriceInput: "" }))
		).toBe(0);
	});

	test("cartSubtotalEstimateMinor sums every draft line", () => {
		expect(
			cartSubtotalEstimateMinor([
				cartLine({ key: "a", quantity: "1", unitPriceInput: "5.00" }),
				cartLine({ key: "b", quantity: "3", unitPriceInput: "2.00" }),
			])
		).toBe(1100);
	});

	test("toSaleLineInput maps a draft line into the create-sale request shape", () => {
		const input = toSaleLineInput(
			cartLine({ discountAmountMinor: 100, quantity: "3", variantId: "v1" })
		);
		expect(input).toEqual({
			discountAmount: { amountMinor: 100, currency: "GYD" },
			productId: "product_00000000000000001",
			quantity: "3",
			taxCategory: "GY_STANDARD_14",
			unit: "each",
			unitPrice: { amountMinor: 1000, currency: "GYD" },
			variantId: "v1",
		});
	});

	test("toSaleLineInput omits discountAmount when there is no line discount", () => {
		const input = toSaleLineInput(cartLine());
		expect(input.discountAmount).toBeUndefined();
	});

	test("isValidCartLineDraft requires a product, positive quantity, and a positive parseable price", () => {
		expect(isValidCartLineDraft(cartLine())).toBe(true);
		expect(isValidCartLineDraft(cartLine({ productId: "" }))).toBe(false);
		expect(isValidCartLineDraft(cartLine({ quantity: "0" }))).toBe(false);
		expect(isValidCartLineDraft(cartLine({ quantity: "abc" }))).toBe(false);
		expect(isValidCartLineDraft(cartLine({ unitPriceInput: "0.00" }))).toBe(
			false
		);
		expect(isValidCartLineDraft(cartLine({ unitPriceInput: "" }))).toBe(false);
		expect(isValidCartLineDraft(cartLine({ unitPriceInput: "abc" }))).toBe(
			false
		);
	});
});

// WS3 remediation R3, Finding F: the barcode-scan race fix's core DECISION
// logic, unit-tested independent of the DOM/React harness `sale-pages.
// tsx`'s `ProductLookup` wraps around it. This is the exact function every
// `queryClient.fetchQuery` resolution is passed through — proving it here
// proves the auto-add/no-match/ambiguous boundary regardless of network
// timing, which the e2e suite separately proves for the actual race
// (slow-then-fast out-of-order resolution, focus retention, aria-live).
describe("barcode scan resolution (Finding F)", () => {
	function product(
		overrides: Partial<{
			id: string;
			name: string;
			variants: Array<{ id: string; name: string }>;
		}> = {}
	) {
		return {
			archivedAt: null,
			archiveReason: null,
			createdAt: "2026-07-18T09:00:00.000Z",
			id: overrides.id ?? "product_a",
			name: overrides.name ?? "Cola 500ml",
			state: "Active" as const,
			updatedAt: "2026-07-18T09:00:00.000Z",
			variants: (
				overrides.variants ?? [{ id: "variant_a", name: "Default" }]
			).map((variant) => ({
				id: variant.id,
				identifiers: [],
				name: variant.name,
			})),
			version: 1,
		};
	}

	test("resolves to 'added' for exactly one product with exactly one variant, carrying the matched product and variant", () => {
		const match = product({ id: "product_cola", name: "Cola 500ml" });
		const outcome = resolveBarcodeScan([match]);
		expect(outcome).toEqual({
			kind: "added",
			product: match,
			variantId: "variant_a",
		});
	});

	test("resolves to 'no-match' for zero results — never silently does nothing", () => {
		expect(resolveBarcodeScan([])).toEqual({ kind: "no-match" });
	});

	test("resolves to 'ambiguous' for a product with more than one variant — never guesses which variant", () => {
		const multiVariant = product({
			variants: [
				{ id: "variant_a", name: "Small" },
				{ id: "variant_b", name: "Large" },
			],
		});
		expect(resolveBarcodeScan([multiVariant])).toEqual({ kind: "ambiguous" });
	});

	test("resolves to 'ambiguous' for more than one matching product — never picks one arbitrarily", () => {
		const first = product({ id: "product_a" });
		const second = product({ id: "product_b" });
		expect(resolveBarcodeScan([first, second])).toEqual({ kind: "ambiguous" });
	});

	// The actual race this finding fixes: a fast response for barcode B
	// resolving before a slow response for barcode A does. Because the
	// caller (ProductLookup.scanBarcode) invokes this resolver on EACH
	// response independently — never on shared reactive query state — the
	// resolution for A, whenever it finally arrives, still resolves to A's
	// own product, never B's, and vice versa. This is the property the
	// pre-fix code (`if (results.data && addSingleVariant(results.data.
	// items))`, reading one shared `results.data`) could not guarantee: a
	// stale `results.data` from whichever query last settled could be read
	// by the WRONG Enter press. Modeled here directly, without a DOM.
	test("out-of-order resolution: a stale response for barcode A can never resolve to barcode B's product, regardless of arrival order", () => {
		const productA = product({ id: "product_a", name: "Barcode A product" });
		const productB = product({ id: "product_b", name: "Barcode B product" });

		// Simulates: scan A (slow network) fires first; scan B (fast
		// network) fires second and resolves FIRST; A resolves LAST.
		const resolvedForB = resolveBarcodeScan([productB]);
		const resolvedForA = resolveBarcodeScan([productA]);

		expect(resolvedForB).toMatchObject({ kind: "added", product: productB });
		expect(resolvedForA).toMatchObject({ kind: "added", product: productA });
		// The defect this replaces: both resolutions used to funnel through
		// ONE shared `results.data` value, so whichever query's data
		// happened to be current when Enter was read could leak into the
		// other scan's outcome. Each call above is independent and neither
		// result equals the other's product.
		expect(resolvedForA.kind === "added" && resolvedForA.product.id).toBe(
			"product_a"
		);
		expect(resolvedForB.kind === "added" && resolvedForB.product.id).toBe(
			"product_b"
		);
	});
});

describe("created-resource local history", () => {
	test("round-trips a maker's created-resource record, newest first, per kind", () => {
		recordCreatedResource("return", {
			createdAt: "2026-07-18T09:00:00.000Z",
			id: "return_a",
			label: "Return return_a",
		});
		recordCreatedResource("return", {
			createdAt: "2026-07-18T09:05:00.000Z",
			id: "return_b",
			label: "Return return_b",
		});
		const list = listCreatedResources("return");
		expect(list.map((entry) => entry.id)).toEqual(["return_b", "return_a"]);
		expect(listCreatedResources("deposit")).toEqual([]);
	});

	test("ignores a tampered stored list instead of throwing", () => {
		sessionStorage.setItem(
			"platform.pos.created.refund",
			"not valid json at all"
		);
		expect(listCreatedResources("refund")).toEqual([]);
	});
});

describe("accountant-handoff export download", () => {
	test("triggers a Blob download of the export payload, then revokes the object URL", () => {
		const created: Blob[] = [];
		const triggered: Array<{ fileName: string; url: string }> = [];
		const revoked: { url: string | null } = { url: null };
		downloadAccountantHandoffExport(
			{
				contentHash: "sha256:abc",
				currency: "GYD",
				generatedAt: "2026-07-18T09:00:00.000Z",
				id: "export_0000000000000001",
				idempotencyKey: "idem_0000000000000001",
				kind: "AccountantHandoff",
				legalEntityId: "legal_entity_000000000001",
				organizationId: "org_000000000000000001",
				payload: { postingBatch: { lines: [] } },
				periodEnd: "2026-07-18T23:59:59.000Z",
				periodStart: "2026-07-01T00:00:00.000Z",
				ruleVersion: "v1",
				schemaVersion: "v1",
				tenantId: "tenant_00000000000000001",
				timezone: "America/Guyana",
			} as never,
			{
				createObjectUrl: (blob) => {
					created.push(blob);
					return "blob:mock-url";
				},
				revokeObjectUrl: (url) => {
					revoked.url = url;
				},
				trigger: (url, fileName) => {
					triggered.push({ fileName, url });
				},
			}
		);
		expect(created).toHaveLength(1);
		expect(triggered).toEqual([
			{
				fileName: "accountant-handoff-export_0000000000000001.json",
				url: "blob:mock-url",
			},
		]);
		expect(revoked.url).toBe("blob:mock-url");
	});
});
