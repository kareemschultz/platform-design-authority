"use client";

import type {
	CurrentIdentity,
	Location,
	Organization,
} from "@meridian/contracts-platform-api";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@meridian/ui-web/components/alert";
import { Label } from "@meridian/ui-web/components/label";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CloudOff } from "lucide-react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { ACTIVE_CONTEXT_STORAGE_KEY } from "@/lib/shell";
import { orpc } from "@/utils/orpc";

import { useOnlineStatus } from "./use-online-status";

interface WorkspaceValue {
	contextId: string | null;
	identity: CurrentIdentity | undefined;
	isLoading: boolean;
	isOnline: boolean;
	locations: Location[];
	organizations: Organization[];
	refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function useWorkspace(): WorkspaceValue {
	const value = useContext(WorkspaceContext);
	if (!value) {
		throw new Error("useWorkspace must be used inside WorkspaceProvider");
	}
	return value;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const isOnline = useOnlineStatus();
	const [storedContextId, setStoredContextId] = useState<string | null>(null);
	const storageLoaded = useRef(false);
	const initialContextAttempted = useRef(false);

	useEffect(() => {
		setStoredContextId(sessionStorage.getItem(ACTIVE_CONTEXT_STORAGE_KEY));
		storageLoaded.current = true;
	}, []);

	const identityQuery = useQuery({
		...orpc.identity.getCurrent.queryOptions({
			input: {
				headers: storedContextId
					? { "x-active-context-id": storedContextId }
					: {},
			},
		}),
		retry: false,
	});
	const setContext = useMutation(
		orpc.identity.setActiveContext.mutationOptions()
	);
	const contextId = identityQuery.data?.activeContext?.contextId ?? null;

	const persistContext = useCallback((next: string | null) => {
		setStoredContextId(next);
		if (next) {
			sessionStorage.setItem(ACTIVE_CONTEXT_STORAGE_KEY, next);
		} else {
			sessionStorage.removeItem(ACTIVE_CONTEXT_STORAGE_KEY);
		}
	}, []);

	const activate = useCallback(
		async (nextOrganizationId: string, locationId?: string | null) => {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: orpc.catalog.key() }),
				queryClient.cancelQueries({ queryKey: orpc.inventory.key() }),
			]);
			const result = await setContext.mutateAsync({
				body: {
					locationId: locationId ?? null,
					organizationId: nextOrganizationId,
				},
				headers: { "idempotency-key": crypto.randomUUID() },
			});
			queryClient.removeQueries({ queryKey: orpc.catalog.key() });
			queryClient.removeQueries({ queryKey: orpc.inventory.key() });
			persistContext(result.contextId);
			await queryClient.invalidateQueries({ queryKey: orpc.identity.key() });
		},
		[persistContext, queryClient, setContext]
	);

	useEffect(() => {
		if (
			!storageLoaded.current ||
			initialContextAttempted.current ||
			identityQuery.isLoading
		) {
			return;
		}
		if (identityQuery.isError && storedContextId) {
			// The next query runs without the stale context header. Keep activation
			// eligible so an active membership can establish a replacement context.
			initialContextAttempted.current = false;
			persistContext(null);
			return;
		}
		if (identityQuery.data?.activeContext) {
			initialContextAttempted.current = true;
			return;
		}
		const membership = identityQuery.data?.memberships.find(
			(item) => item.state === "Active"
		);
		if (membership) {
			initialContextAttempted.current = true;
			activate(membership.organizationId).catch(() => undefined);
		}
	}, [
		activate,
		identityQuery.data,
		identityQuery.isError,
		identityQuery.isLoading,
		persistContext,
		storedContextId,
	]);

	const organizationsQuery = useQuery({
		...orpc.organizations.list.queryOptions({
			input: {
				headers: { "x-active-context-id": contextId ?? "" },
				query: { limit: 200 },
			},
		}),
		enabled: Boolean(contextId),
		retry: false,
	});
	const organizationId = identityQuery.data?.activeContext?.organizationId;
	const locationsQuery = useQuery({
		...orpc.organizations.listLocations.queryOptions({
			input: {
				headers: { "x-active-context-id": contextId ?? "" },
				query: { limit: 200, organizationId: organizationId ?? "" },
			},
		}),
		enabled: Boolean(contextId && organizationId),
		retry: false,
	});

	const refresh = useCallback(async () => {
		await Promise.all([
			identityQuery.refetch(),
			organizationsQuery.refetch(),
			locationsQuery.refetch(),
		]);
	}, [identityQuery, locationsQuery, organizationsQuery]);

	const value = useMemo<WorkspaceValue>(
		() => ({
			contextId,
			identity: identityQuery.data,
			isLoading: identityQuery.isLoading || setContext.isPending,
			isOnline,
			locations: locationsQuery.data?.items ?? [],
			organizations: organizationsQuery.data?.items ?? [],
			refresh,
		}),
		[
			contextId,
			identityQuery.data,
			identityQuery.isLoading,
			isOnline,
			locationsQuery.data,
			organizationsQuery.data,
			refresh,
			setContext.isPending,
		]
	);

	let contextSummary = (
		<p className="text-destructive text-sm">
			No active organization membership is available.
		</p>
	);
	if (value.isLoading) {
		contextSummary = <Skeleton className="mt-2 h-5 w-64" />;
	} else if (contextId) {
		contextSummary = (
			<p className="text-muted-foreground text-sm">
				Tenant context is server-validated for this browser tab.
			</p>
		);
	}

	let connectivityAlert: React.ReactNode = null;
	if (!isOnline) {
		connectivityAlert = (
			<Alert className="mx-auto my-3 max-w-screen-2xl" role="status">
				<CloudOff />
				<AlertTitle>Offline</AlertTitle>
				<AlertDescription>
					Previously loaded information may be visible, but changes and
					authority checks require a connection.
				</AlertDescription>
			</Alert>
		);
	} else if (identityQuery.isError && !storedContextId) {
		connectivityAlert = (
			<Alert className="mx-auto my-3 max-w-screen-2xl" variant="destructive">
				<CircleAlert />
				<AlertTitle>Workspace unavailable</AlertTitle>
				<AlertDescription>Refresh the page or sign in again.</AlertDescription>
			</Alert>
		);
	}

	return (
		<WorkspaceContext.Provider value={value}>
			<section
				aria-label="Current workspace"
				className="border-b bg-muted/30 px-4 py-3"
			>
				<div className="mx-auto flex max-w-screen-2xl flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="font-medium text-sm">Current workspace</p>
						{contextSummary}
					</div>
					{contextId ? (
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="grid gap-1">
								<Label htmlFor="organization-context">Organization</Label>
								<select
									className="min-h-10 min-w-56 rounded-xl border bg-background px-3 text-sm"
									id="organization-context"
									onChange={(event) => activate(event.target.value)}
									value={organizationId}
								>
									{value.organizations.map((organization) => (
										<option key={organization.id} value={organization.id}>
											{organization.name}
										</option>
									))}
								</select>
							</div>
							<div className="grid gap-1">
								<Label htmlFor="location-context">Location</Label>
								<select
									className="min-h-10 min-w-56 rounded-xl border bg-background px-3 text-sm"
									id="location-context"
									onChange={(event) =>
										organizationId &&
										activate(organizationId, event.target.value || null)
									}
									value={identityQuery.data?.activeContext?.locationId ?? ""}
								>
									<option value="">All locations</option>
									{value.locations.map((location) => (
										<option key={location.id} value={location.id}>
											{location.name}
										</option>
									))}
								</select>
							</div>
						</div>
					) : null}
				</div>
			</section>
			{connectivityAlert}
			<div key={contextId ?? "no-active-context"}>{children}</div>
		</WorkspaceContext.Provider>
	);
}
