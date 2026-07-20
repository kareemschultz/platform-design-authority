import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
const { pageDocumentTitle } = await import("./operations-shared");

const METADATA_EXPORT_PATTERN = /export const metadata|generateMetadata/;

function listPageFiles(dir: string): string[] {
	const entries = readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = `${dir}/${entry.name}`;
		if (entry.isDirectory()) {
			files.push(...listPageFiles(full));
		} else if (entry.name === "page.tsx") {
			files.push(full);
		}
	}
	return files;
}

// WS3 remediation R3b, Item 10 (accessible route state — route-specific
// titles).
//
// Pre-fix behavior (proven below, not assumed): scans every `page.tsx`
// under `apps/web/src/app` and confirms none of them declares its own
// route metadata — i.e. every route depended entirely on the root
// layout's single generic `title.template` default, with nothing
// route-specific anywhere. This is a structural, not assumed, proof of
// the gap `OperationsPageFrame`'s `document.title` effect closes.
describe("route metadata audit (WS3 remediation R3b, Item 10)", () => {
	test("pre-fix reproduction: no page.tsx declares route-specific metadata", () => {
		const appDir = fileURLToPath(new URL("../app", import.meta.url));
		const pageFiles = listPageFiles(appDir);
		expect(pageFiles.length).toBeGreaterThan(20);
		const withOwnMetadata = pageFiles.filter((file) =>
			METADATA_EXPORT_PATTERN.test(readFileSync(file, "utf-8"))
		);
		expect(withOwnMetadata).toEqual([]);
	});
});

describe("pageDocumentTitle (WS3 remediation R3b, Item 10)", () => {
	test("post-fix: produces a distinct, route-specific title per page", () => {
		expect(pageDocumentTitle("Sale sale_0000000000000001")).toBe(
			"Sale sale_0000000000000001 | Platform Prototype"
		);
		expect(pageDocumentTitle("Returns")).toBe("Returns | Platform Prototype");
		expect(pageDocumentTitle("Sale sale_0000000000000001")).not.toBe(
			pageDocumentTitle("Returns")
		);
	});
});
