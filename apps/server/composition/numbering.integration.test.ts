import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createNumberingRepository,
	migratePlatformNumbering,
} from "@meridian/persistence-platform-numbering-postgres";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

const databaseName = `meridian_numbering_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

const sequence = {
	id: "sequence_shared_reference",
	ownerNamespace: "platform",
	padding: 4,
	prefix: "REF-",
	recordType: "SecurityProof",
	sequenceKey: "platform.security-proof",
};

async function insertSequence(tenantId: string, organizationId: string) {
	await testPool.query(
		`INSERT INTO platform_number_sequence
		(tenant_id, id, organization_id, owner_namespace, record_type, sequence_key, prefix, padding, current_value, next_value, state, version, classification, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 1, 'Active', 1, 'Confidential', $9, $9)`,
		[
			tenantId,
			sequence.id,
			organizationId,
			sequence.ownerNamespace,
			sequence.recordType,
			sequence.sequenceKey,
			sequence.prefix,
			sequence.padding,
			new Date("2026-07-16T12:00:00.000Z"),
		]
	);
}

async function insertAllocation(input: {
	counterValue: number;
	id: string;
	idempotencyKey: string;
	organizationId: string;
	tenantId: string;
	value: string;
}) {
	await testPool.query(
		`INSERT INTO platform_number_allocation
		(tenant_id, id, organization_id, sequence_id, sequence_key, sequence_version, business_record_id, source_command_id, idempotency_key, request_fingerprint, allocated_by_user_id, counter_value, value, state, classification, issued_at)
		VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8, $9, $10, $11, $12, 'Issued', 'Confidential', $13)`,
		[
			input.tenantId,
			input.id,
			input.organizationId,
			sequence.id,
			sequence.sequenceKey,
			`record_${input.id}`,
			`source_${input.id}`,
			input.idempotencyKey,
			`fingerprint_${input.id}`,
			`actor_${input.tenantId}`,
			input.counterValue,
			input.value,
			new Date("2026-07-16T12:00:00.000Z"),
		]
	);
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 4 });
	await migratePlatformNumbering(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial("Numbering PostgreSQL tenant isolation", () => {
	test("keeps identical sequence and idempotency identities tenant-local", async () => {
		const tenantA = "tenant_numbering_isolation_a";
		const tenantB = "tenant_numbering_isolation_b";
		const organizationA = "organization_numbering_isolation_a";
		const organizationB = "organization_numbering_isolation_b";
		await insertSequence(tenantA, organizationA);
		await insertSequence(tenantB, organizationB);
		await insertAllocation({
			counterValue: 1,
			id: "allocation_shared_a",
			idempotencyKey: "shared-idempotency",
			organizationId: organizationA,
			tenantId: tenantA,
			value: "REF-0001",
		});
		await insertAllocation({
			counterValue: 1,
			id: "allocation_shared_b",
			idempotencyKey: "shared-idempotency",
			organizationId: organizationB,
			tenantId: tenantB,
			value: "REF-0001",
		});
		await insertAllocation({
			counterValue: 2,
			id: "allocation_a_only",
			idempotencyKey: "tenant-a-only",
			organizationId: organizationA,
			tenantId: tenantA,
			value: "REF-0002",
		});

		const client = await testPool.connect();
		try {
			const repository = createNumberingRepository(client);
			const sharedA = await repository.findAllocation({
				idempotencyKey: "shared-idempotency",
				sequenceId: sequence.id,
				tenantId: tenantA,
			});
			const sharedB = await repository.findAllocation({
				idempotencyKey: "shared-idempotency",
				sequenceId: sequence.id,
				tenantId: tenantB,
			});
			expect(sharedA).toMatchObject({
				id: "allocation_shared_a",
				tenantId: tenantA,
				value: "REF-0001",
			});
			expect(sharedB).toMatchObject({
				id: "allocation_shared_b",
				tenantId: tenantB,
				value: "REF-0001",
			});
			expect(
				await repository.findAllocation({
					idempotencyKey: "tenant-a-only",
					sequenceId: sequence.id,
					tenantId: tenantB,
				})
			).toBeNull();
		} finally {
			client.release();
		}

		const facts = await testPool.query<{
			allocations: string;
			tenant_id: string;
		}>(`SELECT tenant_id, count(*)::text AS allocations
			FROM platform_number_allocation
			GROUP BY tenant_id
			ORDER BY tenant_id`);
		expect(facts.rows).toEqual([
			{ allocations: "2", tenant_id: tenantA },
			{ allocations: "1", tenant_id: tenantB },
		]);
	});
});
