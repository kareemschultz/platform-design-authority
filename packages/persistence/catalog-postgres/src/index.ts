import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	CatalogAggregateRecord,
	CatalogCommandOperation,
	CatalogCommandReceipt,
	CatalogIdentifierRecord,
	CatalogPage,
	CatalogPageRequest,
	CatalogProductRecord,
	CatalogRepository,
	CatalogVariantRecord,
} from "@meridian/domain-catalog";
import { and, asc, eq, gt, ilike, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	catalogCommandReceipts,
	catalogIdentifiers,
	catalogProducts,
	catalogVariants,
} from "./schema";

export type CatalogPostgresConnection = Pool | PoolClient;
export const CATALOG_MIGRATION_TABLE = "catalog_migrations";

function isUniqueViolation(error: unknown): boolean {
	if (typeof error !== "object" || error === null) {
		return false;
	}
	if ("code" in error && (error as { code?: unknown }).code === "23505") {
		return true;
	}
	return "cause" in error && isUniqueViolation(error.cause);
}

function mapReceipt(
	row: typeof catalogCommandReceipts.$inferSelect
): CatalogCommandReceipt {
	return {
		idempotencyKey: row.idempotencyKey,
		operation: row.operation as CatalogCommandOperation,
		requestFingerprint: row.requestFingerprint,
		resourceId: row.resourceId,
		result: row.result as CatalogCommandReceipt["result"],
		tenantId: row.tenantId,
	};
}

function productBase(
	row: typeof catalogProducts.$inferSelect
): Omit<CatalogProductRecord, "variants"> {
	return {
		archivedAt: row.archivedAt,
		archiveReason: row.archiveReason,
		classification: row.classification as "Confidential",
		createdAt: row.createdAt,
		id: row.id,
		name: row.name,
		organizationId: row.organizationId,
		state: row.state as CatalogProductRecord["state"],
		tenantId: row.tenantId,
		updatedAt: row.updatedAt,
		version: row.version,
	};
}

export function createCatalogRepository(
	connection: CatalogPostgresConnection
): CatalogRepository {
	const database = drizzle(connection);

	async function loadProduct(
		row: typeof catalogProducts.$inferSelect
	): Promise<CatalogProductRecord> {
		const [variantRows, identifierRows] = await Promise.all([
			database
				.select()
				.from(catalogVariants)
				.where(
					and(
						eq(catalogVariants.tenantId, row.tenantId),
						eq(catalogVariants.productId, row.id)
					)
				)
				.orderBy(asc(catalogVariants.position), asc(catalogVariants.id)),
			database
				.select()
				.from(catalogIdentifiers)
				.where(
					and(
						eq(catalogIdentifiers.tenantId, row.tenantId),
						eq(catalogIdentifiers.productId, row.id)
					)
				)
				.orderBy(asc(catalogIdentifiers.id)),
		]);
		const identifiersByVariant = new Map<string, CatalogIdentifierRecord[]>();
		for (const identifier of identifierRows) {
			const record: CatalogIdentifierRecord = {
				createdAt: identifier.createdAt,
				id: identifier.id,
				normalizationVersion:
					identifier.normalizationVersion as CatalogIdentifierRecord["normalizationVersion"],
				normalizedValue: identifier.normalizedValue,
				productId: identifier.productId,
				scheme: identifier.scheme as CatalogIdentifierRecord["scheme"],
				tenantId: identifier.tenantId,
				type: identifier.type as CatalogIdentifierRecord["type"],
				uniquenessScope:
					identifier.uniquenessScope as CatalogIdentifierRecord["uniquenessScope"],
				value: identifier.value,
				variantId: identifier.variantId,
			};
			const current = identifiersByVariant.get(record.variantId) ?? [];
			current.push(record);
			identifiersByVariant.set(record.variantId, current);
		}
		const variants = variantRows.map<CatalogVariantRecord>((variant) => ({
			createdAt: variant.createdAt,
			id: variant.id,
			identifiers: identifiersByVariant.get(variant.id) ?? [],
			name: variant.name,
			position: variant.position,
			productId: variant.productId,
			tenantId: variant.tenantId,
			updatedAt: variant.updatedAt,
		}));
		return { ...productBase(row), variants };
	}

	async function insertChildren(record: CatalogAggregateRecord): Promise<void> {
		if (record.variants.length > 0) {
			await database.insert(catalogVariants).values(
				record.variants.map((variant) => ({
					createdAt: variant.createdAt,
					id: variant.id,
					name: variant.name,
					position: variant.position,
					productId: variant.productId,
					tenantId: variant.tenantId,
					updatedAt: variant.updatedAt,
				}))
			);
		}
		if (record.identifiers.length > 0) {
			await database.insert(catalogIdentifiers).values(record.identifiers);
		}
	}

	return {
		async createProduct(record) {
			try {
				const [row] = await database
					.insert(catalogProducts)
					.values(record.product)
					.returning();
				if (!row) {
					throw new Error("Catalog Product insert returned no row");
				}
				await insertChildren(record);
				return loadProduct(row);
			} catch (error) {
				if (isUniqueViolation(error)) {
					return "identifier_conflict";
				}
				throw error;
			}
		},

		async getCommandReceipt(tenantId, operation, idempotencyKey) {
			const [row] = await database
				.select()
				.from(catalogCommandReceipts)
				.where(
					and(
						eq(catalogCommandReceipts.tenantId, tenantId),
						eq(catalogCommandReceipts.operation, operation),
						eq(catalogCommandReceipts.idempotencyKey, idempotencyKey)
					)
				)
				.limit(1);
			return row ? mapReceipt(row) : null;
		},

		async getProduct(tenantId, productId) {
			const [row] = await database
				.select()
				.from(catalogProducts)
				.where(
					and(
						eq(catalogProducts.tenantId, tenantId),
						eq(catalogProducts.id, productId)
					)
				)
				.limit(1);
			return row ? loadProduct(row) : null;
		},

		async listProducts(
			tenantId: string,
			page: CatalogPageRequest
		): Promise<CatalogPage<CatalogProductRecord>> {
			if (page.barcode) {
				const [identifier] = await database
					.select({ productId: catalogIdentifiers.productId })
					.from(catalogIdentifiers)
					.where(
						and(
							eq(catalogIdentifiers.tenantId, tenantId),
							eq(catalogIdentifiers.uniquenessScope, "Barcode"),
							eq(catalogIdentifiers.normalizedValue, page.barcode)
						)
					)
					.limit(1);
				if (!identifier) {
					return { items: [], nextCursor: null };
				}
				const product = await this.getProduct(tenantId, identifier.productId);
				return { items: product ? [product] : [], nextCursor: null };
			}

			const search = page.query?.trim();
			let identifierProductIds: string[] = [];
			if (search) {
				identifierProductIds = (
					await database
						.select({ productId: catalogIdentifiers.productId })
						.from(catalogIdentifiers)
						.where(
							and(
								eq(catalogIdentifiers.tenantId, tenantId),
								eq(catalogIdentifiers.normalizedValue, search.toUpperCase())
							)
						)
				).map((row) => row.productId);
			}
			const rows = await database
				.select()
				.from(catalogProducts)
				.where(
					and(
						eq(catalogProducts.tenantId, tenantId),
						page.cursor ? gt(catalogProducts.id, page.cursor) : undefined,
						search
							? or(
									ilike(catalogProducts.name, `%${search}%`),
									identifierProductIds.length > 0
										? inArray(catalogProducts.id, identifierProductIds)
										: undefined
								)
							: undefined
					)
				)
				.orderBy(asc(catalogProducts.id))
				.limit(page.limit + 1);
			const items = await Promise.all(
				rows.slice(0, page.limit).map(loadProduct)
			);
			return {
				items,
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},

		async recordCommandReceipt(receipt) {
			const inserted = await database
				.insert(catalogCommandReceipts)
				.values(receipt)
				.onConflictDoNothing()
				.returning();
			if (inserted[0]) {
				return { inserted: true, record: mapReceipt(inserted[0]) };
			}
			const existing = await this.getCommandReceipt(
				receipt.tenantId,
				receipt.operation,
				receipt.idempotencyKey
			);
			if (!existing) {
				throw new Error("Catalog command receipt conflict could not be loaded");
			}
			return { inserted: false, record: existing };
		},

		async transitionProduct(input) {
			const [row] = await database
				.update(catalogProducts)
				.set({
					...(input.archiveReason
						? { archiveReason: input.archiveReason }
						: {}),
					...(input.archivedAt ? { archivedAt: input.archivedAt } : {}),
					state: input.to,
					updatedAt: input.updatedAt,
					version: input.version + 1,
				})
				.where(
					and(
						eq(catalogProducts.tenantId, input.tenantId),
						eq(catalogProducts.id, input.productId),
						eq(catalogProducts.state, input.from),
						eq(catalogProducts.version, input.version)
					)
				)
				.returning();
			return row ? loadProduct(row) : "version_conflict";
		},

		async updateProduct(input) {
			try {
				const [row] = await database
					.update(catalogProducts)
					.set({
						name: input.aggregate.product.name,
						updatedAt: input.aggregate.product.updatedAt,
						version: input.aggregate.product.version,
					})
					.where(
						and(
							eq(catalogProducts.tenantId, input.aggregate.product.tenantId),
							eq(catalogProducts.id, input.aggregate.product.id),
							eq(catalogProducts.version, input.expectedVersion)
						)
					)
					.returning();
				if (!row) {
					return "version_conflict";
				}
				if (input.replaceChildren) {
					await database
						.delete(catalogVariants)
						.where(
							and(
								eq(catalogVariants.tenantId, row.tenantId),
								eq(catalogVariants.productId, row.id)
							)
						);
					await insertChildren(input.aggregate);
				}
				return loadProduct(row);
			} catch (error) {
				if (isUniqueViolation(error)) {
					return "identifier_conflict";
				}
				throw error;
			}
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migrateCatalog(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: CATALOG_MIGRATION_TABLE,
	});
}

// biome-ignore lint/performance/noBarrelFile: persistence package public schema and adapter surface.
export * from "./schema";
