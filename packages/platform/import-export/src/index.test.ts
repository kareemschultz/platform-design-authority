import { describe, expect, test } from "bun:test";
import {
	CSV_IMPORT_LIMITS,
	createImportService,
	type ImportCommandReceipt,
	ImportError,
	type ImportFinding,
	type ImportJobRecord,
	type ImportRepository,
	type ImportRowRecord,
	type ImportTarget,
} from ".";

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
