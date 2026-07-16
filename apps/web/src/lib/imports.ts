import type {
	ImportCorrectionReport,
	ImportJob,
} from "@meridian/contracts-platform-api";
import type { Route } from "next";

import { safeDownloadName } from "./operations";

export const IMPORT_MAX_BYTES = 1_048_576;

export const IMPORT_STATES = [
	"Uploaded",
	"Validating",
	"ReadyForApproval",
	"Approved",
	"Committing",
	"Completed",
	"Failed",
	"Cancelled",
] as const satisfies readonly ImportJob["state"][];

export type ImportState = (typeof IMPORT_STATES)[number];
export type ImportTarget = "opening-stock" | "product";

const IMPORT_STATE_SET = new Set<string>(IMPORT_STATES);

export function parseImportState(
	value: string | null
): ImportState | undefined {
	return value && IMPORT_STATE_SET.has(value)
		? (value as ImportState)
		: undefined;
}

export function parseImportTarget(value: string | null): ImportTarget {
	return value === "opening-stock" ? "opening-stock" : "product";
}

export function importTargetLabel(target: ImportTarget): string {
	return target === "product" ? "Product" : "Opening stock";
}

export function importDetailHref(
	target: ImportTarget,
	importId: string,
	returnTo?: string
): Route {
	const base = `/operations/imports/${target}/${encodeURIComponent(importId)}`;
	return (
		returnTo ? `${base}?returnTo=${encodeURIComponent(returnTo)}` : base
	) as Route;
}

export function canApproveImport(job: ImportJob): boolean {
	return job.state === "ReadyForApproval";
}

export function canCancelImport(job: ImportJob): boolean {
	return job.state === "ReadyForApproval";
}

export function canAcceptImport(job: ImportJob): boolean {
	return job.state === "Completed" && job.reconciliationState === "Reconciled";
}

export function isTerminalImport(job: ImportJob): boolean {
	return ["Cancelled", "Completed", "Failed"].includes(job.state);
}

export async function sha256Hex(content: string): Promise<string> {
	const bytes = new TextEncoder().encode(content);
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(digest), (value) =>
		value.toString(16).padStart(2, "0")
	).join("");
}

export async function readCsvUpload(
	file: Blob,
	fileName: string
): Promise<{ content: string; fileName: string; sha256: string }> {
	if (file.size === 0) {
		throw new Error("Choose a non-empty CSV file.");
	}
	if (file.size > IMPORT_MAX_BYTES) {
		throw new Error("CSV files must be 1 MiB or smaller.");
	}
	const bytes = new Uint8Array(await file.arrayBuffer());
	let content: string;
	try {
		content = new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true,
		}).decode(bytes);
	} catch (error) {
		throw new Error("The CSV file must contain valid UTF-8 text.", {
			cause: error,
		});
	}
	if (!content || content.length > IMPORT_MAX_BYTES) {
		throw new Error("CSV files must contain 1 MiB or less of UTF-8 text.");
	}
	const normalizedName = fileName.trim();
	if (!normalizedName || normalizedName.length > 200) {
		throw new Error("The CSV file name must be between 1 and 200 characters.");
	}
	return {
		content,
		fileName: normalizedName,
		sha256: await sha256Hex(content),
	};
}

export interface DownloadEnvironment {
	createObjectUrl: (blob: Blob) => string;
	revokeObjectUrl: (url: string) => void;
	trigger: (url: string, fileName: string) => void;
}

function browserDownloadEnvironment(): DownloadEnvironment {
	return {
		createObjectUrl: (blob) => URL.createObjectURL(blob),
		revokeObjectUrl: (url) => URL.revokeObjectURL(url),
		trigger: (url, fileName) => {
			const anchor = document.createElement("a");
			anchor.download = fileName;
			anchor.href = url;
			anchor.click();
		},
	};
}

export function downloadCorrectionReport(
	report: ImportCorrectionReport,
	environment = browserDownloadEnvironment()
): void {
	const blob = new Blob([report.content], { type: report.contentType });
	const objectUrl = environment.createObjectUrl(blob);
	try {
		environment.trigger(objectUrl, safeDownloadName(report.fileName));
	} finally {
		environment.revokeObjectUrl(objectUrl);
	}
}
