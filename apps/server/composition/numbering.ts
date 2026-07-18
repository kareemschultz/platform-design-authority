import { randomUUID } from "node:crypto";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createNumberingRepository } from "@meridian/persistence-platform-numbering-postgres";
import { createNumberingService } from "@meridian/platform-numbering";
import type { PoolClient } from "pg";

import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

export const numberingService = createNumberingService({
	clock: () => new Date(),
	ids: {
		create: (kind) => `numbering_${kind}_${randomUUID().replaceAll("-", "")}`,
	},
	unitOfWork: createPostgresUnitOfWork(databasePool, (client) => ({
		events: createPostgresOutbox(client),
		repository: createNumberingRepository(client),
	})),
});

/**
 * WS3 PR2's online receipt-numbering path (frozen control plan "Read
 * first": reuse `platform/numbering`'s online allocation-in-transaction
 * pattern; the offline-safe path is EXPLICITLY PENDING WS5). Mirrors
 * `createImportReferenceAllocator` immediately below: a Numbering service
 * instance bound to the SAME transactional `PoolClient` as the sale
 * commit, so the number allocation, the sale row, the synchronous
 * Inventory movement, and the outbox writes all commit or roll back
 * together. Scoped per REGISTER (not per tenant/organization) — one
 * sequence per register — so receipt-number monotonicity holds per
 * register under concurrency, matching the frozen Tests requirement.
 */
export function createReceiptNumberAllocator(client: PoolClient) {
	const service = createNumberingService({
		clock: () => new Date(),
		ids: {
			create: (kind) => `numbering_${kind}_${randomUUID().replaceAll("-", "")}`,
		},
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: createPostgresOutbox(client),
					repository: createNumberingRepository(client),
				}),
		},
	});
	return {
		async allocate(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			registerId: string;
			saleId: string;
			tenantId: string;
		}) {
			const sequenceId = `sequence_receipt_${input.registerId}`;
			await service.ensureSystemSequence({
				id: sequenceId,
				organizationId: input.organizationId,
				ownerNamespace: "commerce",
				padding: 6,
				prefix: `R-${input.registerId}-`,
				recordType: "Receipt",
				sequenceKey: `commerce.receipt.${input.registerId}`,
				tenantId: input.tenantId,
			});
			const allocation = await service.allocate({
				actorUserId: input.actorUserId,
				businessRecordId: input.saleId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				organizationId: input.organizationId,
				sequenceId,
				sourceCommandId: input.idempotencyKey,
				tenantId: input.tenantId,
			});
			return { value: allocation.value };
		},
	};
}

export function createImportReferenceAllocator(client: PoolClient) {
	const service = createNumberingService({
		clock: () => new Date(),
		ids: {
			create: (kind) => `numbering_${kind}_${randomUUID().replaceAll("-", "")}`,
		},
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: createPostgresOutbox(client),
					repository: createNumberingRepository(client),
				}),
		},
	});
	return {
		async allocate(input: {
			actorUserId: string;
			businessRecordId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			sourceCommandId: string;
			tenantId: string;
		}) {
			const sequenceId = `sequence_import_job_${input.organizationId}`;
			await service.ensureSystemSequence({
				id: sequenceId,
				organizationId: input.organizationId,
				ownerNamespace: "platform",
				padding: 6,
				prefix: "IMP-",
				recordType: "ImportJob",
				sequenceKey: "platform.import-job",
				tenantId: input.tenantId,
			});
			const allocation = await service.allocate({
				...input,
				businessRecordId: input.businessRecordId,
				sequenceId,
			});
			return {
				allocationId: allocation.id,
				sequenceVersion: allocation.sequenceVersion,
				value: allocation.value,
			};
		},
	};
}
