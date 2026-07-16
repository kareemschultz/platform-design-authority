CREATE TABLE "platform_event_consumer_receipt" (
	"consumer_id" text NOT NULL,
	"consumer_schema_version" text NOT NULL,
	"effect_reference" text,
	"event_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"replay_request_id" text,
	"result_code" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_event_consumer_receipt_pk" PRIMARY KEY("consumer_id","event_id","consumer_schema_version")
);
--> statement-breakpoint
CREATE TABLE "platform_event_dead_letter" (
	"attempt_count" integer NOT NULL,
	"consumer_id" text NOT NULL,
	"consumer_schema_version" text NOT NULL,
	"delivery_sequence" bigint NOT NULL,
	"encrypted_payload" text,
	"envelope_summary" jsonb NOT NULL,
	"event_id" text NOT NULL,
	"expires_at" timestamp with time zone,
	"failure_classification" text NOT NULL,
	"first_attempted_at" timestamp with time zone NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"last_attempted_at" timestamp with time zone NOT NULL,
	"payload_key_reference" text,
	"privacy_state" text DEFAULT 'retained' NOT NULL,
	"resolution_code" text,
	"resolved_at" timestamp with time zone,
	"retention_class" text NOT NULL,
	"schema_ref" text NOT NULL,
	"tenant_id" text NOT NULL,
	"terminal_reason" text NOT NULL,
	CONSTRAINT "platform_event_dead_letter_attempt_count_ck" CHECK ("platform_event_dead_letter"."attempt_count" > 0 AND "platform_event_dead_letter"."attempt_count" <= 20),
	CONSTRAINT "platform_event_dead_letter_payload_pair_ck" CHECK (("platform_event_dead_letter"."encrypted_payload" IS NULL AND "platform_event_dead_letter"."payload_key_reference" IS NULL) OR ("platform_event_dead_letter"."encrypted_payload" IS NOT NULL AND "platform_event_dead_letter"."payload_key_reference" IS NOT NULL)),
	CONSTRAINT "platform_event_dead_letter_privacy_state_ck" CHECK ("platform_event_dead_letter"."privacy_state" IN ('retained', 'minimized', 'erased'))
);
--> statement-breakpoint
CREATE TABLE "platform_event_delivery_attempt" (
	"attempt_number" integer NOT NULL,
	"consumer_id" text NOT NULL,
	"consumer_schema_version" text NOT NULL,
	"event_id" text NOT NULL,
	"finished_at" timestamp with time zone,
	"id" text PRIMARY KEY NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"outcome" text NOT NULL,
	"reason_code" text,
	"retry_delay_ms" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_event_delivery_attempt_number_ck" CHECK ("platform_event_delivery_attempt"."attempt_number" > 0 AND "platform_event_delivery_attempt"."attempt_number" <= 20),
	CONSTRAINT "platform_event_delivery_attempt_outcome_ck" CHECK ("platform_event_delivery_attempt"."outcome" IN ('succeeded', 'retryable_failure', 'terminal_failure')),
	CONSTRAINT "platform_event_delivery_attempt_retry_delay_ck" CHECK ("platform_event_delivery_attempt"."retry_delay_ms" IS NULL OR ("platform_event_delivery_attempt"."retry_delay_ms" >= 0 AND "platform_event_delivery_attempt"."retry_delay_ms" <= 300000))
);
--> statement-breakpoint
CREATE TABLE "platform_event_replay_request" (
	"approved_by" text NOT NULL,
	"audit_record_id" text NOT NULL,
	"compatibility_result" text NOT NULL,
	"completed_at" timestamp with time zone,
	"consumer_id" text NOT NULL,
	"consumer_schema_version" text NOT NULL,
	"event_names" jsonb NOT NULL,
	"failure_code" text,
	"first_sequence" bigint NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"last_sequence" bigint NOT NULL,
	"permission_decision_id" text NOT NULL,
	"purpose" text NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"requested_by" text NOT NULL,
	"started_at" timestamp with time zone,
	"state" text DEFAULT 'queued' NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_event_replay_request_tenant_reference_uq" UNIQUE("id","tenant_id"),
	CONSTRAINT "platform_event_replay_request_range_ck" CHECK ("platform_event_replay_request"."first_sequence" > 0 AND "platform_event_replay_request"."last_sequence" >= "platform_event_replay_request"."first_sequence" AND ("platform_event_replay_request"."last_sequence" - "platform_event_replay_request"."first_sequence") < 1000),
	CONSTRAINT "platform_event_replay_request_state_ck" CHECK ("platform_event_replay_request"."state" IN ('queued', 'running', 'completed', 'failed', 'cancelled'))
);
--> statement-breakpoint
DROP INDEX "platform_event_outbox_delivery_idx";--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "claim_token_digest" text;--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "delivery_sequence" bigserial NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "first_attempted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "last_attempted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "lease_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD COLUMN "terminal_reason" text;--> statement-breakpoint
CREATE INDEX "platform_event_consumer_receipt_tenant_idx" ON "platform_event_consumer_receipt" USING btree ("tenant_id","processed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_event_dead_letter_consumer_uidx" ON "platform_event_dead_letter" USING btree ("event_id","consumer_id","consumer_schema_version");--> statement-breakpoint
CREATE INDEX "platform_event_dead_letter_review_idx" ON "platform_event_dead_letter" USING btree ("tenant_id","resolved_at","delivery_sequence");--> statement-breakpoint
CREATE INDEX "platform_event_delivery_attempt_lookup_idx" ON "platform_event_delivery_attempt" USING btree ("tenant_id","event_id","consumer_id","attempt_number");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_event_replay_request_idempotency_uidx" ON "platform_event_replay_request" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "platform_event_replay_request_state_idx" ON "platform_event_replay_request" USING btree ("tenant_id","state","requested_at");--> statement-breakpoint
CREATE INDEX "platform_event_outbox_stream_idx" ON "platform_event_outbox" USING btree ("scope_key","producer_namespace","aggregate_id","delivery_sequence");--> statement-breakpoint
CREATE INDEX "platform_event_outbox_delivery_idx" ON "platform_event_outbox" USING btree ("status","next_attempt_at","delivery_sequence");--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD CONSTRAINT "platform_event_outbox_tenant_reference_uq" UNIQUE("id","tenant_id");--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD CONSTRAINT "platform_event_outbox_delivery_status_ck" CHECK ("platform_event_outbox"."status" IN ('pending', 'claimed', 'retrying', 'delivered', 'dead_lettered'));--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD CONSTRAINT "platform_event_outbox_attempt_count_ck" CHECK ("platform_event_outbox"."attempt_count" >= 0 AND "platform_event_outbox"."attempt_count" <= 20);--> statement-breakpoint
ALTER TABLE "platform_event_outbox" ADD CONSTRAINT "platform_event_outbox_claim_pair_ck" CHECK (("platform_event_outbox"."claim_token_digest" IS NULL AND "platform_event_outbox"."claimed_at" IS NULL AND "platform_event_outbox"."lease_expires_at" IS NULL) OR ("platform_event_outbox"."claim_token_digest" IS NOT NULL AND "platform_event_outbox"."claimed_at" IS NOT NULL AND "platform_event_outbox"."lease_expires_at" IS NOT NULL AND "platform_event_outbox"."lease_expires_at" > "platform_event_outbox"."claimed_at"));