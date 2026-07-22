CREATE TABLE "platform_export_job" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"content_hash" text NOT NULL,
	"created_by_actor_user_id" text NOT NULL,
	"currency" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"kind" text NOT NULL,
	"legal_entity_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"period_end_utc" timestamp with time zone NOT NULL,
	"period_start_utc" timestamp with time zone NOT NULL,
	"rule_version" text NOT NULL,
	"schema_version" text NOT NULL,
	"tenant_id" text NOT NULL,
	"timezone" text NOT NULL,
	CONSTRAINT "platform_export_job_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "platform_export_job_kind_ck" CHECK ("platform_export_job"."kind" IN ('AccountantHandoff')),
	CONSTRAINT "platform_export_job_currency_ck" CHECK ("platform_export_job"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "platform_export_job_period_ck" CHECK ("platform_export_job"."period_start_utc" < "platform_export_job"."period_end_utc")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "platform_export_job_idempotency_uidx" ON "platform_export_job" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "platform_export_job_tenant_org_period_idx" ON "platform_export_job" USING btree ("tenant_id","organization_id","period_start_utc");