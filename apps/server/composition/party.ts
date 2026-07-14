import { randomUUID } from "node:crypto";
import {
	createPartyApplication,
	createPartyService,
	type PartyIdFactory,
} from "@meridian/domain-party";
import { createPartyRepository } from "@meridian/persistence-party-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createTenancyRepository } from "@meridian/persistence-platform-tenancy-postgres";

import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

const ids: PartyIdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createPartyRepository(client),
}));

const membershipAuthority = {
	async requireActiveMembership(input: {
		authUserId: string;
		membershipId: string;
		organizationId: string;
		tenantId: string;
	}) {
		const repository = createTenancyRepository(databasePool);
		const membership = await repository.getMembership(
			input.tenantId,
			input.membershipId
		);
		if (
			!membership ||
			membership.authUserId !== input.authUserId ||
			membership.organizationId !== input.organizationId ||
			membership.state !== "Active"
		) {
			throw Object.assign(
				new Error("Active membership does not match the link"),
				{
					code: "wrong_tenant" as const,
				}
			);
		}
	},
};

export const partyService = createPartyService({
	clock: () => new Date(),
	ids,
	membershipAuthority,
	unitOfWork,
});

export const partyApplication = createPartyApplication({
	activeContexts: {
		async requireActiveContext(input) {
			const context = await tenancyService.requireContext(input);
			return {
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			};
		},
	},
	service: partyService,
});

export const partyTransportApplication = {
	createIdentityLink: partyApplication.createIdentityLink,
	createOrganizationParty: partyApplication.createOrganization,
	createPersonParty: partyApplication.createPerson,
	getParty: partyApplication.get,
	listParties: partyApplication.list,
	updateParty: partyApplication.update,
};
