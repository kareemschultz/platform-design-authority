import { describe, expect, mock, test } from "bun:test";
import type { QueryClient } from "@tanstack/react-query";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
const { recoverCancelledWorkspaceQueries } = await import(
	"./workspace-context"
);

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
