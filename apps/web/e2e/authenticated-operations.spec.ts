import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const FIXTURE_EMAIL = "ws2-operations@example.test";
const FIXTURE_PASSWORD = "WS2-browser-verification-password-0001";
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("an authenticated operator creates and reads a tenant-scoped Product", async ({
	page,
}, testInfo) => {
	await page.goto("/login?returnTo=/operations/products");
	await page.getByLabel("Email").fill(FIXTURE_EMAIL);
	await page.getByLabel("Password").fill(FIXTURE_PASSWORD);
	const signInResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/api/auth/sign-in/email")
	);
	await page.getByRole("button", { name: "Sign In" }).click();
	const signInResponse = await signInResponsePromise;
	expect(signInResponse.ok()).toBe(true);

	// Navigate explicitly after the auth response so the server-rendered layout
	// verifies the newly issued cookie instead of relying on client cache timing.
	await page.goto("/operations/products");
	await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
	await page.getByRole("link", { name: "Create Product" }).click();

	await expect(
		page.getByRole("heading", { name: "Create Product" })
	).toBeVisible();
	await expect(
		page.getByText("Tenant context is server-validated for this browser tab.")
	).toBeVisible();
	await expect(page.getByLabel("Organization")).toHaveValue(
		"organization_ws2_browser_0001"
	);

	const commandSuffix = crypto.randomUUID().slice(0, 8);
	const productName = `Browser Product ${testInfo.project.name} ${commandSuffix}`;
	await page.getByLabel("Product name").fill(productName);
	await page.getByLabel("Variant name").fill("Default");
	await page
		.getByLabel("Tenant SKU (optional)")
		.fill(`BROWSER-${testInfo.project.name.toUpperCase()}-${commandSuffix}`);
	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/create")
	);
	await page.getByRole("button", { name: "Create Product draft" }).click();
	const createResponse = await createResponsePromise;
	expect(createResponse.ok()).toBe(true);
	const created = (await createResponse.json()) as {
		json: { id: string; name: string };
	};
	expect(created.json.name).toBe(productName);

	await page.goto(
		`/operations/products/${encodeURIComponent(created.json.id)}`
	);
	await expect(page.getByRole("heading", { name: productName })).toBeVisible();
	await expect(page.getByText("Draft", { exact: true })).toBeVisible();
	await expect(page.getByText("Version 1", { exact: true })).toBeVisible();

	const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
	expect(results.violations).toEqual([]);

	await page.getByRole("link", { name: "Back to results" }).click();
	await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
	await expect(page.getByRole("link", { name: productName })).toBeVisible();

	const performanceEvidence = await page.evaluate(() => {
		const navigation = performance.getEntriesByType("navigation")[0] as
			| PerformanceNavigationTiming
			| undefined;
		const resources = performance.getEntriesByType(
			"resource"
		) as PerformanceResourceTiming[];
		return {
			domContentLoadedMs: navigation
				? navigation.domContentLoadedEventEnd - navigation.startTime
				: null,
			navigationDurationMs: navigation?.duration ?? null,
			resourceCount: resources.length,
			transferredBytes: resources.reduce(
				(total, resource) => total + resource.transferSize,
				0
			),
		};
	});
	await testInfo.attach("operations-performance.json", {
		body: JSON.stringify(performanceEvidence, null, 2),
		contentType: "application/json",
	});
});
