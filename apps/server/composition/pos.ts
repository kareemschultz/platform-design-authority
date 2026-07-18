import { randomUUID } from "node:crypto";
import {
	createPosApplication,
	createPosService,
	PosError,
	type PosIdFactory,
} from "@meridian/domain-pos";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createPosRepository } from "@meridian/persistence-pos-postgres";

import { permissionAuthorizer } from "./authorization";
import { entitlementEvaluator } from "./entitlements";
import { partyIdentityLinkDirectory } from "./party";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

const ids: PosIdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createPosRepository(client),
}));

export const posService = createPosService({
	clock: () => new Date(),
	ids,
	parties: {
		async requireActorPartyId(input) {
			const partyId = await partyIdentityLinkDirectory.findActivePartyId(input);
			if (!partyId) {
				throw new PosError(
					"invalid_reference",
					"Actor has no active Party identity link for the active organization"
				);
			}
			return partyId;
		},
	},
	unitOfWork,
});

export const posApplication = createPosApplication({
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
	service: posService,
});

/**
 * `/registers/{registerId}/safe-drops` and `/registers/{registerId}/cash-
 * movements` share one permission and one domain command
 * (`commerce.cash-movement.create`) per the frozen WS3 control plan §4/§6 —
 * a safe drop is a cash movement with the `SafeDrop` reason code and
 * `PaidOut` direction fixed by the transport, not a caller choice.
 */
export const posTransportApplication = {
	approveCashVariance: posApplication.approveCashVariance,
	closeRegister: posApplication.closeRegister,
	createCashMovement: posApplication.createCashMovement,
	createSafeDrop: (
		input: Omit<
			Parameters<typeof posApplication.createCashMovement>[0],
			"direction" | "reasonCode"
		>
	) =>
		posApplication.createCashMovement({
			...input,
			direction: "PaidOut",
			reasonCode: "SafeDrop",
		}),
	openRegister: posApplication.openRegister,
};
