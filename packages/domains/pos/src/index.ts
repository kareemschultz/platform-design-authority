/**
 * WS3 PR0 publishes only the runtime-neutral contract boundary for the POS
 * domain: the register-session and sale state machines the frozen WS3
 * control plan (docs/blueprint/17-Roadmap/WS3_POS_CASH_IMPLEMENTATION_PLAN.md)
 * defines, and the persistence port marker. Register, cash, sale, return,
 * refund, and deposit BEHAVIOR is implemented in WS3 PR1-PR4, never here.
 */

/**
 * RegisterSession lifecycle (PR1): a session opens with a counted float and
 * closes with a counted drawer. There is no reopen transition — a new
 * session is opened instead. `Closing` is the state a non-zero-variance
 * close occupies while `commerce.cash-variance.approve` is pending; it is
 * never externally observable as a completed close.
 */
export const REGISTER_SESSION_STATES = ["Open", "Closing", "Closed"] as const;

export type RegisterSessionState = (typeof REGISTER_SESSION_STATES)[number];

/**
 * Sale lifecycle (PR2): a sale accumulates lines while `Open`, may be
 * parked to `Held` via `commerce.sale.hold` and resumed by any further
 * authorized mutation, and becomes `Completed` only through
 * `commerce.sale.complete`. A `Completed` sale is append-only; returns and
 * voids are PR3 compensating records, never edits of this state.
 */
export const SALE_STATES = ["Open", "Held", "Completed"] as const;

export type SaleState = (typeof SALE_STATES)[number];

/**
 * Maker/checker pending states shared by the five WS3 create/approve pairs
 * (cash-variance, price-override, return, refund, deposit-confirm). A
 * `Pending` request carries no irreversible cash, inventory, or outbox
 * effect; only `Approved` may. The requesting actor may never also be the
 * approving actor (self-approval is denied at the application boundary).
 */
export const APPROVAL_STATES = ["Pending", "Approved"] as const;

export type ApprovalState = (typeof APPROVAL_STATES)[number];

/**
 * Runtime-neutral persistence boundary. Concrete Postgres adapters live in
 * `@meridian/persistence-pos-postgres`; this core never imports Drizzle,
 * `pg`, migrations, environment access, Hono, oRPC transports, or Bun
 * globals (ADR-0020).
 */
export interface PosPersistencePort {
	readonly owner: "pos";
}
