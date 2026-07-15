import { randomUUID } from "node:crypto";
import {
	type CatalogIdFactory,
	createCatalogApplication,
	createCatalogService,
} from "@meridian/domain-catalog";
import { createCatalogRepository } from "@meridian/persistence-catalog-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";

import { permissionAuthorizer } from "./authorization";
import { entitlementEvaluator } from "./entitlements";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

const ids: CatalogIdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createCatalogRepository(client),
}));

export const catalogService = createCatalogService({
	clock: () => new Date(),
	ids,
	unitOfWork,
});

export const catalogApplication = createCatalogApplication({
	activeContexts: {
		async requireActiveContext(input) {
			const context = await tenancyService.requireContext(input);
			return {
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			};
		},
	},
	entitlements: entitlementEvaluator,
	permissions: permissionAuthorizer,
	service: catalogService,
});

export const catalogTransportApplication = {
	activateProduct: catalogApplication.activate,
	archiveProduct: catalogApplication.archive,
	createProduct: catalogApplication.create,
	getProduct: catalogApplication.get,
	listProducts: catalogApplication.list,
	updateProduct: catalogApplication.update,
};
