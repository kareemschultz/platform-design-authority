export interface IdentityAccountSummary {
	authenticationState: "Active" | "Suspended";
	authUserId: string;
	displayName: string;
	email: string;
}

export interface IdentityDirectoryPort {
	findUsers: (
		authUserIds: readonly string[]
	) => Promise<IdentityAccountSummary[]>;
}

export interface IdentityOrganizationProjection {
	projectInvitation: (input: {
		email: string;
		expiresAt: Date;
		invitationId: string;
		inviterAuthUserId: string;
		organizationId: string;
	}) => Promise<void>;
	projectMembership: (input: {
		authUserId: string;
		membershipId: string;
		organizationId: string;
	}) => Promise<void>;
	projectOrganization: (input: {
		canonicalOrganizationId: string;
		name: string;
		tenantId: string;
	}) => Promise<void>;
	removeMembership: (membershipId: string) => Promise<void>;
}
