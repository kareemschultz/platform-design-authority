import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// WS3 remediation R3b, Item 12 (partial — touch targets).
//
// Pre-fix behavior (proven below, not assumed): the platform Button
// component's default size is `h-8` (32px) — confirmed directly against
// `packages/ui-web/core/src/components/button.tsx`'s own `cva` size
// map, not assumed from memory. None of the buttons this test checks
// declared an explicit height override before this fix, so each
// rendered at that 32px default (the "Add" button was smaller still,
// `size="sm"` = `h-7`/28px). This test scans the REAL current source of
// each fixed file and asserts the specific named button's JSX block now
// carries the governed 48px (`min-h-12`) override — a source-level check
// (matching this stage's own "route metadata audit" precedent) rather
// than a full component render, since these components need live
// TanStack Query/workspace context to mount.

const DEFAULT_SIZE_IS_H8_PATTERN = /default:\s*"h-8\b/;

function readSource(relativePath: string): string {
	return readFileSync(
		fileURLToPath(new URL(relativePath, import.meta.url)),
		"utf-8"
	);
}

/** Extracts the FULL JSX element (`<Button ... >...</Button>`) whose
 * opening tag is the nearest `<Button` BEFORE the given anchor text and
 * whose closing tag is the nearest `</Button>` AFTER it — a real proxy
 * for "this specific button's own props include min-h-12", anchored on
 * text guaranteed to be inside that exact button (a doc comment or its
 * label), not a regex over the whole file that could match an unrelated
 * button elsewhere. */
function buttonElementAroundAnchor(source: string, anchor: string): string {
	const anchorIndex = source.indexOf(anchor);
	expect(anchorIndex).toBeGreaterThan(-1);
	const buttonStart = source.lastIndexOf("<Button", anchorIndex);
	expect(buttonStart).toBeGreaterThan(-1);
	const closeIndex = source.indexOf("</Button>", anchorIndex);
	expect(closeIndex).toBeGreaterThan(-1);
	return source.slice(buttonStart, closeIndex);
}

describe("48px touch-target density on frequent POS controls (WS3 remediation R3b, Item 12)", () => {
	test("Button's default size is 32px (h-8), confirmed directly against the shared component, not assumed", () => {
		const buttonSource = readSource(
			"../../../../packages/ui-web/core/src/components/button.tsx"
		);
		expect(DEFAULT_SIZE_IS_H8_PATTERN.test(buttonSource)).toBe(true);
	});

	test("the scan/add-to-cart button (sale-pages.tsx) carries the 48px density", () => {
		const source = readSource("./sale-pages.tsx");
		// Anchored on the button's own doc comment, not a label string that
		// (via the aria-live scan-announcement text built from the SAME
		// template) also appears earlier in the file outside this button.
		const block = buttonElementAroundAnchor(
			source,
			"highest-frequency control on the whole POS"
		);
		expect(block).toContain("min-h-12");
	});

	test("the Create sale button carries the 48px density", () => {
		const source = readSource("./sale-pages.tsx");
		const block = buttonElementAroundAnchor(
			source,
			'{create.isPending ? "Creating sale…" : "Create sale"}'
		);
		expect(block).toContain("min-h-12");
	});

	test("the Complete sale (tender) button carries the 48px density", () => {
		const source = readSource("./sale-pages.tsx");
		const block = buttonElementAroundAnchor(
			source,
			'{complete.isPending ? "Completing…" : "Complete sale"}'
		);
		expect(block).toContain("min-h-12");
	});

	test("the standalone Approve override button carries the 48px density", () => {
		const source = readSource("./sale-pages.tsx");
		const block = buttonElementAroundAnchor(
			source,
			'{approve.isPending ? "Approving…" : "Approve override"}'
		);
		expect(block).toContain("min-h-12");
	});

	test("the shared ConsequencePreviewDialog's Cancel and Confirm controls (close-register/refund-approve/deposit-confirm/return-approve/variance-approve/receipt-void all share this ONE dialog) carry the 48px density", () => {
		const source = readSource("./consequence-preview-dialog.tsx");
		expect(source).toContain('<AlertDialogCancel className="min-h-12"');
		const confirmBlock = buttonElementAroundAnchor(
			source,
			"{confirmButtonLabel}"
		);
		expect(confirmBlock).toContain("min-h-12");
	});

	test("every 'Review & approve/close/confirm/void ...' trigger button that opens the shared dialog carries the 48px density", () => {
		const cases: Array<{ file: string; label: string }> = [
			{ file: "./returns-pages.tsx", label: "Review &amp; approve return" },
			{ file: "./refund-pages.tsx", label: "Review &amp; approve refund" },
			{
				file: "./register-pages.tsx",
				label: "Review &amp; approve variance",
			},
			{ file: "./register-pages.tsx", label: "Review &amp; close register" },
			{ file: "./deposit-pages.tsx", label: "Review &amp; confirm deposit" },
			{ file: "./receipt-pages.tsx", label: "Review &amp; void receipt" },
		];
		for (const { file, label } of cases) {
			const source = readSource(file);
			const block = buttonElementAroundAnchor(source, label);
			expect(block).toContain("min-h-12");
		}
	});
});
