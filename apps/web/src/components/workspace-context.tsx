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
	isGuardableInternalNavigation,
	isLatestWorkspaceRequest,
	isPlainLeftClick,
	shouldWarnBeforeLeaving,
	type WorkspaceWorkState,
	workspaceSwitchDisposition,
} from "@/lib/workspace-change";
import { orpc } from "@/utils/orpc";

import { useOnlineStatus } from "./use-online-status";

interface WorkspaceValue {
	/** WS3 remediation R4: the SAME "unsaved changes — leave anyway?"
	 * question the in-app anchor-click guard (below) answers automatically
	 * for `<a href>` navigation, exposed for a caller that triggers
	 * navigation through something OTHER than a plain anchor click — the
	 * mobile section `<select>` (`PosNavigation`/`OperationsNavigation`)
	 * is exactly this case: its `onChange` calls `router.push` directly,
	 * which the document-level anchor click-listener never sees at all
	 * (confirmed: it only ever inspects `event.target.closest("a[href]")`),
	 * so a dirty sale-cart draft silently discarded with zero warning on a
	 * narrow viewport, while the identical navigation intent on a wide
	 * viewport (an actual `<a>` click) already correctly warned. Returns
	 * `true` when it is safe to proceed (nothing unsaved/in-flight, or the
	 * user explicitly confirmed discarding it) and `false` when the caller
	 * must NOT navigate (the user cancelled). */
	confirmLeaveIfDirty: () => boolean;
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

/**
 * WS3 remediation R3b, Item 10 (accessible route state).
 *
 * Before this fix, the loading branch below was a bare `<Skeleton>` with
 * no heading and no accessible name at all — the WS1 workspace-context
 * fix already ensures the EVENTUAL content is correct, but this loading
 * WINDOW itself (which every hard navigation/reload into `/operations/*`
 * or `/administration/*` passes through, since `identityQuery` always
 * starts unresolved) rendered with ZERO `<h1>` anywhere in the DOM —
 * `Header` has no h1, and the eventual page's own h1 (from
 * `OperationsPageFrame` / administration's `PageFrame`) does not exist
 * yet because `children` is not mounted during loading. This is the
 * "intermittent missing-h1 landing state": intermittent because ordinary
 * in-app navigation within the same layout subtree does not remount
 * `WorkspaceProvider` (so most navigations never hit this window), but
 * every fresh reload or deep link does, unconditionally.
 *
 * A separate, directly-testable component (matching `loader.tsx`'s own
 * `renderToStaticMarkup`-tested pattern) so the exact markup asserted in
 * `workspace-context.test.ts` is the exact markup actually rendered, not
 * a re-implementation the test could drift from.
 */
export function WorkspaceLoadingState() {
	return (
		<div className="mx-auto max-w-screen-2xl px-4 py-10">
			{/* A real (visually-hidden, not decorative) heading — guarantees
			 * this window always has exactly one accessible h1, closing the
			 * intermittent gap regardless of how long the window lasts. */}
			<h1 className="sr-only">Loading workspace</h1>
			<div aria-label="Loading workspace" className="grid gap-3" role="status">
				<Skeleton className="h-24 w-full" />
			</div>
		</div>
	);
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
	const [hasReadStorage, setHasReadStorage] = useState(false);
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
		setHasReadStorage(true);
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

	// WS3 remediation R3b, Item 8 (recoverable task state — dirty carts and
	// mutation forms must be protected across navigation, back, reload, and
	// tab close, not just workspace change). Tracks whether an extra
	// "sentinel" history entry is currently absorbing the browser Back
	// button's next `popstate` — see the `popstate` effect below for the
	// full mechanism. Reset to `false` whenever every registered work state
	// returns to "clean" (including on a successful commit, which clears
	// its own guard key), so a LATER dirty episode pushes a fresh sentinel
	// rather than being silently skipped because a stale one was never
	// reset.
	const historySentinelPushedRef = useRef(false);

	const registerWorkState = useCallback(
		(key: string, state: WorkspaceWorkState) => {
			if (state === "clean") {
				workStates.current.delete(key);
			} else {
				workStates.current.set(key, state);
			}
			if (shouldWarnBeforeLeaving(workStates.current.values())) {
				if (!historySentinelPushedRef.current) {
					historySentinelPushedRef.current = true;
					window.history.pushState(
						{ workGuardSentinel: true },
						"",
						window.location.href
					);
				}
			} else {
				historySentinelPushedRef.current = false;
			}
			return () => workStates.current.delete(key);
		},
		[]
	);

	// WS3 remediation R4: see `WorkspaceValue.confirmLeaveIfDirty`'s own
	// doc comment for why this exists — the SAME synchronous `window.
	// confirm` prompt the anchor click-guard below shows, exposed for a
	// non-anchor navigation trigger.
	const confirmLeaveIfDirty = useCallback(() => {
		if (!shouldWarnBeforeLeaving(workStates.current.values())) {
			return true;
		}
		// biome-ignore lint/suspicious/noAlert: synchronous confirmation required, matching the identical anchor-click and popstate guards elsewhere in this file
		return window.confirm(
			"You have unsaved changes in this workspace. Leave this page and discard them?"
		);
	}, []);

	// Native `beforeunload` covers reload and tab/window close — the ONE
	// exit path a client-side `popstate`/click-capture guard can never
	// intercept, since the page is actually about to be torn down.
	useEffect(() => {
		function handleBeforeUnload(event: BeforeUnloadEvent) {
			if (shouldWarnBeforeLeaving(workStates.current.values())) {
				event.preventDefault();
				// Legacy requirement some browsers still honor for showing
				// their own native "leave site?" prompt; the string itself is
				// never actually displayed by modern browsers.
				event.returnValue = "";
			}
		}
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, []);

	// In-app navigation guard: Next.js App Router exposes no built-in
	// "confirm before navigating away" hook, so this intercepts real
	// anchor clicks (which is what every `next/link` `<Link>` renders,
	// including `PosNavigation`/`OperationsNavigation`'s own links) in the
	// CAPTURE phase — before the Link's own bubble-phase click handler
	// (which calls the router) ever runs — so `stopPropagation` here
	// genuinely prevents the navigation, not just this listener's own view
	// of it.
	useEffect(() => {
		function findGuardableAnchor(event: MouseEvent): HTMLAnchorElement | null {
			const { target } = event;
			if (!(target instanceof Element)) {
				return null;
			}
			const anchor = target.closest("a[href]");
			if (!(anchor instanceof HTMLAnchorElement)) {
				return null;
			}
			const guardable = isGuardableInternalNavigation(
				{
					hasDownloadAttribute: anchor.hasAttribute("download"),
					href: anchor.href,
					target: anchor.target,
				},
				window.location.href
			);
			return guardable ? anchor : null;
		}

		function handleClick(event: MouseEvent) {
			if (
				!(
					shouldWarnBeforeLeaving(workStates.current.values()) &&
					isPlainLeftClick(event)
				)
			) {
				return;
			}
			if (!findGuardableAnchor(event)) {
				return;
			}
			// This must be a SYNCHRONOUS decision made inside the click
			// handler itself, before the browser's own default navigation
			// proceeds — a stateful/async dialog (e.g. the app's own Base UI
			// AlertDialog, used everywhere else per CLAUDE.md §8) cannot
			// answer in time to still call `preventDefault()` on THIS event.
			// Matches the native `beforeunload` prompt this same guard
			// already shows for the SAME question at a different exit point.
			// biome-ignore lint/suspicious/noAlert: synchronous confirmation required, see comment above
			const confirmed = window.confirm(
				"You have unsaved changes in this workspace. Leave this page and discard them?"
			);
			if (!confirmed) {
				event.preventDefault();
				event.stopPropagation();
			}
		}
		document.addEventListener("click", handleClick, true);
		return () => document.removeEventListener("click", handleClick, true);
	}, []);

	// Browser Back/Forward guard: `registerWorkState` (above) pushes one
	// extra history entry the moment work first becomes dirty/pending, so
	// the user's next Back press pops THAT sentinel entry first (landing
	// back on the SAME url) and fires `popstate` here instead of actually
	// leaving. Confirmed => genuinely go back (one more `history.back()`,
	// past the sentinel this handler's own pop just consumed). Cancelled
	// => push the sentinel again so a repeated Back press is still guarded.
	useEffect(() => {
		function handlePopState() {
			if (!shouldWarnBeforeLeaving(workStates.current.values())) {
				return;
			}
			// See the click-guard effect's identical comment above — a
			// `popstate` handler must answer synchronously too; the browser
			// has already popped the history entry by the time this runs.
			// biome-ignore lint/suspicious/noAlert: synchronous confirmation required, see comment above
			const confirmed = window.confirm(
				"You have unsaved changes in this workspace. Leave this page and discard them?"
			);
			if (confirmed) {
				historySentinelPushedRef.current = false;
				window.history.back();
			} else {
				historySentinelPushedRef.current = true;
				window.history.pushState(
					{ workGuardSentinel: true },
					"",
					window.location.href
				);
			}
		}
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

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
			!hasReadStorage ||
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
		hasReadStorage,
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
			confirmLeaveIfDirty,
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
			confirmLeaveIfDirty,
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
			<Alert
				className="mx-auto my-3 max-w-screen-2xl print:hidden"
				role="status"
			>
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
			<Alert
				className="mx-auto my-3 max-w-screen-2xl print:hidden"
				variant="destructive"
			>
				<CircleAlert />
				<AlertTitle>Workspace unavailable</AlertTitle>
				<AlertDescription>Refresh the page or sign in again.</AlertDescription>
			</Alert>
		);
	}

	return (
		<WorkspaceContext.Provider value={value}>
			{/* WS3 remediation R3b, Item 12 (print composition): application
			 * chrome — the workspace switcher bar never belongs on a printed
			 * receipt or any other printed page. */}
			<section
				aria-label="Current workspace"
				className="border-b bg-muted/30 px-4 py-3 print:hidden"
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
									disabled={setContext.isPending}
									id="organization-context"
									onChange={(event) =>
										requestContextChange({
											organizationId: event.target.value,
										})
									}
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
									disabled={setContext.isPending}
									id="location-context"
									onChange={(event) =>
										organizationId &&
										requestContextChange({
											locationId: event.target.value || null,
											organizationId,
										})
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
			{contextChangeMessage ? (
				<Alert
					className="mx-auto my-3 max-w-screen-2xl print:hidden"
					role="alert"
				>
					<CircleAlert />
					<AlertTitle>Workspace not changed</AlertTitle>
					<AlertDescription>{contextChangeMessage}</AlertDescription>
				</Alert>
			) : null}
			{value.isLoading ? (
				// `key={contextId}` below intentionally remounts `children` on a
				// genuine context change, discarding any workspace-scoped form
				// state (the switch-confirmation dialog above says as much). But
				// `contextId` starts `null` on every hard navigation until
				// `identityQuery` resolves with the persisted context header —
				// mounting `children` against that transient `null` key first,
				// then swapping to the real key moments later, remounts a page
				// the user may already be mid-interaction with. Holding off
				// until the identity query has actually settled means `children`
				// only ever mounts once, against the already-resolved contextId.
				<WorkspaceLoadingState />
			) : (
				<div key={contextId ?? "no-active-context"}>{children}</div>
			)}
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
