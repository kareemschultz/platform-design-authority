import type { PermissionAuthorizer } from "../src/context";

/**
 * PR3 keeps permissioned administration fail-closed until PR5 binds the
 * canonical scoped authorization evaluator. Authenticated-session and
 * authenticated-membership operations remain available through their own
 * guards; no Better Auth role is treated as Platform authority.
 */
export const permissionAuthorizer: PermissionAuthorizer = {
	can: () => Promise.resolve(false),
};
