import { createTenancyApplication } from "@meridian/platform-tenancy";

import { permissionAuthorizer } from "./authorization";
import { partyTransportApplication } from "./party";
import {
	identityDirectory,
	identityOrganizationProjection,
	tenancyService,
} from "./tenancy";

const tenancyApplication = createTenancyApplication({
	directory: identityDirectory,
	permissions: permissionAuthorizer,
	projection: identityOrganizationProjection,
	service: tenancyService,
});

export const serverApplication = {
	...tenancyApplication,
	...partyTransportApplication,
};
