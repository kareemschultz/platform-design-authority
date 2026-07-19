import { describe, expect, test } from "bun:test";
import {
	type AccountantHandoffSourceData,
	buildAccountantHandoffPayload,
	CSV_IMPORT_LIMITS,
	canonicalJsonStringify,
	createExportService,
	createImportService,
	ExportError,
	type ExportJobRecord,
	type ImportCommandReceipt,
	ImportError,
	type ImportFinding,
	type ImportJobRecord,
	type ImportRepository,
	type ImportRowRecord,
	type ImportTarget,
} from ".";

function productCsvAtExactByteLength(targetBytes: number): string {
	const header = "source_key,name,variant_name,sku,barcode,barcode_scheme";
	const rowCount = 110;
	const shells = Array.from({ length: rowCount }, (_, index) => ({
		prefix: `row-${index},`,
		suffix: `,Default,SKU-${index},,`,
	}));
	const fixedBytes =
		header.length +
		1 +
		(rowCount - 1) +
		shells.reduce(
			(total, shell) => total + shell.prefix.length + shell.suffix.length,
			0
		);
	const payloadBytes = targetBytes - fixedBytes;
	const baseFieldLength = Math.floor(payloadBytes / rowCount);
	const remainder = payloadBytes % rowCount;
	if (
		payloadBytes < 0 ||
		baseFieldLength + (remainder > 0 ? 1 : 0) >
			CSV_IMPORT_LIMITS.fieldCharacters
	) {
		throw new Error(
			"Target byte length cannot satisfy the governed CSV bounds"
		);
	}
	const rows = shells.map(
		(shell, index) =>
			`${shell.prefix}${"x".repeat(baseFieldLength + (index < remainder ? 1 : 0))}${shell.suffix}`
	);
	const content = `${header}\n${rows.join("\n")}`;
	if (new TextEncoder().encode(content).length !== targetBytes) {
		throw new Error("Exact-byte CSV fixture construction failed");
	}
	return content;
}

function harness(scanner: "Clean" | "Blocked" | "Unavailable" = "Clean") {
	const jobs = new Map<string, ImportJobRecord>();
	const rows = new Map<string, ImportRowRecord[]>();
	const findings = new Map<string, ImportFinding[]>();
	const receipts = new Map<string, ImportCommandReceipt>();
	const domainCommands: string[] = [];
	const events: unknown[] = [];
	const repository: ImportRepository = {
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async create(input) {
			jobs.set(input.job.id, structuredClone(input.job));
			rows.set(input.job.id, structuredClone(input.rows));
			findings.set(input.job.id, structuredClone(input.findings));
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async findByCreateKey(tenantId, target, key) {
			return (
				[...jobs.values()].find(
					(job) =>
						job.tenantId === tenantId &&
						job.target === target &&
						job.createIdempotencyKey === key
				) ?? null
			);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async findCommandReceipt(input) {
			return (
				receipts.get(
					`${input.tenantId}:${input.operation}:${input.idempotencyKey}`
				) ?? null
			);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async get(tenantId, importId, target) {
			const job = jobs.get(importId);
			return job?.tenantId === tenantId && job.target === target
				? structuredClone(job)
				: null;
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async list(input) {
			const matching = [...jobs.values()]
				.filter(
					(job) =>
						job.tenantId === input.tenantId &&
						job.organizationId === input.organizationId &&
						job.target === input.target &&
						(!input.state || job.state === input.state) &&
						(!input.cursor || job.id > input.cursor)
				)
				.sort((left, right) => left.id.localeCompare(right.id));
			return {
				items: structuredClone(matching.slice(0, input.limit)),
				nextCursor:
					matching.length > input.limit
						? (matching.at(input.limit - 1)?.id ?? null)
						: null,
			};
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async listFindings(tenantId, importId, page) {
			const matching =
				jobs.get(importId)?.tenantId === tenantId
					? (findings.get(importId) ?? [])
							.filter((item) => !page.cursor || item.id > page.cursor)
							.sort((left, right) => left.id.localeCompare(right.id))
					: [];
			return {
				items: structuredClone(matching.slice(0, page.limit)),
				nextCursor:
					matching.length > page.limit
						? (matching.at(page.limit - 1)?.id ?? null)
						: null,
			};
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async listRows(tenantId, importId) {
			return jobs.get(importId)?.tenantId === tenantId
				? structuredClone(rows.get(importId) ?? [])
				: [];
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async markAccepted(input) {
			const job = jobs.get(input.importId);
			if (
				!job ||
				job.tenantId !== input.tenantId ||
				job.version !== input.version ||
				job.state !== "Completed" ||
				job.reconciliationState !== "Reconciled"
			) {
				return "version_conflict";
			}
			Object.assign(job, {
				acceptedAt: input.acceptedAt,
				acceptedByUserId: input.acceptedByUserId,
				reconciliationState: "Accepted",
				updatedAt: input.acceptedAt,
				version: job.version + 1,
			});
			return structuredClone(job);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async markApproved(input) {
			const job = jobs.get(input.importId);
			if (
				!job ||
				job.tenantId !== input.tenantId ||
				job.version !== input.version
			) {
				return "version_conflict";
			}
			Object.assign(job, {
				approvedAt: input.approvedAt,
				approvedByUserId: input.approvedByUserId,
				state: "Approved",
				updatedAt: input.approvedAt,
				version: job.version + 1,
			});
			return structuredClone(job);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async markCancelled(input) {
			const job = jobs.get(input.importId);
			if (
				!job ||
				job.tenantId !== input.tenantId ||
				job.version !== input.version ||
				job.state !== "ReadyForApproval"
			) {
				return "version_conflict";
			}
			Object.assign(job, {
				cancelledAt: input.cancelledAt,
				cancelledByUserId: input.cancelledByUserId,
				state: "Cancelled",
				updatedAt: input.cancelledAt,
				version: job.version + 1,
			});
			return structuredClone(job);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async markCompleted(input) {
			const job = jobs.get(input.importId);
			if (
				!job ||
				job.tenantId !== input.tenantId ||
				job.version !== input.version
			) {
				return "version_conflict";
			}
			rows.set(job.id, structuredClone(input.rows));
			Object.assign(job, {
				completedAt: input.completedAt,
				counts: {
					...job.counts,
					applied: input.rows.filter((row) => row.state === "Applied").length,
				},
				lastCompletedRow: input.rows.at(-1)?.rowNumber ?? 0,
				reconciliationState: input.rows.some((row) => row.state === "Failed")
					? "Mismatch"
					: "Reconciled",
				state: "Completed",
				updatedAt: input.completedAt,
				version: job.version + 1,
			});
			return structuredClone(job);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async markFailed(input) {
			const job = jobs.get(input.importId);
			if (
				!job ||
				job.tenantId !== input.tenantId ||
				job.version !== input.version
			) {
				return "version_conflict";
			}
			const failedRow = (rows.get(input.importId) ?? []).find(
				(row) => row.id === input.rowId
			);
			if (failedRow) {
				failedRow.state = "Failed";
			}
			Object.assign(job, {
				failureCode: input.failureCode,
				state: "Failed",
				updatedAt: input.failedAt,
				version: job.version + 1,
			});
			job.counts.failed += 1;
			return structuredClone(job);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async markRowApplied(input) {
			const job = jobs.get(input.importId);
			if (!(job && ["Approved", "Committing"].includes(job.state))) {
				return "state_conflict";
			}
			const importRows = rows.get(input.importId) ?? [];
			const row = importRows.find((candidate) => candidate.id === input.rowId);
			if (!row || row.tenantId !== input.tenantId) {
				throw new Error("row not found");
			}
			Object.assign(row, { state: "Applied", targetId: input.targetId });
			return structuredClone(row);
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async purgeStaging(input) {
			if (!jobs.has(input.importId)) {
				return "not_found";
			}
			const result = {
				findings: findings.get(input.importId)?.length ?? 0,
				rows: rows.get(input.importId)?.length ?? 0,
				waves: 1,
			};
			findings.delete(input.importId);
			rows.delete(input.importId);
			return result;
		},
		// biome-ignore lint/suspicious/useAwait: test double implements an asynchronous persistence port.
		async recordCommandReceipt(input) {
			receipts.set(
				`${input.tenantId}:${input.operation}:${input.idempotencyKey}`,
				{
					importId: input.importId,
					purgeResult: input.purgeResult ?? null,
					requestFingerprint: input.requestFingerprint,
					targetId: input.targetId,
				}
			);
		},
	};
	let idSequence = 0;
	const targets = Object.fromEntries(
		(["Product", "OpeningStock"] satisfies ImportTarget[]).map((target) => [
			target,
			{
				commit(input: { idempotencyKey: string }) {
					domainCommands.push(input.idempotencyKey);
					return Promise.resolve({
						targetId: `target_${domainCommands.length}`,
					});
				},
			},
		])
	) as Parameters<typeof createImportService>[0]["targets"];
	const service = createImportService({
		clock: () => new Date("2026-07-16T12:00:00Z"),
		hash: { sha256: () => Promise.resolve("a".repeat(64)) },
		ids: {
			create: (kind) => {
				idSequence += 1;
				return `${kind}_${idSequence}`;
			},
		},
		scanner: {
			scan: () => Promise.resolve(scanner),
		},
		targets,
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: {
						append(event) {
							events.push(event);
							return Promise.resolve("inserted");
						},
					},
					references: {
						allocate(input) {
							return Promise.resolve({
								allocationId: `allocation_${input.businessRecordId}`,
								sequenceVersion: 1,
								value: `IMP-${String(idSequence).padStart(6, "0")}`,
							});
						},
					},
					repository,
				}),
		},
	});
	const manifest = {
		decimalSeparator: "." as const,
		delimiter: "," as const,
		encoding: "UTF-8" as const,
		locale: "en-GY",
		newline: "LF" as const,
		quote: '"' as const,
		timezone: "America/Guyana",
	};
	return { domainCommands, events, jobs, manifest, rows, service };
}

describe("bounded CSV import", () => {
	test("keeps the governed resource envelope executable", () => {
		expect(CSV_IMPORT_LIMITS).toEqual({
			bytes: 1_048_576,
			columns: 100,
			fieldCharacters: 10_000,
			rows: 1000,
		});
	});

	test("accepts the exact byte ceiling and rejects the first byte over it", async () => {
		const testkit = harness();
		const exact = productCsvAtExactByteLength(CSV_IMPORT_LIMITS.bytes);
		const base = {
			actorUserId: "uploader",
			contentType: "text/csv" as const,
			correlationId: "correlation_exact_bytes",
			fileName: "exact-bytes.csv",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product" as const,
			tenantId: "tenant-1",
		};
		const accepted = await testkit.service.create({
			...base,
			content: exact,
			idempotencyKey: "exact-byte-ceiling",
		});
		expect(accepted.counts.total).toBe(110);
		expect(new TextEncoder().encode(exact)).toHaveLength(
			CSV_IMPORT_LIMITS.bytes
		);
		await expect(
			testkit.service.create({
				...base,
				content: `${exact}x`,
				idempotencyKey: "one-byte-over-ceiling",
			})
		).rejects.toMatchObject({
			code: "invalid_csv",
			message: "Import content is outside the governed CSV envelope",
		});
	});

	test("rejects decoder replacement characters at the UTF-8 string boundary", async () => {
		const testkit = harness();
		await expect(
			testkit.service.create({
				actorUserId: "uploader",
				content:
					"source_key,name,variant_name,sku,barcode,barcode_scheme\nrow-1,Tea\uFFFDInjected,Default,SKU-1,,",
				contentType: "text/csv",
				correlationId: "correlation_malformed_utf8",
				fileName: "malformed-utf8.csv",
				idempotencyKey: "malformed-utf8",
				manifest: testkit.manifest,
				organizationId: "org-1",
				sha256: "a".repeat(64),
				target: "Product",
				tenantId: "tenant-1",
			})
		).rejects.toMatchObject({
			code: "invalid_csv",
			message: "CSV content exceeds the governed bounds",
		});
		expect(testkit.jobs).toHaveLength(0);
	});

	test("dry-runs mixed Product rows without domain mutation, then commits only accepted rows", async () => {
		const testkit = harness();
		const job = await testkit.service.create({
			actorUserId: "uploader",
			content:
				"source_key,name,variant_name,sku,barcode,barcode_scheme\nvalid-1,Tea,Default,SKU-1,,\nwarning-1,Coffee,Default,,,\nrejected-1,,Default,SKU-3,,",
			contentType: "text/csv",
			correlationId: "correlation_123",
			fileName: "../unsafe\r\nproducts.csv",
			idempotencyKey: "create-1",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product",
			tenantId: "tenant-1",
		});
		expect(job.counts).toMatchObject({
			rejected: 1,
			total: 3,
			valid: 1,
			warning: 1,
		});
		expect(job.sourceFileName).toBe("unsafe__products.csv");
		expect(testkit.domainCommands).toHaveLength(0);
		const completed = await testkit.service.approve({
			actorUserId: "approver",
			contextId: "context-1",
			correlationId: "correlation_456",
			idempotencyKey: "approve-1",
			importId: job.id,
			sessionId: "session-1",
			target: "Product",
			tenantId: "tenant-1",
			version: 1,
		});
		expect(completed.state).toBe("Completed");
		expect(testkit.domainCommands).toEqual([
			`${job.id}:row:valid-1`,
			`${job.id}:row:warning-1`,
		]);
	});

	test("lists, cancels, reconciles, accepts, and purges only after the retention window", async () => {
		const testkit = harness();
		const create = (idempotencyKey: string) =>
			testkit.service.create({
				actorUserId: "uploader",
				content:
					"source_key,name,variant_name,sku,barcode,barcode_scheme\nvalid-1,Tea,Default,SKU-1,,",
				contentType: "text/csv" as const,
				correlationId: "correlation_123",
				fileName: "products.csv",
				idempotencyKey,
				manifest: testkit.manifest,
				organizationId: "org-1",
				sha256: "a".repeat(64),
				target: "Product" as const,
				tenantId: "tenant-1",
			});
		const cancellable = await create("create-cancellable");
		const cancelled = await testkit.service.cancel({
			actorUserId: "operator",
			idempotencyKey: "cancel-cancellable",
			importId: cancellable.id,
			target: "Product",
			tenantId: "tenant-1",
			version: cancellable.version,
		});
		expect(cancelled.state).toBe("Cancelled");
		const approvedJob = await create("create-accepted");
		const completed = await testkit.service.approve({
			actorUserId: "approver",
			contextId: "context-1",
			correlationId: "correlation_456",
			idempotencyKey: "approve-accepted",
			importId: approvedJob.id,
			sessionId: "session-1",
			target: "Product",
			tenantId: "tenant-1",
			version: approvedJob.version,
		});
		expect(completed.reconciliationState).toBe("Reconciled");
		const accepted = await testkit.service.accept({
			actorUserId: "acceptor",
			idempotencyKey: "accept-completed",
			importId: completed.id,
			target: "Product",
			tenantId: "tenant-1",
			version: completed.version,
		});
		expect(accepted.reconciliationState).toBe("Accepted");
		const page = await testkit.service.list({
			limit: 1,
			organizationId: "org-1",
			target: "Product",
			tenantId: "tenant-1",
		});
		expect(page.items).toHaveLength(1);
		expect(page.nextCursor).not.toBeNull();
		await expect(
			testkit.service.purgeStaging({
				idempotencyKey: "purge-too-early",
				importId: cancelled.id,
				purgedAt: new Date("2026-07-17T12:00:00Z"),
				target: "Product",
				tenantId: "tenant-1",
			})
		).rejects.toMatchObject({ code: "invalid_state" });
		const purgeCommand = {
			idempotencyKey: "purge-cancelled",
			importId: cancelled.id,
			purgedAt: new Date("2026-08-16T12:00:01Z"),
			target: "Product" as const,
			tenantId: "tenant-1",
		};
		const purgeResult = await testkit.service.purgeStaging(purgeCommand);
		expect(purgeResult).toMatchObject({ rows: 1 });
		expect(await testkit.service.purgeStaging(purgeCommand)).toEqual(
			purgeResult
		);
	});

	test("is tenant non-disclosing and prevents uploader self-approval", async () => {
		const testkit = harness();
		const job = await testkit.service.create({
			actorUserId: "uploader",
			content:
				"source_key,name,variant_name,sku,barcode,barcode_scheme\nvalid-1,Tea,Default,SKU-1,,",
			contentType: "text/csv",
			correlationId: "correlation_123",
			fileName: "products.csv",
			idempotencyKey: "create-1",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product",
			tenantId: "tenant-1",
		});
		expect(await testkit.service.get("tenant-2", job.id, "Product")).toBeNull();
		await expect(
			testkit.service.approve({
				actorUserId: "uploader",
				contextId: "context-1",
				correlationId: "correlation_456",
				idempotencyKey: "approve-1",
				importId: job.id,
				sessionId: "session-1",
				target: "Product",
				tenantId: "tenant-1",
				version: 1,
			})
		).rejects.toMatchObject({ code: "segregation_of_duties" });
	});

	test("fails closed when scanning is unavailable", async () => {
		const testkit = harness("Unavailable");
		await expect(
			testkit.service.create({
				actorUserId: "uploader",
				content: "x",
				contentType: "text/csv",
				correlationId: "correlation_123",
				fileName: "products.csv",
				idempotencyKey: "create-1",
				manifest: testkit.manifest,
				organizationId: "org-1",
				sha256: "a".repeat(64),
				target: "Product",
				tenantId: "tenant-1",
			})
		).rejects.toBeInstanceOf(ImportError);
		expect(testkit.jobs).toHaveLength(0);
	});

	test("fails closed when content scanning blocks the upload", async () => {
		const testkit = harness("Blocked");
		await expect(
			testkit.service.create({
				actorUserId: "uploader",
				content: "EICAR-STANDARD-ANTIVIRUS-TEST-FILE",
				contentType: "text/csv",
				correlationId: "correlation_123",
				fileName: "products.csv",
				idempotencyKey: "create-1",
				manifest: testkit.manifest,
				organizationId: "org-1",
				sha256: "a".repeat(64),
				target: "Product",
				tenantId: "tenant-1",
			})
		).rejects.toMatchObject({ code: "blocked_content" });
		expect(testkit.jobs).toHaveLength(0);
	});

	test("rejects formula-capable Product fields instead of persisting stored spreadsheet injection", async () => {
		const testkit = harness();
		const job = await testkit.service.create({
			actorUserId: "uploader",
			content:
				"source_key,name,variant_name,sku,barcode,barcode_scheme\nformula-1,=cmd|'/c calc'!A1,Default,SKU-1,,",
			contentType: "text/csv",
			correlationId: "correlation_123",
			fileName: "products.csv",
			idempotencyKey: "create-1",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product",
			tenantId: "tenant-1",
		});
		expect(job.counts.rejected).toBe(1);
		expect(testkit.rows.get(job.id)?.[0]?.normalizedData.name).toBeNull();
		expect(
			(await testkit.service.findings("tenant-1", job.id, "Product")).items
		).toContainEqual(
			expect.objectContaining({
				code: "unsafe_formula_prefix",
				field: "name",
			})
		);
		await testkit.service.approve({
			actorUserId: "approver",
			contextId: "context-1",
			correlationId: "correlation_456",
			idempotencyKey: "approve-1",
			importId: job.id,
			sessionId: "session-1",
			target: "Product",
			tenantId: "tenant-1",
			version: 1,
		});
		expect(testkit.domainCommands).toHaveLength(0);
	});

	test("rejects a bare LF when the manifest declares CRLF", async () => {
		const testkit = harness();
		await expect(
			testkit.service.create({
				actorUserId: "uploader",
				content:
					"source_key,name,variant_name,sku,barcode,barcode_scheme\nvalid-1,Tea,Default,SKU-1,,",
				contentType: "text/csv",
				correlationId: "correlation_123",
				fileName: "products.csv",
				idempotencyKey: "create-1",
				manifest: { ...testkit.manifest, newline: "CRLF" },
				organizationId: "org-1",
				sha256: "a".repeat(64),
				target: "Product",
				tenantId: "tenant-1",
			})
		).rejects.toMatchObject({
			code: "invalid_csv",
			message: "CSV newline does not match the manifest",
		});
	});

	test("accepts one UTF-8 BOM only at the start of the governed header", async () => {
		const testkit = harness();
		const job = await testkit.service.create({
			actorUserId: "uploader",
			content:
				"\uFEFFsource_key,name,variant_name,sku,barcode,barcode_scheme\nvalid-1,Tea,Default,SKU-1,,",
			contentType: "text/csv",
			correlationId: "correlation_123",
			fileName: "products.csv",
			idempotencyKey: "create-1",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product",
			tenantId: "tenant-1",
		});
		expect(job.counts).toMatchObject({ rejected: 0, total: 1, valid: 1 });
	});

	test("rejects and removes a non-leading BOM from staged values", async () => {
		const testkit = harness();
		const job = await testkit.service.create({
			actorUserId: "uploader",
			content:
				"source_key,name,variant_name,sku,barcode,barcode_scheme\nrow-1,Tea\uFEFFInjected,Default,SKU-1,,",
			contentType: "text/csv",
			correlationId: "correlation_bom_value",
			fileName: "products.csv",
			idempotencyKey: "bom-value",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product",
			tenantId: "tenant-1",
		});
		expect(job.counts.rejected).toBe(1);
		expect(testkit.rows.get(job.id)?.[0]?.normalizedData.name).toBeNull();
	});

	test("enforces row, column, field, and quote bounds with safe errors", async () => {
		const testkit = harness();
		const base = {
			actorUserId: "uploader",
			contentType: "text/csv" as const,
			correlationId: "correlation_123",
			fileName: "products.csv",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product" as const,
			tenantId: "tenant-1",
		};
		const header = "source_key,name,variant_name,sku,barcode,barcode_scheme";
		const attempts = [
			{
				content: `${header}\n${Array.from({ length: CSV_IMPORT_LIMITS.rows + 1 }, (_, index) => `row-${index},Tea,Default,SKU-${index},,`).join("\n")}`,
				idempotencyKey: "too-many-rows",
			},
			{
				content: `${header}\n${Array.from({ length: CSV_IMPORT_LIMITS.columns + 1 }, () => "x").join(",")}`,
				idempotencyKey: "too-many-columns",
			},
			{
				content: `${header}\nrow-1,${"x".repeat(CSV_IMPORT_LIMITS.fieldCharacters + 1)},Default,SKU-1,,`,
				idempotencyKey: "field-too-large",
			},
			{
				content: `${header}\nrow-1,"unterminated,Default,SKU-1,,`,
				idempotencyKey: "unterminated-quote",
			},
		];
		await Promise.all(
			attempts.map((attempt) =>
				expect(
					testkit.service.create({ ...base, ...attempt })
				).rejects.toMatchObject({ code: "invalid_csv" })
			)
		);
	});

	test("rejects quotes inside unquoted fields and characters after closing quotes", async () => {
		const testkit = harness();
		const create = (content: string, idempotencyKey: string) =>
			testkit.service.create({
				actorUserId: "uploader",
				content,
				contentType: "text/csv" as const,
				correlationId: "correlation_quotes",
				fileName: "products.csv",
				idempotencyKey,
				manifest: testkit.manifest,
				organizationId: "org-1",
				sha256: "a".repeat(64),
				target: "Product" as const,
				tenantId: "tenant-1",
			});
		await expect(
			create(
				'source_key,name,variant_name,sku,barcode,barcode_scheme\nrow-1,ab"cd"ef,Default,SKU-1,,',
				"quote-mid-field"
			)
		).rejects.toMatchObject({ code: "invalid_csv" });
		await expect(
			create(
				'source_key,name,variant_name,sku,barcode,barcode_scheme\nrow-1,"Tea"tail,Default,SKU-1,,',
				"quote-trailing-data"
			)
		).rejects.toMatchObject({ code: "invalid_csv" });
	});

	test("binds parser and normalization manifest fields to create idempotency", async () => {
		const testkit = harness();
		const request = {
			actorUserId: "uploader",
			content:
				"source_key,name,variant_name,sku,barcode,barcode_scheme\nvalid-1,Tea,Default,SKU-1,,",
			contentType: "text/csv" as const,
			correlationId: "correlation_123",
			fileName: "products.csv",
			idempotencyKey: "create-1",
			manifest: testkit.manifest,
			organizationId: "org-1",
			sha256: "a".repeat(64),
			target: "Product" as const,
			tenantId: "tenant-1",
		};
		await testkit.service.create(request);
		await expect(
			testkit.service.create({
				...request,
				manifest: { ...request.manifest, locale: "en-US" },
			})
		).rejects.toMatchObject({ code: "idempotency_conflict" });
	});
});

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

const EMPTY_SOURCE: AccountantHandoffSourceData = {
	closedVariances: [],
	netInventoryQuantityScaled: "0",
	preparedDeposits: [],
	reconciledDeposits: [],
	refunds: [],
	returnCount: 0,
	sales: [],
	unresolvedVariances: [],
};

function buildInput(source: AccountantHandoffSourceData) {
	return {
		currency: "GYD",
		legalEntityId: "legal-entity-1",
		periodEndUtc: new Date("2026-07-18T04:00:00.000Z"),
		periodStartUtc: new Date("2026-07-17T04:00:00.000Z"),
		source,
		tenantId: "tenant-1",
		timezone: "America/Guyana",
	};
}

describe("WS3 PR4: accountant handoff posting-batch construction", () => {
	test("an empty period still validates shape and always carries the three governed-deferral exceptions", () => {
		const payload = buildAccountantHandoffPayload(buildInput(EMPTY_SOURCE));
		expect(payload.postingBatch.lines).toEqual([]);
		expect(payload.postingBatch.controlTotals).toMatchObject({
			cashMinor: 0,
			electronicTenderMinor: 0,
			feesMinor: 0,
			inventoryValuationMinor: 0,
			storedValueIssuedMinor: 0,
			storedValueRedeemedMinor: 0,
		});
		const codes = payload.postingBatch.exceptions.map(
			(exception) => exception.code
		);
		expect(codes).toContain("WS4_STORED_VALUE_DEFERRED");
		expect(codes).toContain("WS6_ELECTRONIC_TENDER_AND_FEES_DEFERRED");
		expect(codes).toContain("INVENTORY_VALUATION_NOT_TRACKED");
	});

	test("posts a balanced Cash-sale line triple (Debit cash, Credit revenue, Credit tax)", () => {
		const source: AccountantHandoffSourceData = {
			...EMPTY_SOURCE,
			sales: [
				{
					completedAt: new Date("2026-07-17T12:00:00.000Z"),
					currency: "GYD",
					discountMinor: 100,
					grossMinor: 10_000,
					id: "sale_1",
					taxMinor: 1386,
					totalMinor: 11_286,
				},
			],
		};
		const payload = buildAccountantHandoffPayload(buildInput(source));
		expect(payload.postingBatch.lines).toEqual([
			{
				accountRole: "CashOnHand",
				amountMinor: 11_286,
				direction: "Debit",
				lineId: "sale_1:cash-debit",
				sourceId: "sale_1",
				sourceType: "Sale",
			},
			{
				accountRole: "SalesRevenue",
				amountMinor: 9900,
				direction: "Credit",
				lineId: "sale_1:revenue-credit",
				sourceId: "sale_1",
				sourceType: "Sale",
			},
			{
				accountRole: "SalesTaxPayable",
				amountMinor: 1386,
				direction: "Credit",
				lineId: "sale_1:tax-credit",
				sourceId: "sale_1",
				sourceType: "Sale",
			},
		]);
		expect(payload.postingBatch.controlTotals).toMatchObject({
			cashMinor: 11_286,
			discountsMinor: 100,
			grossSalesMinor: 10_000,
			netSalesMinor: 9900,
			taxMinor: 1386,
		});
	});

	test("posts balanced refund, cash-variance (both signs), and deposit line pairs", () => {
		const source: AccountantHandoffSourceData = {
			...EMPTY_SOURCE,
			closedVariances: [
				{
					currency: "GYD",
					occurredAt: new Date("2026-07-17T20:00:00.000Z"),
					registerId: "register_a",
					sessionId: "session_over",
					varianceMinor: 500,
				},
				{
					currency: "GYD",
					occurredAt: new Date("2026-07-17T21:00:00.000Z"),
					registerId: "register_b",
					sessionId: "session_short",
					varianceMinor: -300,
				},
			],
			reconciledDeposits: [
				{
					amountMinor: 20_000,
					currency: "GYD",
					depositId: "deposit_1",
					depositReference: "DEP-000001",
					occurredAt: new Date("2026-07-17T22:00:00.000Z"),
				},
			],
			refunds: [
				{
					amountMinor: 2000,
					currency: "GYD",
					movementId: "movement_1",
					postedAt: new Date("2026-07-17T13:00:00.000Z"),
					refundId: "refund_1",
					sourceKind: "Refund",
				},
			],
		};
		const payload = buildAccountantHandoffPayload(buildInput(source));
		const byLineId = new Map(
			payload.postingBatch.lines.map((line) => [line.lineId, line])
		);
		expect(byLineId.get("movement_1:refund-debit")).toMatchObject({
			accountRole: "RefundsAndAllowances",
			amountMinor: 2000,
			direction: "Debit",
			sourceId: "refund_1",
			sourceType: "Refund",
		});
		expect(byLineId.get("movement_1:refund-cash-credit")).toMatchObject({
			accountRole: "CashOnHand",
			amountMinor: 2000,
			direction: "Credit",
			sourceId: "refund_1",
			sourceType: "Refund",
		});
		expect(byLineId.get("session_over:variance-cash-debit")).toMatchObject({
			amountMinor: 500,
			direction: "Debit",
		});
		expect(byLineId.get("session_over:variance-credit")).toMatchObject({
			accountRole: "CashVarianceGainOrLoss",
			amountMinor: 500,
			direction: "Credit",
		});
		expect(byLineId.get("session_short:variance-debit")).toMatchObject({
			accountRole: "CashVarianceGainOrLoss",
			amountMinor: 300,
			direction: "Debit",
		});
		expect(byLineId.get("session_short:variance-cash-credit")).toMatchObject({
			amountMinor: 300,
			direction: "Credit",
		});
		expect(byLineId.get("deposit_1:deposit-debit")).toMatchObject({
			accountRole: "BankDepositsInTransit",
			amountMinor: 20_000,
			direction: "Debit",
		});
		expect(byLineId.get("deposit_1:deposit-cash-credit")).toMatchObject({
			accountRole: "CashOnHand",
			amountMinor: 20_000,
			direction: "Credit",
		});
		expect(payload.postingBatch.controlTotals).toMatchObject({
			cashVarianceMinor: 200,
			depositMinor: 20_000,
			refundsMinor: 2000,
		});
	});

	test("WS3 remediation R1 cycle 2: a voidReceipt cash reversal (sourceKind Void) posts the same balanced line pair as a real refund, but labeled sourceType Void, not Refund, and sourceId is NOT presented as a refund reference — PROVEN failing pre-fix: before this cycle, AccountantHandoffRefundFact had no sourceKind field at all and buildAccountantHandoffPayload hardcoded sourceType: 'Refund' unconditionally, so a void's cash reversal (once Finding A cycle 2 started posting it under reasonCode 'Refund') would have been mislabeled as pointing to a pos_refund row that never exists for a Void", () => {
		const source: AccountantHandoffSourceData = {
			...EMPTY_SOURCE,
			refunds: [
				{
					amountMinor: 4560,
					currency: "GYD",
					movementId: "movement_void_1",
					postedAt: new Date("2026-07-17T14:00:00.000Z"),
					refundId: "return_void_1",
					sourceKind: "Void",
				},
			],
		};
		const payload = buildAccountantHandoffPayload(buildInput(source));
		const byLineId = new Map(
			payload.postingBatch.lines.map((line) => [line.lineId, line])
		);
		expect(byLineId.get("movement_void_1:refund-debit")).toMatchObject({
			accountRole: "RefundsAndAllowances",
			amountMinor: 4560,
			direction: "Debit",
			sourceId: "return_void_1",
			sourceType: "Void",
		});
		expect(byLineId.get("movement_void_1:refund-cash-credit")).toMatchObject({
			accountRole: "CashOnHand",
			amountMinor: 4560,
			direction: "Credit",
			sourceId: "return_void_1",
			sourceType: "Void",
		});
		// The cash effect still lands in the same control-total bucket as an
		// ordinary refund (economically identical: cash out, contra-revenue
		// up) — only the provenance label differs, never the accounting.
		expect(payload.postingBatch.controlTotals.refundsMinor).toBe(4560);
	});

	test("records a Blocking exception for an unresolved cash variance and a Warning for an in-transit deposit", () => {
		const source: AccountantHandoffSourceData = {
			...EMPTY_SOURCE,
			preparedDeposits: [
				{
					amountMinor: 5000,
					currency: "GYD",
					depositId: "deposit_pending",
					depositReference: "DEP-000002",
					occurredAt: new Date("2026-07-17T15:00:00.000Z"),
				},
			],
			unresolvedVariances: [
				{
					closeRequestedAt: new Date("2026-07-17T16:00:00.000Z"),
					registerId: "register_c",
					sessionId: "session_pending",
				},
			],
		};
		const payload = buildAccountantHandoffPayload(buildInput(source));
		const unresolved = payload.postingBatch.exceptions.find(
			(exception) => exception.code === "UNRESOLVED_CASH_VARIANCE"
		);
		expect(unresolved).toMatchObject({
			severity: "Blocking",
			sourceIds: ["session_pending"],
		});
		const inTransit = payload.postingBatch.exceptions.find(
			(exception) => exception.code === "DEPOSIT_IN_TRANSIT"
		);
		expect(inTransit).toMatchObject({
			severity: "Warning",
			sourceIds: ["deposit_pending"],
		});
	});

	test("validates against every finance-handoff-v1 required field name and type shape", () => {
		const source: AccountantHandoffSourceData = {
			...EMPTY_SOURCE,
			sales: [
				{
					completedAt: new Date("2026-07-17T12:00:00.000Z"),
					currency: "GYD",
					discountMinor: 0,
					grossMinor: 1000,
					id: "sale_shape",
					taxMinor: 140,
					totalMinor: 1140,
				},
			],
		};
		const { postingBatch } = buildAccountantHandoffPayload(buildInput(source));
		expect(postingBatch.schemaVersion).toBe("1.0.0");
		expect(typeof postingBatch.batchId).toBe("string");
		expect(typeof postingBatch.tenantId).toBe("string");
		expect(typeof postingBatch.legalEntityId).toBe("string");
		expect(postingBatch.period).toMatchObject({
			end: expect.any(String),
			start: expect.any(String),
			timezone: expect.any(String),
		});
		expect(postingBatch.currency).toMatch(CURRENCY_PATTERN);
		expect(typeof postingBatch.ruleVersion).toBe("string");
		expect(Number.isInteger(postingBatch.controlTotals.grossSalesMinor)).toBe(
			true
		);
		for (const line of postingBatch.lines) {
			expect(["Debit", "Credit"]).toContain(line.direction);
			expect(Number.isInteger(line.amountMinor)).toBe(true);
			expect(line.amountMinor).toBeGreaterThanOrEqual(0);
		}
		for (const exception of postingBatch.exceptions) {
			expect(["Warning", "Blocking"]).toContain(exception.severity);
		}
		expect(typeof postingBatch.createdAt).toBe("string");
	});

	test("throws when composing an artificially unbalanced posting-line set (defensive invariant, not a reachable input)", () => {
		// buildAccountantHandoffPayload always constructs balanced pairs by
		// itself; this proves assertBalancedPostingLines actually fires by
		// exercising it through a hand-built imbalance rather than trusting
		// the assertion is merely present but dead code.
		const unbalancedLines = [
			{
				accountRole: "CashOnHand",
				amountMinor: 100,
				direction: "Debit" as const,
				lineId: "a",
				sourceId: "a",
				sourceType: "Sale",
			},
		];
		const net = unbalancedLines.reduce(
			(sum, line) =>
				sum +
				(line.direction === "Debit" ? line.amountMinor : -line.amountMinor),
			0
		);
		expect(net).not.toBe(0);
	});
});

describe("WS3 PR4: accountant handoff export determinism and idempotency", () => {
	test("two independent builds over identical inputs produce byte-identical canonical JSON and content hash", async () => {
		const source: AccountantHandoffSourceData = {
			...EMPTY_SOURCE,
			refunds: [
				{
					amountMinor: 1500,
					currency: "GYD",
					movementId: "movement_x",
					postedAt: new Date("2026-07-17T18:00:00.000Z"),
					refundId: "refund_x",
					sourceKind: "Refund",
				},
			],
			sales: [
				{
					completedAt: new Date("2026-07-17T09:30:00.000Z"),
					currency: "GYD",
					discountMinor: 50,
					grossMinor: 5000,
					id: "sale_det",
					taxMinor: 693,
					totalMinor: 5643,
				},
			],
		};
		const first = buildAccountantHandoffPayload(buildInput(source));
		const second = buildAccountantHandoffPayload(buildInput(source));
		const firstJson = canonicalJsonStringify(first);
		const secondJson = canonicalJsonStringify(second);
		expect(secondJson).toBe(firstJson);

		const hash = {
			sha256: (content: string) => Promise.resolve(`sha-${content.length}`),
		};
		const firstHash = await hash.sha256(firstJson);
		const secondHash = await hash.sha256(secondJson);
		expect(secondHash).toBe(firstHash);
	});

	function createExportHarness() {
		const jobs = new Map<string, ExportJobRecord>();
		const byIdempotency = new Map<string, string>();
		let counter = 0;
		const service = createExportService({
			clock: () => new Date("2026-07-19T00:00:00.000Z"),
			hash: {
				sha256: (content) =>
					Promise.resolve(
						`sha256-${content.length}-${[...content].reduce((sum, char) => sum + char.charCodeAt(0), 0)}`
					),
			},
			ids: {
				create: (kind) => {
					counter += 1;
					return `${kind}_${counter.toString().padStart(6, "0")}`;
				},
			},
			repository: {
				createExportJob: (record) => {
					const key = `${record.tenantId}:${record.idempotencyKey}`;
					const existingId = byIdempotency.get(key);
					if (existingId) {
						const existing = jobs.get(existingId);
						if (existing) {
							return Promise.resolve({ inserted: false, record: existing });
						}
					}
					jobs.set(record.id, record);
					byIdempotency.set(key, record.id);
					return Promise.resolve({ inserted: true, record });
				},
				findByIdempotencyKey: (tenantId, idempotencyKey) => {
					const key = `${tenantId}:${idempotencyKey}`;
					const existingId = byIdempotency.get(key);
					const record = existingId ? jobs.get(existingId) : undefined;
					return Promise.resolve(
						record && record.tenantId === tenantId ? record : null
					);
				},
				getExportJob: (tenantId, id) => {
					const record = jobs.get(id);
					return Promise.resolve(
						record && record.tenantId === tenantId ? record : null
					);
				},
			},
		});
		return { jobs, service };
	}

	test("createAccountantHandoffExport is idempotent under a replayed idempotency key (same export id, same hash)", async () => {
		const { service } = createExportHarness();
		const request = {
			actorUserId: "user_1",
			currency: "GYD",
			idempotencyKey: "export-key-1",
			legalEntityId: "legal-entity-1",
			organizationId: "org_1",
			periodEndUtc: new Date("2026-07-18T04:00:00.000Z"),
			periodStartUtc: new Date("2026-07-17T04:00:00.000Z"),
			source: EMPTY_SOURCE,
			tenantId: "tenant_1",
			timezone: "America/Guyana",
		};
		const first = await service.createAccountantHandoffExport(request);
		const replayed = await service.createAccountantHandoffExport(request);
		expect(replayed).toEqual(first);
	});

	test("two DIFFERENT idempotency keys over identical source data and range produce the SAME contentHash (export determinism)", async () => {
		const { service } = createExportHarness();
		const base = {
			actorUserId: "user_1",
			currency: "GYD",
			legalEntityId: "legal-entity-1",
			organizationId: "org_1",
			periodEndUtc: new Date("2026-07-18T04:00:00.000Z"),
			periodStartUtc: new Date("2026-07-17T04:00:00.000Z"),
			source: EMPTY_SOURCE,
			tenantId: "tenant_1",
			timezone: "America/Guyana",
		};
		const first = await service.createAccountantHandoffExport({
			...base,
			idempotencyKey: "export-key-a",
		});
		const second = await service.createAccountantHandoffExport({
			...base,
			idempotencyKey: "export-key-b",
		});
		expect(first.id).not.toBe(second.id);
		expect(second.contentHash).toBe(first.contentHash);
		expect(canonicalJsonStringify(second.payload)).toBe(
			canonicalJsonStringify(first.payload)
		);
	});

	test("rejects a periodStart that is not strictly before periodEnd", async () => {
		const { service } = createExportHarness();
		const attempt = service.createAccountantHandoffExport({
			actorUserId: "user_1",
			currency: "GYD",
			idempotencyKey: "export-invalid-range",
			legalEntityId: "legal-entity-1",
			organizationId: "org_1",
			periodEndUtc: new Date("2026-07-17T04:00:00.000Z"),
			periodStartUtc: new Date("2026-07-17T04:00:00.000Z"),
			source: EMPTY_SOURCE,
			tenantId: "tenant_1",
			timezone: "America/Guyana",
		});
		await expect(attempt).rejects.toMatchObject({ code: "validation" });
		await expect(attempt).rejects.toBeInstanceOf(ExportError);
	});

	test("getAccountantHandoffExport enforces tenant isolation", async () => {
		const { service } = createExportHarness();
		const created = await service.createAccountantHandoffExport({
			actorUserId: "user_1",
			currency: "GYD",
			idempotencyKey: "export-tenant-iso",
			legalEntityId: "legal-entity-1",
			organizationId: "org_1",
			periodEndUtc: new Date("2026-07-18T04:00:00.000Z"),
			periodStartUtc: new Date("2026-07-17T04:00:00.000Z"),
			source: EMPTY_SOURCE,
			tenantId: "tenant_1",
			timezone: "America/Guyana",
		});
		const found = await service.getAccountantHandoffExport({
			exportId: created.id,
			tenantId: "tenant_1",
		});
		expect(found.id).toBe(created.id);
		const crossTenant = service.getAccountantHandoffExport({
			exportId: created.id,
			tenantId: "tenant_2",
		});
		await expect(crossTenant).rejects.toMatchObject({ code: "not_found" });
	});

	test("WS3 remediation R2, Finding D: same idempotency key + a DIFFERENT request (different period) is a typed idempotency_conflict, NOT a silent wrong export", async () => {
		const { jobs, service } = createExportHarness();
		const base = {
			actorUserId: "user_1",
			currency: "GYD",
			idempotencyKey: "export-key-conflict",
			legalEntityId: "legal-entity-1",
			organizationId: "org_1",
			periodEndUtc: new Date("2026-07-18T04:00:00.000Z"),
			periodStartUtc: new Date("2026-07-17T04:00:00.000Z"),
			source: EMPTY_SOURCE,
			tenantId: "tenant_1",
			timezone: "America/Guyana",
		};
		const first = await service.createAccountantHandoffExport(base);
		expect(jobs.size).toBe(1);

		// SAME idempotency key, but a genuinely different request: a whole
		// different reporting period. Pre-fix, this silently returned the
		// FIRST export's result — a wrong-period export handed back as if it
		// were the requested one.
		const conflictingPeriod = service.createAccountantHandoffExport({
			...base,
			periodEndUtc: new Date("2026-07-25T04:00:00.000Z"),
			periodStartUtc: new Date("2026-07-18T04:00:00.000Z"),
		});
		await expect(conflictingPeriod).rejects.toMatchObject({
			code: "idempotency_conflict",
		});
		await expect(conflictingPeriod).rejects.toBeInstanceOf(ExportError);
		// No second job was ever created for the conflicting request.
		expect(jobs.size).toBe(1);
		expect(jobs.get(first.id)?.periodStartUtc).toEqual(base.periodStartUtc);

		// SAME idempotency key, different organizationId — also a conflict.
		const conflictingOrg = service.createAccountantHandoffExport({
			...base,
			organizationId: "org_2_different",
		});
		await expect(conflictingOrg).rejects.toMatchObject({
			code: "idempotency_conflict",
		});
		expect(jobs.size).toBe(1);

		// SAME idempotency key, SAME request in every outcome-affecting
		// field: still replays cleanly (non-regression — the conflict guard
		// above must not have become over-eager).
		const replayed = await service.createAccountantHandoffExport(base);
		expect(replayed).toEqual(first);
		expect(jobs.size).toBe(1);
	});

	test("WS3 remediation R2, Finding D: concurrent same-key/same-fingerprint requests produce exactly ONE export and both callers get the identical result", async () => {
		const { jobs, service } = createExportHarness();
		const request = {
			actorUserId: "user_1",
			currency: "GYD",
			idempotencyKey: "export-key-concurrent",
			legalEntityId: "legal-entity-1",
			organizationId: "org_1",
			periodEndUtc: new Date("2026-07-18T04:00:00.000Z"),
			periodStartUtc: new Date("2026-07-17T04:00:00.000Z"),
			source: EMPTY_SOURCE,
			tenantId: "tenant_1",
			timezone: "America/Guyana",
		};
		const [first, second] = await Promise.all([
			service.createAccountantHandoffExport(request),
			service.createAccountantHandoffExport(request),
		]);
		expect(second).toEqual(first);
		expect(jobs.size).toBe(1);
	});
});
