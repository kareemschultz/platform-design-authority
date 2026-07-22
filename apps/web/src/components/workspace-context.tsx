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
import { Button } from "@meridian/ui-web/components/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@meridian/ui-web/components/dialog";
import { Label } from "@meridian/ui-web/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@meridian/ui-web/components/select";
import { Skeleton } from "@meridian/ui-web/components/skeleton";
import {
	type QueryClient,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { CircleAlert, CloudOff } from "lucide-react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";

import { ACTIVE_CONTEXT_STORAGE_KEY } from "@/lib/shell";
import {
	isLatestWorkspaceRequest,
	type WorkspaceWorkState,
	workspaceSwitchDisposition,
} from "@/lib/workspace-change";
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
	registerWorkState: (key: string, state: WorkspaceWorkState) => () => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export async function recoverCancelledWorkspaceQueries(
	queryClient: QueryClient,
	requestSequence: number,
	currentRequestSequence: number
): Promise<boolean> {
	if (!isLatestWorkspaceRequest(requestSequence, currentRequestSequence)) {
		return false;
	}

	// Cancellation reverts an initial active query to pending/idle. If context
	// activation then fails, explicitly restart those observers against the
	// still-current workspace so the page cannot remain stranded indefinitely.
	await Promise.allSettled([
		queryClient.refetchQueries({
			queryKey: orpc.catalog.key(),
			type: "active",
		}),
		queryClient.refetchQueries({
			queryKey: orpc.inventory.key(),
			type: "active",
		}),
	]);
	return true;
}

export function useWorkspace(): WorkspaceValue {
	const value = useContext(WorkspaceContext);
	if (!value) {
		throw new Error("useWorkspace must be used inside WorkspaceProvider");
	}
	return value;
}

export function useWorkspaceWorkGuard(state: WorkspaceWorkState) {
	const { registerWorkState } = useWorkspace();
	const key = useId();
	useEffect(
		() => registerWorkState(key, state),
		[key, registerWorkState, state]
	);
}

interface ContextTarget {
	locationId?: string | null;
	organizationId: string;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
	const queryClient = useQueryClient();
	const isOnline = useOnlineStatus();
	const [storedContextId, setStoredContextId] = useState<string | null>(null);
	const storageLoaded = useRef(false);
	const initialContextAttempted = useRef(false);
	const contextRequestSequence = useRef(0);
	const workStates = useRef(new Map<string, WorkspaceWorkState>());
	const [pendingContextTarget, setPendingContextTarget] =
		useState<ContextTarget | null>(null);
	const [contextChangeMessage, setContextChangeMessage] = useState<
		string | null
	>(null);

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

	const registerWorkState = useCallback(
		(key: string, state: WorkspaceWorkState) => {
			if (state === "clean") {
				workStates.current.delete(key);
			} else {
				workStates.current.set(key, state);
			}
			return () => workStates.current.delete(key);
		},
		[]
	);

	const activate = useCallback(
		async (nextOrganizationId: string, locationId?: string | null) => {
			contextRequestSequence.current += 1;
			const requestSequence = contextRequestSequence.current;
			setContextChangeMessage(null);
			await Promise.all([
				queryClient.cancelQueries({ queryKey: orpc.catalog.key() }),
				queryClient.cancelQueries({ queryKey: orpc.inventory.key() }),
			]);
			const result = await setContext
				.mutateAsync({
					body: {
						locationId: locationId ?? null,
						organizationId: nextOrganizationId,
					},
					headers: { "idempotency-key": crypto.randomUUID() },
				})
				.catch(async (error: unknown) => {
					await recoverCancelledWorkspaceQueries(
						queryClient,
						requestSequence,
						contextRequestSequence.current
					);
					throw error;
				});
			if (
				!isLatestWorkspaceRequest(
					requestSequence,
					contextRequestSequence.current
				)
			) {
				return;
			}
			queryClient.removeQueries({ queryKey: orpc.catalog.key() });
			queryClient.removeQueries({ queryKey: orpc.inventory.key() });
			persistContext(result.contextId);
			await queryClient.invalidateQueries({ queryKey: orpc.identity.key() });
		},
		[persistContext, queryClient, setContext]
	);

	const requestContextChange = useCallback(
		(target: ContextTarget) => {
			if (setContext.isPending) {
				return;
			}
			const disposition = workspaceSwitchDisposition(
				workStates.current.values()
			);
			if (disposition === "block") {
				setContextChangeMessage(
					"Wait for the current change to finish before switching workspace."
				);
				return;
			}
			if (disposition === "confirm") {
				setPendingContextTarget(target);
				return;
			}
			activate(target.organizationId, target.locationId).catch(() =>
				setContextChangeMessage(
					"The workspace could not be changed. Your current workspace is still active."
				)
			);
		},
		[activate, setContext.isPending]
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
			registerWorkState,
		}),
		[
			contextId,
			identityQuery.data,
			identityQuery.isLoading,
			isOnline,
			locationsQuery.data,
			organizationsQuery.data,
			registerWorkState,
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
								<Select
									disabled={setContext.isPending}
									items={Object.fromEntries(
										value.organizations.map((organization) => [
											organization.id,
											organization.name,
										])
									)}
									onValueChange={(next) =>
										requestContextChange({
											organizationId: next as string,
										})
									}
									value={organizationId}
								>
									<SelectTrigger id="organization-context">
										<SelectValue placeholder="Select an organization" />
									</SelectTrigger>
									<SelectContent>
										{value.organizations.map((organization) => (
											<SelectItem key={organization.id} value={organization.id}>
												{organization.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-1">
								<Label htmlFor="location-context">Location</Label>
								<Select
									disabled={setContext.isPending}
									items={{
										all: "All locations",
										...Object.fromEntries(
											value.locations.map((location) => [
												location.id,
												location.name,
											])
										),
									}}
									onValueChange={(next) =>
										organizationId &&
										requestContextChange({
											locationId: next === "all" ? null : (next as string),
											organizationId,
										})
									}
									value={identityQuery.data?.activeContext?.locationId ?? "all"}
								>
									<SelectTrigger id="location-context">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All locations</SelectItem>
										{value.locations.map((location) => (
											<SelectItem key={location.id} value={location.id}>
												{location.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					) : null}
				</div>
			</section>
			{connectivityAlert}
			{contextChangeMessage ? (
				<Alert className="mx-auto my-3 max-w-screen-2xl" role="alert">
					<CircleAlert />
					<AlertTitle>Workspace not changed</AlertTitle>
					<AlertDescription>{contextChangeMessage}</AlertDescription>
				</Alert>
			) : null}
			<div key={contextId ?? "no-active-context"}>{children}</div>
			<Dialog
				onOpenChange={(open) => {
					if (!open) {
						setPendingContextTarget(null);
					}
				}}
				open={Boolean(pendingContextTarget)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Discard unsaved work and switch?</DialogTitle>
						<DialogDescription>
							Changing organization or location resets this workspace boundary.
							Unsaved form values in the current workspace will be discarded.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose render={<Button variant="outline" />}>
							Keep working here
						</DialogClose>
						<Button
							onClick={() => {
								const target = pendingContextTarget;
								setPendingContextTarget(null);
								if (target) {
									activate(target.organizationId, target.locationId).catch(() =>
										setContextChangeMessage(
											"The workspace could not be changed. Your current workspace is still active."
										)
									);
								}
							}}
							variant="destructive"
						>
							Discard work and switch
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</WorkspaceContext.Provider>
	);
}
