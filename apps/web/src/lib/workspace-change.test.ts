import { describe, expect, test } from "bun:test";

import {
	isLatestWorkspaceRequest,
	workspaceSwitchDisposition,
	workspaceWorkState,
} from "./workspace-change";

describe("workspace change protection", () => {
	test("blocks boundary changes while a command result is pending", () => {
		expect(workspaceSwitchDisposition(["clean", "pending"])).toBe("block");
	});

	test("requires confirmation before discarding unsaved form work", () => {
		expect(workspaceSwitchDisposition(["clean", "unsaved"])).toBe("confirm");
		expect(workspaceSwitchDisposition(["clean"])).toBe("allow");
	});

	test("gives pending work precedence over dirty local values", () => {
		expect(workspaceWorkState(true, true)).toBe("pending");
		expect(workspaceWorkState(false, true)).toBe("unsaved");
		expect(workspaceWorkState(false, false)).toBe("clean");
	});

	test("rejects a stale context response after a newer request exists", () => {
		expect(isLatestWorkspaceRequest(2, 2)).toBe(true);
		expect(isLatestWorkspaceRequest(1, 2)).toBe(false);
	});
});
