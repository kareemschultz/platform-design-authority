import { Buffer } from "node:buffer";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, type TestInfo, test } from "@playwright/test";

const FIXTURE_EMAIL = "ws2-operations@example.test";
const FIXTURE_PASSWORD = "WS2-browser-verification-password-0001";
const RESTRICTED_FIXTURE_EMAIL = "ws2-read-restricted@example.test";
const RESTRICTED_FIXTURE_PASSWORD =
	"WS2-browser-restricted-verification-password-0001";
const LOCATION_ID = "location_ws2_browser_0001";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const PRODUCT_IMPORT_LIST_URL = /\/operations\/imports\?target=product/u;
const STALE_CURSOR_URL = /cursor=stale-cursor.*cursorTrail=older-cursor/u;
const CURSOR_TRAIL_URL = /cursorTrail=/u;
const INVENTORY_PERMISSION_DETAIL = /inventory\.balance\.read/u;

async function signIn(
	page: Page,
	input: { email: string; password: string; returnTo: string }
) {
	await page.goto(`/login?returnTo=${encodeURIComponent(input.returnTo)}`);
	await page.getByLabel("Email").fill(input.email);
	await page.getByLabel("Password").fill(input.password);
	const signInResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/api/auth/sign-in/email")
	);
	await page.getByRole("button", { name: "Sign In" }).click();
	const signInResponse = await signInResponsePromise;
	expect(signInResponse.ok()).toBe(true);
	const authOrigin = new URL(signInResponse.url()).origin;
	await expect
		.poll(async () => {
			const sessionResponse = await page.request.get(
				`${authOrigin}/api/auth/get-session`
			);
			const session = (await sessionResponse.json().catch(() => null)) as {
				user?: { email?: string };
			} | null;
			return session?.user?.email;
		})
		.toBe(input.email);

	// A response event can precede browser cookie-jar settlement. Navigate only
	// after the independent session endpoint observes the persisted session.
	await page.goto(input.returnTo);
	await expect(
		page.getByRole("region", { name: "Current workspace" })
	).toBeVisible();
	await expect(
		page.getByText("Tenant context is server-validated for this browser tab.")
	).toBeVisible();
}

async function signInOperator(page: Page, returnTo: string) {
	await signIn(page, {
		email: FIXTURE_EMAIL,
		password: FIXTURE_PASSWORD,
		returnTo,
	});
}

async function expectAutomatedA11yClean(page: Page) {
	const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
	expect(results.violations).toEqual([]);
}

async function expectViewportReflow(page: Page) {
	const viewportFits = await page.evaluate(
		() =>
			document.documentElement.scrollWidth <=
			document.documentElement.clientWidth
	);
	expect(viewportFits).toBe(true);
}

async function createProduct(page: Page, testInfo: TestInfo) {
	await page.goto("/operations/products/new");
	await expect(
		page.getByRole("heading", { name: "Create Product" })
	).toBeVisible();
	await expect(
		page.getByText("Tenant context is server-validated for this browser tab.")
	).toBeVisible();
	const suffix = crypto.randomUUID().slice(0, 8);
	const productName = `Count Product ${testInfo.project.name} ${suffix}`;
	await page.getByLabel("Product name").fill(productName);
	await page.getByLabel("Variant name").fill("Default");
	await page
		.getByLabel("Tenant SKU (optional)")
		.fill(`COUNT-${testInfo.project.name.toUpperCase()}-${suffix}`);
	const responsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/create")
	);
	await page.getByRole("button", { name: "Create Product draft" }).click();
	const createResponse = await responsePromise;
	expect(createResponse.ok()).toBe(true);
	const created = (await createResponse.json()) as { json: { id: string } };
	return created.json.id;
}

async function recordScannerObservation(
	page: Page,
	productId: string,
	observed: string
): Promise<number> {
	await page.getByLabel("Product ID").fill(productId);
	await page.getByLabel("Observed quantity").fill(observed);
	const saveResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/inventory/counts/saveDraft")
	);
	const startedAt = performance.now();
	await page.getByLabel("Observed quantity").press("Enter");
	expect((await saveResponsePromise).ok()).toBe(true);
	await expect(page.getByLabel("Product ID")).toBeFocused();
	await expect(page.getByLabel("Product ID")).toHaveValue("");
	await expect(
		page.getByText(`Observed ${observed}.000000 each`, { exact: true })
	).toBeVisible();
	return performance.now() - startedAt;
}

test("a Product import reaches governed review with keyboard, history, reflow, and axe evidence", async ({
	page,
}, testInfo) => {
	await signInOperator(page, "/operations/imports/new?target=product");
	await expect(
		page.getByRole("heading", { name: "Start CSV import" })
	).toBeVisible();
	await expect(page.getByLabel("Import type")).toHaveValue("product");

	const suffix = crypto.randomUUID().slice(0, 8);
	const fileName = `product-review-${suffix}.csv`;
	const csv = [
		"source_key,name,variant_name,sku,barcode,barcode_scheme",
		`browser-${suffix},Browser Import ${suffix},Default,IMPORT-${suffix},,`,
	].join("\n");
	await page.getByLabel("UTF-8 CSV file").setInputFiles({
		buffer: Buffer.from(csv, "utf8"),
		mimeType: "text/csv",
		name: fileName,
	});

	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/imports/create")
	);
	await page.getByRole("button", { name: "Upload CSV" }).click();
	expect((await createResponsePromise).ok()).toBe(true);

	await expect(page.getByText(fileName, { exact: true })).toBeVisible();
	await expect(
		page.getByText("ReadyForApproval", { exact: true })
	).toBeVisible();
	await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();
	await expect(
		page.getByRole("progressbar", { name: "Import row progress" })
	).toHaveAttribute("value", "0");

	const review = page.getByRole("button", { name: "Review and commit" });
	await review.focus();
	await expect(review).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(
		page.getByRole("dialog").getByRole("heading", {
			name: "Approve and commit Product?",
		})
	).toBeVisible();
	await expect(
		page
			.getByRole("dialog")
			.getByText("The uploader cannot approve their own import.", {
				exact: false,
			})
	).toBeVisible();
	const keepUncommitted = page.getByRole("button", {
		name: "Keep uncommitted",
	});
	await keepUncommitted.focus();
	await page.keyboard.press("Enter");
	await expect(page.getByRole("dialog")).not.toBeVisible();

	await expectAutomatedA11yClean(page);
	await expectViewportReflow(page);
	const detailUrl = page.url();
	await page.getByRole("link", { name: "Back to results" }).click();
	await expect(page).toHaveURL(PRODUCT_IMPORT_LIST_URL);
	await expect(page.getByRole("heading", { name: "Imports" })).toBeVisible();
	await page.goBack();
	await expect(page).toHaveURL(detailUrl);
	await expect(page.getByText(fileName, { exact: true })).toBeVisible();

	await testInfo.attach("product-import-review-route.txt", {
		body: detailUrl,
		contentType: "text/plain",
	});
});

test("a blind Count preserves hidden expected quantity through submit and returns scanner focus", async ({
	page,
}, testInfo) => {
	test.slow();
	await signInOperator(page, "/operations/products/new");
	const productId = await createProduct(page, testInfo);

	await page.goto("/operations/inventory/counts/new");
	await expect(
		page.getByRole("heading", { name: "Create Stock Count" })
	).toBeVisible();
	await page.locator("#count-location").selectOption(LOCATION_ID);
	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/inventory/counts/create")
	);
	await page.getByRole("button", { name: "Create blind Count" }).click();
	const createResponse = await createResponsePromise;
	expect(createResponse.ok()).toBe(true);
	const created = (await createResponse.json()) as { json: { id: string } };

	await expect(
		page.getByRole("heading", { name: `Count ${created.json.id}` })
	).toBeVisible();
	await expect(page.getByText("Blind Count", { exact: true })).toBeVisible();
	await expect(page.getByText("Expected", { exact: true })).not.toBeVisible();
	const scannerSamplesMs: number[] = [];
	for (const observed of ["7", "8", "9", "10", "11"]) {
		scannerSamplesMs.push(
			// biome-ignore lint/performance/noAwaitInLoops: scanner evidence must preserve input, commit, refocus, and version order.
			await recordScannerObservation(page, productId, observed)
		);
	}
	const sortedScannerSamples = [...scannerSamplesMs].sort(
		(left, right) => left - right
	);
	const scannerEvidence = {
		failures: scannerSamplesMs.filter((sample) => sample >= 5000).length,
		maxMs: Math.max(...scannerSamplesMs),
		medianMs: sortedScannerSamples[Math.floor(sortedScannerSamples.length / 2)],
		sampleSize: scannerSamplesMs.length,
		samplesMs: scannerSamplesMs,
		targetMedianMs: 5000,
	};
	await testInfo.attach("blind-count-scanner-interaction.json", {
		body: JSON.stringify(scannerEvidence, null, 2),
		contentType: "application/json",
	});
	expect(scannerEvidence.medianMs).toBeLessThan(5000);
	await expect(page.getByText(productId, { exact: true })).toBeVisible();
	await expect(
		page.getByText("Observed 11.000000 each", { exact: true })
	).toBeVisible();

	const reviewSubmission = page.getByRole("button", {
		name: "Review submission",
	});
	await reviewSubmission.focus();
	await page.keyboard.press("Enter");
	await expect(
		page.getByRole("heading", { name: "Submit this blind Count?" })
	).toBeVisible();
	const submit = page.getByRole("button", { name: "Submit for review" });
	await submit.focus();
	const submitResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/inventory/counts/submit")
	);
	await page.keyboard.press("Enter");
	expect((await submitResponsePromise).ok()).toBe(true);
	await expect(page.getByText("Submitted", { exact: true })).toBeVisible();
	await expect(
		page.getByText("Expected quantity remains hidden until posting.")
	).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Scan or enter an observation" })
	).not.toBeVisible();

	await page.getByRole("button", { name: "Review approval" }).click();
	await expect(
		page.getByText("The maker cannot approve their own Count.", {
			exact: false,
		})
	).toBeVisible();
	await page.getByRole("button", { name: "Cancel" }).click();
	await expectAutomatedA11yClean(page);
	await expectViewportReflow(page);
});

test("Inventory routes preserve URL history, expose context and projection semantics, and reflow", async ({
	page,
}, testInfo) => {
	await signInOperator(
		page,
		"/operations/inventory/balances?cursor=stale-cursor&cursorTrail=older-cursor"
	);
	await expect(
		page.getByRole("heading", { name: "Inventory balances" })
	).toBeVisible();
	await expect(page.getByText("Projection", { exact: true })).toBeVisible();
	await expect(
		page.getByText("Current authority rechecked on commands", { exact: true })
	).toBeVisible();
	await expect(page.getByLabel("Organization")).toHaveValue(
		"organization_ws2_browser_0001"
	);
	await page
		.getByLabel("Location", { exact: true })
		.last()
		.selectOption(LOCATION_ID);
	await page
		.getByLabel("Exact Product ID (optional)")
		.fill("product-filter-proof");
	await page.getByRole("button", { name: "Load projection" }).click();
	await expect
		.poll(() => {
			const url = new URL(page.url());
			return {
				cursor: url.searchParams.get("cursor"),
				cursorTrail: url.searchParams.get("cursorTrail"),
				locationId: url.searchParams.get("locationId"),
				productId: url.searchParams.get("productId"),
			};
		})
		.toEqual({
			cursor: null,
			cursorTrail: null,
			locationId: LOCATION_ID,
			productId: "product-filter-proof",
		});
	await page.goBack();
	await expect(page).toHaveURL(STALE_CURSOR_URL);
	await page.goForward();
	await expect(page).not.toHaveURL(CURSOR_TRAIL_URL);
	await expectAutomatedA11yClean(page);

	await page.goto("/operations/inventory/adjustments");
	await expect(
		page.getByRole("heading", { name: "Inventory Adjustments" })
	).toBeVisible();
	await expect(
		page.getByText("Organization scope", { exact: true })
	).toBeVisible();
	await expectAutomatedA11yClean(page);

	await page.goto("/operations/inventory/transfers");
	await expect(
		page.getByRole("heading", { name: "Stock transfers" })
	).toBeVisible();
	await expect(
		page.getByRole("navigation", { name: "Operations" })
	).toBeVisible();
	if (testInfo.project.name.includes("mobile")) {
		await expect(page.getByLabel("Operations section")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Open navigation" })
		).toBeVisible();
	} else {
		await expect(
			page.getByRole("navigation", { name: "Operations" }).getByRole("link", {
				name: "Inventory",
			})
		).toHaveAttribute("aria-current", "page");
	}
	await expectAutomatedA11yClean(page);
	await expectViewportReflow(page);
});

test("a permission-limited operator receives a distinct non-disclosing denial state", async ({
	page,
}) => {
	await signIn(page, {
		email: RESTRICTED_FIXTURE_EMAIL,
		password: RESTRICTED_FIXTURE_PASSWORD,
		returnTo: `/operations/inventory/balances?locationId=${LOCATION_ID}`,
	});
	await expect(
		page.getByRole("heading", { name: "Inventory balances" })
	).toBeVisible();
	await expect(
		page.getByText("Permission denied", { exact: true })
	).toBeVisible();
	await expect(
		page.getByText(
			"Your current role and scope do not permit this operation.",
			{
				exact: true,
			}
		)
	).toBeVisible();
	await expect(page.getByText(INVENTORY_PERMISSION_DETAIL)).not.toBeVisible();
	await expectAutomatedA11yClean(page);
	await expectViewportReflow(page);
});
