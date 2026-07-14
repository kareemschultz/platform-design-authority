import { describe, expect, test } from "bun:test";

import {
	createPartyApplication,
	createPartyService,
	type IdentityLinkRecord,
	type Page,
	type PageRequest,
	type PartyCommandReceipt,
	PartyError,
	type PartyRecord,
	type PartyRepository,
	type PendingEvent,
} from "./index";

const SHA_256_HEX = /^[a-f0-9]{64}$/;

function fixture() {
	const parties = new Map<string, PartyRecord>();
	const links = new Map<string, IdentityLinkRecord>();
	const receipts = new Map<string, PartyCommandReceipt>();
	const events: PendingEvent[] = [];
	let sequence = 0;
	const key = (tenantId: string, id: string) => `${tenantId}:${id}`;
	const receiptKey = (
		tenantId: string,
		operation: string,
		idempotencyKey: string
	) => `${tenantId}:${operation}:${idempotencyKey}`;

	const repository: PartyRepository = {
		createIdentityLink(record) {
			links.set(key(record.tenantId, record.membershipId), record);
			return Promise.resolve(record);
		},
		createOrganization({ party }) {
			parties.set(key(party.tenantId, party.id), party);
			return Promise.resolve(party);
		},
		createPerson({ party }) {
			parties.set(key(party.tenantId, party.id), party);
			return Promise.resolve(party);
		},
		getCommandReceipt(tenantId, operation, idempotencyKey) {
			return Promise.resolve(
				receipts.get(receiptKey(tenantId, operation, idempotencyKey)) ?? null
			);
		},
		getIdentityLinkForMembership(tenantId, membershipId) {
			return Promise.resolve(links.get(key(tenantId, membershipId)) ?? null);
		},
		getParty(tenantId, partyId) {
			return Promise.resolve(parties.get(key(tenantId, partyId)) ?? null);
		},
		listParties(
			tenantId: string,
			page: PageRequest
		): Promise<Page<PartyRecord>> {
			const items = [...parties.values()]
				.filter(
					(party) =>
						party.tenantId === tenantId &&
						(!page.query ||
							party.displayName
								.toLowerCase()
								.includes(page.query.toLowerCase()))
				)
				.slice(0, page.limit);
			return Promise.resolve({ items, nextCursor: null });
		},
		recordCommandReceipt(receipt) {
			const id = receiptKey(
				receipt.tenantId,
				receipt.operation,
				receipt.idempotencyKey
			);
			const existing = receipts.get(id);
			if (existing) {
				return Promise.resolve({ inserted: false, record: existing });
			}
			receipts.set(id, receipt);
			return Promise.resolve({ inserted: true, record: receipt });
		},
		updateParty(input) {
			const id = key(input.tenantId, input.partyId);
			const existing = parties.get(id);
			if (!existing || existing.version !== input.version) {
				return Promise.resolve("version_conflict" as const);
			}
			const updated: PartyRecord = {
				...existing,
				displayName: input.displayName ?? existing.displayName,
				state: input.state ?? existing.state,
				updatedAt: new Date("2026-07-14T00:00:00.000Z"),
				version: existing.version + 1,
			};
			parties.set(id, updated);
			return Promise.resolve(updated);
		},
	};

	const service = createPartyService({
		clock: () => new Date("2026-07-14T00:00:00.000Z"),
		ids: {
			create(kind) {
				sequence += 1;
				return `${kind}_fixture_${sequence}`;
			},
		},
		membershipAuthority: {
			requireActiveMembership(input) {
				if (
					input.tenantId !== "tenant_alpha_0001" ||
					input.organizationId !== "organization_alpha_0001" ||
					input.membershipId !== "membership_alpha_0001" ||
					input.authUserId !== "auth_user_alpha_0001"
				) {
					throw new PartyError("wrong_tenant", "Membership mismatch");
				}
				return Promise.resolve();
			},
		},
		unitOfWork: {
			execute(operation) {
				return operation({
					events: {
						append(event) {
							events.push(event);
							return Promise.resolve("inserted");
						},
					},
					repository,
				});
			},
		},
	});

	return { events, links, parties, repository, service };
}

const command = {
	actorUserId: "auth_user_alpha_0001",
	correlationId: "correlation_party_test_0001",
	idempotencyKey: "idempotency_party_test_0001",
	organizationId: "organization_alpha_0001",
	tenantId: "tenant_alpha_0001",
};

describe("Party domain", () => {
	test("creates a Confidential Party without leaking contact data into its event", async () => {
		const { events, repository, service } = fixture();
		const party = await service.createPerson({
			...command,
			body: {
				displayName: "Asha Persaud",
				email: "Asha@example.test",
				phone: "+592 600 0000",
			},
		});

		expect(party).toMatchObject({
			classification: "Confidential",
			state: "Active",
			tenantId: "tenant_alpha_0001",
			type: "Person",
			version: 1,
		});
		expect(events).toHaveLength(1);
		expect(events[0]?.name).toBe("party.person.created.v1");
		expect(JSON.stringify(events[0])).not.toContain("Asha@example.test");
		expect(JSON.stringify(events[0])).not.toContain("600 0000");
		const receipt = await repository.getCommandReceipt(
			"tenant_alpha_0001",
			"party.create-person",
			"idempotency_party_test_0001"
		);
		expect(receipt?.requestFingerprint).toMatch(SHA_256_HEX);
		expect(receipt?.requestFingerprint).not.toContain("Asha");
	});

	test("replays the same command and rejects an idempotency-key substitution", async () => {
		const { events, service } = fixture();
		const first = await service.createOrganization({
			...command,
			body: { displayName: "Essequibo Retail Demo" },
		});
		const replay = await service.createOrganization({
			...command,
			body: { displayName: "Essequibo Retail Demo" },
		});
		expect(replay).toEqual(first);
		expect(events).toHaveLength(1);

		await expect(
			service.createOrganization({
				...command,
				body: { displayName: "Substituted Tenant Party" },
			})
		).rejects.toMatchObject({ code: "idempotency_conflict" });
	});

	test("isolates tenant reads and enforces optimistic concurrency", async () => {
		const { service } = fixture();
		const party = await service.createPerson({
			...command,
			body: { displayName: "Tenant Alpha Person" },
		});
		expect(
			await service.listParties("tenant_beta_0001", { limit: 20 })
		).toEqual({
			items: [],
			nextCursor: null,
		});
		await expect(
			service.getParty("tenant_beta_0001", party.id)
		).rejects.toMatchObject({ code: "not_found" });
		await expect(
			service.updateParty({
				actorUserId: command.actorUserId,
				body: { displayName: "Stale", version: 99 },
				idempotencyKey: "idempotency_party_update_0001",
				partyId: party.id,
				tenantId: command.tenantId,
			})
		).rejects.toMatchObject({ code: "version_conflict" });
	});

	test("reconciles an active membership to an existing Party exactly once", async () => {
		const { events, service } = fixture();
		const party = await service.createPerson({
			...command,
			body: { displayName: "Onboarded Person" },
		});
		const link = await service.createIdentityLink({
			...command,
			body: {
				authUserId: "auth_user_alpha_0001",
				membershipId: "membership_alpha_0001",
				partyId: party.id,
			},
			idempotencyKey: "idempotency_identity_link_0001",
		});
		expect(link).toMatchObject({ partyId: party.id, state: "Active" });
		expect(events.at(-1)?.name).toBe("party.identity-link.created.v1");

		await expect(
			service.createIdentityLink({
				...command,
				body: {
					authUserId: "auth_user_other_0001",
					membershipId: "membership_alpha_0001",
					partyId: party.id,
				},
				idempotencyKey: "idempotency_identity_link_0002",
			})
		).rejects.toMatchObject({ code: "wrong_tenant" });
	});

	test("revalidates active context on direct application calls", async () => {
		const { service } = fixture();
		let checked = false;
		const application = createPartyApplication({
			activeContexts: {
				requireActiveContext() {
					checked = true;
					return Promise.reject(
						new PartyError("wrong_tenant", "Context denied")
					);
				},
			},
			permissions: { requirePermission: async () => undefined },
			service,
		});
		await expect(
			application.list({
				authUserId: "auth_user_alpha_0001",
				contextId: "context_stale_0001",
				page: { limit: 20 },
				sessionId: "session_alpha_0001",
			})
		).rejects.toMatchObject({ code: "wrong_tenant" });
		expect(checked).toBe(true);
	});

	test("denies direct application calls before Party repository dispatch", async () => {
		const { repository, service } = fixture();
		let listed = false;
		repository.listParties = () => {
			listed = true;
			return Promise.resolve({ items: [], nextCursor: null });
		};
		const application = createPartyApplication({
			activeContexts: {
				requireActiveContext: async () => ({
					organizationId: "organization_alpha_0001",
					tenantId: "tenant_alpha_0001",
				}),
			},
			permissions: {
				requirePermission: () =>
					Promise.reject(
						Object.assign(new Error("denied"), {
							code: "authorization_denied",
						})
					),
			},
			service,
		});
		await expect(
			application.list({
				authUserId: "auth_user_alpha_0001",
				contextId: "context_alpha_0001",
				page: { limit: 20 },
				sessionId: "session_alpha_0001",
			})
		).rejects.toMatchObject({ code: "authorization_denied" });
		expect(listed).toBe(false);
	});
});
