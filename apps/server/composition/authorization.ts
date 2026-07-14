import { createAuthorizationService } from "@meridian/platform-authorization";
import type { PermissionAuthorizer } from "../src/context";
import { tenancyService } from "./tenancy";

export const authorizationService = createAuthorizationService({
	clock: () => new Date(),
	state: {
		load: (input) => tenancyService.resolveAuthorizationState(input),
	},
});

/** Every call re-loads Platform Tenancy's current context, membership, role,
 * assignment, and selected delegation state. Better Auth roles are ignored. */
export const permissionAuthorizer: PermissionAuthorizer = authorizationService;
