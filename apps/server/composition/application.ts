import { createTenancyApplication } from "@meridian/platform-tenancy";

import { auditTransportApplication } from "./audit";
import { permissionAuthorizer } from "./authorization";
import { catalogTransportApplication } from "./catalog";
import { createCurrentIdentityResolver } from "./current-identity";
import { entitlementTransportApplication } from "./entitlements";
import { identitySessionTransportApplication } from "./identity";
import { inventoryTransportApplication } from "./inventory";
import { partyIdentityLinkDirectory, partyTransportApplication } from "./party";
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

const getCurrentIdentity = createCurrentIdentityResolver({
	base: tenancyApplication.getCurrentIdentity,
	partyLinks: partyIdentityLinkDirectory,
});

export const serverApplication = {
	...auditTransportApplication,
	...catalogTransportApplication,
	...entitlementTransportApplication,
	...identitySessionTransportApplication,
	...inventoryTransportApplication,
	...tenancyApplication,
	...partyTransportApplication,
	getCurrentIdentity,
};
