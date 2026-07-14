CREATE TABLE "platform_entitlement_change" (
	"actor_id" text NOT NULL,
	"changed_fields" text[] NOT NULL,
	"entitlement_id" text NOT NULL,
	"entitlement_version" integer NOT NULL,
	"id" text NOT NULL,
	"new_state" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"previous_state" text,
	"reason" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_entitlement_change_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "platform_entitlement_command_receipt" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"resource_id" text NOT NULL,
	"result" jsonb NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_entitlement_command_receipt_pk" PRIMARY KEY("tenant_id","operation","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "platform_entitlement" (
	"capability_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dependencies" text[] DEFAULT '{}' NOT NULL,
	"ends_at" timestamp with time zone,
	"exclusions" text[] DEFAULT '{}' NOT NULL,
	"id" text NOT NULL,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"organization_id" text,
	"scope_key" text NOT NULL,
	"source" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "platform_entitlement_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
ALTER TABLE "platform_entitlement_change" ADD CONSTRAINT "platform_entitlement_change_entitlement_fk" FOREIGN KEY ("tenant_id","entitlement_id") REFERENCES "public"."platform_entitlement"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_entitlement_change_history_idx" ON "platform_entitlement_change" USING btree ("tenant_id","entitlement_id","entitlement_version");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_entitlement_scope_capability_uidx" ON "platform_entitlement" USING btree ("tenant_id","scope_key","capability_id");--> statement-breakpoint
CREATE INDEX "platform_entitlement_tenant_state_idx" ON "platform_entitlement" USING btree ("tenant_id","state");