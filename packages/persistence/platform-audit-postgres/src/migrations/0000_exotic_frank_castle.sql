CREATE TABLE "platform_audit_privacy_overlay" (
	"id" text PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"privacy_case_id" text NOT NULL,
	"pseudonym" text NOT NULL,
	"scope_key" text NOT NULL,
	"subject_digest" text NOT NULL,
	"subject_type" text NOT NULL,
	"transformation_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_audit_record" (
	"action" text NOT NULL,
	"actor_party_id" text,
	"actor_type" text NOT NULL,
	"actor_user_id" text,
	"approval_id" text,
	"causation_id" text,
	"change_summary" jsonb,
	"classification" text NOT NULL,
	"correlation_id" text NOT NULL,
	"delegation_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"legal_hold_id" text,
	"location_id" text,
	"metadata" jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"organization_id" text,
	"original_actor_id" text,
	"outcome" text NOT NULL,
	"previous_hash" text,
	"privacy_case_id" text,
	"privacy_transformation_version" text,
	"reason_code" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"record_hash" text NOT NULL,
	"retention_class" text NOT NULL,
	"retention_until" timestamp with time zone,
	"scope_key" text NOT NULL,
	"scope_type" text NOT NULL,
	"sequence" integer NOT NULL,
	"source_channel" text NOT NULL,
	"source_event_id" text,
	"target_id" text,
	"target_type" text NOT NULL,
	"tenant_id" text,
	CONSTRAINT "platform_audit_record_scope_ck" CHECK (("platform_audit_record"."scope_type" = 'Tenant' AND "platform_audit_record"."tenant_id" IS NOT NULL AND "platform_audit_record"."scope_key" = "platform_audit_record"."tenant_id") OR ("platform_audit_record"."scope_type" = 'Platform' AND "platform_audit_record"."tenant_id" IS NULL AND "platform_audit_record"."organization_id" IS NULL AND "platform_audit_record"."location_id" IS NULL AND "platform_audit_record"."scope_key" = 'platform'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "platform_audit_privacy_subject_uidx" ON "platform_audit_privacy_overlay" USING btree ("scope_key","subject_type","subject_digest");--> statement-breakpoint
CREATE INDEX "platform_audit_record_tenant_occurred_idx" ON "platform_audit_record" USING btree ("tenant_id","occurred_at");--> statement-breakpoint
CREATE INDEX "platform_audit_record_tenant_actor_idx" ON "platform_audit_record" USING btree ("tenant_id","actor_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_audit_record_scope_sequence_uidx" ON "platform_audit_record" USING btree ("scope_key","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_audit_record_hash_uidx" ON "platform_audit_record" USING btree ("record_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_audit_record_source_event_uidx" ON "platform_audit_record" USING btree ("source_event_id") WHERE "platform_audit_record"."source_event_id" is not null;