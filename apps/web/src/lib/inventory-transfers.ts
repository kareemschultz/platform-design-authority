export interface TransferLineRemainder {
	id: string;
	remainingQuantity: string;
}

export function receiptIntentAfterDraftReset<T>(
	current: T | null,
	confirmedSuccess: boolean
): T | null {
	return confirmedSuccess ? null : current;
}

export function outstandingTransferLineId(
	lines: readonly TransferLineRemainder[],
	currentLineId: string
): string {
	const outstanding = lines.filter((line) => line.remainingQuantity !== "0");
	return outstanding.some((line) => line.id === currentLineId)
		? currentLineId
		: (outstanding[0]?.id ?? "");
}
