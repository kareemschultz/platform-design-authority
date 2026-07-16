export const CSV_IMPORT_LIMITS = {
	bytes: 1_048_576,
	columns: 100,
	fieldCharacters: 10_000,
	rows: 1000,
} as const;

export type ImportTarget = "Product" | "OpeningStock";
export type ImportState =
	| "Uploaded"
	| "Validating"
	| "ReadyForApproval"
	| "Approved"
	| "Committing"
	| "Completed"
	| "Failed"
	| "Cancelled";

export interface CsvImportManifest {
	decimalSeparator: "." | ",";
	defaultUnit?: string;
	delimiter: "," | ";" | "\t" | "|";
	encoding: "UTF-8";
	locale: string;
	newline: "LF" | "CRLF";
	quote: '"';
	timezone: string;
}

export interface CreateImportRequest {
	actorUserId: string;
	content: string;
	contentType: "text/csv";
	correlationId: string;
	fileName: string;
	idempotencyKey: string;
	manifest: CsvImportManifest;
	organizationId: string;
	sha256: string;
	target: ImportTarget;
	tenantId: string;
}

export interface ImportCounts {
	applied: number;
	failed: number;
	rejected: number;
	skipped: number;
	total: number;
	valid: number;
	warning: number;
}

export interface ImportJobRecord {
	approvedAt: Date | null;
	approvedByUserId: string | null;
	completedAt: Date | null;
	counts: ImportCounts;
	createdAt: Date;
	createdByUserId: string;
	createIdempotencyKey: string;
	failureCode: string | null;
	id: string;
	lastCompletedRow: number;
	manifest: CsvImportManifest;
	organizationId: string;
	requestFingerprint: string;
	scannerResult: "Clean" | "Blocked" | "Unavailable";
	sourceFileName: string;
	sourceSha256: string;
	state: ImportState;
	target: ImportTarget;
	tenantId: string;
	updatedAt: Date;
	version: number;
}

export interface ImportRowRecord {
	id: string;
	importId: string;
	normalizedData: Record<string, string | null>;
	rowFingerprint: string;
	rowNumber: number;
	sourceKey: string;
	state: "Valid" | "Warning" | "Rejected" | "Applied" | "Skipped" | "Failed";
	targetId: string | null;
	tenantId: string;
}

export interface ImportFinding {
	code: string;
	field: string | null;
	id: string;
	importId: string;
	rowId: string;
	rowNumber: number;
	severity: "Info" | "Warning" | "Error";
	sourceKey: string;
	tenantId: string;
}

export interface ImportCommandReceipt {
	importId: string;
	requestFingerprint: string;
}

export interface ImportRepository {
	create: (input: {
		job: ImportJobRecord;
		rows: ImportRowRecord[];
		findings: ImportFinding[];
	}) => Promise<void>;
	findByCreateKey: (
		tenantId: string,
		target: ImportTarget,
		idempotencyKey: string
	) => Promise<ImportJobRecord | null>;
	findCommandReceipt: (input: {
		idempotencyKey: string;
		operation: string;
		tenantId: string;
	}) => Promise<ImportCommandReceipt | null>;
	get: (
		tenantId: string,
		importId: string,
		target: ImportTarget
	) => Promise<ImportJobRecord | null>;
	listFindings: (
		tenantId: string,
		importId: string
	) => Promise<ImportFinding[]>;
	listRows: (tenantId: string, importId: string) => Promise<ImportRowRecord[]>;
	markApproved: (input: {
		approvedAt: Date;
		approvedByUserId: string;
		importId: string;
		tenantId: string;
		version: number;
	}) => Promise<ImportJobRecord | "version_conflict">;
	markCompleted: (input: {
		completedAt: Date;
		importId: string;
		rows: ImportRowRecord[];
		tenantId: string;
		version: number;
	}) => Promise<ImportJobRecord | "version_conflict">;
	markRowApplied: (input: {
		completedAt: Date;
		importId: string;
		rowId: string;
		targetId: string;
		tenantId: string;
	}) => Promise<ImportRowRecord>;
	purgeStaging: (input: {
		importId: string;
		purgedAt: Date;
		tenantId: string;
	}) => Promise<
		{ findings: number; rows: number; waves: number } | "not_found"
	>;
	recordCommandReceipt: (input: {
		createdAt: Date;
		idempotencyKey: string;
		importId: string;
		operation: string;
		requestFingerprint: string;
		tenantId: string;
	}) => Promise<void>;
}

export interface ImportTargetPort {
	commit: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		createdByUserId: string;
		idempotencyKey: string;
		organizationId: string;
		row: ImportRowRecord;
		sessionId: string;
		tenantId: string;
	}) => Promise<{ targetId: string }>;
}

export interface ImportTransactionScope {
	events: {
		append: (
			event: Record<string, unknown>
		) => Promise<"inserted" | "duplicate">;
	};
	repository: ImportRepository;
}

export interface ImportUnitOfWork {
	execute: <TResult>(
		operation: (scope: ImportTransactionScope) => Promise<TResult>
	) => Promise<TResult>;
}

export interface ImportIdFactory {
	create: (kind: "finding" | "import" | "row" | "event") => string;
}

export class ImportError extends Error {
	readonly code:
		| "blocked_content"
		| "dependency_unavailable"
		| "hash_mismatch"
		| "idempotency_conflict"
		| "invalid_csv"
		| "invalid_state"
		| "not_found"
		| "segregation_of_duties"
		| "version_conflict";

	constructor(
		code:
			| "blocked_content"
			| "dependency_unavailable"
			| "hash_mismatch"
			| "idempotency_conflict"
			| "invalid_csv"
			| "invalid_state"
			| "not_found"
			| "segregation_of_duties"
			| "version_conflict",
		message: string
	) {
		super(message);
		this.code = code;
	}
}

const PRODUCT_HEADERS = [
	"source_key",
	"name",
	"variant_name",
	"sku",
	"barcode",
	"barcode_scheme",
];
const OPENING_STOCK_HEADERS = [
	"source_key",
	"location_id",
	"product_id",
	"variant_id",
	"quantity",
	"unit",
];

const SOURCE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const DECIMAL_QUANTITY_PATTERN = /^-?(?:0|[1-9][0-9]*)(?:[.,][0-9]{1,6})?$/;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: RFC-4180-style state handling is intentionally centralized and bounded.
function parseCsv(content: string, manifest: CsvImportManifest): string[][] {
	if (
		content.includes("\0") ||
		new TextEncoder().encode(content).length > CSV_IMPORT_LIMITS.bytes
	) {
		throw new ImportError(
			"invalid_csv",
			"CSV content exceeds the governed bounds"
		);
	}
	const expectedNewline = manifest.newline === "CRLF" ? "\r\n" : "\n";
	if (manifest.newline === "LF" && content.includes("\r\n")) {
		throw new ImportError(
			"invalid_csv",
			"CSV newline does not match the manifest"
		);
	}
	const records: string[][] = [];
	let field = "";
	let record: string[] = [];
	let quoted = false;
	for (let index = 0; index < content.length; index += 1) {
		const character = content[index];
		if (character === manifest.quote) {
			if (quoted && content[index + 1] === manifest.quote) {
				field += manifest.quote;
				index += 1;
			} else {
				quoted = !quoted;
			}
			continue;
		}
		if (!quoted && character === manifest.delimiter) {
			record.push(field);
			field = "";
			continue;
		}
		if (!quoted && content.startsWith(expectedNewline, index)) {
			record.push(field);
			records.push(record);
			field = "";
			record = [];
			index += expectedNewline.length - 1;
			continue;
		}
		field += character;
		if (field.length > CSV_IMPORT_LIMITS.fieldCharacters) {
			throw new ImportError(
				"invalid_csv",
				"CSV field exceeds the governed bound"
			);
		}
	}
	if (quoted) {
		throw new ImportError(
			"invalid_csv",
			"CSV contains an unterminated quoted field"
		);
	}
	if (field.length > 0 || record.length > 0) {
		record.push(field);
		records.push(record);
	}
	if (records.length < 2 || records.length - 1 > CSV_IMPORT_LIMITS.rows) {
		throw new ImportError(
			"invalid_csv",
			"CSV row count is outside the governed bounds"
		);
	}
	if (records.some((item) => item.length > CSV_IMPORT_LIMITS.columns)) {
		throw new ImportError(
			"invalid_csv",
			"CSV column count exceeds the governed bound"
		);
	}
	return records;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: two governed CSV templates share one deterministic row-classification pass.
function normalize(
	input: CreateImportRequest,
	records: string[][],
	ids: ImportIdFactory
) {
	const expected =
		input.target === "Product" ? PRODUCT_HEADERS : OPENING_STOCK_HEADERS;
	if (records[0]?.join("|") !== expected.join("|")) {
		throw new ImportError(
			"invalid_csv",
			"CSV header does not match the selected import target"
		);
	}
	const seen = new Set<string>();
	const rows: ImportRowRecord[] = [];
	const findings: ImportFinding[] = [];
	for (let index = 1; index < records.length; index += 1) {
		const values = records[index] ?? [];
		const rowNumber = index;
		const rowId = ids.create("row");
		const sourceKey = values[0]?.trim() ?? "";
		const data = Object.fromEntries(
			expected.map((header, column) => [header, values[column]?.trim() || null])
		);
		const errors: Array<{ code: string; field: string }> = [];
		if (
			!sourceKey ||
			sourceKey.length > 128 ||
			!SOURCE_KEY_PATTERN.test(sourceKey)
		) {
			errors.push({ code: "invalid_source_key", field: "source_key" });
		}
		if (seen.has(sourceKey)) {
			errors.push({ code: "duplicate_source_key", field: "source_key" });
		}
		seen.add(sourceKey);
		if (values.length !== expected.length) {
			errors.push({ code: "column_count_mismatch", field: "" });
		}
		if (input.target === "Product") {
			if (!data.name || data.name.length > 300) {
				errors.push({ code: "invalid_product_name", field: "name" });
			}
			if (!data.variant_name || data.variant_name.length > 300) {
				errors.push({ code: "invalid_variant_name", field: "variant_name" });
			}
			if (!(data.sku || data.barcode)) {
				findings.push({
					code: "identifierless_variant",
					field: null,
					id: ids.create("finding"),
					importId: "pending",
					rowId,
					rowNumber,
					severity: "Warning",
					sourceKey,
					tenantId: input.tenantId,
				});
			}
		} else {
			for (const field of ["location_id", "product_id", "quantity"]) {
				if (!data[field]) {
					errors.push({ code: `missing_${field}`, field });
				}
			}
			if (!(data.unit || input.manifest.defaultUnit)) {
				errors.push({ code: "missing_unit", field: "unit" });
			}
			if (data.quantity && !DECIMAL_QUANTITY_PATTERN.test(data.quantity)) {
				errors.push({ code: "invalid_quantity", field: "quantity" });
			}
			if (data.quantity && input.manifest.decimalSeparator === ",") {
				data.quantity = data.quantity.replace(",", ".");
			}
			data.unit ??= input.manifest.defaultUnit ?? null;
		}
		for (const error of errors) {
			findings.push({
				code: error.code,
				field: error.field || null,
				id: ids.create("finding"),
				importId: "pending",
				rowId,
				rowNumber,
				severity: "Error",
				sourceKey: sourceKey || `row-${rowNumber}`,
				tenantId: input.tenantId,
			});
		}
		const warning = findings.some(
			(finding) => finding.rowId === rowId && finding.severity === "Warning"
		);
		let state: ImportRowRecord["state"] = "Valid";
		if (errors.length) {
			state = "Rejected";
		} else if (warning) {
			state = "Warning";
		}
		rows.push({
			id: rowId,
			importId: "pending",
			normalizedData: data,
			rowFingerprint: JSON.stringify(data),
			rowNumber,
			sourceKey: sourceKey || `row-${rowNumber}`,
			state,
			targetId: null,
			tenantId: input.tenantId,
		});
	}
	return { findings, rows };
}

function createImportFingerprint(input: CreateImportRequest) {
	return JSON.stringify({
		organizationId: input.organizationId,
		sha256: input.sha256.toLowerCase(),
		target: input.target,
		tenantId: input.tenantId,
	});
}

function sanitizeFileName(value: string) {
	const basename = value.replaceAll("\\", "/").split("/").at(-1) ?? "";
	const sanitized = basename
		.replaceAll(/[^A-Za-z0-9._ -]/g, "_")
		.trim()
		.slice(0, 200);
	return sanitized || "upload.csv";
}

function approvalFingerprint(input: {
	actorUserId: string;
	importId: string;
	target: ImportTarget;
	tenantId: string;
	version: number;
}) {
	return JSON.stringify({
		actorUserId: input.actorUserId,
		importId: input.importId,
		target: input.target,
		tenantId: input.tenantId,
		version: input.version,
	});
}

function assertCommandReceipt(
	receipt: ImportCommandReceipt,
	expectedFingerprint: string
) {
	if (receipt.requestFingerprint !== expectedFingerprint) {
		throw new ImportError(
			"idempotency_conflict",
			"The idempotency key is already bound to another import command"
		);
	}
}

export function createImportService(options: {
	clock: () => Date;
	hash: { sha256: (content: string) => Promise<string> };
	ids: ImportIdFactory;
	scanner: {
		scan: (input: {
			content: string;
			fileName: string;
		}) => Promise<"Clean" | "Blocked" | "Unavailable">;
	};
	targets: Record<ImportTarget, ImportTargetPort>;
	unitOfWork: ImportUnitOfWork;
}) {
	return {
		async approve(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			importId: string;
			sessionId: string;
			target: ImportTarget;
			tenantId: string;
			version: number;
		}) {
			const operation = `approve:${input.target}`;
			const expectedFingerprint = approvalFingerprint(input);
			const replay = await options.unitOfWork.execute(
				async ({ repository }) => {
					const receipt = await repository.findCommandReceipt({
						idempotencyKey: input.idempotencyKey,
						operation,
						tenantId: input.tenantId,
					});
					if (!receipt) {
						return null;
					}
					assertCommandReceipt(receipt, expectedFingerprint);
					return repository.get(input.tenantId, receipt.importId, input.target);
				}
			);
			if (replay) {
				return replay;
			}
			const existing = await options.unitOfWork.execute(({ repository }) =>
				repository.get(input.tenantId, input.importId, input.target)
			);
			if (!existing) {
				throw new ImportError("not_found", "Import was not found");
			}
			if (existing.state === "Completed") {
				return existing;
			}
			const job = await options.unitOfWork.execute(
				async ({ events, repository }) => {
					const current = await repository.get(
						input.tenantId,
						input.importId,
						input.target
					);
					if (!current) {
						throw new ImportError("not_found", "Import was not found");
					}
					if (current.createdByUserId === input.actorUserId) {
						throw new ImportError(
							"segregation_of_duties",
							"The uploader cannot approve this import"
						);
					}
					if (current.state === "Approved" || current.state === "Committing") {
						return current;
					}
					if (current.state !== "ReadyForApproval") {
						throw new ImportError(
							"invalid_state",
							"Import is not ready for approval"
						);
					}
					const approved = await repository.markApproved({
						approvedAt: options.clock(),
						approvedByUserId: input.actorUserId,
						importId: input.importId,
						tenantId: input.tenantId,
						version: input.version,
					});
					if (approved === "version_conflict") {
						throw new ImportError(
							"version_conflict",
							"Import version is stale"
						);
					}
					await events.append({
						aggregateId: input.importId,
						correlationId: input.correlationId,
						data: { target: input.target },
						id: options.ids.create("event"),
						name: "platform.import.approved.v1",
						tenantId: input.tenantId,
					});
					return approved;
				}
			);
			const rows = await options.unitOfWork.execute(({ repository }) =>
				repository.listRows(input.tenantId, input.importId)
			);
			const committed: ImportRowRecord[] = [];
			for (const row of rows) {
				if (row.state === "Rejected") {
					committed.push(row);
					continue;
				}
				// biome-ignore lint/performance/noAwaitInLoops: commit waves preserve deterministic source order and checkpoint after each owner command.
				const result = await options.targets[input.target].commit({
					actorUserId: input.actorUserId,
					contextId: input.contextId,
					correlationId: input.correlationId,
					createdByUserId: job.createdByUserId,
					idempotencyKey: `${input.importId}:row:${row.sourceKey}`,
					organizationId: job.organizationId,
					row,
					sessionId: input.sessionId,
					tenantId: input.tenantId,
				});
				const checkpoint = await options.unitOfWork.execute(({ repository }) =>
					repository.markRowApplied({
						completedAt: options.clock(),
						importId: input.importId,
						rowId: row.id,
						targetId: result.targetId,
						tenantId: input.tenantId,
					})
				);
				committed.push(checkpoint);
			}
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const completed = await repository.markCompleted({
					completedAt: options.clock(),
					importId: input.importId,
					rows: committed,
					tenantId: input.tenantId,
					version: job.version,
				});
				if (completed === "version_conflict") {
					throw new ImportError("version_conflict", "Import version is stale");
				}
				await events.append({
					aggregateId: input.importId,
					correlationId: input.correlationId,
					data: { counts: completed.counts, target: input.target },
					id: options.ids.create("event"),
					name: "platform.import.completed.v1",
					tenantId: input.tenantId,
				});
				await repository.recordCommandReceipt({
					createdAt: options.clock(),
					idempotencyKey: input.idempotencyKey,
					importId: input.importId,
					operation,
					requestFingerprint: expectedFingerprint,
					tenantId: input.tenantId,
				});
				return completed;
			});
		},
		async create(input: CreateImportRequest): Promise<ImportJobRecord> {
			if (
				input.contentType !== "text/csv" ||
				new TextEncoder().encode(input.content).length > CSV_IMPORT_LIMITS.bytes
			) {
				throw new ImportError(
					"invalid_csv",
					"Import content is outside the governed CSV envelope"
				);
			}
			const sourceFileName = sanitizeFileName(input.fileName);
			const scan = await options.scanner.scan({
				content: input.content,
				fileName: sourceFileName,
			});
			if (scan === "Blocked") {
				throw new ImportError(
					"blocked_content",
					"The upload did not pass content scanning"
				);
			}
			if (scan === "Unavailable") {
				throw new ImportError(
					"dependency_unavailable",
					"Content scanning is unavailable"
				);
			}
			const actualHash = await options.hash.sha256(input.content);
			if (actualHash.toLowerCase() !== input.sha256.toLowerCase()) {
				throw new ImportError(
					"hash_mismatch",
					"The uploaded content hash does not match the manifest"
				);
			}
			const parsed = normalize(
				input,
				parseCsv(input.content, input.manifest),
				options.ids
			);
			const fingerprint = createImportFingerprint(input);
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const operation = `create:${input.target}`;
				const receipt = await repository.findCommandReceipt({
					idempotencyKey: input.idempotencyKey,
					operation,
					tenantId: input.tenantId,
				});
				if (receipt) {
					assertCommandReceipt(receipt, fingerprint);
					const recorded = await repository.get(
						input.tenantId,
						receipt.importId,
						input.target
					);
					if (recorded) {
						return recorded;
					}
				}
				const prior = await repository.findByCreateKey(
					input.tenantId,
					input.target,
					input.idempotencyKey
				);
				if (prior) {
					if (prior.requestFingerprint !== fingerprint) {
						throw new ImportError(
							"idempotency_conflict",
							"The idempotency key is already bound to another import"
						);
					}
					return prior;
				}
				const id = options.ids.create("import");
				const now = options.clock();
				for (const row of parsed.rows) {
					row.importId = id;
				}
				for (const finding of parsed.findings) {
					finding.importId = id;
				}
				const counts = {
					applied: 0,
					failed: 0,
					rejected: parsed.rows.filter((row) => row.state === "Rejected")
						.length,
					skipped: 0,
					total: parsed.rows.length,
					valid: parsed.rows.filter((row) => row.state === "Valid").length,
					warning: parsed.rows.filter((row) => row.state === "Warning").length,
				};
				const job: ImportJobRecord = {
					approvedAt: null,
					approvedByUserId: null,
					completedAt: null,
					counts,
					createdAt: now,
					createdByUserId: input.actorUserId,
					createIdempotencyKey: input.idempotencyKey,
					failureCode: null,
					id,
					lastCompletedRow: 0,
					manifest: input.manifest,
					organizationId: input.organizationId,
					requestFingerprint: fingerprint,
					scannerResult: "Clean",
					sourceFileName,
					sourceSha256: actualHash.toLowerCase(),
					state: "ReadyForApproval",
					target: input.target,
					tenantId: input.tenantId,
					updatedAt: now,
					version: 1,
				};
				await repository.create({
					findings: parsed.findings,
					job,
					rows: parsed.rows,
				});
				await events.append({
					aggregateId: id,
					correlationId: input.correlationId,
					data: { counts, target: input.target },
					id: options.ids.create("event"),
					name: "platform.import.validated.v1",
					tenantId: input.tenantId,
				});
				await repository.recordCommandReceipt({
					createdAt: now,
					idempotencyKey: input.idempotencyKey,
					importId: id,
					operation,
					requestFingerprint: fingerprint,
					tenantId: input.tenantId,
				});
				return job;
			});
		},
		findings(tenantId: string, importId: string, target: ImportTarget) {
			return options.unitOfWork.execute(async ({ repository }) => {
				if (!(await repository.get(tenantId, importId, target))) {
					throw new ImportError("not_found", "Import was not found");
				}
				return repository.listFindings(tenantId, importId);
			});
		},
		get(tenantId: string, importId: string, target: ImportTarget) {
			return options.unitOfWork.execute(({ repository }) =>
				repository.get(tenantId, importId, target)
			);
		},
		purgeStaging(input: {
			importId: string;
			purgedAt: Date;
			target: ImportTarget;
			tenantId: string;
		}) {
			return options.unitOfWork.execute(async ({ repository }) => {
				const job = await repository.get(
					input.tenantId,
					input.importId,
					input.target
				);
				if (!job) {
					throw new ImportError("not_found", "Import was not found");
				}
				if (job.state !== "Completed" && job.state !== "Cancelled") {
					throw new ImportError(
						"invalid_state",
						"Import staging can only be purged after terminal completion"
					);
				}
				const purged = await repository.purgeStaging(input);
				if (purged === "not_found") {
					throw new ImportError("not_found", "Import was not found");
				}
				return purged;
			});
		},
	};
}
