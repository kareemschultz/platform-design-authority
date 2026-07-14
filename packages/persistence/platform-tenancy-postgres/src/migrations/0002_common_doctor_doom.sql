CREATE TABLE "platform_delegation" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"allow_further_delegation" boolean DEFAULT false NOT NULL,
	"delegate_membership_id" text NOT NULL,
	"delegator_membership_id" text NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"permission_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reason" text NOT NULL,
	"scope_id" text,
	"scope_type" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "platform_delegation_tenant_id_id_key" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "platform_role_assignment" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"role_id" text NOT NULL,
	"scope_id" text,
	"scope_type" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "platform_role_assignment_tenant_id_id_key" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "platform_role" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"permission_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "platform_role_tenant_id_id_key" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
ALTER TABLE "platform_delegation" ADD CONSTRAINT "platform_delegation_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_delegation" ADD CONSTRAINT "platform_delegation_tenant_delegator_fk" FOREIGN KEY ("tenant_id","delegator_membership_id") REFERENCES "public"."platform_membership"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_delegation" ADD CONSTRAINT "platform_delegation_tenant_delegate_fk" FOREIGN KEY ("tenant_id","delegate_membership_id") REFERENCES "public"."platform_membership"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignment" ADD CONSTRAINT "platform_role_assignment_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignment" ADD CONSTRAINT "platform_role_assignment_tenant_membership_fk" FOREIGN KEY ("tenant_id","membership_id") REFERENCES "public"."platform_membership"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignment" ADD CONSTRAINT "platform_role_assignment_tenant_role_fk" FOREIGN KEY ("tenant_id","role_id") REFERENCES "public"."platform_role"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role" ADD CONSTRAINT "platform_role_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_delegation_tenant_delegate_idx" ON "platform_delegation" USING btree ("tenant_id","delegate_membership_id","state","ends_at");--> statement-breakpoint
CREATE INDEX "platform_role_assignment_tenant_member_idx" ON "platform_role_assignment" USING btree ("tenant_id","membership_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_role_tenant_name_uidx" ON "platform_role" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "platform_role_tenant_state_idx" ON "platform_role" USING btree ("tenant_id","state");--> statement-breakpoint
ALTER TABLE "platform_active_context" ADD CONSTRAINT "platform_active_context_tenant_delegation_fk" FOREIGN KEY ("tenant_id","delegation_id") REFERENCES "public"."platform_delegation"("tenant_id","id") ON DELETE no action ON UPDATE no action;