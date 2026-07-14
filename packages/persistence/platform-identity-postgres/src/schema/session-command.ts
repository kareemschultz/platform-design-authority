import {
	index,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const identitySessionCommandReceipt = pgTable(
	"platform_identity_session_command_receipt",
	{
		authUserId: text("auth_user_id").notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		operation: text("operation").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		sessionId: text("session_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.authUserId, table.operation, table.idempotencyKey],
			name: "platform_identity_session_command_receipt_pk",
		}),
		index("platform_identity_session_command_target_idx").on(
			table.authUserId,
			table.sessionId
		),
	]
);
