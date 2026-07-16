import type { PermissionId } from "@meridian/contracts-permissions";
import { createTenancyRepository } from "@meridian/persistence-platform-tenancy-postgres";
import { env } from "@meridian/tooling-env/server";
import { entitlementService } from "./entitlements";
import { identitySessionService } from "./identity";
import { closeDatabaseComposition, databasePool } from "./postgres";

const AUTH_BASE_URL = new URL("/api/auth", env.BETTER_AUTH_URL).toString();
const FIXTURE_EMAIL = "ws2-operations@example.test";
const FIXTURE_PASSWORD = "WS2-browser-verification-password-0001";
const SESSION_COOKIE_PATTERN = /better-auth\.session_token=([^;]+)/u;

const TENANT_ID = "tenant_ws2_browser_0001";
const ORGANIZATION_ID = "organization_ws2_browser_0001";
const LOCATION_ID = "location_ws2_browser_0001";
const MEMBERSHIP_ID = "membership_ws2_browser_0001";
const ROLE_ID = "role_ws2_browser_operator_0001";
const ROLE_ASSIGNMENT_ID = "role_assignment_ws2_browser_0001";

const permissions = [
	"catalog.product.activate",
	"catalog.product.archive",
	"catalog.product.create",
	"catalog.product.read",
	"catalog.product.update",
	"platform.organization.read",
] satisfies PermissionId[];

function sessionCookie(response: Response): string {
	const value = response.headers
		.get("set-cookie")
		?.match(SESSION_COOKIE_PATTERN)?.[1];
	if (!value) {
		throw new Error("Synthetic browser user did not receive a session cookie");
	}
	return `better-auth.session_token=${value}`;
}

async function authenticateFixture(): Promise<string> {
	const headers = {
		"content-type": "application/json",
		origin: env.CORS_ORIGIN,
	};
	let response = await fetch(`${AUTH_BASE_URL}/sign-up/email`, {
		body: JSON.stringify({
			email: FIXTURE_EMAIL,
			name: "WS2 Operations Operator",
			password: FIXTURE_PASSWORD,
		}),
		headers,
		method: "POST",
	});
	if (!response.ok) {
		response = await fetch(`${AUTH_BASE_URL}/sign-in/email`, {
			body: JSON.stringify({
				email: FIXTURE_EMAIL,
				password: FIXTURE_PASSWORD,
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

async function seedWebExperienceFixture(): Promise<void> {
	const authUserId = await authenticateFixture();
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
		],
		tenant: {
			id: TENANT_ID,
			name: "WS2 Browser Tenant",
			state: "Active",
			version: 1,
		},
	});

	await Promise.all(
		(
			[
				"catalog.products",
				"catalog.variants",
				"catalog.identifiers",
				"catalog.barcodes",
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
