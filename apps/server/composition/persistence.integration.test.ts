import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import { migratePlatformIdentity } from "@meridian/persistence-platform-identity-postgres";
import type { OutboxEvent } from "@meridian/platform-events";
import { env } from "@meridian/tooling-env/server";
import { Pool, type PoolClient } from "pg";
import {
	type MigrationStream,
	runMigrationStreams,
	WS1_MIGRATION_STREAMS,
} from "./migrations";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_pr2_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;

const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

async function createDatabase(name: string): Promise<Pool> {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
	const url = new URL(env.DATABASE_URL);
	url.pathname = `/${name}`;
	return new Pool({ connectionString: url.toString(), max: 4 });
}

async function dropDatabase(name: string, pool: Pool): Promise<void> {
	await pool.end();
	await adminPool.query(`DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`);
}

function event(id: string): OutboxEvent<{ change: string }> {
	return {
		actorId: "user_pr2",
		classification: "Internal",
		data: { change: "persistence-proof" },
		id,
		name: "platform.membership.activated.v1",
		occurredAt: "2026-07-13T00:00:00.000Z",
		producerNamespace: "platform",
		retentionClass: "platform-security-evidence",
		schemaRef: "schemas/events/platform.membership.activated.v1.schema.json",
		schemaVersion: "1.0.0",
		sourceChannel: "test",
		tenantId: "tenant_pr2",
	};
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 4 });
});

afterAll(async () => {
	await dropDatabase(databaseName, testPool);
	await adminPool.end();
});

describe.serial("WS1 persistence orchestration", () => {
	test("uses a deterministic, owner-qualified stream order", () => {
		expect(WS1_MIGRATION_STREAMS.map((stream) => stream.id)).toEqual([
			"platform.identity",
			"platform.events",
		]);
	});

	test("migrates an empty database and repeats without schema drift", async () => {
		await runMigrationStreams(testPool);
		await runMigrationStreams(testPool);

		const tables = await testPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
		);
		expect(tables.rows.map((row) => row.table_name)).toEqual([
			"account",
			"platform_event_outbox",
			"session",
			"user",
			"verification",
		]);

		const histories = await testPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'drizzle' ORDER BY table_name"
		);
		expect(histories.rows.map((row) => row.table_name)).toEqual([
			"platform_events_migrations",
			"platform_identity_migrations",
		]);
	});

	test("upgrades a representative identity-only database", async () => {
		const name = `${databaseName}_upgrade`;
		const pool = await createDatabase(name);
		try {
			await migratePlatformIdentity(pool);
			const before = await pool.query<{ value: string | null }>(
				"SELECT to_regclass('public.platform_event_outbox')::text AS value"
			);
			expect(before.rows[0]?.value).toBeNull();

			await runMigrationStreams(pool);
			const after = await pool.query<{ value: string | null }>(
				"SELECT to_regclass('public.platform_event_outbox')::text AS value"
			);
			expect(after.rows[0]?.value).toBe("platform_event_outbox");
		} finally {
			await dropDatabase(name, pool);
		}
	});

	test("recovers after a failed serial stream without partial state", async () => {
		const name = `${databaseName}_failure`;
		const pool = await createDatabase(name);
		const failingStream: MigrationStream = {
			id: "test.deliberate-failure",
			async migrate(target) {
				const client = await target.connect();
				try {
					await client.query("BEGIN");
					await client.query(
						"CREATE TABLE pr2_failed_migration_fixture (id text PRIMARY KEY)"
					);
					throw new Error("deliberate migration failure");
				} catch (error) {
					await client.query("ROLLBACK");
					throw error;
				} finally {
					client.release();
				}
			},
		};

		try {
			await expect(
				runMigrationStreams(pool, [
					{ id: "platform.identity", migrate: migratePlatformIdentity },
					failingStream,
					{ id: "platform.events", migrate: migratePlatformEvents },
				])
			).rejects.toThrow("Migration stream test.deliberate-failure failed");
			const partial = await pool.query<{ value: string | null }>(
				"SELECT to_regclass('public.pr2_failed_migration_fixture')::text AS value"
			);
			expect(partial.rows[0]?.value).toBeNull();

			await runMigrationStreams(pool);
			const recovered = await pool.query<{ value: string | null }>(
				"SELECT to_regclass('public.platform_event_outbox')::text AS value"
			);
			expect(recovered.rows[0]?.value).toBe("platform_event_outbox");
		} finally {
			await dropDatabase(name, pool);
		}
	});

	test("commits and rolls back owner state with its outbox record", async () => {
		await testPool.query(
			"CREATE TABLE pr2_identity_state_fixture (id text PRIMARY KEY, revision integer NOT NULL)"
		);
		await testPool.query(
			"INSERT INTO pr2_identity_state_fixture (id, revision) VALUES ('identity_pr2', 0)"
		);

		const bindScope = (client: PoolClient) => ({
			outbox: createPostgresOutbox(client),
			state: {
				increment: () =>
					client.query(
						"UPDATE pr2_identity_state_fixture SET revision = revision + 1 WHERE id = 'identity_pr2'"
					),
			},
		});
		const unitOfWork = createPostgresUnitOfWork(testPool, bindScope);

		await unitOfWork.execute(async ({ outbox, state }) => {
			await state.increment();
			expect(await outbox.append(event("evt_pr2_atomic_commit"))).toBe(
				"inserted"
			);
		});

		await expect(
			unitOfWork.execute(async ({ outbox, state }) => {
				await state.increment();
				await outbox.append(event("evt_pr2_atomic_rollback"));
				throw new Error("rollback proof");
			})
		).rejects.toThrow("rollback proof");

		const stateResult = await testPool.query<{ revision: number }>(
			"SELECT revision FROM pr2_identity_state_fixture WHERE id = 'identity_pr2'"
		);
		expect(stateResult.rows[0]?.revision).toBe(1);
		const outboxRecords = await testPool.query<{ id: string }>(
			"SELECT id FROM platform_event_outbox WHERE id LIKE 'evt_pr2_atomic_%' ORDER BY id"
		);
		expect(outboxRecords.rows.map((row) => row.id)).toEqual([
			"evt_pr2_atomic_commit",
		]);
		expect(
			await createPostgresOutbox(testPool).append(
				event("evt_pr2_atomic_commit")
			)
		).toBe("duplicate");
	});
});
