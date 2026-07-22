export type WorkspaceWorkState = "clean" | "pending" | "unsaved";
export type WorkspaceSwitchDisposition = "allow" | "block" | "confirm";

export function isLatestWorkspaceRequest(
	requestSequence: number,
	currentSequence: number
): boolean {
	return requestSequence === currentSequence;
}

export function workspaceWorkState(
	isPending: boolean,
	isDirty: boolean
): WorkspaceWorkState {
	if (isPending) {
		return "pending";
	}
	return isDirty ? "unsaved" : "clean";
}

export function workspaceSwitchDisposition(
	states: Iterable<WorkspaceWorkState>
): WorkspaceSwitchDisposition {
	let hasUnsaved = false;
	for (const state of states) {
		if (state === "pending") {
			return "block";
		}
		if (state === "unsaved") {
			hasUnsaved = true;
		}
	}
	return hasUnsaved ? "confirm" : "allow";
}

/**
 * WS3 remediation R3b, Item 8 (recoverable task state).
 *
 * `WorkspaceProvider`'s `workStates` registry (populated by every
 * `useWorkspaceWorkGuard` caller across the app — the sale-cart builder
 * and any other multi-field mutation form) already existed to gate
 * WORKSPACE switches (`workspaceSwitchDisposition`, above). This reuses
 * the EXACT SAME registry and disposition logic to also gate leaving the
 * app entirely (reload/tab-close, via `beforeunload`) and in-app
 * navigation/back — the same "is there unsaved or in-flight work right
 * now" question, asked at a different exit point. `true` for either
 * "confirm" (unsaved work — ask first) or "block" (a mutation is
 * in-flight — never let a submit race a navigation away).
 */
export function shouldWarnBeforeLeaving(
	states: Iterable<WorkspaceWorkState>
): boolean {
	return workspaceSwitchDisposition(states) !== "allow";
}

/** True for an ordinary, unmodified left click — the only kind of click
 * the in-app navigation guard should ever intercept. A modified click
 * (Ctrl/Cmd/Shift/Alt, a middle/right button, or one whose default was
 * already prevented by something else) is left alone: browsers use these
 * to open a link in a new tab/window, which does not leave the current
 * page and so needs no guard. */
export function isPlainLeftClick(event: {
	altKey: boolean;
	button: number;
	ctrlKey: boolean;
	defaultPrevented: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}): boolean {
	return (
		!event.defaultPrevented &&
		event.button === 0 &&
		!(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
	);
}

/** True only for a same-origin anchor navigating to a genuinely
 * DIFFERENT location than the current one — a same-page hash link, a
 * `target="_blank"` link, a `download` link, or an external origin is
 * never intercepted (none of them leave the current in-app page in a
 * way this guard is meant to protect). */
export function isGuardableInternalNavigation(
	anchor: { hasDownloadAttribute: boolean; href: string; target: string },
	currentHref: string
): boolean {
	if (anchor.target === "_blank" || anchor.hasDownloadAttribute) {
		return false;
	}
	let destination: URL;
	let current: URL;
	try {
		destination = new URL(anchor.href, currentHref);
		current = new URL(currentHref);
	} catch {
		return false;
	}
	if (destination.origin !== current.origin) {
		return false;
	}
	return (
		destination.pathname !== current.pathname ||
		destination.search !== current.search
	);
}
