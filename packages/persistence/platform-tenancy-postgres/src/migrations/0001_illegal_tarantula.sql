CREATE TABLE "platform_tenancy_command_receipt" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"resource_id" text NOT NULL,
	"result" jsonb NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_tenancy_command_receipt_pk" PRIMARY KEY("tenant_id","operation","idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "platform_tenancy_command_receipt" ADD CONSTRAINT "platform_tenancy_command_receipt_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_tenancy_command_resource_idx" ON "platform_tenancy_command_receipt" USING btree ("tenant_id","operation","resource_id");