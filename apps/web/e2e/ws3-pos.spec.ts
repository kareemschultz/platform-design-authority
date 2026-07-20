import AxeBuilder from "@axe-core/playwright";
import {
	type APIRequestContext,
	expect,
	type Page,
	request,
	test,
} from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const WEB_ORIGIN = "http://localhost:3001";
const ORGANIZATION_ID = "organization_ws2_browser_0001";
const LOCATION_ID = "location_ws2_browser_0001";

// WS3 PR5 e2e suite. Follows WS1 PR8's real-session auth pattern (no
// mocked-401-only coverage) and the WS2 PR6 lesson this stage's spec names
// explicitly: one assertion path per workflow surface, not three happy
// paths per surface. Each `test(...)` below maps 1:1 to a row in this
// stage's REQUIRED workflow-surface-to-e2e-test table (recorded in the
// stage evidence notes / commit body, not a new in-repo file).

const FIXTURE_EMAIL = "ws2-operations@example.test";
const FIXTURE_PASSWORD = "WS2-browser-verification-password-0001";
const APPROVER_EMAIL = "ws3-approver@example.test";
const APPROVER_PASSWORD = "WS3-browser-approver-verification-password-0001";
const CASHIER_EMAIL = "ws3-cashier@example.test";
const CASHIER_PASSWORD = "WS3-browser-cashier-verification-password-0001";
const RECEIPT_URL_PATTERN = /\/operations\/pos\/receipts\//;
const EXPORT_DOWNLOAD_FILENAME_PATTERN = /^accountant-handoff-.*\.json$/;
const RECEIPT_NUMBER_DISCLOSURE_PATTERN =
	/receipt number printed on the customer's receipt/;
const SALE_ID_TEXT_PATTERN = /Sale ID/;
const RECEIPT_HEADING_NAME_PATTERN = /^Receipt\s+\S+/;
const RECEIPT_HEADING_PREFIX_PATTERN = /^Receipt\s+/;
const REGISTER_LINE_PREFIX_PATTERN = /^Register:\s*/;
const CONNECTION_REQUIRED_PATTERN = /connection/i;

/** Computes a valid GTIN-13 check digit for a 12-digit base, replicating
 * `packages/domains/catalog/src/index.ts`'s `gtinCheckDigitIsValid` exactly
 * (weight 3 on the digit immediately left of the check digit, alternating
 * with weight 1, summed right-to-left over the 12 base digits) — the
 * product-create form's default "GTIN scheme" is GTIN-13, which requires
 * BOTH exact 13-digit length AND a checksum-valid value; an arbitrary
 * digit string (e.g. a raw timestamp) fails validation with "Identifier
 * does not satisfy its declared GTIN scheme". */
function gtin13(base12: string): string {
	const digits = [...base12].map(Number).reverse();
	const sum = digits.reduce(
		(total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
		0
	);
	const checkDigit = (10 - (sum % 10)) % 10;
	return `${base12}${checkDigit}`;
}

async function signIn(
	page: Page,
	returnTo: string,
	credentials: { email: string; password: string } = {
		email: FIXTURE_EMAIL,
		password: FIXTURE_PASSWORD,
	}
) {
	await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
	await page.getByLabel("Email").fill(credentials.email);
	await page.getByLabel("Password").fill(credentials.password);
	const signInResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/api/auth/sign-in/email")
	);
	await page.getByRole("button", { name: "Sign In" }).click();
	const signInResponse = await signInResponsePromise;
	expect(signInResponse.ok()).toBe(true);
	await page.goto(returnTo);
	await expect(
		page.getByRole("region", { name: "Current workspace" })
	).toBeVisible();
	// Wait for the active tenant/org/location context to settle. Until it
	// does, `WorkspaceProvider` keys its child tree on `contextId`, and that
	// key changing when context activation completes remounts the page and
	// silently discards any form input typed before this point (this stage's
	// own defect class — see register-pages.tsx's hydration comments).
	await expect(
		page.getByText("Tenant context is server-validated for this browser tab.")
	).toBeVisible();
}

async function selectLocation(page: Page, label: string) {
	const responsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/identity/setActiveContext")
	);
	await page.getByLabel("Location").selectOption({ label });
	await responsePromise;
	await expect(
		page.getByText("Tenant context is server-validated for this browser tab.")
	).toBeVisible();
}

async function openRegister(
	page: Page,
	registerId: string,
	openingFloat = "150.00"
) {
	await signIn(page, "/operations/pos/registers/new");
	await selectLocation(page, "Georgetown Browser Store");
	await expect(
		page.getByRole("heading", { name: "Open register" })
	).toBeVisible();
	await page.getByLabel("Register ID").fill(registerId);
	await page.getByLabel("Opening float (GYD)").fill(openingFloat);
	const openResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/open")
	);
	await page.getByRole("button", { name: "Open register" }).click();
	const openResponse = await openResponsePromise;
	expect(openResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Register opened" })
	).toBeVisible();
	const body = (await openResponse.json()) as { json: { id: string } };
	return body.json.id;
}

test("register open renders and completes a real commerce.register.open round-trip", async ({
	page,
}) => {
	const registerId = `register_smoke_${Date.now()}`;
	await openRegister(page, registerId);
	await expect(
		page.getByRole("heading", { name: `Register ${registerId}` })
	).toBeVisible();
});

/**
 * WS3 remediation R3, Finding G, closing the gap the R3 lead session's own
 * verification pass found AFTER the directive's six named ungated controls
 * were fixed: `RegisterOpenPage` still called TanStack Query's raw
 * `useMutation` directly (pre-fix), relying solely on the submit button's
 * `disabled={... || !workspace.isOnline}` attribute as the correctness
 * boundary. That is a real gap, not defense-in-depth theater — `disabled`
 * is a React re-render away from `workspace.isOnline`'s own state update
 * (the `offline`/`online` window events it listens for), so a submit fired
 * in that window, or by any future regression that drops the `disabled`
 * clause, would still hit `networkMode: 'online'`'s default PAUSE-and-
 * auto-replay-on-reconnect behavior with no further confirmation.
 *
 * This test proves the fix by bypassing the disabled button entirely —
 * `HTMLFormElement.requestSubmit()` fires the form's real submit event
 * (and therefore `useForm`'s `onSubmit` -> `open.mutateAsync`) regardless
 * of any particular submit control's `disabled` state, exactly simulating
 * "the disabled attribute did not prevent this call" for the code path
 * `useOnlineGatedMutation` is supposed to make unreachable-with-effect.
 * PRE-FIX (raw `useMutation`), this exact sequence pauses a real mutation
 * in the cache and auto-fires a genuine `commerce.registers.open` call the
 * instant `setOffline(false)` + the `online` event fire below — this test
 * asserts zero calls, both immediately after the offline submit and again
 * after reconnecting, then proves a real online retry still succeeds.
 */
test("offline reconnect never replays a rejected mutation: register open requires a real online retry, not automatic execution on reconnect", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_offline_open_${Date.now()}`;
	await signIn(page, "/operations/pos/registers/new");
	await selectLocation(page, "Georgetown Browser Store");
	await expect(
		page.getByRole("heading", { name: "Open register" })
	).toBeVisible();
	await page.getByLabel("Register ID").fill(registerId);
	await page.getByLabel("Opening float (GYD)").fill("60.00");

	let openCallCount = 0;
	await page.route("**/rpc/commerce/registers/open", async (route) => {
		openCallCount += 1;
		await route.continue();
	});

	await page.context().setOffline(true);
	await page.evaluate(() => window.dispatchEvent(new Event("offline")));
	await expect(
		page.getByText("Offline", { exact: true }).first()
	).toBeVisible();
	// The button itself is disabled (asserted by the sibling
	// "online-only WS3 mutations fail closed" test) — this bypasses it to
	// exercise the mutation-level gate directly, the actual guarantee.
	await page.evaluate(() => {
		document
			.querySelector<HTMLFormElement>("#register-open-form")
			?.requestSubmit();
	});
	await expect(
		page.getByRole("alert").filter({ hasText: CONNECTION_REQUIRED_PATTERN })
	).toBeVisible();
	// Still on the open-register form — a rejected offline submit never
	// advances to the "Register opened" success view.
	await expect(
		page.getByRole("heading", { name: "Open register" })
	).toBeVisible();
	expect(openCallCount).toBe(0);

	await page.context().setOffline(false);
	await page.evaluate(() => window.dispatchEvent(new Event("online")));
	// Bounded wait for any reconnection-triggered auto-replay to have had a
	// real chance to fire before asserting it did not.
	await page.waitForTimeout(1500);
	expect(openCallCount).toBe(0);
	await expect(
		page.getByRole("heading", { name: `Register ${registerId}` })
	).toHaveCount(0);

	// A real online retry from here still works — offline rejection is a
	// deliberate gate, not a permanent lockout.
	const openResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/open")
	);
	await page.getByRole("button", { name: "Open register" }).click();
	const openResponse = await openResponsePromise;
	expect(openResponse.ok()).toBe(true);
	expect(openCallCount).toBe(1);
	await expect(
		page.getByRole("heading", { name: `Register ${registerId}` })
	).toBeVisible();
});

test("register session view records a cash movement and updates the running expected-cash tally", async ({
	page,
}) => {
	const registerId = `register_movement_${Date.now()}`;
	const sessionId = await openRegister(page, registerId, "100.00");
	await page.goto(`/operations/pos/registers/${sessionId}`);
	await expect(
		page.getByRole("heading", { name: `Register ${registerId}` })
	).toBeVisible();
	await expect(page.getByText("Running expected cash: $100.00")).toBeVisible();
	await page.getByLabel("Amount (GYD)", { exact: true }).fill("25.00");
	const movementResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/cashMovements/create")
	);
	await page.getByRole("button", { name: "Record movement" }).click();
	const movementResponse = await movementResponsePromise;
	expect(movementResponse.ok()).toBe(true);
	await expect(page.getByText("Running expected cash: $125.00")).toBeVisible();
});

test("register close with a matching count closes immediately at zero variance", async ({
	page,
}) => {
	const registerId = `register_close_${Date.now()}`;
	const sessionId = await openRegister(page, registerId, "80.00");
	await page.goto(`/operations/pos/registers/${sessionId}/close`);
	await expect(
		page.getByRole("heading", { name: "Close register" })
	).toBeVisible();
	await page.getByLabel("Counted cash (GYD)").fill("80.00");
	// WS3 remediation R3, Finding I: close-register is now a two-step
	// review/confirm flow — "Review & close register" opens the
	// consequence-preview dialog (server-derived expected cash), and the
	// actual commerce.register.close mutation fires only from the dialog's
	// own "Close register" confirm control.
	await page.getByRole("button", { name: "Review & close register" }).click();
	await expect(
		page.getByRole("heading", { name: "Close this register?" })
	).toBeVisible();
	const closeCommitButton = page.getByRole("button", {
		exact: true,
		name: "Close register",
	});
	await expect(closeCommitButton).toBeEnabled();
	const closeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await closeCommitButton.click();
	const closeResponse = await closeResponsePromise;
	expect(closeResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Register closed" })
	).toBeVisible();
});

test("register close with a mismatched count requires a second identity's cash-variance approval, with self-approval hidden", async ({
	browser,
}) => {
	const registerId = `register_variance_${Date.now()}`;
	const makerContext = await browser.newContext();
	const makerPage = await makerContext.newPage();
	const sessionId = await openRegister(makerPage, registerId, "80.00");
	await makerPage.goto(`/operations/pos/registers/${sessionId}/close`);
	await makerPage.getByLabel("Counted cash (GYD)").fill("70.00");
	await makerPage
		.getByRole("button", { name: "Review & close register" })
		.click();
	await expect(
		makerPage.getByRole("heading", { name: "Close this register?" })
	).toBeVisible();
	const makerCloseCommitButton = makerPage.getByRole("button", {
		exact: true,
		name: "Close register",
	});
	await expect(makerCloseCommitButton).toBeEnabled();
	const closeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await makerCloseCommitButton.click();
	const closeResponse = await closeResponsePromise;
	expect(closeResponse.ok()).toBe(true);
	await expect(
		makerPage.getByRole("heading", { name: "Variance approval required" })
	).toBeVisible();
	// Self-approval path is absent from the UI: the same browser that closed
	// the register cannot see an approve control for its own variance.
	await expect(
		makerPage.getByText(
			"This browser closed this register, so it cannot approve its own variance."
		)
	).toBeVisible();
	await expect(
		makerPage.getByRole("button", { name: "Review & approve variance" })
	).toHaveCount(0);
	const body = (await closeResponse.json()) as {
		json: { id: string; version: number };
	};

	// A genuinely different identity, in a separate browser context, uses the
	// ID + version the maker's screen displayed (no commerce.register.* read
	// endpoint exists to look this up any other way — frozen control plan
	// §8) to approve directly. No prior local workspace for this session is
	// required or present in this browser.
	const checkerContext = await browser.newContext();
	const checkerPage = await checkerContext.newPage();
	await signIn(checkerPage, "/operations/pos/registers/new", {
		email: APPROVER_EMAIL,
		password: APPROVER_PASSWORD,
	});
	await checkerPage.goto(`/operations/pos/registers/${sessionId}/close`);
	await expect(
		checkerPage.getByRole("heading", { name: "Approve a pending variance" })
	).toBeVisible();
	await checkerPage
		.getByLabel("Variance / register session ID")
		.fill(body.json.id);
	await checkerPage.getByLabel("Version").fill(String(body.json.version));
	await checkerPage
		.getByRole("button", { name: "Review & approve variance" })
		.click();
	await expect(
		checkerPage.getByRole("heading", { name: "Approve this cash variance?" })
	).toBeVisible();
	const varianceCommitButton = checkerPage.getByRole("button", {
		exact: true,
		name: "Approve variance",
	});
	await expect(varianceCommitButton).toBeEnabled();
	const approveResponsePromise = checkerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/cashVariances/approve")
	);
	await varianceCommitButton.click();
	const approveResponse = await approveResponsePromise;
	expect(approveResponse.ok()).toBe(true);
	await expect(
		checkerPage.getByRole("heading", { name: "Variance approved" })
	).toBeVisible();
});

test("a cashier without commerce.register.close is denied closing their own register, with a non-disclosing message", async ({
	page,
}) => {
	const registerId = `register_denial_${Date.now()}`;
	await signIn(page, "/operations/pos/registers/new", {
		email: CASHIER_EMAIL,
		password: CASHIER_PASSWORD,
	});
	await selectLocation(page, "Georgetown Browser Store");
	await page.getByLabel("Register ID").fill(registerId);
	await page.getByLabel("Opening float (GYD)").fill("50.00");
	const openResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/open")
	);
	await page.getByRole("button", { name: "Open register" }).click();
	const openResponse = await openResponsePromise;
	expect(openResponse.ok()).toBe(true);
	const body = (await openResponse.json()) as { json: { id: string } };
	await page.goto(`/operations/pos/registers/${body.json.id}/close`);
	await page.getByLabel("Counted cash (GYD)").fill("50.00");
	// WS3 remediation R3, Finding I: the pre-commit consequence-preview read
	// (`getRegisterSession`) is gated on the SAME `commerce.register.close`
	// permission the commit itself requires — a cashier without it is
	// denied at the PREVIEW step, before `commerce.register.close` (the
	// actual commit) is ever attempted. The dialog surfaces the SAME
	// non-disclosing "Permission denied" copy the rest of the app uses
	// (Finding G's dialog-error fix), and the commit control stays
	// disabled throughout — it can never be clicked to fire the mutation.
	const previewResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registerSessions/get")
	);
	await page.getByRole("button", { name: "Review & close register" }).click();
	const previewResponse = await previewResponsePromise;
	expect(previewResponse.status()).toBe(403);
	await expect(
		page.getByRole("heading", { name: "Close this register?" })
	).toBeVisible();
	await expect(page.getByText("Permission denied")).toBeVisible();
	await expect(
		page.getByText(
			"Your current role or scope does not permit this change. No change was applied."
		)
	).toBeVisible();
	await expect(
		page.getByRole("button", { exact: true, name: "Close register" })
	).toBeDisabled();
});

test("register session view records a paid-out movement and decreases the running expected-cash tally", async ({
	page,
}) => {
	const registerId = `register_paidout_${Date.now()}`;
	const sessionId = await openRegister(page, registerId, "100.00");
	await page.goto(`/operations/pos/registers/${sessionId}`);
	await expect(page.getByText("Running expected cash: $100.00")).toBeVisible();
	await page.getByLabel("Direction").selectOption("PaidOut");
	await page.getByLabel("Amount (GYD)", { exact: true }).fill("15.00");
	const movementResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/cashMovements/create")
	);
	await page.getByRole("button", { name: "Record movement" }).click();
	const movementResponse = await movementResponsePromise;
	expect(movementResponse.ok()).toBe(true);
	await expect(page.getByText("Running expected cash: $85.00")).toBeVisible();
});

test("register session view records a safe drop and decreases the running expected-cash tally", async ({
	page,
}) => {
	const registerId = `register_safedrop_${Date.now()}`;
	const sessionId = await openRegister(page, registerId, "100.00");
	await page.goto(`/operations/pos/registers/${sessionId}`);
	await expect(page.getByText("Running expected cash: $100.00")).toBeVisible();
	await page.getByLabel("Safe drop amount (GYD)").fill("40.00");
	const safeDropResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/safeDrops/create")
	);
	await page.getByRole("button", { name: "Record safe drop" }).click();
	const safeDropResponse = await safeDropResponsePromise;
	expect(safeDropResponse.ok()).toBe(true);
	await expect(page.getByText("Running expected cash: $60.00")).toBeVisible();
});

/** Establishes a fresh active-context ID for the fixture tenant/
 * organization/location over an already-authenticated API request
 * context — used by `seedProductStock` below, which drives a maker/
 * checker precondition directly over RPC rather than through the
 * Inventory UI (it is test setup, not the workflow surface under test). */
async function activeContextId(apiContext: APIRequestContext): Promise<string> {
	const response = await apiContext.post("/rpc/identity/setActiveContext", {
		data: {
			json: {
				body: { locationId: LOCATION_ID, organizationId: ORGANIZATION_ID },
				headers: { "idempotency-key": crypto.randomUUID() },
			},
		},
		headers: { origin: WEB_ORIGIN },
	});
	const body = (await response.json()) as { json: { contextId: string } };
	return body.json.contextId;
}

/** Seeds enough stock for `productId` at the fixture location so a sale
 * against it can complete. `commerce.sale.complete` posts a synchronous
 * Inventory movement and rejects with a state_transition conflict
 * ("Insufficient stock…") when none exists (packages/domains/pos/src/
 * index.ts `postSaleLineMovements`) — Inventory owns this precondition,
 * not POS. Inventory's own inventory.adjustment maker/checker discipline
 * applies here too (creator != approver): the maker page's own session
 * creates the adjustment, and a freshly authenticated approver API
 * session approves it. */
async function seedProductStock(
	page: Page,
	productId: string,
	variantId: string
): Promise<void> {
	const makerContextId = await activeContextId(page.request);
	const createResponse = await page.request.post(
		"/rpc/inventory/adjustments/create",
		{
			data: {
				json: {
					body: {
						locationId: LOCATION_ID,
						productId,
						quantity: "1000",
						reason: "WS3 POS e2e stock seed",
						unit: "each",
						variantId,
					},
					headers: {
						"idempotency-key": crypto.randomUUID(),
						"x-active-context-id": makerContextId,
					},
				},
			},
			headers: { origin: WEB_ORIGIN },
		}
	);
	const created = (await createResponse.json()) as {
		json: { id: string; version: number };
	};

	const approverContext = await request.newContext({ baseURL: WEB_ORIGIN });
	try {
		await approverContext.post("/api/auth/sign-in/email", {
			data: { email: APPROVER_EMAIL, password: APPROVER_PASSWORD },
			headers: { origin: WEB_ORIGIN },
		});
		const approverContextId = await activeContextId(approverContext);
		const approveResponse = await approverContext.post(
			"/rpc/inventory/adjustments/approve",
			{
				data: {
					json: {
						headers: {
							"idempotency-key": crypto.randomUUID(),
							"if-match": String(created.json.version),
							"x-active-context-id": approverContextId,
						},
						params: { id: created.json.id },
					},
				},
				headers: { origin: WEB_ORIGIN },
			}
		);
		if (!approveResponse.ok()) {
			throw new Error(
				`Stock-seed inventory adjustment approval failed: ${approveResponse.status()} ${await approveResponse.text()}`
			);
		}
	} finally {
		await approverContext.dispose();
	}
}

/** Creates and activates a Product through the real Catalog UI, seeds it
 * with stock, and returns its id and name. Shared by every POS test below
 * that needs a real, Active, searchable, sellable product — the sale
 * screen's catalog.product.read lookup only ever returns Active products
 * (frozen control plan §8 realization in sale-pages.tsx), and
 * commerce.sale.complete requires positive stock on hand (see
 * `seedProductStock`). */
async function createActiveProduct(
	page: Page,
	label: string,
	barcode?: string
): Promise<{ id: string; name: string }> {
	const productName = `WS3 POS ${label} ${Date.now()}`;
	await page.goto("/operations/products/new");
	await expect(
		page.getByRole("heading", { name: "Create Product" })
	).toBeVisible();
	await page.getByLabel("Product name").fill(productName);
	await page.getByLabel("Variant name").fill("Default");
	if (barcode) {
		await page.getByLabel("Barcode (optional)").fill(barcode);
	}
	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/create")
	);
	await page.getByRole("button", { name: "Create Product draft" }).click();
	const createResponse = await createResponsePromise;
	expect(createResponse.ok()).toBe(true);
	const created = (await createResponse.json()) as {
		json: { id: string; variants: Array<{ id: string }> };
	};
	await page.goto(
		`/operations/products/${encodeURIComponent(created.json.id)}`
	);
	const activateResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/activate")
	);
	await page.getByRole("button", { name: "Activate Product" }).click();
	await activateResponsePromise;
	// The stock ledger keys on (productId, variantId) — the sale line the
	// cart builder creates always names this product's single real variant
	// (draftFromProduct in sale-pages.tsx), so the seed MUST target the same
	// variant, not a variant-less product-level balance (a distinct ledger
	// bucket — packages/domains/inventory/src/index.ts `itemKey`).
	await seedProductStock(page, created.json.id, created.json.variants[0].id);
	return { id: created.json.id, name: productName };
}

/** Drives the sale-cart-building screen: search for `productName`, add its
 * single variant, set the unit price, and submit `commerce.sale.create`.
 * Returns the created Sale (Open state, real line ids). */
async function createSaleWithOneLine(
	page: Page,
	registerId: string,
	registerSessionId: string,
	productName: string,
	unitPriceMajor: string
): Promise<{ id: string; total: { amountMinor: number } }> {
	await page.goto(
		`/operations/pos/sales/new?registerId=${encodeURIComponent(registerId)}&registerSessionId=${encodeURIComponent(registerSessionId)}`
	);
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();
	const searchResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/list")
	);
	await page.getByLabel("Search by name or SKU").fill(productName);
	await searchResponsePromise;
	await page.getByRole("button", { name: "Add" }).first().click();
	await page.getByLabel("Unit price (GYD)").fill(unitPriceMajor);
	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/sales/create")
	);
	await page.getByRole("button", { name: "Create sale" }).click();
	const createResponse = await createResponsePromise;
	expect(createResponse.ok()).toBe(true);
	const body = (await createResponse.json()) as {
		json: { id: string; total: { amountMinor: number } };
	};
	await expect(
		page.getByRole("heading", { name: `Sale ${body.json.id}` })
	).toBeVisible();
	return body.json;
}

/** WS3 remediation R3, Finding J: reads ONLY what `ReceiptLayout` actually
 * prints — the `receiptNumber` (the section heading, e.g. "Receipt
 * RCPT-000123") and `registerId` (the "Register: …" line) — never the
 * `receiptId` in the URL or the Sale ID a real paper/PDF receipt never
 * shows. Simulates a cashier reading their own printed receipt to start a
 * return, not a browser with the sale's opaque IDs still in memory. */
async function readPrintedReceiptReference(
	page: Page,
	receiptId: string
): Promise<{ receiptNumber: string; registerId: string }> {
	await page.goto(`/operations/pos/receipts/${encodeURIComponent(receiptId)}`);
	const receiptHeading = await page
		.getByRole("heading", { name: RECEIPT_HEADING_NAME_PATTERN })
		.first()
		.textContent();
	const receiptNumber = (receiptHeading ?? "")
		.replace(RECEIPT_HEADING_PREFIX_PATTERN, "")
		.trim();
	if (!receiptNumber) {
		throw new Error("Could not read a receiptNumber off the receipt view");
	}
	const registerLine = await page
		.locator("p", { hasText: "Register:" })
		.first()
		.textContent();
	const registerId = (registerLine ?? "")
		.replace(REGISTER_LINE_PREFIX_PATTERN, "")
		.trim();
	if (!registerId) {
		throw new Error("Could not read a registerId off the receipt view");
	}
	return { receiptNumber, registerId };
}

test("full cash sale: open register, complete a sale, view the receipt, close the register at zero variance", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_fullsale_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "full-sale");
	const sale = await createSaleWithOneLine(
		page,
		registerId,
		registerSessionId,
		productName,
		"10.00"
	);
	await page.getByLabel("Cash tendered (GYD)").fill("50.00");
	await expect(
		page.getByText(
			`Change due: ${new Intl.NumberFormat("en-GY", { currency: "GYD", style: "currency" }).format((5000 - sale.total.amountMinor) / 100)}`
		)
	).toBeVisible();
	const completeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	expect(completeResponse.ok()).toBe(true);
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};
	await expect(page).toHaveURL(
		new RegExp(`/operations/pos/receipts/${completed.json.receiptId}$`)
	);
	await expect(
		page.getByRole("heading", { exact: true, name: "Receipt" })
	).toBeVisible();

	// WS3 remediation R1, Finding A: a completed cash sale now posts its own
	// PaidIn cash-ledger entry atomically with `sale.complete`
	// (`packages/domains/pos/src/index.ts`'s `completeSale`), so the
	// register's server-computed expectedCash is opening float PLUS that
	// sale's net cash-in — SUPERSEDES this test's prior comment, which
	// documented the pre-fix gap ("a cash sale posts no
	// commerce.cash-movement ... never completed cash-sale proceeds") as an
	// accepted scoping boundary. Zero variance now requires counting the
	// opening float (100.00) plus the sale's own total, not the unchanged
	// float.
	const expectedCashMajor = ((10_000 + sale.total.amountMinor) / 100).toFixed(
		2
	);
	await page.goto(`/operations/pos/registers/${registerSessionId}/close`);
	await expect(
		page.getByRole("heading", { name: "Close register" })
	).toBeVisible();
	await page.getByLabel("Counted cash (GYD)").fill(expectedCashMajor);
	await page.getByRole("button", { name: "Review & close register" }).click();
	await expect(
		page.getByRole("heading", { name: "Close this register?" })
	).toBeVisible();
	const fullSaleCloseCommitButton = page.getByRole("button", {
		exact: true,
		name: "Close register",
	});
	await expect(fullSaleCloseCommitButton).toBeEnabled();
	const closeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await fullSaleCloseCommitButton.click();
	const closeResponse = await closeResponsePromise;
	expect(closeResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Register closed" })
	).toBeVisible();
});

/**
 * WS3 remediation R3, Finding F: the barcode-scan race. PRE-FIX,
 * `ProductLookup`'s Enter handler read `results.data` — a single shared
 * `useQuery` keyed off whatever barcode was CURRENTLY in the input at the
 * instant of the read, not the barcode that was scanned. Firing a slow
 * lookup for barcode A immediately followed by a fast lookup for barcode B
 * would, pre-fix, resolve however the last-settled response happened to
 * shape `results.data` at read time — concretely, if A's slower response
 * arrived after B's synchronous `results.data` read already fired for B
 * (or vice versa depending on exact timing), a scan could add the WRONG
 * product or silently add nothing, because the code had no way to bind a
 * specific response back to the specific scan that triggered it. This test
 * proves the POST-fix behavior instead: intercepting the real network
 * layer and deliberately delaying barcode A's response LONGER than barcode
 * B's, firing A then B in quick succession, and asserting the cart ends up
 * with exactly one line for A's product and exactly one line for B's
 * product — never swapped, never merged, never dropped — because each scan
 * now awaits its OWN `queryClient.fetchQuery` keyed to its OWN scanned
 * value (`apps/web/src/components/sale-pages.tsx` `scanBarcode`).
 */
test("barcode scan race: a slow response for an earlier scan can never be mistaken for a later scan's product", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const base12 = String(Date.now()).slice(0, 12);
	const barcodeA = gtin13(base12);
	const barcodeB = gtin13(
		`${base12.slice(0, 11)}${(Number(base12.slice(11)) + 1) % 10}`
	);
	const registerId = `register_barcode_race_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productAName } = await createActiveProduct(
		page,
		"barcode-race-a",
		barcodeA
	);
	const { name: productBName } = await createActiveProduct(
		page,
		"barcode-race-b",
		barcodeB
	);

	await page.route("**/rpc/catalog/products/list", async (route) => {
		const postData = route.request().postDataJSON() as {
			json?: { query?: { barcode?: string } };
		};
		const scannedBarcode = postData.json?.query?.barcode;
		if (scannedBarcode === barcodeA) {
			// The earlier scan resolves LAST — the exact ordering that broke
			// the pre-fix shared-query-state read.
			await new Promise((resolve) => setTimeout(resolve, 700));
		}
		await route.continue();
	});

	await page.goto(
		`/operations/pos/sales/new?registerId=${encodeURIComponent(registerId)}&registerSessionId=${encodeURIComponent(registerSessionId)}`
	);
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();

	const barcodeInput = page.getByLabel("Scan or enter barcode");
	// Fires the SLOW scan for A first, then — without waiting for it to
	// settle — the FAST scan for B, reproducing the exact out-of-order
	// resolution the pre-fix code could not handle.
	await barcodeInput.fill(barcodeA);
	await barcodeInput.press("Enter");
	await barcodeInput.fill(barcodeB);
	await barcodeInput.press("Enter");

	// The scan-outcome aria-live region — a single element whose text
	// changes with each outcome. `[aria-live="polite"]` alone also matches
	// Sonner's toast-notification landmark region, so this is additionally
	// scoped to the `<p>` tag ProductLookup actually renders.
	const scanAnnouncement = page.locator('p[aria-live="polite"]');

	// B resolves first (no artificial delay); its outcome must already be
	// visible while A is still in flight.
	await expect(scanAnnouncement).toContainText(`${productBName} added`);
	await expect(
		page.getByRole("list", { name: "Cart lines" }).getByRole("listitem")
	).toHaveCount(1);

	// A resolves after its artificial delay; the cart must then show BOTH
	// products, each exactly once, neither swapped for the other.
	await expect(scanAnnouncement).toContainText(`${productAName} added`, {
		timeout: 5000,
	});
	const cartList = page.getByRole("list", { name: "Cart lines" });
	await expect(cartList.getByRole("listitem")).toHaveCount(2);
	await expect(cartList.getByText(productAName)).toHaveCount(1);
	await expect(cartList.getByText(productBName)).toHaveCount(1);

	// Scanner input focus is preserved after each outcome (second
	// independent review's supplemental requirement) — the next physical
	// scan can fire without a manual re-click.
	await expect(barcodeInput).toBeFocused();

	// An unknown barcode produces visible, accessible feedback — never
	// silent nothing.
	await barcodeInput.fill("0000000000000");
	await barcodeInput.press("Enter");
	await expect(scanAnnouncement).toContainText(
		"No matching product for barcode 0000000000000"
	);
	await expect(cartList.getByRole("listitem")).toHaveCount(2);
});

test("sale hold and resume: a Held sale can be completed after navigating away and back", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_hold_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "hold-resume");
	const sale = await createSaleWithOneLine(
		page,
		registerId,
		registerSessionId,
		productName,
		"5.00"
	);
	const holdResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/sales/hold")
	);
	await page.getByRole("button", { name: "Hold sale" }).click();
	await holdResponsePromise;

	// Navigate away, then resume the Held sale from the same browser at its
	// canonical URL — this IS the resume surface; no separate resume
	// permission or endpoint exists (frozen control plan §6.2).
	await page.goto("/operations/pos");
	await page.goto(`/operations/pos/sales/${sale.id}`);
	await expect(
		page.getByRole("heading", { name: `Sale ${sale.id}` })
	).toBeVisible();
	await page.getByLabel("Cash tendered (GYD)").fill("50.00");
	const completeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	expect(completeResponse.ok()).toBe(true);
	await expect(page).toHaveURL(RECEIPT_URL_PATTERN);
});

test("price-override request on a sale line, approved by a second identity, unblocks completion", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const makerContext = await browser.newContext();
	const makerPage = await makerContext.newPage();
	const registerId = `register_override_${Date.now()}`;
	const registerSessionId = await openRegister(makerPage, registerId, "100.00");
	const { name: productName } = await createActiveProduct(
		makerPage,
		"price-override"
	);
	const sale = await createSaleWithOneLine(
		makerPage,
		registerId,
		registerSessionId,
		productName,
		"10.00"
	);
	await makerPage.getByLabel("Requested price (GYD)").fill("7.50");
	await makerPage.getByLabel("Reason").fill("Manager-authorized discount");
	const requestResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/priceOverrides/request")
	);
	await makerPage.getByRole("button", { name: "Request override" }).click();
	const requestResponse = await requestResponsePromise;
	expect(requestResponse.ok()).toBe(true);
	const requested = (await requestResponse.json()) as {
		json: { lines: Array<{ id: string; priceOverrideId: string | null }> };
	};
	const overrideId = requested.json.lines[0].priceOverrideId;
	if (!overrideId) {
		throw new Error("Expected a priceOverrideId on the requested line");
	}
	// The sale cannot complete while the override is Pending — no "Complete
	// sale" control is offered.
	await expect(
		makerPage.getByRole("button", { name: "Complete sale" })
	).toHaveCount(0);

	const checkerContext = await browser.newContext();
	const checkerPage = await checkerContext.newPage();
	// A genuinely different browser never held this Sale locally (no
	// commerce.sale.* read endpoint — frozen control plan §8), so it uses
	// the standalone ID-entry approval surface, not the in-workspace one.
	await signIn(checkerPage, "/operations/pos/sales/price-overrides/approve", {
		email: APPROVER_EMAIL,
		password: APPROVER_PASSWORD,
	});
	await expect(
		checkerPage.getByRole("heading", { name: "Price override approval" })
	).toBeVisible();
	await checkerPage.getByLabel("Sale ID").fill(sale.id);
	await expect(
		checkerPage.getByRole("heading", { name: "Approve a price override" })
	).toBeVisible();
	await checkerPage.getByLabel("Price override ID").fill(overrideId);
	const approveResponsePromise = checkerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/priceOverrides/approve")
	);
	await checkerPage.getByRole("button", { name: "Approve override" }).click();
	const approveResponse = await approveResponsePromise;
	expect(approveResponse.ok()).toBe(true);
	await expect(
		checkerPage.getByRole("heading", { name: "Price override approved" })
	).toBeVisible();
});

/**
 * WS3 remediation R3, Finding H: `PriceOverrideRequestForm` renders once
 * PER SALE LINE inside `sale.lines.map(...)` (`sale-pages.tsx`). PRE-FIX,
 * its fields used bare names ("requestedPrice"/"reason") with no per-line
 * `id` — a second line's form would produce a SECOND `id="requestedPrice"`
 * element, an HTML duplicate-id violation that corrupts `<label for>`
 * association: the browser resolves every `<label for="requestedPrice">`
 * to the FIRST matching input regardless of which `<li>` it is visually
 * inside, so `getByLabel("Requested price (GYD)")` (and a screen reader's
 * own label lookup) would always target line 1's input even when the user
 * intends to edit line 2's. This test proves the POST-fix behavior: two
 * sale lines, each with its own open price-override form, have fully
 * independent, uniquely-identified fields — id, help/error association,
 * and value state never cross-contaminate between lines.
 */
test("duplicate DOM ids: two sale lines each with an open price-override form have independent, uniquely-identified fields", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_dup_id_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productAName } = await createActiveProduct(page, "dup-id-a");
	const { name: productBName } = await createActiveProduct(page, "dup-id-b");

	await page.goto(
		`/operations/pos/sales/new?registerId=${encodeURIComponent(registerId)}&registerSessionId=${encodeURIComponent(registerSessionId)}`
	);
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();

	const searchInput = page.getByLabel("Search by name or SKU");
	const addButton = page.getByRole("button", { name: "Add" }).first();

	const firstSearchResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/list")
	);
	await searchInput.fill(productAName);
	await firstSearchResponsePromise;
	await addButton.click();

	const secondSearchResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/list")
	);
	await searchInput.fill(productBName);
	await secondSearchResponsePromise;
	await addButton.click();

	const unitPriceInputs = page.getByLabel("Unit price (GYD)");
	await expect(unitPriceInputs).toHaveCount(2);
	await unitPriceInputs.nth(0).fill("10.00");
	await unitPriceInputs.nth(1).fill("15.00");

	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/sales/create")
	);
	await page.getByRole("button", { name: "Create sale" }).click();
	const createResponse = await createResponsePromise;
	const createdSale = (await createResponse.json()) as {
		json: { id: string; lines: Array<{ id: string; productName: string }> };
	};
	await expect(
		page.getByRole("heading", { name: `Sale ${createdSale.json.id}` })
	).toBeVisible();

	const [line1, line2] = createdSale.json.lines;

	// Unique DOM ids per line, derived from the line's own stable id.
	const priceField1 = page.locator(
		`#price-override-${line1.id}-requestedPrice`
	);
	const priceField2 = page.locator(
		`#price-override-${line2.id}-requestedPrice`
	);
	const reasonField1 = page.locator(`#price-override-${line1.id}-reason`);
	const reasonField2 = page.locator(`#price-override-${line2.id}-reason`);
	await expect(priceField1).toHaveCount(1);
	await expect(priceField2).toHaveCount(1);
	await expect(reasonField1).toHaveCount(1);
	await expect(reasonField2).toHaveCount(1);

	// Correct accessible name / label association per line — a real
	// screen-reader-equivalent lookup (`getByLabel`), not just a raw `id`
	// check: each `<label for>` must resolve to ITS OWN line's input.
	await expect(page.getByLabel("Requested price (GYD)").nth(0)).toHaveAttribute(
		"id",
		`price-override-${line1.id}-requestedPrice`
	);
	await expect(page.getByLabel("Requested price (GYD)").nth(1)).toHaveAttribute(
		"id",
		`price-override-${line2.id}-requestedPrice`
	);

	// Trigger validation errors independently on each line (empty
	// requested-price + empty reason both fail their own schema) and
	// assert the error-message elements are ALSO uniquely identified and
	// correctly associated via aria-describedby — the supplemental
	// requirement the label-only fix alone would not cover.
	await priceField1.fill("-5.00");
	const requestButtons = page.getByRole("button", { name: "Request override" });
	await requestButtons.nth(0).click();
	await expect(priceField1).toHaveAttribute("aria-invalid", "true");
	const errorId1 = await priceField1.getAttribute("aria-describedby");
	expect(errorId1).toBe(`price-override-${line1.id}-requestedPrice-error`);
	await expect(page.locator(`#${errorId1}`)).toBeVisible();
	// Line 2's field is untouched by line 1's invalid submission — no
	// shared/duplicate error id, no cross-line validation bleed.
	await expect(priceField2).not.toHaveAttribute("aria-invalid", "true");
	await expect(
		page.locator(`#price-override-${line2.id}-requestedPrice-error`)
	).toHaveCount(0);

	// Editing line 1's override value does not affect line 2's own value —
	// fully independent state, not a shared/duplicate-id-corrupted field.
	await priceField2.fill("99.00");
	await expect(priceField1).toHaveValue("-5.00");
	await expect(priceField2).toHaveValue("99.00");

	// Keyboard tab order reaches both lines' price fields independently
	// (each is a real, individually-focusable, uniquely-identified
	// control — no duplicate id for the browser to collapse focus onto).
	await priceField1.focus();
	await expect(priceField1).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(reasonField1).toBeFocused();
	await priceField2.focus();
	await expect(priceField2).toBeFocused();
	await page.keyboard.press("Tab");
	await expect(reasonField2).toBeFocused();
});

test("return flow: creating a return against a completed sale leaves it Pending with no inventory effect yet", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_return_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "return");
	await createSaleWithOneLine(
		page,
		registerId,
		registerSessionId,
		productName,
		"20.00"
	);
	await page.getByLabel("Cash tendered (GYD)").fill("50.00");
	const completeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};
	const receiptReference = await readPrintedReceiptReference(
		page,
		completed.json.receiptId
	);

	await page.goto("/operations/pos/returns/new");
	await expect(
		page.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await page.getByLabel("Register").fill(receiptReference.registerId);
	await page.getByLabel("Receipt number").fill(receiptReference.receiptNumber);
	await expect(
		page.getByRole("heading", { name: "Lines to return" })
	).toBeVisible();
	await page.getByLabel("Return quantity (0 = skip)").fill("1");
	await page.getByLabel("Reason").fill("Customer changed mind");
	const returnResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/create")
	);
	await page.getByRole("button", { name: "Create return" }).click();
	const returnResponse = await returnResponsePromise;
	expect(returnResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Return created" })
	).toBeVisible();
	await expect(page.getByText("Pending", { exact: true })).toBeVisible();
});

/**
 * WS3 remediation R3, Finding J: the receipt-to-return dead end. PRE-FIX,
 * `ReturnNewPage` required a bare "Sale ID" text field with the disclosure
 * "Enter the Sale ID from the original receipt" — but `ReceiptLayout` never
 * prints a Sale ID (only `receiptNumber` and `registerId`), and the field
 * resolved through `loadSaleWorkspace`, a THIS-BROWSER-ONLY
 * `sessionStorage` read (`apps/web/src/lib/pos.ts`) with no server lookup
 * behind it at all. A genuinely fresh browser context — a different device,
 * or the same device after clearing storage, the way a real cashier
 * starting a return days later would be — has no `sessionStorage` entry for
 * a sale ANOTHER session created, so pre-fix code could not have completed
 * this scenario at all: there was no field to even type a register/receipt
 * number into, and even a correct Sale ID typed by hand would resolve to
 * `null` (`loadSaleWorkspace` returns `null` for an unknown key), rendering
 * "This sale is not available in this browser" and permanently dead-ending
 * the flow. This test proves the POST-fix behavior instead: a brand new
 * `browser.newContext()` (no cookies, no storage, nothing carried over from
 * the browser that completed the sale) can still start and submit a return,
 * using only `receiptNumber` + `registerId` — the two values a real printed
 * receipt actually shows — resolved through the new
 * `commerce.sales.getForReturn` server read.
 */
test("receipt-to-return: a fresh browser with no prior session for the sale can start a return using only what the printed receipt shows", async ({
	browser,
}) => {
	test.setTimeout(60_000);

	// Browser A: completes the sale and reads ONLY what a real receipt
	// would print — never the receiptId in the URL, never the Sale ID.
	const cashierContext = await browser.newContext();
	const cashierPage = await cashierContext.newPage();
	const registerId = `register_fresh_return_${Date.now()}`;
	const registerSessionId = await openRegister(
		cashierPage,
		registerId,
		"100.00"
	);
	const { name: productName } = await createActiveProduct(
		cashierPage,
		"fresh-return"
	);
	await createSaleWithOneLine(
		cashierPage,
		registerId,
		registerSessionId,
		productName,
		"15.00"
	);
	await cashierPage.getByLabel("Cash tendered (GYD)").fill("20.00");
	const completeResponsePromise = cashierPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await cashierPage.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};
	const printedReference = await readPrintedReceiptReference(
		cashierPage,
		completed.json.receiptId
	);
	await cashierContext.close();

	// Browser B: a genuinely separate context — no cookies, no
	// sessionStorage, no IndexedDB carried over from browser A. Signs in
	// fresh and starts a return using ONLY `printedReference`.
	const freshContext = await browser.newContext();
	const freshPage = await freshContext.newPage();
	await signIn(freshPage, "/operations/pos/returns/new");
	await selectLocation(freshPage, "Georgetown Browser Store");
	await expect(
		freshPage.getByRole("heading", { name: "Create a return" })
	).toBeVisible();

	// The disclosure copy names the printed values, never an opaque Sale
	// ID — the smaller bug the same finding calls out.
	await expect(
		freshPage.getByText(RECEIPT_NUMBER_DISCLOSURE_PATTERN)
	).toBeVisible();
	await expect(freshPage.getByText(SALE_ID_TEXT_PATTERN)).toHaveCount(0);

	const saleLookupResponsePromise = freshPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/sales/getForReturn")
	);
	await freshPage.getByLabel("Register").fill(printedReference.registerId);
	await freshPage
		.getByLabel("Receipt number")
		.fill(printedReference.receiptNumber);
	const saleLookupResponse = await saleLookupResponsePromise;
	expect(saleLookupResponse.ok()).toBe(true);
	await expect(
		freshPage.getByRole("heading", { name: "Lines to return" })
	).toBeVisible();
	await expect(freshPage.getByText(productName)).toBeVisible();

	await freshPage.getByLabel("Return quantity (0 = skip)").fill("1");
	await freshPage
		.getByLabel("Reason")
		.fill("Fresh-browser receipt-to-return verification");
	const returnResponsePromise = freshPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/create")
	);
	await freshPage.getByRole("button", { name: "Create return" }).click();
	const returnResponse = await returnResponsePromise;
	expect(returnResponse.ok()).toBe(true);
	await expect(
		freshPage.getByRole("heading", { name: "Return created" })
	).toBeVisible();
});

test("receipt-to-return: an unknown register/receipt pair produces visible feedback, not a silent dead end", async ({
	page,
}) => {
	await signIn(page, "/operations/pos/returns/new");
	await selectLocation(page, "Georgetown Browser Store");
	await expect(
		page.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await page.getByLabel("Register").fill("register_does_not_exist_000000");
	await page.getByLabel("Receipt number").fill("RCPT-DOES-NOT-EXIST");
	// Scoped past Next.js's own `role="alert"` route-announcer element
	// (`#__next-route-announcer__`, always present in the DOM) to the
	// specific lookup-failure message.
	await expect(
		page.getByRole("alert").filter({ hasText: "No sale was found" })
	).toContainText("No sale was found for register");
	await expect(
		page.getByRole("heading", { name: "Lines to return" })
	).toHaveCount(0);
});

test("return approval by a second identity (approver != creator) posts the compensating inventory movement", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const makerContext = await browser.newContext();
	const makerPage = await makerContext.newPage();
	const registerId = `register_return_approve_${Date.now()}`;
	const registerSessionId = await openRegister(makerPage, registerId, "100.00");
	const { name: productName } = await createActiveProduct(
		makerPage,
		"return-approve"
	);
	await createSaleWithOneLine(
		makerPage,
		registerId,
		registerSessionId,
		productName,
		"20.00"
	);
	await makerPage.getByLabel("Cash tendered (GYD)").fill("50.00");
	const completeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await makerPage.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};
	const receiptReference = await readPrintedReceiptReference(
		makerPage,
		completed.json.receiptId
	);

	await makerPage.goto("/operations/pos/returns/new");
	await expect(
		makerPage.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await makerPage.getByLabel("Register").fill(receiptReference.registerId);
	await makerPage
		.getByLabel("Receipt number")
		.fill(receiptReference.receiptNumber);
	await expect(
		makerPage.getByRole("heading", { name: "Lines to return" })
	).toBeVisible();
	await makerPage.getByLabel("Return quantity (0 = skip)").fill("1");
	await makerPage.getByLabel("Reason").fill("Damaged item");
	const returnResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/create")
	);
	await makerPage.getByRole("button", { name: "Create return" }).click();
	const returnResponse = await returnResponsePromise;
	const createdReturn = (await returnResponse.json()) as {
		json: { id: string };
	};

	const checkerContext = await browser.newContext();
	const checkerPage = await checkerContext.newPage();
	await signIn(checkerPage, "/operations/pos/returns/approve", {
		email: APPROVER_EMAIL,
		password: APPROVER_PASSWORD,
	});
	await checkerPage.getByLabel("Return ID").fill(createdReturn.json.id);
	await checkerPage
		.getByRole("button", { name: "Review & approve return" })
		.click();
	await expect(
		checkerPage.getByRole("heading", { name: "Approve this return?" })
	).toBeVisible();
	const returnCommitButton = checkerPage.getByRole("button", {
		exact: true,
		name: "Approve return",
	});
	await expect(returnCommitButton).toBeEnabled();
	const approveResponsePromise = checkerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/approve")
	);
	await returnCommitButton.click();
	const approveResponse = await approveResponsePromise;
	expect(approveResponse.ok()).toBe(true);
	await expect(
		checkerPage.getByRole("heading", { name: "Return approved" })
	).toBeVisible();
});

/**
 * WS3 remediation R3, Finding I, exercised against `commerce.return.approve`
 * (one of the six flows the finding names). PRE-FIX, this screen showed
 * only a bare Return-ID-entry field and a commit button — the amount,
 * reference, and state were revealed only in the POST-commit success view,
 * and nothing stopped a mis-typed ID from committing against the wrong
 * record. This test proves the POST-fix behavior: a required intermediate
 * review step fetches and displays REAL server-derived data (the approver
 * never typed the refundable amount, sale reference, or state anywhere —
 * they only typed a Return ID) before the commit control is even usable,
 * AND the second independent review's supplemental requirements are met by
 * construction: non-destructive initial focus (never the commit button),
 * Escape and an explicit Cancel both close the dialog and restore focus to
 * the triggering control, and the commit mutation never fires from either
 * dismissal path.
 */
test("consequence preview: server-derived data, non-destructive focus, and Escape/Cancel both dismiss without committing", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const makerContext = await browser.newContext();
	const makerPage = await makerContext.newPage();
	const registerId = `register_preview_focus_${Date.now()}`;
	const registerSessionId = await openRegister(makerPage, registerId, "100.00");
	const { name: productName } = await createActiveProduct(
		makerPage,
		"preview-focus"
	);
	await createSaleWithOneLine(
		makerPage,
		registerId,
		registerSessionId,
		productName,
		"33.00"
	);
	await makerPage.getByLabel("Cash tendered (GYD)").fill("40.00");
	const completeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await makerPage.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};
	const receiptReference = await readPrintedReceiptReference(
		makerPage,
		completed.json.receiptId
	);

	await makerPage.goto("/operations/pos/returns/new");
	await makerPage.getByLabel("Register").fill(receiptReference.registerId);
	await makerPage
		.getByLabel("Receipt number")
		.fill(receiptReference.receiptNumber);
	await expect(
		makerPage.getByRole("heading", { name: "Lines to return" })
	).toBeVisible();
	await makerPage.getByLabel("Return quantity (0 = skip)").fill("1");
	await makerPage.getByLabel("Reason").fill("Consequence preview verification");
	const returnCreateResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/create")
	);
	await makerPage.getByRole("button", { name: "Create return" }).click();
	const returnCreateResponse = await returnCreateResponsePromise;
	const createdReturn = (await returnCreateResponse.json()) as {
		json: { id: string; totalRefundable: { amountMinor: number } };
	};
	const expectedRefundableMajor = (
		createdReturn.json.totalRefundable.amountMinor / 100
	).toFixed(2);

	const approverContext = await browser.newContext();
	const approverPage = await approverContext.newPage();
	await signIn(approverPage, "/operations/pos/returns/approve", {
		email: APPROVER_EMAIL,
		password: APPROVER_PASSWORD,
	});
	// The approval form's ENTIRE input surface — only a Return ID. Every
	// other value the dialog is about to show came from nowhere the form
	// itself supplied.
	await approverPage.getByLabel("Return ID").fill(createdReturn.json.id);
	const triggerButton = approverPage.getByRole("button", {
		name: "Review & approve return",
	});
	const previewResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/get")
	);
	await triggerButton.click();
	const previewResponse = await previewResponsePromise;
	expect(previewResponse.ok()).toBe(true);
	const dialog = approverPage.getByRole("alertdialog");
	await expect(dialog).toBeVisible();

	// Server-derived data, never form-supplied: the return's own id, the
	// sale it references, the register, and the refundable amount — none
	// of these were typed into the approval form, only fetched from the
	// server in response to the Return ID.
	await expect(dialog).toContainText(createdReturn.json.id);
	await expect(dialog).toContainText(expectedRefundableMajor);
	await expect(dialog).toContainText("Pending");

	// Non-destructive initial focus: the Cancel control, never the
	// destructive commit control, has focus immediately after the dialog
	// opens.
	const cancelButton = dialog.getByRole("button", { name: "Cancel" });
	const commitButton = dialog.getByRole("button", {
		exact: true,
		name: "Approve return",
	});
	await expect(cancelButton).toBeFocused();
	await expect(commitButton).not.toBeFocused();

	// Escape closes the dialog without committing, and restores focus to
	// the triggering control.
	let approveCallFiredOnEscape = false;
	await approverPage.route("**/rpc/commerce/returns/approve", async (route) => {
		approveCallFiredOnEscape = true;
		await route.continue();
	});
	await approverPage.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	expect(approveCallFiredOnEscape).toBe(false);
	await expect(triggerButton).toBeFocused();

	// Re-open, then dismiss via the explicit Cancel control — same
	// guarantees, the other dismissal path.
	const secondPreviewResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/get")
	);
	await triggerButton.click();
	await secondPreviewResponsePromise;
	await expect(dialog).toBeVisible();
	await expect(cancelButton).toBeFocused();
	await cancelButton.click();
	await expect(dialog).toBeHidden();
	expect(approveCallFiredOnEscape).toBe(false);
	await expect(triggerButton).toBeFocused();

	// The return was never approved by either dismissal path — its
	// server-authoritative state, re-checked from scratch, is still
	// Pending.
	const finalPreviewResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/get")
	);
	await triggerButton.click();
	await finalPreviewResponsePromise;
	await expect(dialog).toContainText("Pending");
});

/**
 * WS3 remediation R3, Finding G, exercised against `commerce.return.approve`
 * — one of the six previously-UNGATED controls the directive names by
 * file:line (`returns-pages.tsx:311`, pre-fix). PRE-FIX, clicking "Approve
 * return" while offline called `useMutation`'s own `mutateAsync` directly:
 * TanStack Query's default `networkMode: 'online'` PAUSES (does not reject)
 * that call and queues it in the mutation cache, then AUTOMATICALLY
 * resumes and executes it the instant the browser reconnects — with no
 * further confirmation from the actor, who may have abandoned the action
 * or reconsidered entirely. This test proves the POST-fix behavior: an
 * offline click is REJECTED before any mutation-cache entry is created (no
 * network call, verified by recording every request to the approve
 * endpoint), accessible feedback appears INSIDE the still-open dialog, and
 * reconnecting afterward does NOT silently execute the approval — proven
 * directly by re-opening the SAME return's preview and confirming its
 * server-authoritative state is still `Pending`, not `Completed`.
 */
test("offline reconnect never replays a rejected mutation: return approval requires a real online retry, not automatic execution on reconnect", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const makerContext = await browser.newContext();
	const makerPage = await makerContext.newPage();
	const registerId = `register_offline_replay_${Date.now()}`;
	const registerSessionId = await openRegister(makerPage, registerId, "100.00");
	const { name: productName } = await createActiveProduct(
		makerPage,
		"offline-replay"
	);
	await createSaleWithOneLine(
		makerPage,
		registerId,
		registerSessionId,
		productName,
		"12.00"
	);
	await makerPage.getByLabel("Cash tendered (GYD)").fill("20.00");
	const completeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await makerPage.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};
	const receiptReference = await readPrintedReceiptReference(
		makerPage,
		completed.json.receiptId
	);

	await makerPage.goto("/operations/pos/returns/new");
	await makerPage.getByLabel("Register").fill(receiptReference.registerId);
	await makerPage
		.getByLabel("Receipt number")
		.fill(receiptReference.receiptNumber);
	await expect(
		makerPage.getByRole("heading", { name: "Lines to return" })
	).toBeVisible();
	await makerPage.getByLabel("Return quantity (0 = skip)").fill("1");
	await makerPage.getByLabel("Reason").fill("Offline replay verification");
	const returnCreateResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/create")
	);
	await makerPage.getByRole("button", { name: "Create return" }).click();
	const returnCreateResponse = await returnCreateResponsePromise;
	const createdReturn = (await returnCreateResponse.json()) as {
		json: { id: string };
	};

	const approverContext = await browser.newContext();
	const approverPage = await approverContext.newPage();
	await signIn(approverPage, "/operations/pos/returns/approve", {
		email: APPROVER_EMAIL,
		password: APPROVER_PASSWORD,
	});
	await approverPage.getByLabel("Return ID").fill(createdReturn.json.id);
	const firstPreviewResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/get")
	);
	await approverPage
		.getByRole("button", { name: "Review & approve return" })
		.click();
	await firstPreviewResponsePromise;
	await expect(
		approverPage.getByRole("heading", { name: "Approve this return?" })
	).toBeVisible();
	await expect(
		approverPage.getByRole("definition").filter({ hasText: "Pending" })
	).toBeVisible();

	let approveCallCount = 0;
	await approverPage.route("**/rpc/commerce/returns/approve", async (route) => {
		approveCallCount += 1;
		await route.continue();
	});

	await approverPage.context().setOffline(true);
	await approverPage.evaluate(() => window.dispatchEvent(new Event("offline")));
	// Wait for `useOnlineStatus` to actually flip before clicking — the
	// global "Offline" banner is the same signal every other offline test
	// in this suite waits on, and it's the only proof `workspace.isOnline`
	// (what `useOnlineGatedMutation` actually reads) has propagated.
	await expect(
		approverPage.getByText("Offline", { exact: true }).first()
	).toBeVisible();
	const offlineCommitButton = approverPage.getByRole("button", {
		exact: true,
		name: "Approve return",
	});
	await offlineCommitButton.click();
	// Accessible feedback appears INSIDE the still-open dialog (Finding G's
	// supplemental fix to `ConsequencePreviewDialog` — the commit error is
	// rendered in the same inert-exempt subtree as the dialog's own
	// controls, not behind the modal overlay where a screen reader would
	// not reliably reach it).
	await expect(
		approverPage.getByRole("alertdialog").getByRole("alert")
	).toContainText(CONNECTION_REQUIRED_PATTERN);
	// The dialog stays open — a rejected offline click never advances past
	// this screen.
	await expect(
		approverPage.getByRole("heading", { name: "Approve this return?" })
	).toBeVisible();

	await approverPage.context().setOffline(false);
	await approverPage.evaluate(() => window.dispatchEvent(new Event("online")));
	// Bounded wait for any reconnection-triggered auto-replay to have had a
	// real chance to fire before asserting it did not.
	await approverPage.waitForTimeout(1500);
	expect(approveCallCount).toBe(0);
	await expect(
		approverPage.getByRole("heading", { name: "Return approved" })
	).toHaveCount(0);

	// Direct state check: re-open the SAME return's server-authoritative
	// preview from scratch and confirm it is still Pending — proving the
	// offline click's rejection was real, not merely a UI illusion, and
	// that reconnecting never silently completed the approval underneath.
	await approverPage.goto("/operations/pos/returns/approve");
	await approverPage.getByLabel("Return ID").fill(createdReturn.json.id);
	const secondPreviewResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/get")
	);
	await approverPage
		.getByRole("button", { name: "Review & approve return" })
		.click();
	await secondPreviewResponsePromise;
	await expect(
		approverPage.getByRole("definition").filter({ hasText: "Pending" })
	).toBeVisible();

	// A real online retry from here still works — offline rejection is a
	// deliberate gate, not a permanent lockout.
	const finalCommitButton = approverPage.getByRole("button", {
		exact: true,
		name: "Approve return",
	});
	await expect(finalCommitButton).toBeEnabled();
	const finalApproveResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/approve")
	);
	await finalCommitButton.click();
	const finalApproveResponse = await finalApproveResponsePromise;
	expect(finalApproveResponse.ok()).toBe(true);
	expect(approveCallCount).toBe(1);
	await expect(
		approverPage.getByRole("heading", { name: "Return approved" })
	).toBeVisible();
});

test("refund create and approve: a second identity's approval posts the paid-out cash movement", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const makerContext = await browser.newContext();
	const makerPage = await makerContext.newPage();
	const registerId = `register_refund_${Date.now()}`;
	const registerSessionId = await openRegister(makerPage, registerId, "100.00");
	const { name: productName } = await createActiveProduct(makerPage, "refund");
	await createSaleWithOneLine(
		makerPage,
		registerId,
		registerSessionId,
		productName,
		"20.00"
	);
	await makerPage.getByLabel("Cash tendered (GYD)").fill("50.00");
	const completeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await makerPage.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};
	const receiptReference = await readPrintedReceiptReference(
		makerPage,
		completed.json.receiptId
	);

	await makerPage.goto("/operations/pos/returns/new");
	await expect(
		makerPage.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await makerPage.getByLabel("Register").fill(receiptReference.registerId);
	await makerPage
		.getByLabel("Receipt number")
		.fill(receiptReference.receiptNumber);
	await expect(
		makerPage.getByRole("heading", { name: "Lines to return" })
	).toBeVisible();
	await makerPage.getByLabel("Return quantity (0 = skip)").fill("1");
	await makerPage.getByLabel("Reason").fill("Wrong item");
	const returnResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/create")
	);
	await makerPage.getByRole("button", { name: "Create return" }).click();
	const returnResponse = await returnResponsePromise;
	const createdReturn = (await returnResponse.json()) as {
		json: { id: string };
	};

	// The return is approved by the approver identity so it is Completed
	// before the refund is requested (frozen control plan §6.4 requires an
	// approved return).
	const approverContext = await browser.newContext();
	const approverPage = await approverContext.newPage();
	await signIn(approverPage, "/operations/pos/returns/approve", {
		email: APPROVER_EMAIL,
		password: APPROVER_PASSWORD,
	});
	await approverPage.getByLabel("Return ID").fill(createdReturn.json.id);
	await approverPage
		.getByRole("button", { name: "Review & approve return" })
		.click();
	await expect(
		approverPage.getByRole("heading", { name: "Approve this return?" })
	).toBeVisible();
	const refundFlowReturnCommitButton = approverPage.getByRole("button", {
		exact: true,
		name: "Approve return",
	});
	await expect(refundFlowReturnCommitButton).toBeEnabled();
	const returnApproveResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/approve")
	);
	await refundFlowReturnCommitButton.click();
	await returnApproveResponsePromise;

	// The maker browser requests the refund.
	await makerPage.goto("/operations/pos/refunds/new");
	await expect(
		makerPage.getByRole("heading", { name: "Request a refund" })
	).toBeVisible();
	await makerPage.getByLabel("Approved return ID").fill(createdReturn.json.id);
	const refundCreateResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/refunds/create")
	);
	await makerPage.getByRole("button", { name: "Request refund" }).click();
	const refundCreateResponse = await refundCreateResponsePromise;
	expect(refundCreateResponse.ok()).toBe(true);
	const createdRefund = (await refundCreateResponse.json()) as {
		json: { id: string };
	};
	await expect(
		makerPage.getByRole("heading", { name: "Refund requested" })
	).toBeVisible();

	// A DIFFERENT identity than the requester approves it.
	await approverPage.goto("/operations/pos/refunds/approve");
	await expect(
		approverPage.getByRole("heading", { name: "Approve a refund" })
	).toBeVisible();
	await approverPage.getByLabel("Refund ID").fill(createdRefund.json.id);
	await approverPage
		.getByRole("button", { name: "Review & approve refund" })
		.click();
	await expect(
		approverPage.getByRole("heading", { name: "Approve this refund?" })
	).toBeVisible();
	const refundCommitButton = approverPage.getByRole("button", {
		exact: true,
		name: "Approve refund",
	});
	await expect(refundCommitButton).toBeEnabled();
	const refundApproveResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/refunds/approve")
	);
	await refundCommitButton.click();
	const refundApproveResponse = await refundApproveResponsePromise;
	expect(refundApproveResponse.ok()).toBe(true);
	await expect(
		approverPage.getByRole("heading", { name: "Refund approved" })
	).toBeVisible();
});

test("deposit create and confirm: a second identity's confirmation reconciles the deposit", async ({
	browser,
}) => {
	test.setTimeout(60_000);
	const makerContext = await browser.newContext();
	const makerPage = await makerContext.newPage();
	const registerId = `register_deposit_${Date.now()}`;
	const registerSessionId = await openRegister(makerPage, registerId, "100.00");

	// A deposit draws from posted SAFE DROPS on the referenced session(s)
	// (`sumSafeDropForSessions` minus already-reserved deposits — packages/
	// domains/pos/src/index.ts `createDeposit`), not from the register's
	// general cash-on-hand. A safe drop is a prerequisite, not incidental.
	await makerPage.goto(`/operations/pos/registers/${registerSessionId}`);
	await expect(
		makerPage.getByText("Running expected cash: $100.00")
	).toBeVisible();
	await makerPage.getByLabel("Safe drop amount (GYD)").fill("60.00");
	const safeDropResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/safeDrops/create")
	);
	await makerPage.getByRole("button", { name: "Record safe drop" }).click();
	await safeDropResponsePromise;

	// Zero variance: expected cash is openingFloat (100.00) minus the safe
	// drop (60.00) = 40.00.
	await makerPage.goto(`/operations/pos/registers/${registerSessionId}/close`);
	await expect(
		makerPage.getByRole("heading", { name: "Close register" })
	).toBeVisible();
	await makerPage.getByLabel("Counted cash (GYD)").fill("40.00");
	await makerPage
		.getByRole("button", { name: "Review & close register" })
		.click();
	await expect(
		makerPage.getByRole("heading", { name: "Close this register?" })
	).toBeVisible();
	const depositFlowCloseCommitButton = makerPage.getByRole("button", {
		exact: true,
		name: "Close register",
	});
	await expect(depositFlowCloseCommitButton).toBeEnabled();
	const closeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await depositFlowCloseCommitButton.click();
	await closeResponsePromise;

	await makerPage.goto("/operations/pos/deposits/new");
	await expect(
		makerPage.getByRole("heading", { name: "Prepare a deposit" })
	).toBeVisible();
	await makerPage.getByLabel("Counted amount (GYD)").fill("60.00");
	await makerPage
		.getByLabel("Source register session IDs (comma-separated)")
		.fill(registerSessionId);
	const depositCreateResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/deposits/create")
	);
	await makerPage.getByRole("button", { name: "Prepare deposit" }).click();
	const depositCreateResponse = await depositCreateResponsePromise;
	expect(depositCreateResponse.ok()).toBe(true);
	const createdDeposit = (await depositCreateResponse.json()) as {
		json: { id: string };
	};
	await expect(
		makerPage.getByRole("heading", { name: "Deposit prepared" })
	).toBeVisible();

	const checkerContext = await browser.newContext();
	const checkerPage = await checkerContext.newPage();
	await signIn(checkerPage, "/operations/pos/deposits/confirm", {
		email: APPROVER_EMAIL,
		password: APPROVER_PASSWORD,
	});
	await checkerPage.getByLabel("Deposit ID").fill(createdDeposit.json.id);
	await checkerPage
		.getByRole("button", { name: "Review & confirm deposit" })
		.click();
	await expect(
		checkerPage.getByRole("heading", { name: "Confirm this deposit?" })
	).toBeVisible();
	const depositCommitButton = checkerPage.getByRole("button", {
		exact: true,
		name: "Confirm deposit",
	});
	await expect(depositCommitButton).toBeEnabled();
	const confirmResponsePromise = checkerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/deposits/confirm")
	);
	await depositCommitButton.click();
	const confirmResponse = await confirmResponsePromise;
	expect(confirmResponse.ok()).toBe(true);
	await expect(
		checkerPage.getByRole("heading", { name: "Deposit reconciled" })
	).toBeVisible();
});

test("receipt reissue produces a new numbered artifact", async ({ page }) => {
	test.setTimeout(60_000);
	const registerId = `register_reissue_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "reissue");
	await createSaleWithOneLine(
		page,
		registerId,
		registerSessionId,
		productName,
		"12.00"
	);
	await page.getByLabel("Cash tendered (GYD)").fill("50.00");
	const completeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	await completeResponsePromise;
	await expect(
		page.getByRole("heading", { exact: true, name: "Receipt" })
	).toBeVisible();

	const reissueResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/receipts/reissue")
	);
	await page.getByRole("button", { exact: true, name: "Reissue" }).click();
	const reissueResponse = await reissueResponsePromise;
	expect(reissueResponse.ok()).toBe(true);
	const reissued = (await reissueResponse.json()) as {
		json: { id: string; kind: string };
	};
	expect(reissued.json.kind).toBe("Reissue");
	await expect(page).toHaveURL(
		new RegExp(`/operations/pos/receipts/${reissued.json.id}$`)
	);
});

test("receipt void reverses the sale through the receipt view", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_void_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "void");
	await createSaleWithOneLine(
		page,
		registerId,
		registerSessionId,
		productName,
		"8.00"
	);
	await page.getByLabel("Cash tendered (GYD)").fill("50.00");
	const completeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	await completeResponsePromise;
	await expect(
		page.getByRole("heading", { exact: true, name: "Receipt" })
	).toBeVisible();

	await page.getByLabel("Reason (optional)").fill("Duplicate transaction");
	await page.getByRole("button", { name: "Review & void receipt" }).click();
	await expect(
		page.getByRole("heading", { name: "Void this receipt?" })
	).toBeVisible();
	const voidCommitButton = page.getByRole("button", {
		exact: true,
		name: "Void receipt",
	});
	await expect(voidCommitButton).toBeEnabled();
	const voidResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/receipts/void")
	);
	await voidCommitButton.click();
	const voidResponse = await voidResponsePromise;
	expect(voidResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Receipt voided" })
	).toBeVisible();
});

test("handoff export: generating an accountant export triggers a real download", async ({
	page,
}) => {
	await signIn(page, "/operations/pos/exports");
	// WS3 remediation R3, cycle 1 (remediation-of-remediation): this used to
	// fill an arbitrary fabricated value (`legal_entity_${Date.now()}`) that
	// was never bound to the signed-in session's active context. That was
	// never valid to begin with — no code path in this system can ever bind
	// a `legalEntityId` to an active context (`setActiveContext` throws if
	// one is supplied; "not implemented in PR3") — so this stage's own
	// Finding K hardening (`requireLegalEntityScope`, now fed a value
	// derived from `context.organizationId` — see
	// `apps/server/composition/legal-entity-scope.ts`
	// `resolveContextLegalEntityId`) correctly rejects ANY value that is not
	// the caller's own organization ID. `ORGANIZATION_ID` is exactly that
	// value for the signed-in `FIXTURE_EMAIL` identity.
	await page.getByLabel("Legal entity ID").fill(ORGANIZATION_ID);
	await page.getByLabel("Period start (date)").fill("2026-07-01");
	await page.getByLabel("Period end (date)").fill("2026-07-18");
	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/exports/createAccountantHandoff")
	);
	await page.getByRole("button", { name: "Generate export" }).click();
	const createResponse = await createResponsePromise;
	expect(createResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Handoff export generated" })
	).toBeVisible();
	const downloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "Download" }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toMatch(
		EXPORT_DOWNLOAD_FILENAME_PATTERN
	);
});

test("handoff export: a legalEntityId that does not match the signed-in session's own organization is rejected, not silently accepted", async ({
	page,
}) => {
	// WS3 remediation R3, cycle 1 adversarial coverage: proves the R3 fix
	// (deriving legal-entity scope from context.organizationId) did not
	// resurrect Finding K's original hole, where ANY caller-supplied
	// legalEntityId — matching or spoofed — was silently accepted and
	// stamped onto the export record unverified. A spoofed value distinct
	// from the signed-in session's real organization must still be denied
	// through the real transport path (real browser, real server, real DB —
	// not a mocked/unit-level reproduction).
	await signIn(page, "/operations/pos/exports");
	await page
		.getByLabel("Legal entity ID")
		.fill("organization_spoofed_by_attacker_0001");
	await page.getByLabel("Period start (date)").fill("2026-07-01");
	await page.getByLabel("Period end (date)").fill("2026-07-18");
	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/exports/createAccountantHandoff")
	);
	await page.getByRole("button", { name: "Generate export" }).click();
	const createResponse = await createResponsePromise;
	expect(createResponse.ok()).toBe(false);
	await expect(
		page.getByRole("heading", { name: "Handoff export generated" })
	).toHaveCount(0);
});

test("accessibility: register open, the sale cart builder, and the receipt view have no automated WCAG A/AA violations", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_a11y_${Date.now()}`;
	await signIn(page, "/operations/pos/registers/new");
	await selectLocation(page, "Georgetown Browser Store");
	const openFormResults = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.analyze();
	expect(openFormResults.violations).toEqual([]);

	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "a11y");
	await createSaleWithOneLine(
		page,
		registerId,
		registerSessionId,
		productName,
		"9.00"
	);
	const saleResults = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.analyze();
	expect(saleResults.violations).toEqual([]);

	await page.getByLabel("Cash tendered (GYD)").fill("20.00");
	const completeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	await completeResponsePromise;
	await expect(
		page.getByRole("heading", { exact: true, name: "Receipt" })
	).toBeVisible();
	const receiptResults = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.analyze();
	expect(receiptResults.violations).toEqual([]);
});

// WS3 PR6 closeout: the accessibility test above scans only register-open,
// the sale cart builder, and the receipt view (PR5's own scope). PR6's
// evidence obligation needs `accessibility_and_responsive` coverage for
// `commerce.returns`/`commerce.refunds`/`commerce.cash-management`
// (deposits) too — those forms render without any completed workflow
// prerequisite, so this scans just the landing forms rather than
// re-running each full maker/checker flow.
test("accessibility: the return-creation, refund-request, and deposit-preparation landing forms have no automated WCAG A/AA violations", async ({
	page,
}) => {
	test.setTimeout(60_000);
	await signIn(page, "/operations/pos/returns/new");
	await expect(
		page.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	const returnResults = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.analyze();
	expect(returnResults.violations).toEqual([]);

	await page.goto("/operations/pos/refunds/new");
	await expect(
		page.getByRole("heading", { name: "Request a refund" })
	).toBeVisible();
	const refundResults = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.analyze();
	expect(refundResults.violations).toEqual([]);

	await page.goto("/operations/pos/deposits/new");
	await expect(
		page.getByRole("heading", { name: "Prepare a deposit" })
	).toBeVisible();
	const depositResults = await new AxeBuilder({ page })
		.withTags(WCAG_TAGS)
		.analyze();
	expect(depositResults.violations).toEqual([]);
});

// WS3 PR6 closeout: mirrors WS2's own "online-only mutations fail closed"
// browser proof (`ws2-closeout.spec.ts`) for the WS3 forms sharing the same
// `WorkspaceProvider`/`workspace.isOnline` gating and global "Offline"
// alert. `commerce.offline-sales` proves ONLY this fail-closed boundary —
// offline-safe command capture, leases, and general sync reconciliation
// remain PENDING WS5 per the frozen control plan §5.
test("online-only WS3 mutations fail closed and remain understandable when connectivity drops", async ({
	page,
}) => {
	test.slow();
	await signIn(page, "/operations/pos/registers/new");
	await selectLocation(page, "Georgetown Browser Store");
	const cases = [
		{
			button: "Open register",
			heading: "Open register",
			route: "/operations/pos/registers/new",
		},
		{
			button: "Request refund",
			heading: "Request a refund",
			route: "/operations/pos/refunds/new",
		},
		{
			button: "Prepare deposit",
			heading: "Prepare a deposit",
			route: "/operations/pos/deposits/new",
		},
	] as const;

	async function expectOnlineOnlyCase(item: (typeof cases)[number]) {
		await page.context().setOffline(false);
		await page.goto(item.route);
		await expect(
			page.getByRole("heading", { name: item.heading })
		).toBeVisible();
		await page.context().setOffline(true);
		await page.evaluate(() => window.dispatchEvent(new Event("offline")));
		await expect(
			page.getByText("Offline", { exact: true }).first()
		).toBeVisible();
		await expect(
			page.getByRole("button", { name: item.button })
		).toBeDisabled();
	}
	await expectOnlineOnlyCase(cases[0]);
	await expectOnlineOnlyCase(cases[1]);
	await expectOnlineOnlyCase(cases[2]);

	// `commerce.returns`' create form progressively discloses "Lines to
	// return" (and the "Create return" submit button inside it) only after
	// `commerce.sales.getForReturn` resolves the printed register+receipt
	// reference over the network (WS3 remediation R3, Finding J — this is
	// now a real server read, not a local sessionStorage lookup). The
	// lookup runs ONLINE, then connectivity drops with the resolved Sale
	// already in the query cache, isolating the FINAL "Create return"
	// mutation button as the thing offline actually disables.
	await page.context().setOffline(false);
	const returnRegisterId = `register_offline_return_${Date.now()}`;
	const returnRegisterSessionId = await openRegister(
		page,
		returnRegisterId,
		"100.00"
	);
	const { name: returnProductName } = await createActiveProduct(
		page,
		"offline-return-gate"
	);
	await createSaleWithOneLine(
		page,
		returnRegisterId,
		returnRegisterSessionId,
		returnProductName,
		"9.00"
	);
	await page.getByLabel("Cash tendered (GYD)").fill("20.00");
	const returnSaleCompletePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	const returnSaleCompleteResponse = await returnSaleCompletePromise;
	const returnSaleCompleted = (await returnSaleCompleteResponse.json()) as {
		json: { receiptId: string };
	};
	const returnReceiptReference = await readPrintedReceiptReference(
		page,
		returnSaleCompleted.json.receiptId
	);

	await page.goto("/operations/pos/returns/new");
	await expect(
		page.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await page.getByLabel("Register").fill(returnReceiptReference.registerId);
	await page
		.getByLabel("Receipt number")
		.fill(returnReceiptReference.receiptNumber);
	await expect(
		page.getByRole("heading", { name: "Lines to return" })
	).toBeVisible();

	await page.context().setOffline(true);
	await page.evaluate(() => window.dispatchEvent(new Event("offline")));
	await expect(
		page.getByText("Offline", { exact: true }).first()
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Create return" })
	).toBeDisabled();

	// A fifth case for `commerce.order-management`'s own sale-create route:
	// unlike the four cases above, "Create sale" is ALSO disabled by
	// `!allValid` with an empty cart, so a valid line is added ONLINE first
	// — the assertion below then isolates offline as the sole remaining
	// disqualifying condition.
	await page.context().setOffline(false);
	const registerId = `register_offline_sale_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "offline-gate");
	await page.goto(
		`/operations/pos/sales/new?registerId=${encodeURIComponent(registerId)}&registerSessionId=${encodeURIComponent(registerSessionId)}`
	);
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();
	const searchResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/list")
	);
	await page.getByLabel("Search by name or SKU").fill(productName);
	await searchResponsePromise;
	await page.getByRole("button", { name: "Add" }).first().click();
	await page.getByLabel("Unit price (GYD)").fill("9.00");

	await page.context().setOffline(true);
	await page.evaluate(() => window.dispatchEvent(new Event("offline")));
	await expect(
		page.getByText("Offline", { exact: true }).first()
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Create sale" })
	).toBeDisabled();

	await page.context().setOffline(false);
	await page.evaluate(() => window.dispatchEvent(new Event("online")));
});

/**
 * WS3 remediation R3b, Item 9 (POS workspace/navigation).
 *
 * PRE-FIX: `/operations/pos` was entirely absent from
 * `OPERATIONS_NAVIGATION`, and `POS_NAVIGATION` (the "Registers / Sales /
 * Receipts / Returns / Refunds / Deposits / Handoff export" list) was
 * rendered ONLY on the POS overview page's body as cross-link cards —
 * never as a persistent nav bar. A cashier or manager reached a deep POS
 * route (an individual register session or receipt) via a direct URL —
 * exactly what this test does with `page.goto`, simulating a bookmark,
 * a shared link, or a reload mid-workflow — with NO POS navigation
 * rendered at all, and (per `shell.test.ts`'s reproduction) the broader
 * Operations nav would have shown the wrong "current" section too.
 *
 * POST-FIX: `PosNavigation` (mounted once by the nested
 * `apps/web/src/app/operations/pos/layout.tsx`, so it persists across
 * in-app navigation within `/operations/pos/*`) is present on a direct
 * deep link into EITHER route below, and marks EXACTLY ONE link
 * `aria-current="page"` — the correct one for that specific route, not
 * "Overview" (which is a path-prefix of every other POS section).
 */
test("POS navigation persists on a direct deep link into an individual register session AND an individual receipt, each with exactly one correct current item", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_deeplink_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "deeplink");
	await createSaleWithOneLine(
		page,
		registerId,
		registerSessionId,
		productName,
		"10.00"
	);
	await page.getByLabel("Cash tendered (GYD)").fill("50.00");
	const completeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/sales/complete")
	);
	await page.getByRole("button", { name: "Complete sale" }).click();
	const completeResponse = await completeResponsePromise;
	expect(completeResponse.ok()).toBe(true);
	const completed = (await completeResponse.json()) as {
		json: { receiptId: string };
	};

	// Deep link #1: a fresh navigation directly to the register session
	// view (not reached by clicking through the app in this same page
	// load).
	await page.goto(`/operations/pos/registers/${registerSessionId}`);
	await expect(
		page.getByRole("heading", { name: `Register ${registerId}` })
	).toBeVisible();
	const posNavRegisters = page.getByRole("navigation", { name: "POS" });
	await expect(posNavRegisters).toBeVisible();
	const currentRegisters = posNavRegisters.locator("[aria-current='page']");
	await expect(currentRegisters).toHaveCount(1);
	await expect(currentRegisters).toHaveText("Registers");
	// The persistent workspace shell (org/location context) also survives
	// the deep link, not just the POS sub-nav.
	await expect(
		page.getByRole("region", { name: "Current workspace" })
	).toBeVisible();

	// Deep link #2: a fresh navigation directly to the receipt view.
	await page.goto(
		`/operations/pos/receipts/${encodeURIComponent(completed.json.receiptId)}`
	);
	await expect(
		page.getByRole("heading", { exact: true, name: "Receipt" })
	).toBeVisible();
	const posNavReceipts = page.getByRole("navigation", { name: "POS" });
	await expect(posNavReceipts).toBeVisible();
	const currentReceipts = posNavReceipts.locator("[aria-current='page']");
	await expect(currentReceipts).toHaveCount(1);
	await expect(currentReceipts).toHaveText("Receipts");
	await expect(
		page.getByRole("region", { name: "Current workspace" })
	).toBeVisible();
});

/**
 * WS3 remediation R3b, Item 8 (recoverable task state).
 *
 * PRE-FIX: `SaleCartBuilder`'s in-progress cart was plain React state
 * with NO protection at all — clicking away to another page (including a
 * click on the app's own persistent nav) silently discarded every line
 * with no warning, and a reload lost the draft outright with nothing to
 * recover.
 *
 * POST-FIX: this test exercises the two DOM-event-driven guard paths a
 * unit test cannot reach — an in-app navigation click while dirty, and a
 * reload while dirty — proving both a real native confirmation appears
 * and that cancelling it genuinely keeps the cashier on the page with
 * their draft intact, while a reload restores the SAME draft via the
 * scoped sessionStorage persistence (`saveCartDraft`/`loadCartDraft`,
 * unit-tested directly in `pos.test.ts` for the cross-scope leak
 * requirement, since that part needs no browser).
 */
test("dirty sale cart: an in-app navigation click while dirty is confirmed (cancel keeps the draft, confirm discards it), and a reload while dirty restores the draft", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_dirtyguard_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "dirtyguard");
	await page.goto(
		`/operations/pos/sales/new?registerId=${encodeURIComponent(registerId)}&registerSessionId=${encodeURIComponent(registerSessionId)}`
	);
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();
	const searchResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/list")
	);
	await page.getByLabel("Search by name or SKU").fill(productName);
	await searchResponsePromise;
	await page.getByRole("button", { name: "Add" }).first().click();
	await expect(page.getByRole("list", { name: "Cart lines" })).toContainText(
		productName
	);

	// Cancel path: an in-app nav click while dirty shows a native confirm;
	// dismissing it must leave the cashier on the SAME page with the SAME
	// draft still visible, not silently navigated away.
	page.once("dialog", (dialog) => {
		dialog.dismiss().catch(() => undefined);
	});
	await page
		.getByRole("navigation", { name: "POS" })
		.getByRole("link", { name: "Registers" })
		.click();
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();
	await expect(page.getByRole("list", { name: "Cart lines" })).toContainText(
		productName
	);

	// Reload path: the draft survives a real page reload, scoped to this
	// exact register session + workspace context.
	await page.reload();
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();
	await expect(page.getByRole("list", { name: "Cart lines" })).toContainText(
		productName
	);

	// Confirm path: accepting the native confirm genuinely completes the
	// navigation this time.
	page.once("dialog", (dialog) => {
		dialog.accept().catch(() => undefined);
	});
	await page
		.getByRole("navigation", { name: "POS" })
		.getByRole("link", { name: "Registers" })
		.click();
	await expect(
		page.getByRole("heading", { exact: true, name: "Registers" })
	).toBeVisible();
});
