import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// WS3 remediation R3b, Item 12 (partial — light-mode "action" contrast
// remeasurement).
//
// A second independent review reported the light-mode primary/action
// button (`bg-primary` / `text-primary-foreground`) at approximately
// 4.34:1 — below WCAG AA's 4.5:1 normal-text minimum. This was
// remeasured directly in a live Chromium instance (canvas-rendered
// sRGB pixel extraction of the ACTUAL computed styles after a real
// `next-themes` light-mode reload, not an estimate): the prior value
// (oklch L 0.56) measured 4.567:1 — a real but narrow pass, close
// enough to the reported figure that a different measurement method
// (axe-core's anti-aliased-edge pixel sampling plausibly explains the
// ~4.34 figure) could land on either side of the threshold. The fix
// darkened ONLY the lightness channel (L 0.56 -> 0.52, same hue/chroma,
// staying within the governed Blue theme per
// SHADCN_CONFIGURATION_DECISION_MATRIX.md) to a real margin above AA.
//
// This test is a SECOND, independent verification method (pure OKLCH
// colorimetric math, executable in CI with no browser) that
// cross-checks the live-Chromium numbers above: it parses the ACTUAL
// oklch() values out of the real globals.css source (not hand-copied)
// and computes the WCAG contrast ratio directly from OKLab-derived
// linear-light RGB, per the CSS Color 4 / Björn Ottosson reference
// conversion.

function oklchToLinearSrgb(l: number, c: number, hDeg: number) {
	const hRad = (hDeg * Math.PI) / 180;
	const a = c * Math.cos(hRad);
	const b = c * Math.sin(hRad);

	const lPrime = l + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
	const mPrime = l - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
	const sPrime = l - 0.089_484_177_5 * a - 1.291_485_548 * b;

	const lCubed = lPrime ** 3;
	const mCubed = mPrime ** 3;
	const sCubed = sPrime ** 3;

	return {
		b:
			-0.004_196_086_3 * lCubed -
			0.703_418_614_7 * mCubed +
			1.707_614_701 * sCubed,
		g:
			-1.268_438_004_6 * lCubed +
			2.609_757_401_1 * mCubed -
			0.341_319_396_5 * sCubed,
		r:
			4.076_741_662_1 * lCubed -
			3.307_711_591_3 * mCubed +
			0.230_969_929_2 * sCubed,
	};
}

/** WCAG relative luminance from LINEAR-light RGB (0-1) — no gamma
 * re-encoding needed, since `oklchToLinearSrgb` already returns
 * linear-light values, which is exactly what the WCAG formula expects. */
function relativeLuminance(linear: {
	b: number;
	g: number;
	r: number;
}): number {
	const clamp = (v: number) => Math.max(0, Math.min(1, v));
	return (
		0.2126 * clamp(linear.r) +
		0.7152 * clamp(linear.g) +
		0.0722 * clamp(linear.b)
	);
}

function contrastRatio(
	a: { b: number; g: number; r: number },
	bColor: { b: number; g: number; r: number }
): number {
	const lumA = relativeLuminance(a);
	const lumB = relativeLuminance(bColor);
	const lighter = Math.max(lumA, lumB);
	const darker = Math.min(lumA, lumB);
	return (lighter + 0.05) / (darker + 0.05);
}

function oklchContrast(
	oklchA: [number, number, number],
	oklchB: [number, number, number]
): number {
	return contrastRatio(
		oklchToLinearSrgb(...oklchA),
		oklchToLinearSrgb(...oklchB)
	);
}

const ROOT_BLOCK_PATTERN = /:root\s*\{([\s\S]*?)\}/;
const OKLCH_TOKEN_PATTERN =
	/--([a-z-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/g;

function parseRootOklchTokens(
	source: string
): Record<string, [number, number, number]> {
	const rootMatch = source.match(ROOT_BLOCK_PATTERN);
	expect(rootMatch).not.toBeNull();
	const body = rootMatch?.[1] ?? "";
	const tokens: Record<string, [number, number, number]> = {};
	for (const match of body.matchAll(OKLCH_TOKEN_PATTERN)) {
		const [, name, l, c, h] = match;
		tokens[name] = [
			Number.parseFloat(l),
			Number.parseFloat(c),
			Number.parseFloat(h),
		];
	}
	return tokens;
}

describe("light-mode primary/action contrast (WS3 remediation R3b, Item 12)", () => {
	test("sanity check: pure-white-on-black and identical colors hit the expected extremes", () => {
		expect(oklchContrast([1, 0, 0], [0, 0, 0])).toBeCloseTo(21, 0);
		expect(oklchContrast([0.5, 0.1, 200], [0.5, 0.1, 200])).toBeCloseTo(1, 1);
	});

	test("pre-fix reproduction: the PRIOR light-mode primary lightness (0.56) measured a narrow, boundary-adjacent AA pass", () => {
		// The exact prior token value, before this fix — not hand-picked.
		const priorPrimary: [number, number, number] = [0.56, 0.19, 258];
		const primaryForeground: [number, number, number] = [0.985, 0, 0];
		const ratio = oklchContrast(priorPrimary, primaryForeground);
		expect(ratio).toBeGreaterThanOrEqual(4.5);
		// Close enough to the AA line that a stricter/different measurement
		// method landing just under 4.5 (as the original review's did, at
		// ~4.34) is plausible — this is the exact boundary-adjacency this
		// fix removes.
		expect(ratio).toBeLessThan(4.7);
	});

	test("post-fix: the actual current globals.css light-mode primary/primary-foreground pair clears AA with real margin", () => {
		const source = readFileSync(
			fileURLToPath(
				new URL(
					"../../../../packages/ui-web/core/src/styles/globals.css",
					import.meta.url
				)
			),
			"utf-8"
		);
		const tokens = parseRootOklchTokens(source);
		expect(tokens.primary).toBeDefined();
		expect(tokens["primary-foreground"]).toBeDefined();

		const ratio = oklchContrast(tokens.primary, tokens["primary-foreground"]);
		expect(ratio).toBeGreaterThanOrEqual(5);

		// Same hue and chroma as before — only lightness changed. A
		// regression here (someone re-theming primary) is exactly what this
		// assertion is meant to catch.
		expect(tokens.primary[1]).toBeCloseTo(0.19, 5);
		expect(tokens.primary[2]).toBeCloseTo(258, 5);
	});
});
