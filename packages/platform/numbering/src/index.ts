export interface NumberAllocationRequest {
	idempotencyKey: string;
	sequenceId: string;
	tenantId: string;
}

export interface NumberAllocation {
	sequenceId: string;
	value: string;
}

export interface NumberingPersistencePort {
	allocate: (request: NumberAllocationRequest) => Promise<NumberAllocation>;
}
