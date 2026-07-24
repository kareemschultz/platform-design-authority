/// <reference types="bun" />
// Package tsconfig sets `types: []` to keep runtime source ADR-0020
// runtime-neutral (no ambient Bun/Node globals); this test-only file pulls
// in bun:test's ambient types for itself alone via the triple-slash
// reference instead of widening the package-wide `types` array.
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";

const TABLE_HEAD_CLASS_PATTERN = /<th class="([^"]*)"/;
const TABLE_CELL_CLASS_PATTERN = /<td class="([^"]*)"/;

function renderTable(density?: "comfortable" | "compact" | "touch") {
	return renderToStaticMarkup(
		<Table density={density}>
			<TableHeader>
				<TableRow>
					<TableHead>Label</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>Value</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	);
}

describe("Table density (issue 216, Codex-review coverage gap)", () => {
	test("defaults to comfortable (44px, h-11) when no density prop is given", () => {
		const markup = renderTable();

		expect(markup).toContain("h-11");
		expect(markup).not.toContain("2.125rem");
		expect(markup).not.toContain("3.25rem");
	});

	test("compact renders the 34px row height on both head and cell", () => {
		const markup = renderTable("compact");

		const headMatches = markup.match(TABLE_HEAD_CLASS_PATTERN);
		const cellMatches = markup.match(TABLE_CELL_CLASS_PATTERN);

		expect(headMatches?.[1]).toContain("2.125rem");
		expect(cellMatches?.[1]).toContain("2.125rem");
	});

	test("touch renders the 52px row height on both head and cell", () => {
		const markup = renderTable("touch");

		const headMatches = markup.match(TABLE_HEAD_CLASS_PATTERN);
		const cellMatches = markup.match(TABLE_CELL_CLASS_PATTERN);

		expect(headMatches?.[1]).toContain("3.25rem");
		expect(cellMatches?.[1]).toContain("3.25rem");
	});

	test("comfortable renders the same h-11 height on both head and cell (no head/cell drift)", () => {
		const markup = renderTable("comfortable");

		const headMatches = markup.match(TABLE_HEAD_CLASS_PATTERN);
		const cellMatches = markup.match(TABLE_CELL_CLASS_PATTERN);

		expect(headMatches?.[1]).toContain("h-11");
		expect(cellMatches?.[1]).toContain("h-11");
	});
});
