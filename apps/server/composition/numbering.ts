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
