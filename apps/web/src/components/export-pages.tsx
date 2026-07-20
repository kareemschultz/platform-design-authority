"use client";

import type { AccountantHandoffExport } from "@meridian/contracts-platform-api";
import { Button } from "@meridian/ui-web/components/button";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { downloadAccountantHandoffExport } from "@/lib/pos";
import { orpc } from "@/utils/orpc";

import { MutationError, OperationsPageFrame } from "./operations-shared";
import { PosCrossLink, PosSectionCard, PosTextField } from "./pos-shared";
import { QueryFailure } from "./query-state";
import { useWorkspace } from "./workspace-context";

const ExportValuesSchema = z.object({
	currency: z.string().regex(/^[A-Z]{3}$/, "3-letter currency code"),
	legalEntityId: z
		.string()
		.min(12, "Legal entity ID must be at least 12 characters")
		.max(64)
		.regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, _ and - only"),
	periodEnd: z.string().min(1, "Period end is required"),
	periodStart: z.string().min(1, "Period start is required"),
	timezone: z.string().min(1).max(100),
});

function ExportResult({
	exportRecord,
}: {
	exportRecord: AccountantHandoffExport;
}) {
	return (
		<PosSectionCard title={`Export ${exportRecord.id}`}>
			<p>
				Legal entity:{" "}
				<span className="font-mono">{exportRecord.legalEntityId}</span>
			</p>
			<p>
				Period: {new Date(exportRecord.periodStart).toLocaleDateString()} –{" "}
				{new Date(exportRecord.periodEnd).toLocaleDateString()}
			</p>
			<p className="break-all font-mono text-muted-foreground text-xs">
				Content hash: {exportRecord.contentHash}
			</p>
			<Button
				onClick={() => {
					downloadAccountantHandoffExport(exportRecord);
					toast.success("Export downloaded");
				}}
				type="button"
			>
				Download
			</Button>
		</PosSectionCard>
	);
}

export function ExportCreatePage() {
	const workspace = useWorkspace();
	const create = useMutation(
		orpc.exports.createAccountantHandoff.mutationOptions()
	);
	const [created, setCreated] = useState<AccountantHandoffExport | null>(null);
	const [legalEntityIdTouched, setLegalEntityIdTouched] = useState(false);

	const form = useForm({
		defaultValues: {
			currency: "GYD",
			legalEntityId: "",
			periodEnd: "",
			periodStart: "",
			timezone: "America/Guyana",
		},
		onSubmit: async ({ value }) => {
			const exportRecord = await create.mutateAsync({
				body: {
					currency: value.currency,
					legalEntityId: value.legalEntityId,
					periodEnd: new Date(value.periodEnd).toISOString(),
					periodStart: new Date(value.periodStart).toISOString(),
					timezone: value.timezone,
				},
				headers: {
					"idempotency-key": crypto.randomUUID(),
					"x-active-context-id": workspace.contextId ?? "",
				},
			});
			setCreated(exportRecord);
			toast.success("Handoff export generated");
		},
		validators: { onSubmit: ExportValuesSchema },
	});

	// WS3 remediation R3, cycle 1 (remediation-of-remediation): the server
	// now derives the authoritative legal-entity scope for this export from
	// the caller's own active-context organizationId (see
	// `apps/server/composition/legal-entity-scope.ts`
	// `resolveContextLegalEntityId` and `finance-handoff.ts`
	// `requireExportContext`) — a value that does not match it is rejected.
	// Prefilling from the same organizationId means an ordinary user no
	// longer has to know or guess a value to type; the field stays editable
	// (not read-only) so a caller who intentionally needs to prove the
	// rejection path can still do so.
	const activeOrganizationId =
		workspace.identity?.activeContext?.organizationId;
	useEffect(() => {
		if (activeOrganizationId && !legalEntityIdTouched) {
			form.setFieldValue("legalEntityId", activeOrganizationId);
		}
	}, [activeOrganizationId, legalEntityIdTouched, form]);

	if (created) {
		return (
			<OperationsPageFrame
				description="Realizes platform.export.create."
				title="Handoff export generated"
			>
				<ExportResult exportRecord={created} />
			</OperationsPageFrame>
		);
	}

	return (
		<OperationsPageFrame
			description="Realizes platform.export.create (POST /v1/exports/accountant-handoff). Bounded to one legal entity and date range per FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md."
			title="Accountant handoff export"
		>
			<PosSectionCard title="Create a handoff export">
				<form
					className="grid max-w-xl gap-4"
					noValidate
					onSubmit={(event) => {
						event.preventDefault();
						form.handleSubmit();
					}}
				>
					<form.Field name="legalEntityId">
						{(field) => (
							<PosTextField
								field={{
									handleBlur: field.handleBlur,
									handleChange: (value: string) => {
										setLegalEntityIdTouched(true);
										field.handleChange(value);
									},
									name: field.name,
									state: field.state,
								}}
								label="Legal entity ID"
							/>
						)}
					</form.Field>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="periodStart">
							{(field) => (
								<PosTextField
									field={field}
									inputMode="text"
									label="Period start (date)"
									placeholder="2026-07-01"
								/>
							)}
						</form.Field>
						<form.Field name="periodEnd">
							{(field) => (
								<PosTextField
									field={field}
									inputMode="text"
									label="Period end (date)"
									placeholder="2026-07-18"
								/>
							)}
						</form.Field>
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="currency">
							{(field) => <PosTextField field={field} label="Currency" />}
						</form.Field>
						<form.Field name="timezone">
							{(field) => <PosTextField field={field} label="Timezone" />}
						</form.Field>
					</div>
					<MutationError error={create.error} isOnline={workspace.isOnline} />
					<Button
						className="w-fit"
						disabled={
							create.isPending || !workspace.contextId || !workspace.isOnline
						}
						type="submit"
					>
						{create.isPending ? "Generating…" : "Generate export"}
					</Button>
				</form>
			</PosSectionCard>
			<PosCrossLink
				description="Retrieve an export another browser generated, by ID."
				href="/operations/pos/exports/lookup"
				label="Look up an existing export"
			/>
		</OperationsPageFrame>
	);
}

export function ExportLookupPage() {
	const workspace = useWorkspace();
	const [exportId, setExportId] = useState("");
	const [submittedId, setSubmittedId] = useState("");
	const lookup = useQuery({
		...orpc.exports.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { exportId: submittedId },
			},
		}),
		enabled: Boolean(workspace.contextId && submittedId),
		retry: false,
	});

	return (
		<OperationsPageFrame
			description="Realizes platform.export.read — look up a previously generated export by ID (e.g. one generated by another browser)."
			title="Look up a handoff export"
		>
			<PosSectionCard title="Export lookup">
				<div className="grid max-w-md gap-4">
					<PosTextField
						field={{
							handleBlur: () => undefined,
							handleChange: setExportId,
							name: "exportId",
							state: { meta: { errors: [] }, value: exportId },
						}}
						label="Export ID"
					/>
					<Button
						className="w-fit"
						disabled={!exportId}
						onClick={() => setSubmittedId(exportId)}
						type="button"
					>
						Look up
					</Button>
				</div>
				{lookup.isError ? (
					<QueryFailure
						error={lookup.error}
						isOnline={workspace.isOnline}
						onRetry={() => lookup.refetch()}
					/>
				) : null}
			</PosSectionCard>
			{lookup.data ? <ExportResult exportRecord={lookup.data} /> : null}
		</OperationsPageFrame>
	);
}
