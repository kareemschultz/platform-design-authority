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
