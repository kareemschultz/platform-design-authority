import { createTenancyApplication } from "@meridian/platform-tenancy";

import { permissionAuthorizer } from "./authorization";
import { entitlementTransportApplication } from "./entitlements";
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
	...entitlementTransportApplication,
	...tenancyApplication,
	...partyTransportApplication,
};
