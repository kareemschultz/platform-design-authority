import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const OPERATIONS_LOGIN_URL = /\/login\?returnTo=(?:%2F|\/)operations$/u;

test("login is keyboard-operable, reflows, and has no automated WCAG A/AA violations", async ({
	page,
}) => {
	await page.goto("/login");
	await expect(
		page.getByRole("heading", { name: "Welcome Back" })
	).toBeVisible();
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("link", { name: "Skip to main content" })
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("#main-content")).toBeFocused();

	const viewportFits = await page.evaluate(
		() =>
			document.documentElement.scrollWidth <=
			document.documentElement.clientWidth
	);
	expect(viewportFits).toBe(true);

	const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
	expect(results.violations).toEqual([]);
});

test("protected Operations navigation returns to a bounded sign-in target", async ({
	page,
}) => {
	await page.goto("/operations");
	await expect(page).toHaveURL(OPERATIONS_LOGIN_URL);
	await expect(page.getByLabel("Email")).toBeVisible();
	await expect(page.getByLabel("Password")).toBeVisible();
	await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
});

test("the route-level loading state is an accessible status region with no WCAG A/AA violations (fifth-audit F-H-002, second-review closure)", async ({
	page,
}) => {
	// Delay every navigation request so the app/loading.tsx Suspense fallback
	// (the shared Loader) stays mounted long enough to assert against; without
	// this the RSC fetch typically resolves before Playwright can observe it.
	await page.route("**/*", async (route) => {
		if (route.request().resourceType() === "document") {
			await new Promise((resolve) => setTimeout(resolve, 1500));
		}
		await route.continue();
	});

	const navigation = page.goto("/login");
	const status = page.getByRole("status", { name: "Loading page" });
	await expect(status).toBeVisible();

	const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
	expect(results.violations).toEqual([]);

	await navigation;
});

test("multiple simultaneous field errors produce unique DOM ids (fifth-audit F-H-005, second-review closure)", async ({
	page,
}) => {
	await page.goto("/login");
	await page.getByRole("button", { name: "Need an account? Sign Up" }).click();
	await expect(
		page.getByRole("heading", { name: "Create Account" })
	).toBeVisible();

	// Submitting entirely empty/invalid values trips all three field
	// validators at once, so each field renders its own error container.
	await page.getByRole("button", { name: "Sign Up" }).click();

	await expect(page.getByText("Invalid email address")).toBeVisible();
	await expect(
		page.getByText("Name must be at least 2 characters")
	).toBeVisible();
	await expect(
		page.getByText("Password must be at least 8 characters")
	).toBeVisible();

	const idCounts = await page.evaluate(() => {
		const ids = Array.from(
			document.querySelectorAll('#sign-up-form [role="alert"][id]')
		).map((element) => element.id);
		const counts = new Map<string, number>();
		for (const id of ids) {
			counts.set(id, (counts.get(id) ?? 0) + 1);
		}
		return { duplicates: [...counts.entries()].filter(([, n]) => n > 1), ids };
	});

	expect(idCounts.ids.length).toBeGreaterThanOrEqual(3);
	expect(idCounts.duplicates).toEqual([]);
});
