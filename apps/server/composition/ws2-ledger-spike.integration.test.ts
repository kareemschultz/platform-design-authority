import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { env } from "@meridian/tooling-env/server";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseName = `meridian_ws2_spike_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;

const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

async function postMovement(
	id: string,
	quantity: string,
	reversalOf: string | null = null
): Promise<void> {
	const database = drizzle(testPool);
	await database.transaction(async (transaction) => {
		await transaction.execute(
			sql`SELECT quantity FROM ws2_spike_balance WHERE tenant_id = 'tenant_a' AND location_id = 'location_a' AND product_id = 'product_a' AND unit = 'EA' FOR UPDATE`
		);
		await transaction.execute(
			sql`INSERT INTO ws2_spike_movement (id, tenant_id, location_id, product_id, unit, quantity, reversal_of) VALUES (${id}, 'tenant_a', 'location_a', 'product_a', 'EA', ${quantity}::numeric, ${reversalOf})`
		);
		await transaction.execute(
			sql`UPDATE ws2_spike_balance SET quantity = quantity + ${quantity}::numeric, version = version + 1 WHERE tenant_id = 'tenant_a' AND location_id = 'location_a' AND product_id = 'product_a' AND unit = 'EA'`
		);
	});
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 8 });
	const database = drizzle(testPool);
	await database.execute(
		sql.raw(`
		CREATE TABLE ws2_spike_movement (
			id text PRIMARY KEY,
			tenant_id text NOT NULL,
			location_id text NOT NULL,
			product_id text NOT NULL,
			unit text NOT NULL,
			quantity numeric(38,6) NOT NULL,
			reversal_of text NULL REFERENCES ws2_spike_movement(id),
			created_at timestamptz NOT NULL DEFAULT now()
		);
		CREATE TABLE ws2_spike_balance (
			tenant_id text NOT NULL,
			location_id text NOT NULL,
			product_id text NOT NULL,
			unit text NOT NULL,
			quantity numeric(38,6) NOT NULL DEFAULT 0,
			version integer NOT NULL DEFAULT 1,
			PRIMARY KEY (tenant_id, location_id, product_id, unit)
		);
		CREATE TABLE ws2_spike_outbox (
			id text PRIMARY KEY,
			tenant_id text NOT NULL,
			movement_id text NOT NULL REFERENCES ws2_spike_movement(id)
		);
		CREATE TABLE ws2_spike_product (
			id bigint PRIMARY KEY,
			tenant_id text NOT NULL,
			name text NOT NULL,
			barcode text NOT NULL,
			state text NOT NULL
		);
		CREATE UNIQUE INDEX ws2_spike_product_barcode_idx ON ws2_spike_product (tenant_id, barcode);
		CREATE INDEX ws2_spike_product_cursor_idx ON ws2_spike_product (tenant_id, id);
		CREATE INDEX ws2_spike_product_filter_idx ON ws2_spike_product (tenant_id, state, id);
		INSERT INTO ws2_spike_balance (tenant_id, location_id, product_id, unit)
		VALUES ('tenant_a', 'location_a', 'product_a', 'EA');
		INSERT INTO ws2_spike_product (id, tenant_id, name, barcode, state)
		SELECT value, 'tenant_a', 'Synthetic Product ' || value, lpad(value::text, 14, '0'),
			CASE WHEN value % 5 = 0 THEN 'Draft' ELSE 'Active' END
		FROM generate_series(1, 250000) AS value;
	`)
	);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial("WS2 PostgreSQL 18 and Drizzle ledger spike", () => {
	test("rolls owner state and outbox back together on one Drizzle transaction", async () => {
		const database = drizzle(testPool);
		let failed = false;
		try {
			await database.transaction(async (transaction) => {
				await transaction.execute(
					sql`INSERT INTO ws2_spike_movement (id, tenant_id, location_id, product_id, unit, quantity) VALUES ('movement_rollback', 'tenant_a', 'location_a', 'product_a', 'EA', 1.25)`
				);
				await transaction.execute(
					sql`INSERT INTO ws2_spike_outbox (id, tenant_id, movement_id) VALUES ('event_rollback', 'tenant_a', 'movement_rollback')`
				);
				throw new Error("forced rollback");
			});
		} catch (error) {
			failed = error instanceof Error && error.message === "forced rollback";
		}
		expect(failed).toBe(true);
		const result = await testPool.query<{ movements: number; events: number }>(
			"SELECT (SELECT count(*)::int FROM ws2_spike_movement WHERE id = 'movement_rollback') AS movements, (SELECT count(*)::int FROM ws2_spike_outbox WHERE id = 'event_rollback') AS events"
		);
		expect(result.rows[0]).toEqual({ events: 0, movements: 0 });
	});

	test("serializes concurrent posting without lost or double effects", async () => {
		await Promise.all(
			Array.from({ length: 20 }, (_, index) =>
				postMovement(`movement_concurrent_${index}`, "0.100000")
			)
		);
		const result = await testPool.query<{
			movements: number;
			quantity: string;
		}>(
			"SELECT (SELECT count(*)::int FROM ws2_spike_movement WHERE id LIKE 'movement_concurrent_%') AS movements, quantity::text FROM ws2_spike_balance WHERE tenant_id = 'tenant_a' AND location_id = 'location_a' AND product_id = 'product_a' AND unit = 'EA'"
		);
		expect(result.rows[0]).toEqual({ movements: 20, quantity: "2.000000" });
	});

	test("preserves exact decimals and linked reversal conservation", async () => {
		await postMovement("movement_original", "3.333333");
		await postMovement("movement_reversal", "-3.333333", "movement_original");
		const result = await testPool.query<{
			original: string;
			reversal: string;
			sum: string;
		}>(
			"SELECT max(quantity::text) FILTER (WHERE id = 'movement_original') AS original, max(quantity::text) FILTER (WHERE id = 'movement_reversal') AS reversal, sum(quantity)::text AS sum FROM ws2_spike_movement WHERE id IN ('movement_original', 'movement_reversal')"
		);
		expect(result.rows[0]).toEqual({
			original: "3.333333",
			reversal: "-3.333333",
			sum: "0.000000",
		});
	});

	test("rebuilds the balance from immutable movements with zero divergence", async () => {
		const result = await testPool.query<{ balance: string; rebuilt: string }>(
			"SELECT b.quantity::text AS balance, coalesce(sum(m.quantity), 0)::text AS rebuilt FROM ws2_spike_balance b LEFT JOIN ws2_spike_movement m ON m.tenant_id = b.tenant_id AND m.location_id = b.location_id AND m.product_id = b.product_id AND m.unit = b.unit WHERE b.tenant_id = 'tenant_a' AND b.location_id = 'location_a' AND b.product_id = 'product_a' AND b.unit = 'EA' GROUP BY b.quantity"
		);
		expect(result.rows[0]?.rebuilt).toBe(result.rows[0]?.balance);
	});

	test("uses tenant-scoped exact barcode and cursor/filter indexes at 250k products", async () => {
		const barcodePlan = await testPool.query<{ "QUERY PLAN": string }>(
			"EXPLAIN (FORMAT TEXT) SELECT id FROM ws2_spike_product WHERE tenant_id = 'tenant_a' AND barcode = '00000000249999'"
		);
		expect(
			barcodePlan.rows.map((row) => row["QUERY PLAN"]).join(" ")
		).toContain("ws2_spike_product_barcode_idx");
		const cursorPlan = await testPool.query<{ "QUERY PLAN": string }>(
			"EXPLAIN (FORMAT TEXT) SELECT id FROM ws2_spike_product WHERE tenant_id = 'tenant_a' AND state = 'Active' AND id > 249900 ORDER BY id LIMIT 20"
		);
		expect(cursorPlan.rows.map((row) => row["QUERY PLAN"]).join(" ")).toContain(
			"ws2_spike_product_filter_idx"
		);
		const page = await testPool.query<{ id: string }>(
			"SELECT id::text FROM ws2_spike_product WHERE tenant_id = 'tenant_a' AND state = 'Active' AND id > 249900 ORDER BY id LIMIT 20"
		);
		expect(page.rows).toHaveLength(20);
		expect(Number(page.rows[0]?.id)).toBeGreaterThan(249_900);
	});
});
