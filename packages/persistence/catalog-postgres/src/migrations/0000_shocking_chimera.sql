CREATE TABLE "catalog_product_command_receipt" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"resource_id" text NOT NULL,
	"result" jsonb NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "catalog_product_command_receipt_pk" PRIMARY KEY("tenant_id","operation","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "catalog_identifier" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" text NOT NULL,
	"normalization_version" text NOT NULL,
	"normalized_value" text NOT NULL,
	"product_id" text NOT NULL,
	"scheme" text NOT NULL,
	"tenant_id" text NOT NULL,
	"type" text NOT NULL,
	"uniqueness_scope" text NOT NULL,
	"value" text NOT NULL,
	"variant_id" text NOT NULL,
	CONSTRAINT "catalog_identifier_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "catalog_product" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"archive_reason" text,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"state" text DEFAULT 'Draft' NOT NULL,
	"tenant_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "catalog_product_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "catalog_variant" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"product_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "catalog_variant_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "catalog_variant_tenant_product_id_key" UNIQUE("tenant_id","product_id","id")
);
--> statement-breakpoint
ALTER TABLE "catalog_identifier" ADD CONSTRAINT "catalog_identifier_variant_fk" FOREIGN KEY ("tenant_id","product_id","variant_id") REFERENCES "public"."catalog_variant"("tenant_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_variant" ADD CONSTRAINT "catalog_variant_product_fk" FOREIGN KEY ("tenant_id","product_id") REFERENCES "public"."catalog_product"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_product_command_receipt_resource_idx" ON "catalog_product_command_receipt" USING btree ("tenant_id","operation","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_identifier_tenant_scope_normalized_uidx" ON "catalog_identifier" USING btree ("tenant_id","uniqueness_scope","normalized_value");--> statement-breakpoint
CREATE INDEX "catalog_identifier_tenant_normalized_idx" ON "catalog_identifier" USING btree ("tenant_id","normalized_value","product_id");--> statement-breakpoint
CREATE INDEX "catalog_identifier_tenant_product_idx" ON "catalog_identifier" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE INDEX "catalog_product_tenant_name_id_idx" ON "catalog_product" USING btree ("tenant_id","name","id");--> statement-breakpoint
CREATE INDEX "catalog_product_tenant_state_id_idx" ON "catalog_product" USING btree ("tenant_id","state","id");--> statement-breakpoint
CREATE INDEX "catalog_variant_tenant_product_position_idx" ON "catalog_variant" USING btree ("tenant_id","product_id","position");