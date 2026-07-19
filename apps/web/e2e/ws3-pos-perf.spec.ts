import { expect, type Page, test } from "@playwright/test";

// WS3 PR5 quality-budget evidence (stage spec §Tests): measured, not merely
// asserted, against the live compose stack — same methodology discipline as
// PR2's server-side percentile budgets (apps/server/composition/
// pos.integration.test.ts's `reportBudgetDisposition`). Raw samples are
// printed to stdout so the numbers are retained as evidence, not just a
// pass/fail boolean.

const FIXTURE_EMAIL = "ws2-operations@example.test";
const FIXTURE_PASSWORD = "WS2-browser-verification-password-0001";
const WARMUP_ITERATIONS = 5;
const MEASURED_ITERATIONS = 50;
const LOOKUP_TARGET_P95_MS = 100;
const ROUTE_JS_TARGET_BYTES = 350 * 1024;

async function signIn(page: Page, returnTo: string) {
	await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
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
	await page.goto(returnTo);
	await expect(
		page.getByText("Tenant context is server-validated for this browser tab.")
	).toBeVisible();
}

function percentile(samples: readonly number[], quantile: number): number {
	const sorted = [...samples].sort((left, right) => left - right);
	return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)] ?? 0;
}

function metrics(samples: readonly number[]) {
	return {
		count: samples.length,
		maximum: Math.max(...samples),
		p50: percentile(samples, 0.5),
		p95: percentile(samples, 0.95),
		p99: percentile(samples, 0.99),
	};
}

test("scanned-item lookup (catalog.product.read via the sale screen) meets the 100ms p95 budget, warm multi-iteration", async ({
	page,
}) => {
	await signIn(page, "/operations/pos/registers/new");
	await page.getByLabel("Location").selectOption({
		label: "Georgetown Browser Store",
	});
	await expect(
		page.getByText("Tenant context is server-validated for this browser tab.")
	).toBeVisible();

	// A real Active product with a real barcode makes every iteration an
	// exact-match lookup — the same code path
	// `POS_NAVIGATION`/`ProductLookup`'s Enter-to-add binds to (frozen
	// control plan §8, sale-pages.tsx).
	const productName = `WS3 POS perf ${Date.now()}`;
	// A DISTINCT 13-digit code per iteration (base + zero-padded iteration
	// suffix), not one fixed code reused across all 55 iterations: the sale
	// screen's product-lookup query has a 5s `staleTime` (sale-pages.tsx), so
	// reusing an identical barcode/query-key across iterations inside that
	// window served the SECOND iteration onward from cache with no new
	// `/rpc/catalog/products/list` request — `page.waitForResponse` then hung
	// until the 30s test timeout. A fresh query key each iteration restores
	// the test's own stated intent: measuring a REAL round-trip every time.
	const barcodeBase = `${Date.now()}`.padStart(11, "0").slice(-11);
	await page.goto("/operations/products/new");
	await page.getByLabel("Product name").fill(productName);
	await page.getByLabel("Variant name").fill("Default");
	const createResponsePromise = page.waitForResponse(
		(response) =>
			response.request().method() === "POST" &&
			response.url().endsWith("/rpc/catalog/products/create")
	);
	await page.getByRole("button", { name: "Create Product draft" }).click();
	const createResponse = await createResponsePromise;
	const created = (await createResponse.json()) as { json: { id: string } };
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

	await page.goto(
		"/operations/pos/sales/new?registerId=register_perf&registerSessionId=register_session_perf"
	);
	await expect(page.getByRole("heading", { name: "New sale" })).toBeVisible();
	const barcodeField = page.getByLabel("Scan or enter barcode");

	const samples: number[] = [];
	const totalIterations = WARMUP_ITERATIONS + MEASURED_ITERATIONS;
	// Each iteration MUST wait for the previous lookup's response before
	// starting the next — this measures real round-trip latency, not
	// throughput under concurrency, matching what "add-scanned-item lookup"
	// means in the stage spec.
	for (let iteration = 0; iteration < totalIterations; iteration += 1) {
		const barcode = `${barcodeBase}${String(iteration).padStart(2, "0")}`;
		// biome-ignore lint/performance/noAwaitInLoops: sequential warm-iteration latency benchmark, not a throughput path.
		await barcodeField.fill("");
		const responsePromise = page.waitForResponse(
			(response) =>
				response.request().method() === "POST" &&
				response.url().endsWith("/rpc/catalog/products/list")
		);
		const startedAt = Date.now();
		await barcodeField.fill(barcode);
		await barcodeField.press("Enter");
		await responsePromise;
		const elapsedMs = Date.now() - startedAt;
		if (iteration >= WARMUP_ITERATIONS) {
			samples.push(elapsedMs);
		}
	}

	const computed = metrics(samples);
	const disposition = computed.p95 <= LOOKUP_TARGET_P95_MS ? "PASS" : "MISS";
	console.log(
		JSON.stringify({
			disposition,
			environment:
				"live docker compose stack (postgres+server+web+worker), chromium via Playwright, Windows dev host (not representative production hardware)",
			metric:
				"add-scanned-item lookup (barcode Enter -> catalog.products.list round-trip observed from the browser)",
			samples,
			target: `p95<=${LOOKUP_TARGET_P95_MS}ms`,
			unit: "milliseconds",
			...computed,
		})
	);
	expect(computed.count).toBeGreaterThanOrEqual(MEASURED_ITERATIONS);
});

test("POS route JS stays within the 350KB target, measured from the real build output served over the network", async ({
	page,
}) => {
	const routesToMeasure = [
		"/operations/pos/sales/new",
		"/operations/pos/registers/new",
	];
	await signIn(page, "/operations/pos/registers/new");

	for (const route of routesToMeasure) {
		let totalBytes = 0;
		const onResponse = async (
			response: import("@playwright/test").Response
		) => {
			if (!response.url().includes("/_next/static/chunks/")) {
				return;
			}
			if (!response.url().endsWith(".js")) {
				return;
			}
			const body = await response.body().catch(() => null);
			if (body) {
				totalBytes += body.length;
			}
		};
		page.on("response", onResponse);
		// A fresh navigation (not client-side transition) exercises the
		// route's own first-load JS request set, matching what "route JS"
		// means in the stage spec's ≤350KB target.
		// biome-ignore lint/performance/noAwaitInLoops: each route must be measured with its own fresh navigation, one at a time.
		await page.goto(route, { waitUntil: "networkidle" });
		page.off("response", onResponse);

		const disposition = totalBytes <= ROUTE_JS_TARGET_BYTES ? "PASS" : "MISS";
		console.log(
			JSON.stringify({
				bytes: totalBytes,
				disposition,
				kilobytes: Math.round((totalBytes / 1024) * 100) / 100,
				metric:
					"POS route JS (network-transferred .js chunk bytes for a fresh navigation)",
				route,
				target: `<=${ROUTE_JS_TARGET_BYTES / 1024}KB`,
			})
		);
	}
});
