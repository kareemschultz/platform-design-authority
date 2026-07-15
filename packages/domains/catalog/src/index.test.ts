import { describe, expect, test } from "bun:test";
import {
	type CatalogAggregateRecord,
	type CatalogCommandReceipt,
	CatalogError,
	type CatalogProductRecord,
	type CatalogRepository,
	createCatalogApplication,
	createCatalogService,
	normalizeProductIdentifier,
	type PendingCatalogEvent,
} from ".";

const now = new Date("2026-07-14T12:00:00.000Z");

function key(tenantId: string, productId: string): string {
	return `${tenantId}:${productId}`;
}

function receiptKey(
	receipt: Pick<
		CatalogCommandReceipt,
		"tenantId" | "operation" | "idempotencyKey"
	>
): string {
	return `${receipt.tenantId}:${receipt.operation}:${receipt.idempotencyKey}`;
}

function clone<T>(value: T): T {
	return structuredClone(value);
}

function resolved<T>(value: T): Promise<T> {
	return Promise.resolve(value);
}

function view(aggregate: CatalogAggregateRecord): CatalogProductRecord {
	return {
		...aggregate.product,
		variants: aggregate.variants,
	};
}

function createMemoryHarness() {
	let sequence = 0;
	const products = new Map<string, CatalogProductRecord>();
	const receipts = new Map<string, CatalogCommandReceipt>();
	const events: PendingCatalogEvent[] = [];

	function identifierConflict(record: CatalogAggregateRecord): boolean {
		return [...products.values()].some(
			(product) =>
				product.tenantId === record.product.tenantId &&
				product.id !== record.product.id &&
				product.variants.some((variant) =>
					variant.identifiers.some((existing) =>
						record.identifiers.some(
							(candidate) =>
								candidate.uniquenessScope === existing.uniquenessScope &&
								candidate.normalizedValue ===
									normalizeProductIdentifier(existing)
						)
					)
				)
		);
	}

	const repository: CatalogRepository = {
		createProduct(record) {
			if (identifierConflict(record)) {
				return resolved("identifier_conflict" as const);
			}
			const product = view(record);
			products.set(key(product.tenantId, product.id), clone(product));
			return resolved(clone(product));
		},
		getCommandReceipt(tenantId, operation, idempotencyKey) {
			return resolved(
				clone(
					receipts.get(receiptKey({ idempotencyKey, operation, tenantId })) ??
						null
				)
			);
		},
		getProduct(tenantId, productId) {
			return resolved(clone(products.get(key(tenantId, productId)) ?? null));
		},
		listProducts(tenantId, page) {
			const items = [...products.values()]
				.filter((product) => product.tenantId === tenantId)
				.filter((product) => !page.cursor || product.id > page.cursor)
				.filter(
					(product) =>
						!page.query ||
						product.name.toLowerCase().includes(page.query.toLowerCase())
				)
				.slice(0, page.limit);
			return resolved({ items: clone(items), nextCursor: null });
		},
		recordCommandReceipt(receipt) {
			const id = receiptKey(receipt);
			const existing = receipts.get(id);
			if (existing) {
				return resolved({ inserted: false, record: clone(existing) });
			}
			receipts.set(id, clone(receipt));
			return resolved({ inserted: true, record: clone(receipt) });
		},
		transitionProduct(input) {
			const id = key(input.tenantId, input.productId);
			const current = products.get(id);
			if (
				!current ||
				current.version !== input.version ||
				current.state !== input.from
			) {
				return resolved("version_conflict" as const);
			}
			const updated: CatalogProductRecord = {
				...current,
				archivedAt: input.archivedAt ?? current.archivedAt,
				archiveReason: input.archiveReason ?? current.archiveReason,
				state: input.to,
				updatedAt: input.updatedAt,
				version: current.version + 1,
			};
			products.set(id, clone(updated));
			return resolved(clone(updated));
		},
		updateProduct(input) {
			const id = key(
				input.aggregate.product.tenantId,
				input.aggregate.product.id
			);
			const current = products.get(id);
			if (!current || current.version !== input.expectedVersion) {
				return resolved("version_conflict" as const);
			}
			if (input.replaceChildren && identifierConflict(input.aggregate)) {
				return resolved("identifier_conflict" as const);
			}
			const aggregateProduct = view(input.aggregate);
			const updated: CatalogProductRecord = {
				...current,
				name: aggregateProduct.name,
				updatedAt: aggregateProduct.updatedAt,
				variants: input.replaceChildren
					? aggregateProduct.variants
					: current.variants,
				version: aggregateProduct.version,
			};
			products.set(id, clone(updated));
			return resolved(clone(updated));
		},
	};

	const service = createCatalogService({
		clock: () => new Date(now),
		ids: {
			create(kind) {
				sequence += 1;
				return `${kind}_${sequence}`;
			},
		},
		unitOfWork: {
			async execute(operation) {
				const productSnapshot = clone([...products.entries()]);
				const receiptSnapshot = clone([...receipts.entries()]);
				const eventCount = events.length;
				try {
					return await operation({
						events: {
							append(event) {
								events.push(clone(event));
								return resolved("inserted" as const);
							},
						},
						repository,
					});
				} catch (error) {
					products.clear();
					for (const [id, product] of productSnapshot) {
						products.set(id, product);
					}
					receipts.clear();
					for (const [id, receipt] of receiptSnapshot) {
						receipts.set(id, receipt);
					}
					events.length = eventCount;
					throw error;
				}
			},
		},
	});

	return { events, products, service };
}

const createInput = {
	actorUserId: "user_catalog_admin",
	body: {
		name: "Coffee",
		variants: [
			{
				identifiers: [
					{
						scheme: "Tenant" as const,
						type: "SKU" as const,
						value: " sku-001 ",
					},
				],
				name: "Ground 500g",
			},
		],
	},
	correlationId: "correlation_catalog_1",
	idempotencyKey: "idempotency_catalog_create_1",
	organizationId: "organization_catalog_1",
	tenantId: "tenant_catalog_1",
};

describe("Catalog identifier policy", () => {
	test("normalizes tenant identifiers and validates declared GTIN check digits", () => {
		expect(
			normalizeProductIdentifier({
				scheme: "Tenant",
				type: "SKU",
				value: "  coffee   500g ",
			})
		).toBe("COFFEE 500G");
		expect(
			normalizeProductIdentifier({
				scheme: "GTIN-12",
				type: "UPC",
				value: "012345678905",
			})
		).toBe("012345678905");
		expect(() =>
			normalizeProductIdentifier({
				scheme: "GTIN-12",
				type: "UPC",
				value: "012345678906",
			})
		).toThrow("declared GTIN scheme");
	});

	test("treats GTIN, UPC, and EAN labels as one physical barcode collision family", async () => {
		const harness = createMemoryHarness();
		await expect(
			harness.service.createProduct({
				...createInput,
				body: {
					name: "Ambiguous barcode",
					variants: [
						{
							identifiers: [
								{
									scheme: "GTIN-12",
									type: "UPC",
									value: "012345678905",
								},
								{
									scheme: "GTIN-12",
									type: "GTIN",
									value: "012345678905",
								},
							],
							name: "Default",
						},
					],
				},
			})
		).rejects.toMatchObject({ code: "identifier_conflict" });
	});
});

describe("Catalog service", () => {
	test("creates an aggregate atomically and replays an idempotent command", async () => {
		const harness = createMemoryHarness();
		const first = await harness.service.createProduct(createInput);
		const replay = await harness.service.createProduct(createInput);

		expect(replay).toEqual(first);
		expect(harness.products).toHaveLength(1);
		expect(harness.events.map((event) => event.name)).toEqual([
			"catalog.product.created.v1",
			"catalog.variant.created.v1",
			"catalog.identifier.assigned.v1",
		]);
	});

	test("creates a Variant without identifiers without fabricating an assignment", async () => {
		const harness = createMemoryHarness();
		const created = await harness.service.createProduct({
			...createInput,
			body: {
				name: "Unidentified Product",
				variants: [{ identifiers: [], name: "Default" }],
			},
			idempotencyKey: "idempotency_catalog_identifierless",
		});

		expect(created.variants[0]?.identifiers).toEqual([]);
		expect(harness.events.map((event) => event.name)).toEqual([
			"catalog.product.created.v1",
			"catalog.variant.created.v1",
		]);
	});

	test("keeps normalized identifiers unique inside a tenant but isolated across tenants", async () => {
		const harness = createMemoryHarness();
		await harness.service.createProduct(createInput);
		await expect(
			harness.service.createProduct({
				...createInput,
				body: { ...createInput.body, name: "Duplicate" },
				idempotencyKey: "idempotency_catalog_create_2",
			})
		).rejects.toMatchObject({ code: "identifier_conflict" });

		const otherTenant = await harness.service.createProduct({
			...createInput,
			idempotencyKey: "idempotency_catalog_create_3",
			tenantId: "tenant_catalog_2",
		});
		expect(otherTenant.name).toBe("Coffee");
		expect(
			await harness.service.listProducts("tenant_catalog_1", { limit: 50 })
		).toHaveProperty("items.length", 1);
	});

	test("preserves Variant and Identifier identity on a name-only update", async () => {
		const harness = createMemoryHarness();
		const created = await harness.service.createProduct(createInput);
		const updated = await harness.service.updateProduct({
			...createInput,
			body: { name: "Coffee Dark Roast" },
			idempotencyKey: "idempotency_catalog_update_1",
			productId: created.id,
			version: created.version,
		});

		expect(updated.name).toBe("Coffee Dark Roast");
		expect(updated.variants).toEqual(created.variants);
		expect(updated.version).toBe(2);
	});

	test("preserves explicit child identities, emits only new assignments, and rejects implicit removal", async () => {
		const harness = createMemoryHarness();
		const created = await harness.service.createProduct(createInput);
		const [variant] = created.variants;
		const identifier = variant?.identifiers[0];
		if (!(variant && identifier)) {
			throw new Error("expected created Variant and Identifier");
		}
		const updated = await harness.service.updateProduct({
			...createInput,
			body: {
				variants: [
					{
						id: variant.id,
						identifiers: [
							{ ...identifier },
							{ scheme: "Tenant", type: "Alias", value: "Coffee Bag" },
						],
						name: "Ground Coffee 500g",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_update_children",
			productId: created.id,
			version: created.version,
		});

		expect(updated.variants[0]?.id).toBe(variant.id);
		expect(updated.variants[0]?.identifiers[0]?.id).toBe(identifier.id);
		expect(harness.events.slice(3).map((event) => event.name)).toEqual([
			"catalog.product.changed.v1",
			"catalog.identifier.assigned.v1",
		]);

		await expect(
			harness.service.updateProduct({
				...createInput,
				body: {
					variants: [
						{
							id: variant.id,
							identifiers: [{ ...identifier }],
							name: "Ground Coffee 500g",
						},
					],
				},
				idempotencyKey: "idempotency_catalog_remove_deferred",
				productId: updated.id,
				version: updated.version,
			})
		).rejects.toMatchObject({ code: "invalid_reference" });
	});

	test("enforces optimistic concurrency and explicit lifecycle commands", async () => {
		const harness = createMemoryHarness();
		const created = await harness.service.createProduct(createInput);
		await expect(
			harness.service.updateProduct({
				...createInput,
				body: { name: "Stale" },
				idempotencyKey: "idempotency_catalog_update_stale",
				productId: created.id,
				version: 99,
			})
		).rejects.toMatchObject({ code: "version_conflict" });

		const active = await harness.service.activateProduct({
			...createInput,
			idempotencyKey: "idempotency_catalog_activate_1",
			productId: created.id,
			version: created.version,
		});
		expect(active.state).toBe("Active");

		const archived = await harness.service.archiveProduct({
			...createInput,
			body: { reason: "Season ended" },
			idempotencyKey: "idempotency_catalog_archive_1",
			productId: active.id,
			version: active.version,
		});
		expect(archived.state).toBe("Archived");
		expect(harness.events.at(-1)).toMatchObject({
			data: { previousState: "Active" },
			name: "catalog.product.archived.v1",
		});
		await expect(
			harness.service.updateProduct({
				...createInput,
				body: { name: "Cannot change" },
				idempotencyKey: "idempotency_catalog_update_archived",
				productId: archived.id,
				version: archived.version,
			})
		).rejects.toBeInstanceOf(CatalogError);
	});

	test("enforces permissions and entitlements at the direct application boundary", async () => {
		const harness = createMemoryHarness();
		const calls: string[] = [];
		const application = createCatalogApplication({
			activeContexts: {
				requireActiveContext() {
					calls.push("context");
					return resolved({
						organizationId: createInput.organizationId,
						tenantId: createInput.tenantId,
					});
				},
			},
			entitlements: {
				requireEntitlement({ capabilityId }) {
					calls.push(`entitlement:${capabilityId}`);
					return resolved(undefined);
				},
			},
			permissions: {
				requirePermission({ permission }) {
					calls.push(`permission:${permission}`);
					return resolved(undefined);
				},
			},
			service: harness.service,
		});
		await application.create({
			actorUserId: createInput.actorUserId,
			body: createInput.body,
			contextId: "context_catalog_1",
			correlationId: createInput.correlationId,
			idempotencyKey: createInput.idempotencyKey,
			sessionId: "session_catalog_1",
		});

		expect(calls).toEqual([
			"permission:catalog.product.create",
			"context",
			"entitlement:catalog.products",
			"entitlement:catalog.variants",
			"entitlement:catalog.identifiers",
			"entitlement:catalog.barcodes",
		]);
	});
});
