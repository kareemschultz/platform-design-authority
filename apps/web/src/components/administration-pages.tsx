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
	Card,
	CardContent,
	CardHeader,
} from "@meridian/ui-web/components/card";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

import {
	CollectionState,
	type DataColumn,
	StateBadge,
} from "./operations-shared";
import { useWorkspace } from "./workspace-context";

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

function useCursor() {
	return useSearchParams().get("cursor") ?? undefined;
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
				<Card aria-labelledby="identity-summary-heading" role="region">
					<CardHeader>
						<UserRound className="text-primary" />
						<h2
							className="cn-font-heading font-medium text-sm"
							data-slot="card-title"
							id="identity-summary-heading"
						>
							Authenticated person
						</h2>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<p className="text-muted-foreground text-sm">
							{party?.displayName ??
								(workspace.identity?.partyId
									? "Party summary is unavailable."
									: "No Party record is linked to this membership.")}
						</p>
						<p className="text-xs">
							Assurance: {workspace.identity?.assuranceLevel ?? "Unknown"}
						</p>
					</CardContent>
				</Card>
				<Card aria-labelledby="organization-summary-heading" role="region">
					<CardHeader>
						<Building2 className="text-primary" />
						<h2
							className="cn-font-heading font-medium text-sm"
							data-slot="card-title"
							id="organization-summary-heading"
						>
							Organization
						</h2>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<p className="text-muted-foreground text-sm">
							{organization?.name ?? "No active organization"}
						</p>
						<p className="text-xs">
							{organization?.timezone ?? "Timezone unavailable"}
						</p>
					</CardContent>
				</Card>
				<Card aria-labelledby="location-summary-heading" role="region">
					<CardHeader>
						<MapPin className="text-primary" />
						<h2
							className="cn-font-heading font-medium text-sm"
							data-slot="card-title"
							id="location-summary-heading"
						>
							Location scope
						</h2>
					</CardHeader>
					<CardContent className="flex flex-col gap-2">
						<p className="text-muted-foreground text-sm">
							{location?.name ?? "All authorized locations"}
						</p>
						<p className="text-xs">
							Server checks this scope on every protected request.
						</p>
					</CardContent>
				</Card>
			</div>
			<Card
				aria-labelledby="authority-note-heading"
				className="mt-6"
				role="region"
			>
				<CardHeader>
					<ShieldCheck className="text-primary" />
					<h2
						className="cn-font-heading font-medium text-sm"
						data-slot="card-title"
						id="authority-note-heading"
					>
						Authority is current-state
					</h2>
				</CardHeader>
				<CardContent>
					<p className="max-w-3xl text-muted-foreground text-sm">
						Navigation is not a security boundary. The server revalidates the
						session, membership, role assignment, entitlement, and tenant
						predicate for each operation.
					</p>
				</CardContent>
			</Card>
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
	const columns: DataColumn<UserSummary>[] = [
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
			render: (item) => <StateBadge state={item.authenticationState} />,
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
			<CollectionState
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
	const columns: DataColumn<Role>[] = [
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
		{ label: "State", render: (item) => <StateBadge state={item.state} /> },
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
			<CollectionState
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
	const columns: DataColumn<Entitlement>[] = [
		{
			label: "Capability",
			render: (item) => (
				<span className="font-medium">{item.capabilityId}</span>
			),
		},
		{ label: "State", render: (item) => <StateBadge state={item.state} /> },
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
			<CollectionState
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
			<DialogTrigger render={<Button variant="outline" />}>
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
					<DialogClose render={<Button variant="outline" />}>
						Cancel
					</DialogClose>
					<Button
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
	const columns: DataColumn<SessionSummary>[] = [
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
			<CollectionState
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
	const columns: DataColumn<AuditRecord>[] = [
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
		{ label: "Outcome", render: (item) => <StateBadge state={item.outcome} /> },
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
			<CollectionState
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
