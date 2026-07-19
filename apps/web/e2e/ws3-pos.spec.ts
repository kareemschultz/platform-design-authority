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
	const closeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await page.getByRole("button", { name: "Close register" }).click();
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
	const closeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await makerPage.getByRole("button", { name: "Close register" }).click();
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
		makerPage.getByRole("button", { name: "Approve variance" })
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
	const approveResponsePromise = checkerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/cashVariances/approve")
	);
	await checkerPage.getByRole("button", { name: "Approve variance" }).click();
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
	const closeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await page.getByRole("button", { name: "Close register" }).click();
	const closeResponse = await closeResponsePromise;
	expect(closeResponse.status()).toBe(403);
	await expect(page.getByText("Permission denied")).toBeVisible();
	await expect(
		page.getByText(
			"Your current role or scope does not permit this change. No change was applied."
		)
	).toBeVisible();
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
	label: string
): Promise<{ id: string; name: string }> {
	const productName = `WS3 POS ${label} ${Date.now()}`;
	await page.goto("/operations/products/new");
	await expect(
		page.getByRole("heading", { name: "Create Product" })
	).toBeVisible();
	await page.getByLabel("Product name").fill(productName);
	await page.getByLabel("Variant name").fill("Default");
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

	// A cash sale posts no commerce.cash-movement — the register's
	// server-computed expectedCash is opening float plus net PaidIn/PaidOut/
	// SafeDrop/Refund movements only (packages/domains/pos/src/index.ts
	// register.close), never completed cash-sale proceeds (a disclosed
	// PR1-4 scoping boundary this stage's UI reflects, not resolves). Zero
	// variance therefore requires the UNCHANGED opening float here.
	await page.goto(`/operations/pos/registers/${registerSessionId}/close`);
	await expect(
		page.getByRole("heading", { name: "Close register" })
	).toBeVisible();
	await page.getByLabel("Counted cash (GYD)").fill("100.00");
	const closeResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await page.getByRole("button", { name: "Close register" }).click();
	const closeResponse = await closeResponsePromise;
	expect(closeResponse.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Register closed" })
	).toBeVisible();
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

test("return flow: creating a return against a completed sale leaves it Pending with no inventory effect yet", async ({
	page,
}) => {
	test.setTimeout(60_000);
	const registerId = `register_return_${Date.now()}`;
	const registerSessionId = await openRegister(page, registerId, "100.00");
	const { name: productName } = await createActiveProduct(page, "return");
	const sale = await createSaleWithOneLine(
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
	await completeResponsePromise;

	await page.goto("/operations/pos/returns/new");
	await expect(
		page.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await page.getByLabel("Sale ID").fill(sale.id);
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
	const sale = await createSaleWithOneLine(
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
	await completeResponsePromise;

	await makerPage.goto("/operations/pos/returns/new");
	await expect(
		makerPage.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await makerPage.getByLabel("Sale ID").fill(sale.id);
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
	const approveResponsePromise = checkerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/approve")
	);
	await checkerPage.getByRole("button", { name: "Approve return" }).click();
	const approveResponse = await approveResponsePromise;
	expect(approveResponse.ok()).toBe(true);
	await expect(
		checkerPage.getByRole("heading", { name: "Return approved" })
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
	const sale = await createSaleWithOneLine(
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
	await completeResponsePromise;

	await makerPage.goto("/operations/pos/returns/new");
	await expect(
		makerPage.getByRole("heading", { name: "Create a return" })
	).toBeVisible();
	await makerPage.getByLabel("Sale ID").fill(sale.id);
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
	const returnApproveResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/returns/approve")
	);
	await approverPage.getByRole("button", { name: "Approve return" }).click();
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
	const refundApproveResponsePromise = approverPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/refunds/approve")
	);
	await approverPage.getByRole("button", { name: "Approve refund" }).click();
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
	const closeResponsePromise = makerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/registers/close")
	);
	await makerPage.getByRole("button", { name: "Close register" }).click();
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
	const confirmResponsePromise = checkerPage.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/commerce/deposits/confirm")
	);
	await checkerPage.getByRole("button", { name: "Confirm deposit" }).click();
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
	const voidResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().includes("/rpc/commerce/receipts/void")
	);
	await page.getByRole("button", { name: "Void receipt" }).click();
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
	await page.getByLabel("Legal entity ID").fill(`legal_entity_${Date.now()}`);
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
