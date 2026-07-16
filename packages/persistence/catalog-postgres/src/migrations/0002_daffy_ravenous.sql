CREATE TABLE "catalog_product_search_projection" (
	"name" text NOT NULL,
	"product_id" text NOT NULL,
	"projected_at" timestamp with time zone NOT NULL,
	"search_text" text NOT NULL,
	"source_event_id" text NOT NULL,
	"source_version" integer NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "catalog_product_search_projection_pk" PRIMARY KEY("tenant_id","product_id"),
	CONSTRAINT "catalog_product_search_projection_source_version_check" CHECK ("catalog_product_search_projection"."source_version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "catalog_product_search_projection" ADD CONSTRAINT "catalog_product_search_projection_product_fk" FOREIGN KEY ("tenant_id","product_id") REFERENCES "public"."catalog_product"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_product_search_projection_tenant_name_idx" ON "catalog_product_search_projection" USING btree ("tenant_id","name","product_id");