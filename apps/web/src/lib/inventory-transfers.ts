export interface TransferLineRemainder {
	id: string;
	remainingQuantity: string;
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
