import type { CurrentIdentity } from "@meridian/contracts-platform-api";

export interface CurrentIdentityInput {
	activeContextId?: string;
	assuranceLevel: CurrentIdentity["assuranceLevel"];
	authUserId: string;
	sessionId: string;
}

export function createCurrentIdentityResolver(options: {
	base: (input: CurrentIdentityInput) => Promise<CurrentIdentity>;
	partyLinks: {
		findActivePartyId: (input: {
			authUserId: string;
			organizationId: string;
			tenantId: string;
		}) => Promise<string | null>;
	};
}) {
	return async (input: CurrentIdentityInput): Promise<CurrentIdentity> => {
		const identity = await options.base(input);
		if (!identity.activeContext) {
			return { ...identity, partyId: null };
		}
		const partyId = await options.partyLinks.findActivePartyId({
			authUserId: identity.authUserId,
			organizationId: identity.activeContext.organizationId,
			tenantId: identity.activeContext.tenantId,
		});
		return {
			...identity,
			activeContext: { ...identity.activeContext, partyId },
			partyId,
		};
	};
}
