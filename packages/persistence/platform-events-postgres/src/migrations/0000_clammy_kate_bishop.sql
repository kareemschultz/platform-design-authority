CREATE TABLE "platform_event_outbox" (
	"actor_id" text,
	"aggregate_id" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"capability_id" text,
	"causation_id" text,
	"classification" text NOT NULL,
	"correlation_id" text,
	"data" jsonb NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text,
	"last_error_code" text,
	"legal_entity_id" text,
	"location_id" text,
	"locked_at" timestamp with time zone,
	"name" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"organization_id" text,
	"producer_namespace" text NOT NULL,
	"published_at" timestamp with time zone,
	"purpose" text,
	"retention_class" text NOT NULL,
	"schema_ref" text NOT NULL,
	"schema_version" text NOT NULL,
	"source_channel" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"tenant_id" text NOT NULL,
	"trace_id" text
);
--> statement-breakpoint
CREATE INDEX "platform_event_outbox_delivery_idx" ON "platform_event_outbox" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "platform_event_outbox_tenant_idx" ON "platform_event_outbox" USING btree ("tenant_id","occurred_at");