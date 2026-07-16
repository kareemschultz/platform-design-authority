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
