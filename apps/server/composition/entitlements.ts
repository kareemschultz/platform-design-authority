import { randomUUID } from "node:crypto";
import { createEntitlementRepository } from "@meridian/persistence-platform-entitlements-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import {
	createEntitlementApplication,
	createEntitlementEvaluator,
	createEntitlementService,
	type EntitlementIdFactory,
} from "@meridian/platform-entitlements";

import { permissionAuthorizer } from "./authorization";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

const ids: EntitlementIdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createEntitlementRepository(client),
}));

export const entitlementService = createEntitlementService({
	clock: () => new Date(),
	ids,
	unitOfWork,
});

export const entitlementEvaluator = createEntitlementEvaluator({
	clock: () => new Date(),
	state: {
		load: (input) =>
			createEntitlementRepository(databasePool).listCurrent(input),
	},
});

export const entitlementApplication = createEntitlementApplication({
	activeContexts: {
		async requireActiveContext(input) {
			const context = await tenancyService.requireContext(input);
			return {
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			};
		},
	},
	permissions: permissionAuthorizer,
	repository: createEntitlementRepository(databasePool),
});

export const entitlementTransportApplication = {
	listEntitlements: entitlementApplication.list,
};
