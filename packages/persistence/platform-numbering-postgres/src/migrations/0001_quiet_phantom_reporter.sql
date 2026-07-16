ALTER TABLE "platform_number_allocation" DROP CONSTRAINT "platform_number_allocation_value_ck";--> statement-breakpoint
ALTER TABLE "platform_number_sequence" DROP CONSTRAINT "platform_number_sequence_padding_ck";--> statement-breakpoint
DROP INDEX "platform_number_allocation_value_uidx";--> statement-breakpoint
DROP INDEX "platform_number_allocation_lookup_idx";--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ALTER COLUMN "value" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ALTER COLUMN "current_value" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ALTER COLUMN "current_value" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ALTER COLUMN "next_value" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ALTER COLUMN "next_value" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD COLUMN "business_record_id" text;--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD COLUMN "counter_value" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD COLUMN "issued_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD COLUMN "sequence_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD COLUMN "source_command_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD COLUMN "state" text DEFAULT 'Issued' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD COLUMN "gap_policy" text;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD COLUMN "increment" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD COLUMN "owner_namespace" text NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD COLUMN "record_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD COLUMN "reset_policy" text DEFAULT 'None' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD COLUMN "void_policy" text;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_number_allocation_value_uidx" ON "platform_number_allocation" USING btree ("tenant_id","sequence_id","counter_value");--> statement-breakpoint
CREATE INDEX "platform_number_allocation_lookup_idx" ON "platform_number_allocation" USING btree ("tenant_id","organization_id","value");--> statement-breakpoint
ALTER TABLE "platform_number_allocation" DROP COLUMN "allocated_at";--> statement-breakpoint
ALTER TABLE "platform_number_allocation" DROP COLUMN "formatted_value";--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD CONSTRAINT "platform_number_allocation_counter_ck" CHECK ("platform_number_allocation"."counter_value" > 0);--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD CONSTRAINT "platform_number_allocation_state_ck" CHECK ("platform_number_allocation"."state" = 'Issued');--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD CONSTRAINT "platform_number_allocation_source_ck" CHECK (length("platform_number_allocation"."source_command_id") BETWEEN 1 AND 128);--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD CONSTRAINT "platform_number_allocation_contract_ck" CHECK (length("platform_number_allocation"."sequence_key") BETWEEN 1 AND 100 AND length("platform_number_allocation"."value") BETWEEN 1 AND 100 AND ("platform_number_allocation"."business_record_id" IS NULL OR length("platform_number_allocation"."business_record_id") BETWEEN 1 AND 128));--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD CONSTRAINT "platform_number_sequence_prototype_policy_ck" CHECK ("platform_number_sequence"."increment" = 1 AND "platform_number_sequence"."reset_policy" = 'None');--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD CONSTRAINT "platform_number_sequence_contract_ck" CHECK (length("platform_number_sequence"."sequence_key") BETWEEN 1 AND 100 AND length("platform_number_sequence"."owner_namespace") BETWEEN 1 AND 100 AND length("platform_number_sequence"."record_type") BETWEEN 1 AND 100 AND length("platform_number_sequence"."prefix") <= 50 AND ("platform_number_sequence"."gap_policy" IS NULL OR length("platform_number_sequence"."gap_policy") BETWEEN 1 AND 100) AND ("platform_number_sequence"."void_policy" IS NULL OR length("platform_number_sequence"."void_policy") BETWEEN 1 AND 100));--> statement-breakpoint
ALTER TABLE "platform_number_sequence" ADD CONSTRAINT "platform_number_sequence_padding_ck" CHECK ("platform_number_sequence"."padding" >= 1 AND "platform_number_sequence"."padding" <= 18);