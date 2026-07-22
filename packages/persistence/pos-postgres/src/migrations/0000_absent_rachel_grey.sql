CREATE TABLE "pos_cash_movement" (
	"actor_party_id" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"direction" text NOT NULL,
	"id" text NOT NULL,
	"note" text,
	"organization_id" text NOT NULL,
	"reason_code" text NOT NULL,
	"reference_id" text,
	"register_id" text NOT NULL,
	"session_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "pos_cash_movement_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_cash_movement_currency_check" CHECK ("pos_cash_movement"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_cash_movement_amount_check" CHECK ("pos_cash_movement"."amount_minor" > 0),
	CONSTRAINT "pos_cash_movement_direction_check" CHECK ("pos_cash_movement"."direction" in ('PaidIn', 'PaidOut')),
	CONSTRAINT "pos_cash_movement_reason_code_check" CHECK ("pos_cash_movement"."reason_code" in ('PaidIn', 'PaidOut', 'SafeDrop', 'Refund', 'Other')),
	CONSTRAINT "pos_cash_movement_direction_reason_pairing_check" CHECK (("pos_cash_movement"."reason_code" = 'PaidIn' and "pos_cash_movement"."direction" = 'PaidIn') or ("pos_cash_movement"."reason_code" = 'PaidOut' and "pos_cash_movement"."direction" = 'PaidOut') or ("pos_cash_movement"."reason_code" = 'SafeDrop' and "pos_cash_movement"."direction" = 'PaidOut') or ("pos_cash_movement"."reason_code" = 'Refund' and "pos_cash_movement"."direction" = 'PaidOut') or ("pos_cash_movement"."reason_code" = 'Other'))
);
--> statement-breakpoint
CREATE TABLE "pos_command_receipt" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"resource_id" text NOT NULL,
	"result" jsonb NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "pos_command_receipt_pk" PRIMARY KEY("tenant_id","operation","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "pos_register_session" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"close_reason" text,
	"close_requested_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"closed_by_actor_user_id" text,
	"closed_by_party_id" text,
	"counted_cash_minor" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"expected_cash_minor" bigint,
	"id" text NOT NULL,
	"location_id" text NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"opened_by_actor_user_id" text NOT NULL,
	"opened_by_party_id" text NOT NULL,
	"opening_float_minor" bigint NOT NULL,
	"organization_id" text NOT NULL,
	"register_id" text NOT NULL,
	"state" text DEFAULT 'Open' NOT NULL,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variance_approval_required" boolean DEFAULT false NOT NULL,
	"variance_approved_at" timestamp with time zone,
	"variance_approved_by_actor_user_id" text,
	"variance_approved_by_party_id" text,
	"variance_minor" bigint,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pos_register_session_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_register_session_currency_check" CHECK ("pos_register_session"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_register_session_state_check" CHECK ("pos_register_session"."state" in ('Open', 'Closing', 'Closed')),
	CONSTRAINT "pos_register_session_opening_float_check" CHECK ("pos_register_session"."opening_float_minor" >= 0),
	CONSTRAINT "pos_register_session_close_fields_check" CHECK (("pos_register_session"."state" = 'Open' and "pos_register_session"."closed_by_actor_user_id" is null and "pos_register_session"."closed_by_party_id" is null and "pos_register_session"."counted_cash_minor" is null and "pos_register_session"."expected_cash_minor" is null and "pos_register_session"."variance_minor" is null and "pos_register_session"."close_requested_at" is null and "pos_register_session"."closed_at" is null) or ("pos_register_session"."state" in ('Closing', 'Closed') and "pos_register_session"."closed_by_actor_user_id" is not null and "pos_register_session"."closed_by_party_id" is not null and "pos_register_session"."counted_cash_minor" is not null and "pos_register_session"."expected_cash_minor" is not null and "pos_register_session"."variance_minor" is not null and "pos_register_session"."close_requested_at" is not null)),
	CONSTRAINT "pos_register_session_closed_at_check" CHECK (("pos_register_session"."state" = 'Closed') = ("pos_register_session"."closed_at" is not null)),
	CONSTRAINT "pos_register_session_variance_approval_check" CHECK (("pos_register_session"."variance_approved_at" is null and "pos_register_session"."variance_approved_by_actor_user_id" is null and "pos_register_session"."variance_approved_by_party_id" is null) or ("pos_register_session"."variance_approved_at" is not null and "pos_register_session"."variance_approved_by_actor_user_id" is not null and "pos_register_session"."variance_approved_by_party_id" is not null and "pos_register_session"."state" = 'Closed'))
);
--> statement-breakpoint
ALTER TABLE "pos_cash_movement" ADD CONSTRAINT "pos_cash_movement_session_fk" FOREIGN KEY ("tenant_id","session_id") REFERENCES "public"."pos_register_session"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pos_cash_movement_tenant_session_idx" ON "pos_cash_movement" USING btree ("tenant_id","session_id","created_at","id");--> statement-breakpoint
CREATE INDEX "pos_cash_movement_tenant_register_idx" ON "pos_cash_movement" USING btree ("tenant_id","register_id","created_at");--> statement-breakpoint
CREATE INDEX "pos_command_receipt_resource_idx" ON "pos_command_receipt" USING btree ("tenant_id","operation","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pos_register_session_open_register_uidx" ON "pos_register_session" USING btree ("tenant_id","register_id") WHERE "pos_register_session"."state" = 'Open';--> statement-breakpoint
CREATE INDEX "pos_register_session_tenant_register_idx" ON "pos_register_session" USING btree ("tenant_id","register_id","id");