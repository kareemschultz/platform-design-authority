import type { PermissionId } from "@meridian/contracts-permissions";
import { createPartyRepository } from "@meridian/persistence-party-postgres";
import { createTenancyRepository } from "@meridian/persistence-platform-tenancy-postgres";
import { env } from "@meridian/tooling-env/server";
import { entitlementService } from "./entitlements";
import { identitySessionService } from "./identity";
import { closeDatabaseComposition, databasePool } from "./postgres";

const AUTH_BASE_URL = new URL("/api/auth", env.BETTER_AUTH_URL).toString();
const FIXTURE_EMAIL = "ws2-operations@example.test";
const FIXTURE_PASSWORD = "WS2-browser-verification-password-0001";
const RESTRICTED_FIXTURE_EMAIL = "ws2-read-restricted@example.test";
const RESTRICTED_FIXTURE_PASSWORD =
	"WS2-browser-restricted-verification-password-0001";
// WS3 PR5: a second full-authority identity distinct from FIXTURE_EMAIL, used
// as the checker (approver != creator) in every maker/checker e2e surface
// (cash-variance, price-override, return, refund, deposit). A separate
// cashier identity carries every POS permission EXCEPT commerce.register.close,
// realizing the stage spec's "denial flow (cashier without close permission)".
const APPROVER_FIXTURE_EMAIL = "ws3-approver@example.test";
const APPROVER_FIXTURE_PASSWORD =
	"WS3-browser-approver-verification-password-0001";
const CASHIER_FIXTURE_EMAIL = "ws3-cashier@example.test";
const CASHIER_FIXTURE_PASSWORD =
	"WS3-browser-cashier-verification-password-0001";
const SESSION_COOKIE_PATTERN = /better-auth\.session_token=([^;]+)/u;

const TENANT_ID = "tenant_ws2_browser_0001";
const ORGANIZATION_ID = "organization_ws2_browser_0001";
const LOCATION_ID = "location_ws2_browser_0001";
const MEMBERSHIP_ID = "membership_ws2_browser_0001";
const ROLE_ID = "role_ws2_browser_operator_0001";
const ROLE_ASSIGNMENT_ID = "role_assignment_ws2_browser_0001";
const RESTRICTED_MEMBERSHIP_ID = "membership_ws2_browser_restricted_0001";
const RESTRICTED_ROLE_ID = "role_ws2_browser_restricted_0001";
const RESTRICTED_ROLE_ASSIGNMENT_ID =
	"role_assignment_ws2_browser_restricted_0001";
const SECOND_LOCATION_ID = "location_ws2_browser_0002";
const APPROVER_MEMBERSHIP_ID = "membership_ws3_browser_approver_0001";
const APPROVER_ROLE_ASSIGNMENT_ID = "role_assignment_ws3_browser_approver_0001";
const CASHIER_MEMBERSHIP_ID = "membership_ws3_browser_cashier_0001";
const CASHIER_ROLE_ID = "role_ws3_browser_cashier_0001";
const CASHIER_ROLE_ASSIGNMENT_ID = "role_assignment_ws3_browser_cashier_0001";

const permissions = [
	"catalog.product.activate",
	"catalog.product.archive",
	"catalog.product.create",
	"catalog.product.read",
	"catalog.product.update",
	"catalog.import.approve",
	"catalog.import.create",
	"catalog.import.download",
	"catalog.import.purge",
	"catalog.import.read",
	"inventory.adjustment.approve",
	"inventory.adjustment.create",
	"inventory.adjustment.read",
	"inventory.adjustment.reverse",
	"inventory.balance.read",
	"inventory.count.approve",
	"inventory.count.create",
	"inventory.count.read",
	"inventory.count.submit",
	"inventory.import.approve",
	"inventory.import.create",
	"inventory.import.download",
	"inventory.import.purge",
	"inventory.import.read",
	"inventory.transfer.create",
	"inventory.transfer.dispatch",
	"inventory.transfer.read",
	"inventory.transfer.receive",
	"platform.organization.read",
	"commerce.cash-movement.create",
	"commerce.cash-variance.approve",
	"commerce.deposit.confirm",
	"commerce.deposit.create",
	"commerce.price-override.approve",
	"commerce.price-override.request",
	"commerce.receipt.read",
	"commerce.receipt.reissue",
	"commerce.receipt.void",
	"commerce.refund.approve",
	"commerce.refund.create",
	"commerce.register.close",
	"commerce.register.open",
	"commerce.return.approve",
	"commerce.return.create",
	"commerce.sale.complete",
	"commerce.sale.create",
	"commerce.sale.hold",
	"platform.export.create",
	"platform.export.read",
] satisfies PermissionId[];

// Every POS permission the cashier role needs EXCEPT commerce.register.close,
// realizing the stage spec's cashier-without-close-permission denial surface.
const cashierPermissions = permissions.filter(
	(permission) => permission !== "commerce.register.close"
) satisfies PermissionId[];

function sessionCookie(response: Response): string {
	const value = response.headers
		.get("set-cookie")
		?.match(SESSION_COOKIE_PATTERN)?.[1];
	if (!value) {
		throw new Error("Synthetic browser user did not receive a session cookie");
	}
	return `better-auth.session_token=${value}`;
}

async function authenticateFixture(input: {
	email: string;
	name: string;
	password: string;
}): Promise<string> {
	const headers = {
		"content-type": "application/json",
		origin: env.CORS_ORIGIN,
	};
	let response = await fetch(`${AUTH_BASE_URL}/sign-up/email`, {
		body: JSON.stringify({
			email: input.email,
			name: input.name,
			password: input.password,
		}),
		headers,
		method: "POST",
	});
	if (!response.ok) {
		response = await fetch(`${AUTH_BASE_URL}/sign-in/email`, {
			body: JSON.stringify({
				email: input.email,
				password: input.password,
			}),
			headers,
			method: "POST",
		});
	}
	if (!response.ok) {
		throw new Error(
			`Synthetic browser user authentication failed with ${response.status}`
		);
	}
	const cookie = sessionCookie(response);
	const session = await identitySessionService.getSession({
		headers: new Headers({ cookie }),
	});
	if (!session) {
		throw new Error("Synthetic browser user session was not persisted");
	}
	return session.user.id;
}

/**
 * WS3 PR5: `commerce.*` commands require the acting Better Auth user to have
 * an active Party identity link (`requireActorPartyId` in
 * `apps/server/composition/pos.ts` — Party owns canonical real-world
 * identity, CLAUDE.md §5). WS2's fixture never needed this (Catalog/
 * Inventory commands do not resolve an actor Party), so this is new here.
 * Seeded directly through the Party repository — the same "Migration-style,
 * authorization-bypassing" seed discipline `createTenancyRepository(...)
 * .seed(...)` already uses above, not the authorized `party.record.create`
 * transport (which would require its own session/context wiring here).
 * Idempotent: skips creation when an identity link already exists for this
 * (tenant, organization, authUserId), and tolerates a party row that already
 * exists from a prior seed run.
 */
async function ensurePartyIdentityLink(input: {
	authUserId: string;
	displayName: string;
	email: string;
	membershipId: string;
	partyId: string;
}): Promise<void> {
	const repository = createPartyRepository(databasePool);
	const existingLink = await repository.getIdentityLinkForUserContext(
		TENANT_ID,
		ORGANIZATION_ID,
		input.authUserId
	);
	if (existingLink) {
		return;
	}
	const now = new Date();
	let party = await repository.getParty(TENANT_ID, input.partyId);
	if (!party) {
		party = await repository.createPerson({
			contacts: [
				{
					classification: "Confidential",
					displayValue: input.email,
					id: `${input.partyId}_contact_email`,
					normalizedValue: input.email.toLowerCase(),
					partyId: input.partyId,
					retentionClass: "party-profile",
					tenantId: TENANT_ID,
					type: "Email",
					verificationState: "Unverified",
				},
			],
			detail: { partyId: input.partyId, tenantId: TENANT_ID },
			party: {
				classification: "Confidential",
				createdAt: now,
				displayName: input.displayName,
				id: input.partyId,
				privacyState: "Normal",
				provenance: "Manual",
				state: "Active",
				tenantId: TENANT_ID,
				type: "Person",
				updatedAt: now,
				version: 1,
			},
		});
	}
	await repository.createIdentityLink({
		authUserId: input.authUserId,
		createdAt: now.toISOString(),
		id: `${input.partyId}_link`,
		membershipId: input.membershipId,
		organizationId: ORGANIZATION_ID,
		partyId: party.id,
		provenance: "AuthenticatedMembershipReconciliation",
		state: "Active",
		tenantId: TENANT_ID,
		version: 1,
	});
}

async function seedWebExperienceFixture(): Promise<void> {
	const [
		authUserId,
		restrictedAuthUserId,
		approverAuthUserId,
		cashierAuthUserId,
	] = await Promise.all([
		authenticateFixture({
			email: FIXTURE_EMAIL,
			name: "WS2 Operations Operator",
			password: FIXTURE_PASSWORD,
		}),
		authenticateFixture({
			email: RESTRICTED_FIXTURE_EMAIL,
			name: "WS2 Restricted Operator",
			password: RESTRICTED_FIXTURE_PASSWORD,
		}),
		authenticateFixture({
			email: APPROVER_FIXTURE_EMAIL,
			name: "WS3 POS Approver",
			password: APPROVER_FIXTURE_PASSWORD,
		}),
		authenticateFixture({
			email: CASHIER_FIXTURE_EMAIL,
			name: "WS3 POS Cashier",
			password: CASHIER_FIXTURE_PASSWORD,
		}),
	]);
	await createTenancyRepository(databasePool).seed({
		locations: [
			{
				id: LOCATION_ID,
				name: "Georgetown Browser Store",
				organizationId: ORGANIZATION_ID,
				state: "Active",
				tenantId: TENANT_ID,
				timezone: "America/Guyana",
				type: "Store",
				version: 1,
			},
			{
				id: SECOND_LOCATION_ID,
				name: "Essequibo Browser Store",
				organizationId: ORGANIZATION_ID,
				state: "Active",
				tenantId: TENANT_ID,
				timezone: "America/Guyana",
				type: "Store",
				version: 1,
			},
		],
		memberships: [
			{
				authUserId,
				id: MEMBERSHIP_ID,
				organizationId: ORGANIZATION_ID,
				roleAssignmentIds: [ROLE_ASSIGNMENT_ID],
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				authUserId: restrictedAuthUserId,
				id: RESTRICTED_MEMBERSHIP_ID,
				organizationId: ORGANIZATION_ID,
				roleAssignmentIds: [RESTRICTED_ROLE_ASSIGNMENT_ID],
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				authUserId: approverAuthUserId,
				id: APPROVER_MEMBERSHIP_ID,
				organizationId: ORGANIZATION_ID,
				// Same operator role as FIXTURE_EMAIL: the maker/checker rule
				// compares actor identity, not permission scope (frozen control
				// plan §6), so the approver needs the SAME full permission set
				// under a DIFFERENT auth user id.
				roleAssignmentIds: [APPROVER_ROLE_ASSIGNMENT_ID],
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				authUserId: cashierAuthUserId,
				id: CASHIER_MEMBERSHIP_ID,
				organizationId: ORGANIZATION_ID,
				roleAssignmentIds: [CASHIER_ROLE_ASSIGNMENT_ID],
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
		],
		organizations: [
			{
				id: ORGANIZATION_ID,
				locale: "en-GY",
				name: "Georgetown Browser Organization",
				state: "Active",
				tenantId: TENANT_ID,
				timezone: "America/Guyana",
				version: 1,
			},
		],
		roleAssignments: [
			{
				id: ROLE_ASSIGNMENT_ID,
				membershipId: MEMBERSHIP_ID,
				roleId: ROLE_ID,
				scopeType: "Tenant",
				startsAt: new Date("2026-01-01T00:00:00.000Z"),
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				id: RESTRICTED_ROLE_ASSIGNMENT_ID,
				membershipId: RESTRICTED_MEMBERSHIP_ID,
				roleId: RESTRICTED_ROLE_ID,
				scopeType: "Tenant",
				startsAt: new Date("2026-01-01T00:00:00.000Z"),
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				id: APPROVER_ROLE_ASSIGNMENT_ID,
				membershipId: APPROVER_MEMBERSHIP_ID,
				roleId: ROLE_ID,
				scopeType: "Tenant",
				startsAt: new Date("2026-01-01T00:00:00.000Z"),
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				id: CASHIER_ROLE_ASSIGNMENT_ID,
				membershipId: CASHIER_MEMBERSHIP_ID,
				roleId: CASHIER_ROLE_ID,
				scopeType: "Tenant",
				startsAt: new Date("2026-01-01T00:00:00.000Z"),
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
		],
		roles: [
			{
				description:
					"Controlled-prototype role for authenticated browser evidence",
				id: ROLE_ID,
				name: "WS2 browser operator",
				permissionIds: permissions,
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				description:
					"Controlled-prototype role for explicit permission-denied browser evidence",
				id: RESTRICTED_ROLE_ID,
				name: "WS2 restricted browser operator",
				permissionIds: ["platform.organization.read"],
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
			{
				description:
					"WS3 controlled-prototype cashier role: every POS permission except " +
					"commerce.register.close, realizing the stage spec's cashier-" +
					"without-close-permission denial flow.",
				id: CASHIER_ROLE_ID,
				name: "WS3 browser cashier",
				permissionIds: cashierPermissions,
				state: "Active",
				tenantId: TENANT_ID,
				version: 1,
			},
		],
		tenant: {
			id: TENANT_ID,
			name: "WS2 Browser Tenant",
			state: "Active",
			version: 1,
		},
	});

	// WS3 PR5: the operator, approver, and cashier identities all issue
	// commerce.* commands and therefore all need an active Party identity
	// link; the restricted identity (permission-denial fixture only) does
	// not.
	await Promise.all([
		ensurePartyIdentityLink({
			authUserId,
			displayName: "WS2 Operations Operator",
			email: FIXTURE_EMAIL,
			membershipId: MEMBERSHIP_ID,
			partyId: "party_ws3_browser_operator_0001",
		}),
		ensurePartyIdentityLink({
			authUserId: approverAuthUserId,
			displayName: "WS3 POS Approver",
			email: APPROVER_FIXTURE_EMAIL,
			membershipId: APPROVER_MEMBERSHIP_ID,
			partyId: "party_ws3_browser_approver_0001",
		}),
		ensurePartyIdentityLink({
			authUserId: cashierAuthUserId,
			displayName: "WS3 POS Cashier",
			email: CASHIER_FIXTURE_EMAIL,
			membershipId: CASHIER_MEMBERSHIP_ID,
			partyId: "party_ws3_browser_cashier_0001",
		}),
	]);

	await Promise.all(
		(
			[
				"catalog.bulk-import",
				"catalog.lifecycle",
				"catalog.products",
				"catalog.variants",
				"catalog.identifiers",
				"catalog.barcodes",
				"inventory.adjustments",
				"inventory.counts",
				"inventory.stock-balances",
				"inventory.transfers",
				// WS3 PR5: entitlements are organization-scoped (not per-identity),
				// so provisioning these once covers the operator, approver, and
				// cashier fixture identities alike (frozen control plan Table (c)).
				"commerce.pos",
				"commerce.register-management",
				"commerce.shift-management",
				"commerce.cash-management",
				"commerce.order-management",
				"commerce.returns",
				"commerce.exchanges",
				"commerce.refunds",
				"commerce.receipts",
				"commerce.gift-receipts",
				"commerce.mobile-pos",
				"commerce.offline-sales",
			] as const
		).map((capabilityId) =>
			entitlementService.change({
				actorId: authUserId,
				capabilityId,
				correlationId: `correlation_ws2_browser_${capabilityId}`,
				idempotencyKey: `idempotency_ws2_browser_${capabilityId}`,
				organizationId: ORGANIZATION_ID,
				reason: "Controlled-prototype authenticated browser verification",
				source: "Migration",
				startsAt: new Date("2026-01-01T00:00:00.000Z"),
				state: "Active",
				tenantId: TENANT_ID,
			})
		)
	);
}

try {
	await seedWebExperienceFixture();
} finally {
	await closeDatabaseComposition();
}
