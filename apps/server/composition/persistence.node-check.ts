import assert from "node:assert/strict";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import type { OutboxEvent } from "@meridian/platform-events";
import { env } from "@meridian/tooling-env/server";
import { Pool, type PoolClient } from "pg";
import { type MigrationStream, runMigrationStreams } from "./migrations";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_pr2_node_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const databaseUrl = new URL(env.DATABASE_URL);
databaseUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function event(id: string): OutboxEvent<{ runtime: string }> {
	return {
		classification: "Internal",
		data: { runtime: "node" },
		id,
		name: "platform.membership.activated.v1",
		occurredAt: "2026-07-13T00:00:00.000Z",
		producerNamespace: "platform",
		retentionClass: "platform-security-evidence",
		schemaRef: "schemas/events/platform.membership.activated.v1.schema.json",
		schemaVersion: "1.0.0",
		tenantId: "tenant_pr2_node",
	};
}

await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
const pool = new Pool({ connectionString: databaseUrl.toString(), max: 4 });

try {
	await runMigrationStreams(pool);
	await runMigrationStreams(pool);

	const ownerTables = await pool.query<{
		outbox: string | null;
		party: string | null;
		tenancy: string | null;
		tenancyReceipts: string | null;
	}>(
		"SELECT to_regclass('public.platform_event_outbox')::text AS outbox, to_regclass('public.party_record')::text AS party, to_regclass('public.platform_tenant')::text AS tenancy, to_regclass('public.platform_tenancy_command_receipt')::text AS \"tenancyReceipts\""
	);
	assert.deepEqual(ownerTables.rows[0], {
		outbox: "platform_event_outbox",
		party: "party_record",
		tenancy: "platform_tenant",
		tenancyReceipts: "platform_tenancy_command_receipt",
	});

	const failingStream: MigrationStream = {
		id: "test.node-failure",
		async migrate(target) {
			const client = await target.connect();
			try {
				await client.query("BEGIN");
				await client.query(
					"CREATE TABLE pr2_node_failed_fixture (id text PRIMARY KEY)"
				);
				throw new Error("deliberate node migration failure");
			} catch (error) {
				await client.query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		},
	};
	await assert.rejects(
		runMigrationStreams(pool, [failingStream]),
		/Migration stream test\.node-failure failed/
	);
	const failedTable = await pool.query<{ value: string | null }>(
		"SELECT to_regclass('public.pr2_node_failed_fixture')::text AS value"
	);
	assert.equal(failedTable.rows[0]?.value, null);

	await pool.query(
		"CREATE TABLE pr2_node_state_fixture (id text PRIMARY KEY, revision integer NOT NULL)"
	);
	await pool.query(
		"INSERT INTO pr2_node_state_fixture (id, revision) VALUES ('identity_node', 0)"
	);
	const unitOfWork = createPostgresUnitOfWork(pool, (client: PoolClient) => ({
		outbox: createPostgresOutbox(client),
		state: {
			increment: () =>
				client.query(
					"UPDATE pr2_node_state_fixture SET revision = revision + 1 WHERE id = 'identity_node'"
				),
		},
	}));
	await unitOfWork.execute(async ({ outbox, state }) => {
		await state.increment();
		assert.equal(await outbox.append(event("evt_pr2_node_commit")), "inserted");
	});
	await assert.rejects(
		unitOfWork.execute(async ({ outbox, state }) => {
			await state.increment();
			await outbox.append(event("evt_pr2_node_rollback"));
			throw new Error("node rollback proof");
		}),
		/node rollback proof/
	);

	const stateResult = await pool.query<{ revision: number }>(
		"SELECT revision FROM pr2_node_state_fixture WHERE id = 'identity_node'"
	);
	assert.equal(stateResult.rows[0]?.revision, 1);
	const records = await pool.query<{ id: string }>(
		"SELECT id FROM platform_event_outbox WHERE id LIKE 'evt_pr2_node_%' ORDER BY id"
	);
	assert.deepEqual(
		records.rows.map((row) => row.id),
		["evt_pr2_node_commit"]
	);
} finally {
	await pool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
}
