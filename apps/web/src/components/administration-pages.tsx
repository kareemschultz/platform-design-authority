"use client";

import type {
	AuditRecord,
	Entitlement,
	Party,
	Role,
	SessionSummary,
	UserSummary,
} from "@meridian/contracts-platform-api";
import { Badge } from "@meridian/ui-web/components/badge";
import { Button } from "@meridian/ui-web/components/button";
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
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@meridian/ui-web/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowRight,
	Building2,
	MapPin,
	ShieldCheck,
	UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

import { EmptyState, ListSkeleton, QueryFailure } from "./query-state";
import { useWorkspace } from "./workspace-context";

interface Column<T> {
	label: string;
	render: (item: T) => React.ReactNode;
}

const POSITIVE_STATE = /active|success|trial/i;
const NEGATIVE_STATE = /suspend|revoke|expired|failure|denied/i;

function PageFrame({
	children,
	description,
	title,
}: {
	children: React.ReactNode;
	description: string;
	title: string;
}) {
	return (
		<div className="mx-auto max-w-screen-2xl px-4 py-6">
			<header className="mb-6 max-w-3xl">
				<h1 className="font-heading font-semibold text-2xl">{title}</h1>
				<p className="mt-1 text-muted-foreground">{description}</p>
			</header>
			{children}
		</div>
	);
}

function ResponsiveList<T>({
	caption,
	columns,
	items,
	rowKey,
}: {
	caption: string;
	columns: Column<T>[];
	items: T[];
	rowKey: (item: T) => string;
}) {
	return (
		<>
			<div className="hidden rounded-2xl border md:block">
				<Table>
					<TableCaption className="sr-only">{caption}</TableCaption>
					<TableHeader>
						<TableRow>
							{columns.map((column) => (
								<TableHead key={column.label}>{column.label}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((item) => (
							<TableRow key={rowKey(item)}>
								{columns.map((column) => (
									<TableCell key={column.label}>
										{column.render(item)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<ul aria-label={caption} className="grid gap-3 md:hidden">
				{items.map((item) => (
					<li className="rounded-2xl border p-4" key={rowKey(item)}>
						<dl className="grid gap-3">
							{columns.map((column) => (
								<div className="grid gap-1" key={column.label}>
									<dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										{column.label}
									</dt>
									<dd>{column.render(item)}</dd>
								</div>
							))}
						</dl>
					</li>
				))}
			</ul>
		</>
	);
}

function CursorNext({ nextCursor }: { nextCursor: string | null }) {
	if (!nextCursor) {
		return null;
	}
	return (
		<div className="mt-4 flex justify-end">
			<Button
				className="min-h-10"
				render={<Link href={`?cursor=${encodeURIComponent(nextCursor)}`} />}
				variant="outline"
			>
				Next page <ArrowRight />
			</Button>
		</div>
	);
}

function useCursor() {
	return useSearchParams().get("cursor") ?? undefined;
}

function stateBadge(state: string) {
	let variant: "destructive" | "outline" | "secondary" = "outline";
	if (POSITIVE_STATE.test(state)) {
		variant = "secondary";
	} else if (NEGATIVE_STATE.test(state)) {
		variant = "destructive";
	}
	return <Badge variant={variant}>{state}</Badge>;
}

function QueryListState<T>({
	caption,
	columns,
	empty,
	error,
	isError,
	isFetching,
	isLoading,
	isOnline,
	items,
	nextCursor,
	onRetry,
	rowKey,
}: {
	caption: string;
	columns: Column<T>[];
	empty: string;
	error: unknown;
	isError: boolean;
	isFetching: boolean;
	isLoading: boolean;
	isOnline: boolean;
	items: T[] | undefined;
	nextCursor: string | null | undefined;
	onRetry: () => void;
	rowKey: (item: T) => string;
}) {
	if (isLoading) {
		return <ListSkeleton />;
	}
	if (isError) {
		return <QueryFailure error={error} isOnline={isOnline} onRetry={onRetry} />;
	}
	if (!items?.length) {
		return <EmptyState>{empty}</EmptyState>;
	}
	return (
		<>
			{isFetching ? (
				<p className="mb-3 text-muted-foreground text-sm" role="status">
					Refreshing current information...
				</p>
			) : null}
			<ResponsiveList
				caption={caption}
				columns={columns}
				items={items}
				rowKey={rowKey}
			/>
			<CursorNext nextCursor={nextCursor ?? null} />
		</>
	);
}

export function AdministrationOverview() {
	const workspace = useWorkspace();
	const partyQuery = useQuery({
		...orpc.parties.get.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				params: { partyId: workspace.identity?.partyId ?? "" },
			},
		}),
		enabled: Boolean(workspace.contextId && workspace.identity?.partyId),
		retry: false,
	});
	const party: Party | undefined = partyQuery.data;
	const context = workspace.identity?.activeContext;
	const organization = workspace.organizations.find(
		(item) => item.id === context?.organizationId
	);
	const location = workspace.locations.find(
		(item) => item.id === context?.locationId
	);
	return (
		<PageFrame
			description="Your current identity, tenant context, and administrative entry points."
			title="Administration"
		>
			<div className="grid gap-4 lg:grid-cols-3">
				<section
					aria-labelledby="identity-summary"
					className="rounded-2xl border p-5"
				>
					<UserRound className="mb-3 text-primary" />
					<h2 className="font-medium" id="identity-summary">
						Authenticated person
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						{party?.displayName ??
							(workspace.identity?.partyId
								? "Party summary is unavailable."
								: "No Party record is linked to this membership.")}
					</p>
					<p className="mt-2 text-xs">
						Assurance: {workspace.identity?.assuranceLevel ?? "Unknown"}
					</p>
				</section>
				<section
					aria-labelledby="organization-summary"
					className="rounded-2xl border p-5"
				>
					<Building2 className="mb-3 text-primary" />
					<h2 className="font-medium" id="organization-summary">
						Organization
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						{organization?.name ?? "No active organization"}
					</p>
					<p className="mt-2 text-xs">
						{organization?.timezone ?? "Timezone unavailable"}
					</p>
				</section>
				<section
					aria-labelledby="location-summary"
					className="rounded-2xl border p-5"
				>
					<MapPin className="mb-3 text-primary" />
					<h2 className="font-medium" id="location-summary">
						Location scope
					</h2>
					<p className="mt-2 text-muted-foreground text-sm">
						{location?.name ?? "All authorized locations"}
					</p>
					<p className="mt-2 text-xs">
						Server checks this scope on every protected request.
					</p>
				</section>
			</div>
			<section
				aria-labelledby="authority-note"
				className="mt-6 rounded-2xl border p-5"
			>
				<ShieldCheck className="mb-3 text-primary" />
				<h2 className="font-medium" id="authority-note">
					Authority is current-state
				</h2>
				<p className="mt-2 max-w-3xl text-muted-foreground text-sm">
					Navigation is not a security boundary. The server revalidates the
					session, membership, role assignment, entitlement, and tenant
					predicate for each operation.
				</p>
			</section>
		</PageFrame>
	);
}

export function UsersPage() {
	const workspace = useWorkspace();
	const cursor = useCursor();
	const query = useQuery({
		...orpc.users.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50 },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
	});
	const columns: Column<UserSummary>[] = [
		{
			label: "Person",
			render: (item) => (
				<>
					<span className="font-medium">
						{item.displayName ?? "Name unavailable"}
					</span>
					<span className="block text-muted-foreground text-xs">
						{item.email}
					</span>
				</>
			),
		},
		{
			label: "Authentication",
			render: (item) => stateBadge(item.authenticationState),
		},
		{
			label: "Memberships",
			render: (item) =>
				item.memberships.map((m) => m.state).join(", ") || "None",
		},
	];
	return (
		<PageFrame
			description="People with tenant memberships. Authentication and Party identity remain separate records."
			title="Users"
		>
			<QueryListState
				caption="Tenant users"
				columns={columns}
				empty="No users are available in this tenant."
				error={query.error}
				isError={query.isError}
				isFetching={query.isFetching}
				isLoading={query.isLoading}
				isOnline={workspace.isOnline}
				items={query.data?.items}
				nextCursor={query.data?.nextCursor}
				onRetry={() => query.refetch()}
				rowKey={(item) => item.authUserId}
			/>
		</PageFrame>
	);
}

export function RolesPage() {
	const workspace = useWorkspace();
	const cursor = useCursor();
	const query = useQuery({
		...orpc.roles.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50 },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
	});
	const columns: Column<Role>[] = [
		{
			label: "Role",
			render: (item) => (
				<>
					<span className="font-medium">{item.name}</span>
					<span className="block max-w-md truncate text-muted-foreground text-xs">
						{item.description ?? "No description"}
					</span>
				</>
			),
		},
		{ label: "State", render: (item) => stateBadge(item.state) },
		{
			label: "Permissions",
			render: (item) => `${item.permissionIds.length} assigned`,
		},
	];
	return (
		<PageFrame
			description="Tenant-scoped business roles and their governed permission sets."
			title="Roles"
		>
			<QueryListState
				caption="Tenant roles"
				columns={columns}
				empty="No roles are available in this tenant."
				error={query.error}
				isError={query.isError}
				isFetching={query.isFetching}
				isLoading={query.isLoading}
				isOnline={workspace.isOnline}
				items={query.data?.items}
				nextCursor={query.data?.nextCursor}
				onRetry={() => query.refetch()}
				rowKey={(item) => item.id}
			/>
		</PageFrame>
	);
}

export function EntitlementsPage() {
	const workspace = useWorkspace();
	const cursor = useCursor();
	const query = useQuery({
		...orpc.entitlements.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50 },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
	});
	const columns: Column<Entitlement>[] = [
		{
			label: "Capability",
			render: (item) => (
				<span className="font-medium">{item.capabilityId}</span>
			),
		},
		{ label: "State", render: (item) => stateBadge(item.state) },
		{ label: "Provisioning source", render: (item) => item.source },
		{
			label: "Limits",
			render: (item) =>
				Object.keys(item.limits).length
					? Object.entries(item.limits)
							.map(([key, value]) => `${key}: ${value}`)
							.join(", ")
					: "No limits",
		},
	];
	return (
		<PageFrame
			description="Provisioned capabilities. Entitlements do not grant an individual permission."
			title="Entitlements"
		>
			<QueryListState
				caption="Tenant entitlements"
				columns={columns}
				empty="No capabilities are provisioned for this tenant."
				error={query.error}
				isError={query.isError}
				isFetching={query.isFetching}
				isLoading={query.isLoading}
				isOnline={workspace.isOnline}
				items={query.data?.items}
				nextCursor={query.data?.nextCursor}
				onRetry={() => query.refetch()}
				rowKey={(item) => item.id}
			/>
		</PageFrame>
	);
}

function RevokeSessionButton({ session }: { session: SessionSummary }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const revoke = useMutation(
		orpc.sessions.revoke.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({ queryKey: orpc.sessions.key() });
				if (session.current) {
					await authClient.signOut();
					router.push("/login?returnTo=/administration&reason=session-revoked");
				}
			},
		})
	);
	return (
		<Dialog>
			<DialogTrigger render={<Button className="min-h-10" variant="outline" />}>
				Revoke
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Revoke {session.current ? "this session" : "session"}?
					</DialogTitle>
					<DialogDescription>
						{session.current
							? "You will be signed out immediately."
							: "That device will be rejected on its next protected request."}
					</DialogDescription>
				</DialogHeader>
				{revoke.isError ? (
					<p className="text-destructive text-sm" role="alert">
						The session could not be revoked. Try again.
					</p>
				) : null}
				<DialogFooter>
					<DialogClose
						render={<Button className="min-h-10" variant="outline" />}
					>
						Cancel
					</DialogClose>
					<Button
						className="min-h-10"
						disabled={revoke.isPending}
						onClick={() =>
							revoke.mutate({
								headers: { "idempotency-key": crypto.randomUUID() },
								params: { sessionId: session.id },
							})
						}
						variant="destructive"
					>
						{revoke.isPending ? "Revoking..." : "Revoke session"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function SessionsPage() {
	const workspace = useWorkspace();
	const cursor = useCursor();
	const query = useQuery({
		...orpc.sessions.list.queryOptions({
			input: { query: { cursor, limit: 50 } },
		}),
		retry: false,
	});
	const columns: Column<SessionSummary>[] = [
		{
			label: "Device",
			render: (item) => (
				<>
					<span className="font-medium">
						{item.deviceLabel ?? item.userAgentSummary ?? "Unknown device"}
					</span>
					{item.current ? (
						<Badge className="ms-2" variant="secondary">
							Current
						</Badge>
					) : null}
				</>
			),
		},
		{
			label: "Network",
			render: (item) => item.ipAddressMasked ?? "Not recorded",
		},
		{
			label: "Last active",
			render: (item) =>
				new Intl.DateTimeFormat(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				}).format(new Date(item.updatedAt)),
		},
		{
			label: "Action",
			render: (item) => <RevokeSessionButton session={item} />,
		},
	];
	return (
		<PageFrame
			description="Review signed-in devices and revoke access. Revocation is authoritative, not a UI-only action."
			title="Sessions"
		>
			<QueryListState
				caption="Your sessions"
				columns={columns}
				empty="No active sessions were returned."
				error={query.error}
				isError={query.isError}
				isFetching={query.isFetching}
				isLoading={query.isLoading}
				isOnline={workspace.isOnline}
				items={query.data?.items}
				nextCursor={query.data?.nextCursor}
				onRetry={() => query.refetch()}
				rowKey={(item) => item.id}
			/>
		</PageFrame>
	);
}

export function AuditPage() {
	const workspace = useWorkspace();
	const cursor = useCursor();
	const query = useQuery({
		...orpc.audit.list.queryOptions({
			input: {
				headers: { "x-active-context-id": workspace.contextId ?? "" },
				query: { cursor, limit: 50 },
			},
		}),
		enabled: Boolean(workspace.contextId),
		retry: false,
	});
	const columns: Column<AuditRecord>[] = [
		{
			label: "Action",
			render: (item) => (
				<>
					<span className="font-medium">{item.action}</span>
					<span className="block text-muted-foreground text-xs">
						{item.targetType}
					</span>
				</>
			),
		},
		{ label: "Outcome", render: (item) => stateBadge(item.outcome) },
		{ label: "Actor", render: (item) => item.actorType },
		{ label: "Classification", render: (item) => item.classification },
		{
			label: "Occurred",
			render: (item) =>
				new Intl.DateTimeFormat(undefined, {
					dateStyle: "medium",
					timeStyle: "short",
				}).format(new Date(item.occurredAt)),
		},
	];
	return (
		<PageFrame
			description="Append-only security and administration evidence. Sensitive metadata is not expanded in this shell."
			title="Audit"
		>
			<QueryListState
				caption="Tenant audit records"
				columns={columns}
				empty="No audit records match this page."
				error={query.error}
				isError={query.isError}
				isFetching={query.isFetching}
				isLoading={query.isLoading}
				isOnline={workspace.isOnline}
				items={query.data?.items}
				nextCursor={query.data?.nextCursor}
				onRetry={() => query.refetch()}
				rowKey={(item) => item.id}
			/>
		</PageFrame>
	);
}
