import { randomUUID } from "node:crypto";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import {
	createIdentityDirectory,
	createIdentityOrganizationProjection,
} from "@meridian/persistence-platform-identity-postgres";
import { createTenancyRepository } from "@meridian/persistence-platform-tenancy-postgres";
import {
	createTenancyApplication,
	createTenancyService,
	type IdFactory,
} from "@meridian/platform-tenancy";

import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const ids: IdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createTenancyRepository(client),
}));

export const tenancyService = createTenancyService({
	clock: () => new Date(),
	contextTtlMs: 8 * 60 * 60 * 1000,
	ids,
	unitOfWork,
});

export const identityDirectory = createIdentityDirectory(databasePool);
export const identityOrganizationProjection =
	createIdentityOrganizationProjection(databasePool);

export const tenancyApplication = createTenancyApplication({
	directory: identityDirectory,
	projection: identityOrganizationProjection,
	service: tenancyService,
});
