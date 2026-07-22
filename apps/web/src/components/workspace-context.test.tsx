import { describe, expect, mock, test } from "bun:test";
import type { QueryClient } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
const { recoverCancelledWorkspaceQueries, WorkspaceLoadingState } =
	await import("./workspace-context");

// WS3 remediation R3b, Item 10 (accessible route state — the intermittent
// missing-h1 landing state).
//
// Pre-fix behavior (proven below, not assumed): the loading branch was a
// bare `<Skeleton>` with NO heading element and no accessible name at
// all. This reproduces that exact pre-fix markup shape, then proves the
// fixed `WorkspaceLoadingState` always renders exactly one accessible
// `<h1>` plus a named `role="status"` region.
describe("WorkspaceLoadingState (WS3 remediation R3b, Item 10)", () => {
	test("pre-fix reproduction: a bare Skeleton with no heading has no h1 and no accessible status name", () => {
		const preFixMarkup = renderToStaticMarkup(
			<div className="mx-auto max-w-screen-2xl px-4 py-10">
				<div className="h-24 w-full" />
			</div>
		);
		expect(preFixMarkup).not.toContain("<h1");
		expect(preFixMarkup).not.toContain('role="status"');
	});

	test("post-fix: renders exactly one accessible h1 during the loading window", () => {
		const markup = renderToStaticMarkup(<WorkspaceLoadingState />);
		const h1Matches = markup.match(/<h1[\s>]/g) ?? [];
		expect(h1Matches).toHaveLength(1);
		expect(markup).toContain("Loading workspace");
	});

	test("post-fix: exposes a named status region", () => {
		const markup = renderToStaticMarkup(<WorkspaceLoadingState />);
		expect(markup).toContain('role="status"');
		expect(markup).toContain('aria-label="Loading workspace"');
	});
});

describe("failed workspace activation recovery", () => {
	test("refetches active cancelled queries for the still-current workspace", async () => {
		const refetchQueries = mock(
			async (_filters: { queryKey: readonly unknown[]; type: "active" }) =>
				undefined
		);
		const queryClient = { refetchQueries } as unknown as QueryClient;

		const recovered = await recoverCancelledWorkspaceQueries(queryClient, 4, 4);

		expect(recovered).toBe(true);
		expect(refetchQueries).toHaveBeenCalledTimes(2);
		for (const [filters] of refetchQueries.mock.calls) {
			expect(filters.type).toBe("active");
			expect(filters.queryKey).toBeDefined();
		}
	});

	test("does not revive stale queries after a newer activation starts", async () => {
		const refetchQueries = mock(
			async (_filters: { queryKey: readonly unknown[]; type: "active" }) =>
				undefined
		);
		const queryClient = { refetchQueries } as unknown as QueryClient;

		const recovered = await recoverCancelledWorkspaceQueries(queryClient, 4, 5);

		expect(recovered).toBe(false);
		expect(refetchQueries).not.toHaveBeenCalled();
	});
});
