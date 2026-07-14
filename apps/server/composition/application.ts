import { createTenancyApplication } from "@meridian/platform-tenancy";

import { auditTransportApplication } from "./audit";
import { permissionAuthorizer } from "./authorization";
import { entitlementTransportApplication } from "./entitlements";
import { identitySessionTransportApplication } from "./identity";
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
	...auditTransportApplication,
	...entitlementTransportApplication,
	...identitySessionTransportApplication,
	...tenancyApplication,
	...partyTransportApplication,
};
