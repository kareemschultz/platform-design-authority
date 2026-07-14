CREATE TABLE "platform_active_context" (
	"auth_user_id" text NOT NULL,
	"branch_id" text,
	"id" text PRIMARY KEY NOT NULL,
	"delegation_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"idempotency_key" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"legal_entity_id" text,
	"location_id" text,
	"organization_id" text NOT NULL,
	"party_id" text,
	"session_id" text NOT NULL,
	"tenant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_membership_invitation" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"failure_code" text,
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"invitee_reference" text NOT NULL,
	"organization_id" text NOT NULL,
	"party_id" text,
	"role_ids" jsonb NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_location" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"timezone" text NOT NULL,
	"type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "platform_location_tenant_id_id_key" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "platform_membership" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"auth_user_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"role_assignment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state" text NOT NULL,
	"suspension_reason" text,
	"tenant_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_organization" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"locale" text,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"timezone" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "platform_organization_tenant_id_id_key" UNIQUE("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "platform_tenant" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_active_context" ADD CONSTRAINT "platform_active_context_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_active_context" ADD CONSTRAINT "platform_active_context_tenant_organization_fk" FOREIGN KEY ("tenant_id","organization_id") REFERENCES "public"."platform_organization"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_active_context" ADD CONSTRAINT "platform_active_context_tenant_location_fk" FOREIGN KEY ("tenant_id","location_id") REFERENCES "public"."platform_location"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_membership_invitation" ADD CONSTRAINT "platform_membership_invitation_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_membership_invitation" ADD CONSTRAINT "platform_invitation_tenant_organization_fk" FOREIGN KEY ("tenant_id","organization_id") REFERENCES "public"."platform_organization"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_location" ADD CONSTRAINT "platform_location_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_location" ADD CONSTRAINT "platform_location_tenant_organization_fk" FOREIGN KEY ("tenant_id","organization_id") REFERENCES "public"."platform_organization"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_membership" ADD CONSTRAINT "platform_membership_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_membership" ADD CONSTRAINT "platform_membership_tenant_organization_fk" FOREIGN KEY ("tenant_id","organization_id") REFERENCES "public"."platform_organization"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_organization" ADD CONSTRAINT "platform_organization_tenant_id_platform_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."platform_tenant"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_active_context_session_idempotency_uidx" ON "platform_active_context" USING btree ("session_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "platform_active_context_session_idx" ON "platform_active_context" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "platform_active_context_tenant_user_idx" ON "platform_active_context" USING btree ("tenant_id","auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_invitation_tenant_idempotency_uidx" ON "platform_membership_invitation" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "platform_invitation_tenant_email_idx" ON "platform_membership_invitation" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "platform_location_tenant_organization_idx" ON "platform_location" USING btree ("tenant_id","organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_membership_tenant_id_id_uidx" ON "platform_membership" USING btree ("tenant_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_membership_tenant_org_user_uidx" ON "platform_membership" USING btree ("tenant_id","organization_id","auth_user_id");--> statement-breakpoint
CREATE INDEX "platform_membership_tenant_user_idx" ON "platform_membership" USING btree ("tenant_id","auth_user_id");--> statement-breakpoint
CREATE INDEX "platform_organization_tenant_idx" ON "platform_organization" USING btree ("tenant_id");