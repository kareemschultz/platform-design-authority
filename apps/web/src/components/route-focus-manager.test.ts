import { describe, expect, mock, test } from "bun:test";

import { focusMainContent, shouldMoveFocus } from "./route-focus-manager";

describe("route focus management", () => {
	test("moves focus to main content after client-side navigation", () => {
		const focus = mock(() => undefined);
		focusMainContent({
			getElementById: (id: string) =>
				id === "main-content" ? { focus } : null,
		} as unknown as Pick<Document, "getElementById">);
		expect(focus).toHaveBeenCalledTimes(1);
	});

	test("does not disturb initial focus and reacts only to a changed pathname", () => {
		expect(shouldMoveFocus(null, "/administration")).toBe(false);
		expect(shouldMoveFocus("/administration", "/administration/roles")).toBe(
			true
		);
		expect(
			shouldMoveFocus("/administration/roles", "/administration/roles")
		).toBe(false);
	});
});
