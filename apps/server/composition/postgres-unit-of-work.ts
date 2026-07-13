import type { Pool, PoolClient } from "pg";

export interface UnitOfWork<TScope> {
	execute: <TResult>(
		operation: (scope: TScope) => Promise<TResult>
	) => Promise<TResult>;
}

/**
 * Bind transaction-scoped adapter ports without exposing `PoolClient` to the
 * application operation. The binder is composition-only; the resulting scope
 * contains only the owner and outbox ports selected for that command.
 */
export function createPostgresUnitOfWork<TScope>(
	pool: Pool,
	bindScope: (client: PoolClient) => TScope
): UnitOfWork<TScope> {
	return {
		async execute<TResult>(
			operation: (scope: TScope) => Promise<TResult>
		): Promise<TResult> {
			const client = await pool.connect();
			try {
				await client.query("BEGIN");
				const result = await operation(bindScope(client));
				await client.query("COMMIT");
				return result;
			} catch (error) {
				await client.query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		},
	};
}
