import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	fullyParallel: true,
	outputDir: "test-results",
	projects: [
		{
			name: "chromium-desktop",
			use: { ...devices["Desktop Chrome"] },
		},
		{
			name: "chromium-mobile",
			use: { ...devices["Pixel 7"] },
		},
	],
	reporter: [
		["line"],
		["html", { open: "never", outputFolder: "playwright-report" }],
	],
	retries: 0,
	testDir: "./e2e",
	timeout: 30_000,
	use: {
		baseURL: "http://127.0.0.1:3001",
		screenshot: "only-on-failure",
		trace: "retain-on-failure",
		video: "retain-on-failure",
	},
	workers: 2,
});
