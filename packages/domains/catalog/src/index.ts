import type { EventEnvelope } from "@meridian/contracts-events";
import type {
	CreateProduct,
	Product,
	ProductIdentifier,
	ProductIdentifierInput,
	ProductVariant,
	TransitionReason,
	UpdateProduct,
	UpdateProductIdentifier,
	UpdateProductVariant,
} from "@meridian/contracts-platform-api";

export const PRODUCT_STATES = [
	"Draft",
	"Active",
	"Suspended",
	"Discontinued",
	"Archived",
] as const;

export type ProductState = (typeof PRODUCT_STATES)[number];

export const CATALOG_NORMALIZATION_VERSION = "catalog-identifier-v1";

const DIGITS_PATTERN = /^\d+$/;

export interface CatalogProductRecord extends Omit<Product, "variants"> {
	archivedAt: Date | null;
	archiveReason: string | null;
	classification: "Confidential";
	createdAt: Date;
	organizationId: string;
	tenantId: string;
	updatedAt: Date;
	variants: CatalogVariantRecord[];
}

export interface CatalogIdentifierRecord extends ProductIdentifier {
	createdAt: Date;
	normalizationVersion: typeof CATALOG_NORMALIZATION_VERSION;
	normalizedValue: string;
	productId: string;
	tenantId: string;
	uniquenessScope: "Barcode" | "SKU" | "Alias" | "External";
	variantId: string;
}

export interface CatalogVariantRecord
	extends Omit<ProductVariant, "identifiers"> {
	createdAt: Date;
	identifiers: CatalogIdentifierRecord[];
	position: number;
	productId: string;
	tenantId: string;
	updatedAt: Date;
}

export interface CatalogAggregateRecord {
	identifiers: CatalogIdentifierRecord[];
	product: Omit<CatalogProductRecord, "variants">;
	variants: CatalogVariantRecord[];
}

export type CatalogCommandOperation =
	| "catalog.product.create"
	| "catalog.product.update"
	| "catalog.product.activate"
	| "catalog.product.archive";

export interface CatalogCommandReceipt {
	idempotencyKey: string;
	operation: CatalogCommandOperation;
	requestFingerprint: string;
	resourceId: string;
	result: Product;
	tenantId: string;
}

export interface CatalogPageRequest {
	barcode?: string;
	cursor?: string;
	limit: number;
	query?: string;
}

export interface CatalogPage<T> {
	items: T[];
	nextCursor: string | null;
}

export interface CatalogRepository {
	createProduct: (
		record: CatalogAggregateRecord
	) => Promise<CatalogProductRecord | "identifier_conflict">;
	getCommandReceipt: (
		tenantId: string,
		operation: CatalogCommandOperation,
		idempotencyKey: string
	) => Promise<CatalogCommandReceipt | null>;
	getProduct: (
		tenantId: string,
		productId: string
	) => Promise<CatalogProductRecord | null>;
	listProducts: (
		tenantId: string,
		page: CatalogPageRequest
	) => Promise<CatalogPage<CatalogProductRecord>>;
	recordCommandReceipt: (
		receipt: CatalogCommandReceipt
	) => Promise<{ inserted: boolean; record: CatalogCommandReceipt }>;
	transitionProduct: (input: {
		archiveReason?: string;
		archivedAt?: Date;
		from: ProductState;
		productId: string;
		tenantId: string;
		to: ProductState;
		updatedAt: Date;
		version: number;
	}) => Promise<CatalogProductRecord | "version_conflict">;
	updateProduct: (input: {
		aggregate: CatalogAggregateRecord;
		expectedVersion: number;
		replaceChildren: boolean;
	}) => Promise<
		CatalogProductRecord | "identifier_conflict" | "version_conflict"
	>;
}

export type PendingCatalogEvent = Omit<
	EventEnvelope<Record<string, unknown>>,
	"publishedAt"
>;

export interface CatalogEventAppendPort {
	append: (event: PendingCatalogEvent) => Promise<"inserted" | "duplicate">;
}

export interface CatalogTransactionScope {
	events: CatalogEventAppendPort;
	repository: CatalogRepository;
}

export interface CatalogUnitOfWork {
	execute: <TResult>(
		operation: (scope: CatalogTransactionScope) => Promise<TResult>
	) => Promise<TResult>;
}

export interface CatalogActiveContextPort {
	requireActiveContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{ organizationId: string; tenantId: string }>;
}

export type CatalogPermission =
	| "catalog.product.read"
	| "catalog.product.create"
	| "catalog.product.update"
	| "catalog.product.activate"
	| "catalog.product.archive";

export interface CatalogPermissionPort {
	requirePermission: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: CatalogPermission;
		sessionId: string;
	}) => Promise<unknown>;
}

export type CatalogCapability =
	| "catalog.products"
	| "catalog.variants"
	| "catalog.identifiers"
	| "catalog.barcodes"
	| "catalog.lifecycle";

export interface CatalogEntitlementPort {
	requireEntitlement: (input: {
		access: "Read" | "Write";
		capabilityId: CatalogCapability;
		organizationId?: string;
		tenantId: string;
	}) => Promise<unknown>;
}

export interface CatalogIdFactory {
	create: (kind: "event" | "identifier" | "product" | "variant") => string;
}

export class CatalogError extends Error {
	readonly code:
		| "idempotency_conflict"
		| "identifier_conflict"
		| "invalid_identifier"
		| "invalid_reference"
		| "invalid_state"
		| "not_found"
		| "version_conflict";

	constructor(code: CatalogError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "CatalogError";
	}
}

function normalizeTenantIdentifier(value: string): string {
	return value.trim().replaceAll(/\s+/g, " ").toUpperCase();
}

function normalizeGtin(value: string): string {
	return value.replaceAll(/[\s-]/g, "");
}

function gtinCheckDigitIsValid(value: string): boolean {
	if (!DIGITS_PATTERN.test(value) || value.length < 2) {
		return false;
	}
	const digits = [...value].map(Number);
	const expected = digits.pop();
	const sum = digits
		.reverse()
		.reduce(
			(total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
			0
		);
	return expected === (10 - (sum % 10)) % 10;
}

function expectedGtinLength(
	scheme: ProductIdentifierInput["scheme"]
): number | null {
	if (!scheme.startsWith("GTIN-")) {
		return null;
	}
	return Number(scheme.slice("GTIN-".length));
}

function identifierUniquenessScope(
	type: ProductIdentifierInput["type"]
): CatalogIdentifierRecord["uniquenessScope"] {
	return type === "GTIN" || type === "UPC" || type === "EAN" ? "Barcode" : type;
}

export function normalizeProductIdentifier(
	identifier: ProductIdentifierInput
): string {
	const gtinLength = expectedGtinLength(identifier.scheme);
	if (gtinLength === null) {
		if (identifier.scheme !== "Tenant") {
			throw new CatalogError(
				"invalid_identifier",
				"The identifier scheme is not supported"
			);
		}
		if (["GTIN", "UPC", "EAN"].includes(identifier.type)) {
			throw new CatalogError(
				"invalid_identifier",
				"A governed GTIN scheme is required for this identifier type"
			);
		}
		const normalized = normalizeTenantIdentifier(identifier.value);
		if (!normalized) {
			throw new CatalogError("invalid_identifier", "Identifier is empty");
		}
		return normalized;
	}
	const normalized = normalizeGtin(identifier.value);
	const typeMatchesScheme =
		identifier.type === "GTIN" ||
		(identifier.type === "UPC" && gtinLength === 12) ||
		(identifier.type === "EAN" && (gtinLength === 8 || gtinLength === 13));
	if (
		!typeMatchesScheme ||
		normalized.length !== gtinLength ||
		!gtinCheckDigitIsValid(normalized)
	) {
		throw new CatalogError(
			"invalid_identifier",
			"The identifier does not satisfy its declared GTIN scheme"
		);
	}
	return normalized;
}

function normalizeLookup(value: string): string {
	const compact = normalizeGtin(value);
	return DIGITS_PATTERN.test(compact)
		? compact
		: normalizeTenantIdentifier(value);
}

async function fingerprint(value: Record<string, unknown>): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(value));
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function productView(record: CatalogProductRecord): Product {
	return {
		id: record.id,
		name: record.name,
		state: record.state,
		variants: record.variants.map((variant) => ({
			id: variant.id,
			identifiers: variant.identifiers.map((identifier) => ({
				id: identifier.id,
				scheme: identifier.scheme,
				type: identifier.type,
				value: identifier.value,
			})),
			name: variant.name,
		})),
		version: record.version,
	};
}

function receiptMatches(
	receipt: CatalogCommandReceipt,
	requestFingerprint: string
): void {
	if (receipt.requestFingerprint !== requestFingerprint) {
		throw new CatalogError(
			"idempotency_conflict",
			"The idempotency key is already bound to another Catalog command"
		);
	}
}

async function replay(
	repository: CatalogRepository,
	input: {
		idempotencyKey: string;
		operation: CatalogCommandOperation;
		requestFingerprint: string;
		tenantId: string;
	}
): Promise<Product | null> {
	const receipt = await repository.getCommandReceipt(
		input.tenantId,
		input.operation,
		input.idempotencyKey
	);
	if (!receipt) {
		return null;
	}
	receiptMatches(receipt, input.requestFingerprint);
	return receipt.result;
}

async function requireMutableProduct(
	repository: CatalogRepository,
	input: { productId: string; tenantId: string; version: number }
): Promise<CatalogProductRecord> {
	const current = await repository.getProduct(input.tenantId, input.productId);
	if (!current) {
		throw new CatalogError("not_found", "Product was not found");
	}
	if (current.version !== input.version) {
		throw new CatalogError("version_conflict", "Product version is stale");
	}
	if (current.state === "Archived") {
		throw new CatalogError(
			"invalid_state",
			"Archived Products cannot be updated"
		);
	}
	return current;
}

async function claimResult(
	repository: CatalogRepository,
	input: {
		idempotencyKey: string;
		operation: CatalogCommandOperation;
		requestFingerprint: string;
		resourceId: string;
		tenantId: string;
	},
	result: Product
): Promise<{ claimed: boolean; result: Product }> {
	const receipt = await repository.recordCommandReceipt({ ...input, result });
	receiptMatches(receipt.record, input.requestFingerprint);
	return { claimed: receipt.inserted, result: receipt.record.result };
}

function eventBase(input: {
	actorUserId: string;
	aggregateId: string;
	capabilityId: CatalogCapability;
	correlationId: string;
	eventId: string;
	idempotencyKey: string;
	name: string;
	now: Date;
	organizationId: string;
	tenantId: string;
}): PendingCatalogEvent {
	return {
		actorId: input.actorUserId,
		aggregateId: input.aggregateId,
		capabilityId: input.capabilityId,
		classification: "Confidential",
		correlationId: input.correlationId,
		data: {},
		id: input.eventId,
		idempotencyKey: input.idempotencyKey,
		name: input.name,
		occurredAt: input.now.toISOString(),
		organizationId: input.organizationId,
		producerNamespace: "catalog",
		purpose: "tenant-product-administration",
		retentionClass: "catalog-operational-event",
		schemaRef: `schemas/events/${input.name}.schema.json`,
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		sourceChannel: "api",
		tenantId: input.tenantId,
	};
}

function buildAggregate(input: {
	body: CreateProduct;
	clock: Date;
	ids: CatalogIdFactory;
	organizationId: string;
	productId: string;
	tenantId: string;
	version: number;
}): CatalogAggregateRecord {
	const seen = new Set<string>();
	const identifiers: CatalogIdentifierRecord[] = [];
	const variants = input.body.variants.map((variant, position) => {
		const variantId = input.ids.create("variant");
		const variantIdentifiers = variant.identifiers.map((identifier) => {
			const normalizedValue = normalizeProductIdentifier(identifier);
			const uniquenessScope = identifierUniquenessScope(identifier.type);
			const uniquenessKey = `${uniquenessScope}:${normalizedValue}`;
			if (seen.has(uniquenessKey)) {
				throw new CatalogError(
					"identifier_conflict",
					"The Product command contains a duplicate normalized identifier"
				);
			}
			seen.add(uniquenessKey);
			const record: CatalogIdentifierRecord = {
				...identifier,
				createdAt: input.clock,
				id: input.ids.create("identifier"),
				normalizationVersion: CATALOG_NORMALIZATION_VERSION,
				normalizedValue,
				productId: input.productId,
				tenantId: input.tenantId,
				uniquenessScope,
				variantId,
			};
			identifiers.push(record);
			return record;
		});
		return {
			createdAt: input.clock,
			id: variantId,
			identifiers: variantIdentifiers,
			name: variant.name,
			position,
			productId: input.productId,
			tenantId: input.tenantId,
			updatedAt: input.clock,
		};
	});
	return {
		identifiers,
		product: {
			archivedAt: null,
			archiveReason: null,
			classification: "Confidential",
			createdAt: input.clock,
			id: input.productId,
			name: input.body.name,
			organizationId: input.organizationId,
			state: "Draft",
			tenantId: input.tenantId,
			updatedAt: input.clock,
			version: input.version,
		},
		variants,
	};
}

function aggregateView(record: CatalogAggregateRecord): CatalogProductRecord {
	return {
		...record.product,
		variants: record.variants,
	};
}

function resolveExistingVariant(
	current: CatalogProductRecord,
	requested: UpdateProductVariant
): CatalogVariantRecord | null {
	if (!requested.id) {
		return null;
	}
	const existing = current.variants.find(
		(variant) => variant.id === requested.id
	);
	if (!existing) {
		throw new CatalogError(
			"invalid_reference",
			"The Variant does not belong to the Product"
		);
	}
	return existing;
}

function buildUpdatedIdentifier(input: {
	clock: Date;
	currentVariant: CatalogVariantRecord | null;
	ids: CatalogIdFactory;
	productId: string;
	requested: UpdateProductIdentifier;
	tenantId: string;
	variantId: string;
}): CatalogIdentifierRecord {
	const existing =
		input.requested.id && input.currentVariant
			? input.currentVariant.identifiers.find(
					(identifier) => identifier.id === input.requested.id
				)
			: null;
	if (input.requested.id && !existing) {
		throw new CatalogError(
			"invalid_reference",
			"The Identifier does not belong to the Variant"
		);
	}
	const normalizedValue = normalizeProductIdentifier(input.requested);
	const uniquenessScope = identifierUniquenessScope(input.requested.type);
	if (
		existing &&
		(existing.scheme !== input.requested.scheme ||
			existing.type !== input.requested.type ||
			existing.normalizedValue !== normalizedValue)
	) {
		throw new CatalogError(
			"invalid_reference",
			"An existing Identifier cannot be reassigned during Product update"
		);
	}
	return {
		createdAt: existing?.createdAt ?? input.clock,
		id: existing?.id ?? input.ids.create("identifier"),
		normalizationVersion: CATALOG_NORMALIZATION_VERSION,
		normalizedValue,
		productId: input.productId,
		scheme: input.requested.scheme,
		tenantId: input.tenantId,
		type: input.requested.type,
		uniquenessScope,
		value: input.requested.value,
		variantId: input.variantId,
	};
}

function requireNoChildRemoval(
	current: CatalogProductRecord,
	variants: CatalogVariantRecord[]
): void {
	const retainedVariants = new Set(variants.map((variant) => variant.id));
	for (const currentVariant of current.variants) {
		if (!retainedVariants.has(currentVariant.id)) {
			throw new CatalogError(
				"invalid_reference",
				"Variant removal is deferred until its canonical event is governed"
			);
		}
		const updated = variants.find(
			(variant) => variant.id === currentVariant.id
		);
		const retainedIdentifiers = new Set(
			updated?.identifiers.map((identifier) => identifier.id) ?? []
		);
		if (
			currentVariant.identifiers.some(
				(identifier) => !retainedIdentifiers.has(identifier.id)
			)
		) {
			throw new CatalogError(
				"invalid_reference",
				"Identifier removal is deferred until its canonical event is governed"
			);
		}
	}
}

function buildUpdatedAggregate(input: {
	body: UpdateProduct;
	clock: Date;
	current: CatalogProductRecord;
	ids: CatalogIdFactory;
}): {
	aggregate: CatalogAggregateRecord;
	candidate: CatalogProductRecord;
	replaceChildren: boolean;
} {
	const { variants: currentVariants, ...currentProduct } = input.current;
	if (!input.body.variants) {
		const aggregate = {
			identifiers: currentVariants.flatMap((variant) => variant.identifiers),
			product: {
				...currentProduct,
				name: input.body.name ?? currentProduct.name,
				updatedAt: input.clock,
				version: currentProduct.version + 1,
			},
			variants: currentVariants,
		};
		return {
			aggregate,
			candidate: aggregateView(aggregate),
			replaceChildren: false,
		};
	}

	const seen = new Set<string>();
	const identifiers: CatalogIdentifierRecord[] = [];
	const variants = input.body.variants.map((requested, position) => {
		const existing = resolveExistingVariant(input.current, requested);
		const variantId = existing?.id ?? input.ids.create("variant");
		const variantIdentifiers = requested.identifiers.map((identifier) => {
			const record = buildUpdatedIdentifier({
				clock: input.clock,
				currentVariant: existing,
				ids: input.ids,
				productId: input.current.id,
				requested: identifier,
				tenantId: input.current.tenantId,
				variantId,
			});
			const uniquenessKey = `${record.uniquenessScope}:${record.normalizedValue}`;
			if (seen.has(uniquenessKey)) {
				throw new CatalogError(
					"identifier_conflict",
					"The Product command contains a duplicate normalized identifier"
				);
			}
			seen.add(uniquenessKey);
			identifiers.push(record);
			return record;
		});
		return {
			createdAt: existing ? existing.createdAt : input.clock,
			id: variantId,
			identifiers: variantIdentifiers,
			name: requested.name,
			position,
			productId: input.current.id,
			tenantId: input.current.tenantId,
			updatedAt: input.clock,
		};
	});
	requireNoChildRemoval(input.current, variants);
	const aggregate: CatalogAggregateRecord = {
		identifiers,
		product: {
			...currentProduct,
			name: input.body.name ?? currentProduct.name,
			updatedAt: input.clock,
			version: currentProduct.version + 1,
		},
		variants,
	};
	return {
		aggregate,
		candidate: aggregateView(aggregate),
		replaceChildren: true,
	};
}

async function appendAggregateEvents(
	events: CatalogEventAppendPort,
	input: {
		actorUserId: string;
		aggregate: CatalogAggregateRecord;
		correlationId: string;
		idempotencyKey: string;
		ids: CatalogIdFactory;
		now: Date;
		prior?: CatalogProductRecord;
	}
): Promise<void> {
	const priorVariants = input.prior ? input.prior.variants : [];
	const priorVariantIds = new Set(priorVariants.map((variant) => variant.id));
	const priorIdentifierIds = new Set(
		priorVariants.flatMap((variant) =>
			variant.identifiers.map((identifier) => identifier.id)
		)
	);
	for (const variant of input.aggregate.variants) {
		if (priorVariantIds.has(variant.id)) {
			continue;
		}
		const event = eventBase({
			actorUserId: input.actorUserId,
			aggregateId: input.aggregate.product.id,
			capabilityId: "catalog.variants",
			correlationId: input.correlationId,
			eventId: input.ids.create("event"),
			idempotencyKey: input.idempotencyKey,
			name: "catalog.variant.created.v1",
			now: input.now,
			organizationId: input.aggregate.product.organizationId,
			tenantId: input.aggregate.product.tenantId,
		});
		event.data = {
			productId: input.aggregate.product.id,
			variantId: variant.id,
			version: input.aggregate.product.version,
		};
		// biome-ignore lint/performance/noAwaitInLoops: one transaction client preserves aggregate event order.
		await events.append(event);
	}
	for (const identifier of input.aggregate.identifiers) {
		if (priorIdentifierIds.has(identifier.id)) {
			continue;
		}
		const event = eventBase({
			actorUserId: input.actorUserId,
			aggregateId: input.aggregate.product.id,
			capabilityId:
				identifier.type === "GTIN" ||
				identifier.type === "UPC" ||
				identifier.type === "EAN"
					? "catalog.barcodes"
					: "catalog.identifiers",
			correlationId: input.correlationId,
			eventId: input.ids.create("event"),
			idempotencyKey: input.idempotencyKey,
			name: "catalog.identifier.assigned.v1",
			now: input.now,
			organizationId: input.aggregate.product.organizationId,
			tenantId: input.aggregate.product.tenantId,
		});
		event.data = {
			identifierId: identifier.id,
			identifierType: identifier.type,
			normalizationVersion: identifier.normalizationVersion,
			normalizedValue: identifier.normalizedValue,
			productId: identifier.productId,
			variantId: identifier.variantId,
		};
		// biome-ignore lint/performance/noAwaitInLoops: one transaction client preserves aggregate event order.
		await events.append(event);
	}
}

export interface CatalogServiceOptions {
	clock: () => Date;
	ids: CatalogIdFactory;
	unitOfWork: CatalogUnitOfWork;
}

export function createCatalogService(options: CatalogServiceOptions) {
	return {
		async activateProduct(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			productId: string;
			tenantId: string;
			version: number;
		}): Promise<Product> {
			const operation = "catalog.product.activate" as const;
			const requestFingerprint = await fingerprint({
				productId: input.productId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay(repository, {
					idempotencyKey: input.idempotencyKey,
					operation,
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getProduct(
					input.tenantId,
					input.productId
				);
				if (!current) {
					throw new CatalogError("not_found", "Product was not found");
				}
				if (current.version !== input.version) {
					throw new CatalogError(
						"version_conflict",
						"Product version is stale"
					);
				}
				if (current.state !== "Draft" && current.state !== "Suspended") {
					throw new CatalogError(
						"invalid_state",
						"Only Draft or Suspended Products may be activated"
					);
				}
				const now = options.clock();
				const candidate = {
					...current,
					state: "Active" as const,
					updatedAt: now,
					version: current.version + 1,
				};
				const claim = await claimResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation,
						requestFingerprint,
						resourceId: current.id,
						tenantId: input.tenantId,
					},
					productView(candidate)
				);
				if (!claim.claimed) {
					return claim.result;
				}
				const updated = await repository.transitionProduct({
					from: current.state,
					productId: current.id,
					tenantId: input.tenantId,
					to: "Active",
					updatedAt: now,
					version: input.version,
				});
				if (updated === "version_conflict") {
					throw new CatalogError(
						"version_conflict",
						"Product version is stale"
					);
				}
				const event = eventBase({
					actorUserId: input.actorUserId,
					aggregateId: updated.id,
					capabilityId: "catalog.lifecycle",
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "catalog.product.activated.v1",
					now,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				event.data = {
					previousState: current.state,
					productId: updated.id,
					version: updated.version,
				};
				await events.append(event);
				return productView(updated);
			});
		},

		async archiveProduct(input: {
			actorUserId: string;
			body: TransitionReason;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			productId: string;
			tenantId: string;
			version: number;
		}): Promise<Product> {
			const operation = "catalog.product.archive" as const;
			const requestFingerprint = await fingerprint({
				body: input.body,
				productId: input.productId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay(repository, {
					idempotencyKey: input.idempotencyKey,
					operation,
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getProduct(
					input.tenantId,
					input.productId
				);
				if (!current) {
					throw new CatalogError("not_found", "Product was not found");
				}
				if (current.version !== input.version) {
					throw new CatalogError(
						"version_conflict",
						"Product version is stale"
					);
				}
				if (current.state === "Archived") {
					throw new CatalogError(
						"invalid_state",
						"The Product is already archived"
					);
				}
				const now = options.clock();
				const candidate = {
					...current,
					archivedAt: now,
					archiveReason: input.body.reason,
					state: "Archived" as const,
					updatedAt: now,
					version: current.version + 1,
				};
				const claim = await claimResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation,
						requestFingerprint,
						resourceId: current.id,
						tenantId: input.tenantId,
					},
					productView(candidate)
				);
				if (!claim.claimed) {
					return claim.result;
				}
				const updated = await repository.transitionProduct({
					archivedAt: now,
					archiveReason: input.body.reason,
					from: current.state,
					productId: current.id,
					tenantId: input.tenantId,
					to: "Archived",
					updatedAt: now,
					version: input.version,
				});
				if (updated === "version_conflict") {
					throw new CatalogError(
						"version_conflict",
						"Product version is stale"
					);
				}
				const event = eventBase({
					actorUserId: input.actorUserId,
					aggregateId: updated.id,
					capabilityId: "catalog.lifecycle",
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "catalog.product.archived.v1",
					now,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				event.data = {
					previousState: current.state,
					productId: updated.id,
					reason: input.body.reason,
					version: updated.version,
				};
				await events.append(event);
				return productView(updated);
			});
		},

		async createProduct(input: {
			actorUserId: string;
			body: CreateProduct;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
		}): Promise<Product> {
			const operation = "catalog.product.create" as const;
			const requestFingerprint = await fingerprint({ body: input.body });
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay(repository, {
					idempotencyKey: input.idempotencyKey,
					operation,
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const now = options.clock();
				const aggregate = buildAggregate({
					body: input.body,
					clock: now,
					ids: options.ids,
					organizationId: input.organizationId,
					productId: options.ids.create("product"),
					tenantId: input.tenantId,
					version: 1,
				});
				const candidate = aggregateView(aggregate);
				const claim = await claimResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation,
						requestFingerprint,
						resourceId: candidate.id,
						tenantId: input.tenantId,
					},
					productView(candidate)
				);
				if (!claim.claimed) {
					return claim.result;
				}
				const created = await repository.createProduct(aggregate);
				if (created === "identifier_conflict") {
					throw new CatalogError(
						"identifier_conflict",
						"An identifier is already assigned in the active tenant"
					);
				}
				const event = eventBase({
					actorUserId: input.actorUserId,
					aggregateId: created.id,
					capabilityId: "catalog.products",
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "catalog.product.created.v1",
					now,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				event.data = {
					name: created.name,
					productId: created.id,
					state: created.state,
					version: created.version,
				};
				await events.append(event);
				await appendAggregateEvents(events, {
					actorUserId: input.actorUserId,
					aggregate,
					correlationId: input.correlationId,
					idempotencyKey: input.idempotencyKey,
					ids: options.ids,
					now,
				});
				return productView(created);
			});
		},

		getProduct(tenantId: string, productId: string): Promise<Product> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const product = await repository.getProduct(tenantId, productId);
				if (!product) {
					throw new CatalogError("not_found", "Product was not found");
				}
				return productView(product);
			});
		},

		listProducts(
			tenantId: string,
			page: CatalogPageRequest
		): Promise<CatalogPage<Product>> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const result = await repository.listProducts(tenantId, {
					...page,
					...(page.barcode ? { barcode: normalizeLookup(page.barcode) } : {}),
				});
				return { ...result, items: result.items.map(productView) };
			});
		},

		async updateProduct(input: {
			actorUserId: string;
			body: UpdateProduct;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			productId: string;
			tenantId: string;
			version: number;
		}): Promise<Product> {
			const operation = "catalog.product.update" as const;
			const requestFingerprint = await fingerprint({
				body: input.body,
				productId: input.productId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay(repository, {
					idempotencyKey: input.idempotencyKey,
					operation,
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await requireMutableProduct(repository, input);
				const now = options.clock();
				const { aggregate, candidate, replaceChildren } = buildUpdatedAggregate(
					{
						body: input.body,
						clock: now,
						current,
						ids: options.ids,
					}
				);
				const claim = await claimResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation,
						requestFingerprint,
						resourceId: current.id,
						tenantId: input.tenantId,
					},
					productView(candidate)
				);
				if (!claim.claimed) {
					return claim.result;
				}
				const updated = await repository.updateProduct({
					aggregate,
					expectedVersion: input.version,
					replaceChildren,
				});
				if (updated === "identifier_conflict") {
					throw new CatalogError(
						"identifier_conflict",
						"An identifier is already assigned in the active tenant"
					);
				}
				if (updated === "version_conflict") {
					throw new CatalogError(
						"version_conflict",
						"Product version is stale"
					);
				}
				const changedFields = Object.keys(input.body);
				const event = eventBase({
					actorUserId: input.actorUserId,
					aggregateId: updated.id,
					capabilityId: "catalog.products",
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "catalog.product.changed.v1",
					now,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				event.data = {
					changedFields,
					productId: updated.id,
					version: updated.version,
				};
				await events.append(event);
				if (input.body.variants) {
					await appendAggregateEvents(events, {
						actorUserId: input.actorUserId,
						aggregate,
						correlationId: input.correlationId,
						idempotencyKey: input.idempotencyKey,
						ids: options.ids,
						now,
						prior: current,
					});
				}
				return productView(updated);
			});
		},
	};
}

const PRODUCT_READ_CAPABILITIES: CatalogCapability[] = [
	"catalog.products",
	"catalog.variants",
	"catalog.identifiers",
	"catalog.barcodes",
];

export interface CatalogApplicationOptions {
	activeContexts: CatalogActiveContextPort;
	entitlements: CatalogEntitlementPort;
	permissions: CatalogPermissionPort;
	service: ReturnType<typeof createCatalogService>;
}

export function createCatalogApplication(options: CatalogApplicationOptions) {
	async function authorize(
		input: { authUserId: string; contextId: string; sessionId: string },
		permission: CatalogPermission
	) {
		await options.permissions.requirePermission({
			assuranceLevel: "aal1",
			...input,
			permission,
		});
		return options.activeContexts.requireActiveContext(input);
	}

	async function requireCapabilities(
		active: { organizationId: string; tenantId: string },
		capabilities: readonly CatalogCapability[],
		access: "Read" | "Write"
	) {
		await Promise.all(
			capabilities.map((capabilityId) =>
				options.entitlements.requireEntitlement({
					access,
					capabilityId,
					organizationId: active.organizationId,
					tenantId: active.tenantId,
				})
			)
		);
	}

	return {
		async activate(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			productId: string;
			sessionId: string;
			version: number;
		}) {
			const active = await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"catalog.product.activate"
			);
			await requireCapabilities(
				active,
				["catalog.products", "catalog.lifecycle"],
				"Write"
			);
			return options.service.activateProduct({
				...input,
				organizationId: active.organizationId,
				tenantId: active.tenantId,
			});
		},
		async archive(input: {
			actorUserId: string;
			body: TransitionReason;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			productId: string;
			sessionId: string;
			version: number;
		}) {
			const active = await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"catalog.product.archive"
			);
			await requireCapabilities(
				active,
				["catalog.products", "catalog.lifecycle"],
				"Write"
			);
			return options.service.archiveProduct({
				...input,
				organizationId: active.organizationId,
				tenantId: active.tenantId,
			});
		},
		async create(input: {
			actorUserId: string;
			body: CreateProduct;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const active = await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"catalog.product.create"
			);
			await requireCapabilities(active, PRODUCT_READ_CAPABILITIES, "Write");
			return options.service.createProduct({
				...input,
				organizationId: active.organizationId,
				tenantId: active.tenantId,
			});
		},
		async get(input: {
			authUserId: string;
			contextId: string;
			productId: string;
			sessionId: string;
		}) {
			const active = await authorize(input, "catalog.product.read");
			await requireCapabilities(active, PRODUCT_READ_CAPABILITIES, "Read");
			return options.service.getProduct(active.tenantId, input.productId);
		},
		async list(input: {
			authUserId: string;
			contextId: string;
			page: CatalogPageRequest;
			sessionId: string;
		}) {
			const active = await authorize(input, "catalog.product.read");
			await requireCapabilities(active, PRODUCT_READ_CAPABILITIES, "Read");
			return options.service.listProducts(active.tenantId, input.page);
		},
		async update(input: {
			actorUserId: string;
			body: UpdateProduct;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			productId: string;
			sessionId: string;
			version: number;
		}) {
			const active = await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"catalog.product.update"
			);
			await requireCapabilities(active, PRODUCT_READ_CAPABILITIES, "Write");
			return options.service.updateProduct({
				...input,
				organizationId: active.organizationId,
				tenantId: active.tenantId,
			});
		},
	};
}
