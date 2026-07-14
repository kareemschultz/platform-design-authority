CREATE TABLE "platform_identity_session_command_receipt" (
	"auth_user_id" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"session_id" text NOT NULL,
	CONSTRAINT "platform_identity_session_command_receipt_pk" PRIMARY KEY("auth_user_id","operation","idempotency_key")
);
--> statement-breakpoint
CREATE INDEX "platform_identity_session_command_target_idx" ON "platform_identity_session_command_receipt" USING btree ("auth_user_id","session_id");