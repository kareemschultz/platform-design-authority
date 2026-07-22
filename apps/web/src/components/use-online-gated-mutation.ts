"use client";

import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";

/** A financial mutation attempted while offline that this wrapper rejected
 * before ever touching TanStack Query's mutation cache — distinct from a
 * genuine network/server failure. `MutationError` (operations-shared.tsx)
 * already special-cases `!isOnline` regardless of the error instance, so
 * callers do not need to branch on this type; it exists mainly so tests
 * can assert the rejection reason precisely. */
export class OfflineRejectionError extends Error {
	constructor() {
		super("This action requires a connection and was not queued.");
		this.name = "OfflineRejectionError";
	}
}

/**
 * WS3 remediation R3, Finding G: the ONE governed online-only mutation
 * wrapper every financial/destructive POS mutation goes through, replacing
 * per-screen `disabled={... || !workspace.isOnline}` buttons as the
 * correctness boundary (the disabled attribute stays too, as a UX nicety —
 * this hook is the actual guarantee).
 *
 * TanStack Query's default `networkMode: 'online'` PAUSES (not rejects) a
 * mutation triggered while offline, then AUTOMATICALLY RESUMES AND
 * EXECUTES it once the browser reconnects — confirmed real, current
 * TanStack Query behavior in this codebase's `queryClient` (no
 * `networkMode` override in `apps/web/src/utils/orpc.ts`). Six of twelve
 * destructive/approval controls relied on a button's `disabled` attribute
 * alone to prevent this; a control whose button was NOT `isOnline`-gated
 * could queue a paused mutation while offline and have it silently
 * execute on reconnect with no further confirmation from the actor who
 * may have abandoned it.
 *
 * `mutateAsync` here checks `isOnline` BEFORE ever calling the underlying
 * `useMutation`'s own `mutateAsync` — an offline attempt never creates a
 * mutation-cache entry at all, so there is nothing left to pause and
 * nothing for reconnection to resume (verifiable directly via
 * `queryClient.getMutationCache().getAll()`). `error` folds in the
 * offline rejection so `MutationError` renders the SAME accessible
 * `role="alert"` feedback for it as any other failure, rather than a
 * silently-disabled button with no explanation.
 */
export function useOnlineGatedMutation<TData, TVariables>(
	options: UseMutationOptions<TData, Error, TVariables>,
	isOnline: boolean
) {
	const mutation = useMutation(options);
	const [offlineRejection, setOfflineRejection] =
		useState<OfflineRejectionError | null>(null);

	const mutateAsync = useCallback(
		async (variables: TVariables): Promise<TData> => {
			if (!isOnline) {
				const rejection = new OfflineRejectionError();
				setOfflineRejection(rejection);
				throw rejection;
			}
			setOfflineRejection(null);
			return await mutation.mutateAsync(variables);
		},
		[isOnline, mutation]
	);

	return {
		...mutation,
		error: offlineRejection ?? mutation.error,
		isError: offlineRejection !== null || mutation.isError,
		mutateAsync,
	};
}
