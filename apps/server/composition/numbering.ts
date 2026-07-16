import { randomUUID } from "node:crypto";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createNumberingRepository } from "@meridian/persistence-platform-numbering-postgres";
import { createNumberingService } from "@meridian/platform-numbering";

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
