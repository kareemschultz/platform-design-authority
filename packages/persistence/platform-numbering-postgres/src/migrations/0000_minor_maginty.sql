CREATE TABLE "platform_number_allocation" (
	"allocated_at" timestamp with time zone NOT NULL,
	"allocated_by_user_id" text NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"formatted_value" text NOT NULL,
	"id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"organization_id" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"sequence_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "platform_number_allocation_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "platform_number_allocation_value_ck" CHECK ("platform_number_allocation"."value" > 0)
);
--> statement-breakpoint
CREATE TABLE "platform_number_sequence" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"id" text NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	"organization_id" text NOT NULL,
	"padding" integer DEFAULT 6 NOT NULL,
	"prefix" text DEFAULT '' NOT NULL,
	"sequence_key" text NOT NULL,
	"state" text DEFAULT 'Active' NOT NULL,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "platform_number_sequence_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "platform_number_sequence_state_ck" CHECK ("platform_number_sequence"."state" IN ('Active','Suspended')),
	CONSTRAINT "platform_number_sequence_value_ck" CHECK ("platform_number_sequence"."current_value" >= 0 AND "platform_number_sequence"."next_value" > "platform_number_sequence"."current_value"),
	CONSTRAINT "platform_number_sequence_padding_ck" CHECK ("platform_number_sequence"."padding" >= 1 AND "platform_number_sequence"."padding" <= 20),
	CONSTRAINT "platform_number_sequence_version_ck" CHECK ("platform_number_sequence"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "platform_number_allocation" ADD CONSTRAINT "platform_number_allocation_sequence_fk" FOREIGN KEY ("tenant_id","sequence_id") REFERENCES "public"."platform_number_sequence"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_number_allocation_value_uidx" ON "platform_number_allocation" USING btree ("tenant_id","sequence_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_number_allocation_idempotency_uidx" ON "platform_number_allocation" USING btree ("tenant_id","sequence_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "platform_number_allocation_lookup_idx" ON "platform_number_allocation" USING btree ("tenant_id","organization_id","formatted_value");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_number_sequence_key_uidx" ON "platform_number_sequence" USING btree ("tenant_id","organization_id","sequence_key");