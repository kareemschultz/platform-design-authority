import { describe, expect, test } from "bun:test";

import {
	canAcceptImport,
	canApproveImport,
	canCancelImport,
	downloadCorrectionReport,
	IMPORT_MAX_BYTES,
	importDetailHref,
	parseImportState,
	parseImportTarget,
	readCsvUpload,
	sha256Hex,
} from "./imports";

const completedJob = {
	reconciliationState: "Reconciled",
	state: "Completed",
} as Parameters<typeof canAcceptImport>[0];

describe("import client boundaries", () => {
	test("accepts only governed URL filter values", () => {
		expect(parseImportTarget("opening-stock")).toBe("opening-stock");
		expect(parseImportTarget("unknown")).toBe("product");
		expect(parseImportState("ReadyForApproval")).toBe("ReadyForApproval");
		expect(parseImportState("ready")).toBeUndefined();
	});

	test("builds encoded target-specific detail routes", () => {
		expect(
			importDetailHref(
				"opening-stock",
				"import/123",
				"/operations/imports?state=Completed"
			)
		).toBe(
			"/operations/imports/opening-stock/import%2F123?returnTo=%2Foperations%2Fimports%3Fstate%3DCompleted"
		);
	});

	test("keeps lifecycle affordances narrower than server authority", () => {
		expect(
			canApproveImport({ state: "ReadyForApproval" } as Parameters<
				typeof canApproveImport
			>[0])
		).toBe(true);
		expect(
			canCancelImport({ state: "Validating" } as Parameters<
				typeof canCancelImport
			>[0])
		).toBe(false);
		expect(canAcceptImport(completedJob)).toBe(true);
		expect(
			canAcceptImport({
				...completedJob,
				reconciliationState: "Mismatch",
			})
		).toBe(false);
	});

	test("computes SHA-256 with Web Crypto", async () => {
		expect(await sha256Hex("abc")).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
		);
	});

	test("reads valid UTF-8 without parsing or normalizing CSV content", async () => {
		const content = "sku,name\r\nA-1,Plantain\r\n";
		const upload = await readCsvUpload(
			new Blob([content], { type: "text/csv" }),
			"products.csv"
		);
		expect(upload.content).toBe(content);
		expect(upload.fileName).toBe("products.csv");
		expect(upload.sha256).toBe(await sha256Hex(content));
	});

	test("rejects oversized and invalid UTF-8 files before submission", async () => {
		await expect(
			readCsvUpload(
				new Blob([new Uint8Array(IMPORT_MAX_BYTES + 1)]),
				"large.csv"
			)
		).rejects.toThrow("1 MiB or smaller");
		await expect(
			readCsvUpload(new Blob([new Uint8Array([0xc3, 0x28])]), "invalid.csv")
		).rejects.toThrow("valid UTF-8");
	});

	test("creates an ephemeral correction-report URL and always revokes it", async () => {
		let capturedBlob: Blob | undefined;
		let triggered: [string, string] | undefined;
		const revoked: string[] = [];
		downloadCorrectionReport(
			{
				content: "row,error\n2,missing sku\n",
				contentDisposition: "attachment",
				contentType: "text/csv",
				fileName: "../correction report.csv",
				schemaVersion: "1.0.0",
				sha256: "a".repeat(64),
			},
			{
				createObjectUrl(blob) {
					capturedBlob = blob;
					return "blob:report";
				},
				revokeObjectUrl(url) {
					revoked.push(url);
				},
				trigger(url, fileName) {
					triggered = [url, fileName];
				},
			}
		);
		expect(triggered).toEqual(["blob:report", "..-correction-report.csv"]);
		expect(capturedBlob?.type).toBe("text/csv");
		expect(await capturedBlob?.text()).toBe("row,error\n2,missing sku\n");
		expect(revoked).toEqual(["blob:report"]);

		expect(() =>
			downloadCorrectionReport(
				{
					content: "x",
					contentDisposition: "attachment",
					contentType: "text/csv",
					fileName: "report.csv",
					schemaVersion: "1.0.0",
					sha256: "b".repeat(64),
				},
				{
					createObjectUrl: () => "blob:failed",
					revokeObjectUrl: (url) => revoked.push(url),
					trigger: () => {
						throw new Error("blocked");
					},
				}
			)
		).toThrow("blocked");
		expect(revoked).toContain("blob:failed");
	});
});
