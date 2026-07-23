"use client";

import type {
	ImportFinding,
	ImportJob,
} from "@meridian/contracts-platform-api";
import { Badge } from "@meridian/ui-web/components/badge";
import { Button, buttonVariants } from "@meridian/ui-web/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@meridian/ui-web/components/dialog";
import { Input } from "@meridian/ui-web/components/input";
import { Label } from "@meridian/ui-web/components/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	Download,
	FileSpreadsheet,
	RefreshCw,
	ShieldAlert,
	Trash2,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
	canAcceptImport,
	canApproveImport,
	canCancelImport,
	downloadCorrectionReport,
	IMPORT_MAX_BYTES,
	IMPORT_STATES,
	type ImportTarget,
	importDetailHref,
	importTargetLabel,
	isTerminalImport,
	parseImportState,
	parseImportTarget,
	readCsvUpload,
} from "@/lib/imports";
import {
	appendCursorTrail,
	isVersionConflict,
	operationsHref,
	parseCursorTrail,
	previousCursorState,
	safeOperationsReturn,
	stableIntentKey,
} from "@/lib/operations";
import { workspaceWorkState } from "@/lib/workspace-change";
import { client, orpc } from "@/utils/orpc";

import {
	CollectionState,
	type DataColumn,
	MutationError,
	OperationsPageFrame,
	ResponsiveDataList,
	StateBadge,
} from "./operations-shared";
import { EmptyState, QueryFailure } from "./query-state";
import { useWorkspace, useWorkspaceWorkGuard } from "./workspace-context";

const formatDateTime = (value: string | null) =>
	value
		? new Intl.DateTimeFormat(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
			}).format(new Date(value))
		: "Not recorded";

function ImportFilters({ selectedTarget }: { selectedTarget: ImportTarget }) {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [target, setTarget] = useState<ImportTarget>(selectedTarget);
	const [state, setState] = useState(searchParams.get("state") ?? "");
	return (
		<form
			aria-label="Import filters"
			className="mb-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
			onSubmit={(event) => {
				event.preventDefault();
				router.push(
					operationsHref(pathname, searchParams, {
						cursor: null,
						cursorTrail: null,
						state: parseImportState(state) ?? null,
						target,
					})
				);
			}}
		>
			<div className="grid gap-1">
				<Label htmlFor="import-target-filter">Import type</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="import-target-filter"
					onChange={(event) => setTarget(parseImportTarget(event.target.value))}
					value={target}
				>
					<option value="product">Product</option>
					<option value="opening-stock">Opening stock</option>
				</select>
			</div>
			<div className="grid gap-1">
				<Label htmlFor="import-state-filter">State</Label>
				<select
					className="min-h-10 rounded-xl border bg-background px-3 text-sm"
					id="import-state-filter"
					onChange={(event) => setState(event.target.value)}
					value={state}
				>
					<option value="">All states</option>
					{IMPORT_STATES.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>
			<Button type="submit" variant="outline">
				Apply filters
			</Button>
		</form>
	);
}

export function ImportsPage() {
	const workspace = useWorkspace();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const target = parseImportTarget(searchParams.get("target"));
	const state = parseImportState(searchParams.get("state"));
	const cursor = searchParams.get("cursor") ?? undefined;
	const productImports = useQuery({
		...orpc.catalog.imports.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50, state },
			},
		}),
		enabled: Boolean(workspace.contextId && target === "product"),
		retry: false,
		staleTime: 10_000,
	});
	const openingStockImports = useQuery({
		...orpc.inventory.imports.listOpeningStock.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50, state },
			},
		}),
		enabled: Boolean(workspace.contextId && target === "opening-stock"),
		retry: false,
		staleTime: 10_000,
	});
	const imports = target === "product" ? productImports : openingStockImports;
	const returnTo = operationsHref(pathname, searchParams, {});
	const columns: DataColumn<ImportJob>[] = [
		{
			label: "Import",
			render: (job) => (
				<>
					<Link
						className="font-medium underline-offset-4 hover:underline"
						href={importDetailHref(target, job.id, returnTo)}
					>
						{job.humanReference}
					</Link>
					<span className="block text-muted-foreground text-xs">
						{job.sourceFileName}
					</span>
				</>
			),
		},
		{ label: "State", render: (job) => <StateBadge state={job.state} /> },
		{
			label: "Rows",
			render: (job) => `${job.counts.applied}/${job.counts.total} applied`,
		},
		{
			label: "Reconciliation",
			render: (job) => <StateBadge state={job.reconciliationState} />,
		},
		{ label: "Updated", render: (job) => formatDateTime(job.updatedAt) },
	];
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants()}
					href={`/operations/imports/new?target=${target}`}
				>
					<Upload /> Start import
				</Link>
			}
			description="Upload, validate, approve, commit, and reconcile bounded CSV imports without storing source files in the browser."
			title="Imports"
		>
			<ImportFilters selectedTarget={target} />
			<CollectionState
				caption={`${importTargetLabel(target)} imports in the current tenant`}
				columns={columns}
				empty={`No ${importTargetLabel(target).toLowerCase()} imports match this view.`}
				error={imports.error}
				isError={imports.isError}
				isFetching={imports.isFetching}
				isLoading={imports.isLoading}
				isOnline={workspace.isOnline}
				items={imports.data?.items}
				nextCursor={imports.data?.nextCursor}
				onRetry={() => imports.refetch()}
				rowKey={(job) => job.id}
			/>
		</OperationsPageFrame>
	);
}

interface ImportManifestValues {
	decimalSeparator: "." | ",";
	defaultUnit: string;
	delimiter: "," | ";" | "\t" | "|";
	locale: string;
	newline: "CRLF" | "LF";
	timezone: string;
}

const DEFAULT_MANIFEST: ImportManifestValues = {
	decimalSeparator: ".",
	defaultUnit: "",
	delimiter: ",",
	locale: "en-GY",
	newline: "LF",
	timezone: "America/Guyana",
};

export function ImportCreatePage() {
	const workspace = useWorkspace();
	const router = useRouter();
	const searchParams = useSearchParams();
	const [target, setTarget] = useState<ImportTarget>(
		parseImportTarget(searchParams.get("target"))
	);
	const [file, setFile] = useState<File | null>(null);
	const [manifest, setManifest] =
		useState<ImportManifestValues>(DEFAULT_MANIFEST);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<unknown>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const createIntent = useRef<ReturnType<typeof stableIntentKey> | null>(null);
	useWorkspaceWorkGuard(workspaceWorkState(isSubmitting, isDirty));
	const updateManifest = <K extends keyof ImportManifestValues>(
		key: K,
		value: ImportManifestValues[K]
	) => {
		setIsDirty(true);
		setManifest((current) => ({ ...current, [key]: value }));
	};
	return (
		<OperationsPageFrame
			actions={
				<Link
					className={buttonVariants({ variant: "outline" })}
					href={`/operations/imports?target=${target}`}
				>
					<ArrowLeft /> Back to Imports
				</Link>
			}
			description="The selected UTF-8 CSV is held only long enough to hash and send it. Validation, parsing, scanning, limits, and authority remain server-side."
			title="Start CSV import"
		>
			<form
				className="grid max-w-3xl gap-6"
				noValidate
				onSubmit={async (event) => {
					event.preventDefault();
					if (!(file && workspace.contextId && workspace.isOnline)) {
						return;
					}
					setError(null);
					setFileError(null);
					setIsSubmitting(true);
					try {
						let upload: Awaited<ReturnType<typeof readCsvUpload>>;
						try {
							upload = await readCsvUpload(file, file.name);
						} catch (caught) {
							setFileError(
								caught instanceof Error
									? caught.message
									: "The selected file could not be read. Choose another UTF-8 CSV."
							);
							return;
						}
						const body = {
							content: upload.content,
							contentType: "text/csv" as const,
							fileName: upload.fileName,
							manifest: {
								decimalSeparator: manifest.decimalSeparator,
								...(manifest.defaultUnit.trim()
									? { defaultUnit: manifest.defaultUnit.trim() }
									: {}),
								delimiter: manifest.delimiter,
								encoding: "UTF-8" as const,
								locale: manifest.locale.trim(),
								newline: manifest.newline,
								quote: '"' as const,
								timezone: manifest.timezone.trim(),
							},
							sha256: upload.sha256,
						};
						const intent = stableIntentKey(
							createIntent.current,
							JSON.stringify({
								body,
								contextId: workspace.contextId,
								target,
							}),
							() => crypto.randomUUID()
						);
						createIntent.current = intent;
						const input = {
							body,
							headers: {
								"idempotency-key": intent.key,
								"x-active-context-id": workspace.contextId,
							},
						};
						const job =
							target === "product"
								? await client.catalog.imports.create(input)
								: await client.inventory.imports.createOpeningStock(input);
						createIntent.current = null;
						setFile(null);
						setIsDirty(false);
						toast.success(`${importTargetLabel(target)} import uploaded`);
						router.push(importDetailHref(target, job.id));
					} catch (caught) {
						setError(caught);
					} finally {
						setIsSubmitting(false);
					}
				}}
			>
				<fieldset className="grid gap-4 rounded-2xl border p-4">
					<legend className="px-2 font-heading font-semibold">
						Import purpose
					</legend>
					<div className="grid gap-1">
						<Label htmlFor="create-import-target">Import type</Label>
						<select
							className="min-h-10 rounded-xl border bg-background px-3 text-sm"
							id="create-import-target"
							onChange={(event) => {
								setIsDirty(true);
								setTarget(parseImportTarget(event.target.value));
							}}
							value={target}
						>
							<option value="product">Product records</option>
							<option value="opening-stock">Opening stock facts</option>
						</select>
						<p className="text-muted-foreground text-sm">
							Opening stock is a governed ledger import. Corrections happen
							through import findings and later ledger-safe workflows, never by
							destructive client editing.
						</p>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="import-file">UTF-8 CSV file</Label>
						<Input
							accept=".csv,text/csv"
							aria-describedby={`import-file-help${fileError ? " import-file-error" : ""}`}
							aria-invalid={Boolean(fileError)}
							id="import-file"
							onChange={(event) => {
								setFileError(null);
								setError(null);
								setIsDirty(true);
								setFile(event.target.files?.[0] ?? null);
							}}
							required
							type="file"
						/>
						<p className="text-muted-foreground text-sm" id="import-file-help">
							Maximum {IMPORT_MAX_BYTES / 1024 / 1024} MiB. The browser does not
							parse the file or persist its contents.
						</p>
						{fileError ? (
							<p
								className="text-destructive text-sm"
								id="import-file-error"
								role="alert"
							>
								{fileError}
							</p>
						) : null}
					</div>
				</fieldset>

				<fieldset className="grid gap-4 rounded-2xl border p-4 sm:grid-cols-2">
					<legend className="px-2 font-heading font-semibold">
						CSV manifest
					</legend>
					<ManifestSelect
						id="import-delimiter"
						label="Delimiter"
						onChange={(value) =>
							updateManifest(
								"delimiter",
								value as ImportManifestValues["delimiter"]
							)
						}
						options={[
							[",", "Comma"],
							[";", "Semicolon"],
							["\t", "Tab"],
							["|", "Pipe"],
						]}
						value={manifest.delimiter}
					/>
					<ManifestSelect
						id="import-newline"
						label="Newline"
						onChange={(value) =>
							updateManifest(
								"newline",
								value as ImportManifestValues["newline"]
							)
						}
						options={[
							["LF", "LF"],
							["CRLF", "CRLF"],
						]}
						value={manifest.newline}
					/>
					<ManifestSelect
						id="import-decimal"
						label="Decimal separator"
						onChange={(value) =>
							updateManifest(
								"decimalSeparator",
								value as ImportManifestValues["decimalSeparator"]
							)
						}
						options={[
							[".", "Period (.)"],
							[",", "Comma (,)"],
						]}
						value={manifest.decimalSeparator}
					/>
					<div className="grid gap-1">
						<Label htmlFor="import-locale">Locale</Label>
						<Input
							id="import-locale"
							maxLength={35}
							onChange={(event) => updateManifest("locale", event.target.value)}
							required
							value={manifest.locale}
						/>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="import-timezone">Timezone</Label>
						<Input
							id="import-timezone"
							maxLength={100}
							onChange={(event) =>
								updateManifest("timezone", event.target.value)
							}
							required
							value={manifest.timezone}
						/>
					</div>
					<div className="grid gap-1">
						<Label htmlFor="import-unit">Default unit (optional)</Label>
						<Input
							id="import-unit"
							maxLength={50}
							onChange={(event) =>
								updateManifest("defaultUnit", event.target.value)
							}
							value={manifest.defaultUnit}
						/>
					</div>
					<p className="text-muted-foreground text-sm sm:col-span-2">
						Encoding is fixed to UTF-8 and quote is fixed to a double quote. The
						server validates this manifest against the uploaded content.
					</p>
				</fieldset>

				{workspace.isOnline ? null : (
					<div className="rounded-2xl border p-4" role="status">
						<p className="font-medium">Reconnect to upload</p>
						<p className="text-muted-foreground text-sm">
							Imports are intentionally online-only because validation,
							scanning, current authority, and idempotent job creation are
							server-owned.
						</p>
					</div>
				)}
				{error ? (
					<MutationError error={error} isOnline={workspace.isOnline} />
				) : null}
				<Button
					className="w-fit"
					disabled={
						isSubmitting ||
						!file ||
						!workspace.contextId ||
						!workspace.isOnline ||
						!manifest.locale.trim() ||
						!manifest.timezone.trim()
					}
					type="submit"
				>
					<Upload /> {isSubmitting ? "Hashing and uploading…" : "Upload CSV"}
				</Button>
			</form>
		</OperationsPageFrame>
	);
}

function ManifestSelect({
	id,
	label,
	onChange,
	options,
	value,
}: {
	id: string;
	label: string;
	onChange: (value: string) => void;
	options: ReadonlyArray<readonly [string, string]>;
	value: string;
}) {
	return (
		<div className="grid gap-1">
			<Label htmlFor={id}>{label}</Label>
			<select
				className="min-h-10 rounded-xl border bg-background px-3 text-sm"
				id={id}
				onChange={(event) => onChange(event.target.value)}
				value={value}
			>
				{options.map(([optionValue, optionLabel]) => (
					<option key={optionValue} value={optionValue}>
						{optionLabel}
					</option>
				))}
			</select>
		</div>
	);
}

function FindingsPager({ nextCursor }: { nextCursor: string | null }) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentCursor = searchParams.get("findingsCursor");
	const cursorTrail = parseCursorTrail(searchParams.get("cursorTrail"));
	const previous = previousCursorState(cursorTrail);
	if (!(previous || nextCursor)) {
		return null;
	}
	return (
		<nav
			aria-label="Import finding pages"
			className="mt-4 flex justify-between gap-3"
		>
			{previous ? (
				<Link
					className={buttonVariants({ variant: "outline" })}
					href={operationsHref(pathname, searchParams, {
						cursorTrail: previous.cursorTrail,
						findingsCursor: previous.cursor,
					})}
				>
					<ArrowLeft /> Previous findings
				</Link>
			) : (
				<span />
			)}
			{nextCursor ? (
				<Link
					className={buttonVariants({ variant: "outline" })}
					href={operationsHref(pathname, searchParams, {
						cursorTrail: appendCursorTrail(cursorTrail, currentCursor),
						findingsCursor: nextCursor,
					})}
				>
					Next findings <ArrowRight />
				</Link>
			) : null}
		</nav>
	);
}

function ImportFindings({
	error,
	isError,
	isLoading,
	isOnline,
	items,
	nextCursor,
	onRetry,
}: {
	error: unknown;
	isError: boolean;
	isLoading: boolean;
	isOnline: boolean;
	items: ImportFinding[] | undefined;
	nextCursor: string | null | undefined;
	onRetry: () => void;
}) {
	if (isLoading) {
		return <p role="status">Loading findings…</p>;
	}
	if (isError) {
		return <QueryFailure error={error} isOnline={isOnline} onRetry={onRetry} />;
	}
	if (!items?.length) {
		return (
			<EmptyState>
				No validation findings are recorded for this import.
			</EmptyState>
		);
	}
	const columns: DataColumn<ImportFinding>[] = [
		{ label: "Row", render: (finding) => finding.rowNumber },
		{
			label: "Severity",
			render: (finding) => <StateBadge state={finding.severity} />,
		},
		{ label: "Code", render: (finding) => finding.code },
		{ label: "Field", render: (finding) => finding.field ?? "Whole row" },
		{ label: "Source key", render: (finding) => finding.sourceKey },
	];
	return (
		<>
			<ResponsiveDataList
				caption="Import validation findings"
				columns={columns}
				items={items}
				rowKey={(finding) =>
					`${finding.rowNumber}:${finding.sourceKey}:${finding.code}`
				}
			/>
			<FindingsPager nextCursor={nextCursor ?? null} />
		</>
	);
}

type ImportAction = "accept" | "approve" | "cancel" | "purge";

function ImportActions({
	job,
	onChanged,
	target,
}: {
	job: ImportJob;
	onChanged: () => Promise<void>;
	target: ImportTarget;
}) {
	const workspace = useWorkspace();
	const [purgeOpen, setPurgeOpen] = useState(false);
	const [approveOpen, setApproveOpen] = useState(false);
	const [reportPending, setReportPending] = useState(false);
	const [reportError, setReportError] = useState<unknown>(null);
	const productApprove = useMutation(
		orpc.catalog.imports.approve.mutationOptions()
	);
	const productCancel = useMutation(
		orpc.catalog.imports.cancel.mutationOptions()
	);
	const productAccept = useMutation(
		orpc.catalog.imports.accept.mutationOptions()
	);
	const productPurge = useMutation(
		orpc.catalog.imports.purgeStaging.mutationOptions()
	);
	const stockApprove = useMutation(
		orpc.inventory.imports.approveOpeningStock.mutationOptions()
	);
	const stockCancel = useMutation(
		orpc.inventory.imports.cancelOpeningStock.mutationOptions()
	);
	const stockAccept = useMutation(
		orpc.inventory.imports.acceptOpeningStock.mutationOptions()
	);
	const stockPurge = useMutation(
		orpc.inventory.imports.purgeOpeningStockStaging.mutationOptions()
	);
	const lifecycleMutations = [
		productApprove,
		productCancel,
		productAccept,
		stockApprove,
		stockCancel,
		stockAccept,
	];
	const actionError = lifecycleMutations.find((item) => item.error)?.error;
	const actionPending = lifecycleMutations.some((item) => item.isPending);
	const purge = target === "product" ? productPurge : stockPurge;
	useWorkspaceWorkGuard(
		workspaceWorkState(actionPending || purge.isPending || reportPending, false)
	);
	const perform = async (action: ImportAction) => {
		if (!(workspace.contextId && workspace.isOnline)) {
			return;
		}
		const headers = {
			"idempotency-key": crypto.randomUUID(),
			"if-match": String(job.version),
			"x-active-context-id": workspace.contextId,
		};
		const input = { headers, params: { importId: job.id } };
		if (action === "purge") {
			const purgeInput = {
				headers: {
					"idempotency-key": headers["idempotency-key"],
					"x-active-context-id": workspace.contextId,
				},
				params: input.params,
			};
			const result =
				target === "product"
					? await productPurge.mutateAsync(purgeInput)
					: await stockPurge.mutateAsync(purgeInput);
			setPurgeOpen(false);
			toast.success(
				`Staging purge completed: ${result.rows} rows and ${result.findings} findings removed`
			);
			await onChanged();
			return;
		}
		if (target === "product") {
			if (action === "approve") {
				await productApprove.mutateAsync(input);
			} else if (action === "cancel") {
				await productCancel.mutateAsync(input);
			} else {
				await productAccept.mutateAsync(input);
			}
		} else if (action === "approve") {
			await stockApprove.mutateAsync(input);
		} else if (action === "cancel") {
			await stockCancel.mutateAsync(input);
		} else {
			await stockAccept.mutateAsync(input);
		}
		toast.success(`Import ${action} action completed`);
		await onChanged();
	};
	const requestAction = (action: ImportAction) => {
		perform(action).catch(() => undefined);
	};
	const downloadReport = async () => {
		if (!(workspace.contextId && workspace.isOnline)) {
			return;
		}
		setReportPending(true);
		setReportError(null);
		try {
			const input = {
				headers: { "x-active-context-id": workspace.contextId },
				params: { importId: job.id },
			};
			const report =
				target === "product"
					? await client.catalog.imports.correctionReport(input)
					: await client.inventory.imports.openingStockCorrectionReport(input);
			downloadCorrectionReport(report);
			toast.success("Correction report downloaded");
		} catch (caught) {
			setReportError(caught);
		} finally {
			setReportPending(false);
		}
	};
	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap gap-2">
				{canApproveImport(job) ? (
					<Dialog onOpenChange={setApproveOpen} open={approveOpen}>
						<DialogTrigger
							render={
								<Button disabled={actionPending || !workspace.isOnline} />
							}
						>
							Review and commit
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									Approve and commit {importTargetLabel(target)}?
								</DialogTitle>
								<DialogDescription>
									Current authority and maker/checker separation are checked
									again by the server. The uploader cannot approve their own
									import.
								</DialogDescription>
							</DialogHeader>
							<dl className="grid gap-2 rounded-xl border p-3 text-sm sm:grid-cols-2">
								<Definition label="Target" value={importTargetLabel(target)} />
								<Definition
									label="Total rows"
									value={String(job.counts.total)}
								/>
								<Definition label="Valid" value={String(job.counts.valid)} />
								<Definition
									label="Warnings"
									value={String(job.counts.warning)}
								/>
								<Definition
									label="Rejected or failed"
									value={String(job.counts.rejected + job.counts.failed)}
								/>
								<Definition label="Uploader" value={job.createdByUserId} />
							</dl>
							{target === "opening-stock" ? (
								<p className="text-sm">
									This posts immutable opening-stock ledger facts in the active
									workspace. Corrections require governed compensating
									movements; they are not destructive edits.
								</p>
							) : null}
							<MutationError
								error={actionError}
								isOnline={workspace.isOnline}
							/>
							<DialogFooter>
								<DialogClose render={<Button variant="outline" />}>
									Keep uncommitted
								</DialogClose>
								<Button
									disabled={actionPending || !workspace.isOnline}
									onClick={async () => {
										await perform("approve");
										setApproveOpen(false);
									}}
								>
									{actionPending ? "Working…" : "Approve and commit"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				) : null}
				{canCancelImport(job) ? (
					<Button
						disabled={actionPending || !workspace.isOnline}
						onClick={() => requestAction("cancel")}
						variant="outline"
					>
						Cancel import
					</Button>
				) : null}
				{canAcceptImport(job) ? (
					<Button
						disabled={actionPending || !workspace.isOnline}
						onClick={() => requestAction("accept")}
						variant="outline"
					>
						Accept reconciliation
					</Button>
				) : null}
				<Button
					disabled={reportPending || !workspace.isOnline}
					onClick={downloadReport}
					variant="outline"
				>
					<Download />
					{reportPending ? "Preparing report…" : "Correction report"}
				</Button>
			</div>
			<p className="text-muted-foreground text-sm">
				Approval uses current server authority and maker/checker enforcement.
				The uploader cannot approve their own import. Actions are unavailable
				offline.
			</p>
			{isVersionConflict(actionError) ? (
				<p className="text-destructive text-sm" role="alert">
					This import changed after the page loaded. No action was repeated.
					Refresh before deciding again.
				</p>
			) : (
				<MutationError error={actionError} isOnline={workspace.isOnline} />
			)}
			<MutationError error={reportError} isOnline={workspace.isOnline} />

			{isTerminalImport(job) ? (
				<details className="rounded-2xl border p-4">
					<summary className="cursor-pointer font-medium">
						Operator retention controls
					</summary>
					<div className="mt-3 grid gap-3">
						<p className="text-muted-foreground text-sm">
							This separately authorized action removes staging rows and
							findings, not the import job or audit evidence. The server
							enforces the governed 30-day minimum retention period; this page
							does not calculate or grant eligibility.
						</p>
						<Dialog onOpenChange={setPurgeOpen} open={purgeOpen}>
							<DialogTrigger render={<Button variant="destructive" />}>
								<Trash2 /> Request staging purge
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Purge retained staging data?</DialogTitle>
									<DialogDescription>
										Only an authorized operator can continue after the server
										confirms the 30-day retention gate. The import job and audit
										evidence remain.
									</DialogDescription>
								</DialogHeader>
								<MutationError
									error={purge.error}
									isOnline={workspace.isOnline}
								/>
								<DialogFooter>
									<DialogClose render={<Button variant="outline" />}>
										Keep staging data
									</DialogClose>
									<Button
										disabled={purge.isPending || !workspace.isOnline}
										onClick={() => requestAction("purge")}
										variant="destructive"
									>
										{purge.isPending
											? "Checking and purging…"
											: "Purge staging data"}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</details>
			) : null}
		</div>
	);
}

export function ImportDetailPage({
	importId,
	target: targetValue,
}: {
	importId: string;
	target: string;
}) {
	const workspace = useWorkspace();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const target = parseImportTarget(targetValue);
	const findingsCursor = searchParams.get("findingsCursor") ?? undefined;
	const productJob = useQuery({
		...orpc.catalog.imports.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { importId },
			},
		}),
		enabled: Boolean(workspace.contextId && target === "product"),
		refetchInterval: (query) => {
			const job = query.state.data;
			return workspace.isOnline && job && !isTerminalImport(job) ? 2000 : false;
		},
		retry: false,
	});
	const stockJob = useQuery({
		...orpc.inventory.imports.getOpeningStock.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { importId },
			},
		}),
		enabled: Boolean(workspace.contextId && target === "opening-stock"),
		refetchInterval: (query) => {
			const job = query.state.data;
			return workspace.isOnline && job && !isTerminalImport(job) ? 2000 : false;
		},
		retry: false,
	});
	const productFindings = useQuery({
		...orpc.catalog.imports.findings.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { importId },
				query: { cursor: findingsCursor, limit: 50 },
			},
		}),
		enabled: Boolean(workspace.contextId && target === "product"),
		retry: false,
	});
	const stockFindings = useQuery({
		...orpc.inventory.imports.openingStockFindings.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { importId },
				query: { cursor: findingsCursor, limit: 50 },
			},
		}),
		enabled: Boolean(workspace.contextId && target === "opening-stock"),
		retry: false,
	});
	const jobQuery = target === "product" ? productJob : stockJob;
	const findingsQuery = target === "product" ? productFindings : stockFindings;
	const returnTo = safeOperationsReturn(
		searchParams.get("returnTo"),
		`/operations/imports?target=${target}`
	);
	if (jobQuery.isLoading) {
		return (
			<OperationsPageFrame
				description="Loading current import authority and progress."
				title="Import"
			>
				<p role="status">Loading import…</p>
			</OperationsPageFrame>
		);
	}
	if (jobQuery.isError || !jobQuery.data) {
		return (
			<OperationsPageFrame
				description="The import could not be loaded in the current tenant."
				title="Import"
			>
				<QueryFailure
					error={jobQuery.error}
					isOnline={workspace.isOnline}
					onRetry={() => jobQuery.refetch()}
				/>
			</OperationsPageFrame>
		);
	}
	const job = jobQuery.data;
	const progress = Math.min(
		job.counts.total,
		job.counts.applied +
			job.counts.failed +
			job.counts.rejected +
			job.counts.skipped
	);
	const refresh = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: orpc.catalog.imports.key() }),
			queryClient.invalidateQueries({ queryKey: orpc.inventory.imports.key() }),
		]);
	};
	return (
		<OperationsPageFrame
			actions={
				<>
					<Link
						className={buttonVariants({ variant: "outline" })}
						href={returnTo}
					>
						<ArrowLeft /> Back to results
					</Link>
					<Button
						disabled={jobQuery.isFetching}
						onClick={() => jobQuery.refetch()}
						variant="outline"
					>
						<RefreshCw /> Refresh
					</Button>
				</>
			}
			description={`${importTargetLabel(target)} import. Current state automatically refreshes while work is active.`}
			title={job.humanReference}
		>
			<div className="mb-5 flex flex-wrap items-center gap-3">
				<StateBadge state={job.state} />
				<StateBadge state={job.reconciliationState} />
				<Badge variant="outline">Version {job.version}</Badge>
				{workspace.isOnline ? null : (
					<Badge variant="offline">Offline · read-only</Badge>
				)}
			</div>

			<section aria-labelledby="import-progress-heading" className="grid gap-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h2
						className="font-heading font-semibold text-xl"
						id="import-progress-heading"
					>
						Progress
					</h2>
					<span aria-live="polite" className="text-muted-foreground text-sm">
						{progress} of {job.counts.total} rows resolved
					</span>
				</div>
				<progress
					aria-label="Import row progress"
					className="h-3 w-full accent-primary"
					max={Math.max(job.counts.total, 1)}
					value={progress}
				/>
				<dl className="grid gap-3 sm:grid-cols-4">
					<Metric label="Valid" value={job.counts.valid} />
					<Metric label="Warnings" value={job.counts.warning} />
					<Metric label="Applied" value={job.counts.applied} />
					<Metric
						label="Rejected or failed"
						value={job.counts.rejected + job.counts.failed}
					/>
				</dl>
			</section>

			<section
				aria-labelledby="import-evidence-heading"
				className="mt-6 grid gap-3"
			>
				<h2
					className="font-heading font-semibold text-xl"
					id="import-evidence-heading"
				>
					Source and authority evidence
				</h2>
				<dl className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
					<Definition label="Source file" value={job.sourceFileName} />
					<Definition label="Scanner" value={job.scannerResult} />
					<Definition label="Created" value={formatDateTime(job.createdAt)} />
					<Definition label="Uploader" value={job.createdByUserId} />
					<Definition
						label="Approver"
						value={job.approvedByUserId ?? "Not approved"}
					/>
					<Definition
						label="Last completed row"
						value={String(job.lastCompletedRow)}
					/>
				</dl>
			</section>

			<section
				aria-labelledby="import-actions-heading"
				className="mt-6 grid gap-3"
			>
				<div className="flex items-center gap-2">
					<ShieldAlert aria-hidden="true" className="size-5" />
					<h2
						className="font-heading font-semibold text-xl"
						id="import-actions-heading"
					>
						Governed actions
					</h2>
				</div>
				<ImportActions job={job} onChanged={refresh} target={target} />
			</section>

			<section aria-labelledby="import-findings-heading" className="mt-6">
				<div className="mb-3 flex items-center gap-2">
					<FileSpreadsheet aria-hidden="true" className="size-5" />
					<h2
						className="font-heading font-semibold text-xl"
						id="import-findings-heading"
					>
						Findings
					</h2>
				</div>
				<ImportFindings
					error={findingsQuery.error}
					isError={findingsQuery.isError}
					isLoading={findingsQuery.isLoading}
					isOnline={workspace.isOnline}
					items={findingsQuery.data?.items}
					nextCursor={findingsQuery.data?.nextCursor}
					onRetry={() => findingsQuery.refetch()}
				/>
			</section>
		</OperationsPageFrame>
	);
}

function Metric({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-2xl border p-4">
			<dt className="text-muted-foreground text-sm">{label}</dt>
			<dd className="font-semibold text-2xl tabular-nums">{value}</dd>
		</div>
	);
}

function Definition({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid gap-1">
			<dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</dt>
			<dd className="break-all">{value}</dd>
		</div>
	);
}
