import { describe, expect, test } from "bun:test";

import {
	isGuardableInternalNavigation,
	isLatestWorkspaceRequest,
	isPlainLeftClick,
	shouldWarnBeforeLeaving,
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

// WS3 remediation R3b, Item 8 (recoverable task state).
describe("shouldWarnBeforeLeaving", () => {
	test("pre-fix reproduction: nothing previously asked this question at all for reload/tab-close/in-app navigation", () => {
		// There was no function answering "is it safe to leave right now" for
		// any exit path other than the workspace-switch dialog — this is a
		// structural statement, not a runtime reproduction, since the
		// function itself did not exist pre-fix.
		expect(typeof shouldWarnBeforeLeaving).toBe("function");
	});

	test("post-fix: warns when any registered work is unsaved", () => {
		expect(shouldWarnBeforeLeaving(["clean", "unsaved"])).toBe(true);
	});

	test("post-fix: warns when any registered work is pending (never let a submit race a navigation away)", () => {
		expect(shouldWarnBeforeLeaving(["clean", "pending"])).toBe(true);
	});

	test("post-fix: does not warn when every registered work state is clean", () => {
		expect(shouldWarnBeforeLeaving(["clean", "clean"])).toBe(false);
		expect(shouldWarnBeforeLeaving([])).toBe(false);
	});
});

describe("isPlainLeftClick", () => {
	const base = {
		altKey: false,
		button: 0,
		ctrlKey: false,
		defaultPrevented: false,
		metaKey: false,
		shiftKey: false,
	};

	test("an ordinary left click is guardable", () => {
		expect(isPlainLeftClick(base)).toBe(true);
	});

	test("a modified click (new-tab intent) is never intercepted", () => {
		expect(isPlainLeftClick({ ...base, ctrlKey: true })).toBe(false);
		expect(isPlainLeftClick({ ...base, metaKey: true })).toBe(false);
		expect(isPlainLeftClick({ ...base, shiftKey: true })).toBe(false);
		expect(isPlainLeftClick({ ...base, altKey: true })).toBe(false);
		expect(isPlainLeftClick({ ...base, button: 1 })).toBe(false);
	});

	test("a click whose default was already prevented is not re-intercepted", () => {
		expect(isPlainLeftClick({ ...base, defaultPrevented: true })).toBe(false);
	});
});

describe("isGuardableInternalNavigation", () => {
	const currentHref = "https://example.test/operations/pos/sales/new";

	test("a link to a different in-app path is guardable", () => {
		expect(
			isGuardableInternalNavigation(
				{
					hasDownloadAttribute: false,
					href: "https://example.test/operations/pos/registers",
					target: "",
				},
				currentHref
			)
		).toBe(true);
	});

	test("a link to the SAME path is not guardable (nothing is actually leaving)", () => {
		expect(
			isGuardableInternalNavigation(
				{ hasDownloadAttribute: false, href: currentHref, target: "" },
				currentHref
			)
		).toBe(false);
	});

	test("a target=_blank link is not guardable (does not leave the current page)", () => {
		expect(
			isGuardableInternalNavigation(
				{
					hasDownloadAttribute: false,
					href: "https://example.test/operations/pos/registers",
					target: "_blank",
				},
				currentHref
			)
		).toBe(false);
	});

	test("a download link is not guardable", () => {
		expect(
			isGuardableInternalNavigation(
				{
					hasDownloadAttribute: true,
					href: "https://example.test/export.json",
					target: "",
				},
				currentHref
			)
		).toBe(false);
	});

	test("an external-origin link is not guardable", () => {
		expect(
			isGuardableInternalNavigation(
				{
					hasDownloadAttribute: false,
					href: "https://attacker.example/phish",
					target: "",
				},
				currentHref
			)
		).toBe(false);
	});
});
