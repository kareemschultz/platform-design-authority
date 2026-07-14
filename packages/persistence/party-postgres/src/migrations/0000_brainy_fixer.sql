CREATE TABLE "party_command_receipt" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"resource_id" text NOT NULL,
	"result" jsonb NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "party_command_receipt_pk" PRIMARY KEY("tenant_id","operation","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "party_contact_point" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"display_value" text NOT NULL,
	"id" text NOT NULL,
	"normalized_value" text NOT NULL,
	"party_id" text NOT NULL,
	"retention_class" text DEFAULT 'party-profile' NOT NULL,
	"tenant_id" text NOT NULL,
	"type" text NOT NULL,
	"verification_state" text DEFAULT 'Unverified' NOT NULL,
	CONSTRAINT "party_contact_point_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "party_identity_link" (
	"auth_user_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"id" text NOT NULL,
	"membership_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"party_id" text NOT NULL,
	"provenance" text NOT NULL,
	"state" text DEFAULT 'Active' NOT NULL,
	"tenant_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "party_identity_link_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "party_organization_detail" (
	"party_id" text NOT NULL,
	"registered_name" text,
	"tenant_id" text NOT NULL,
	CONSTRAINT "party_organization_detail_pk" PRIMARY KEY("tenant_id","party_id")
);
--> statement-breakpoint
CREATE TABLE "party_record" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"display_name" text NOT NULL,
	"id" text NOT NULL,
	"privacy_state" text DEFAULT 'Normal' NOT NULL,
	"provenance" text NOT NULL,
	"state" text DEFAULT 'Active' NOT NULL,
	"tenant_id" text NOT NULL,
	"type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "party_record_pk" PRIMARY KEY("tenant_id","id")
);
--> statement-breakpoint
CREATE TABLE "party_person_detail" (
	"party_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "party_person_detail_pk" PRIMARY KEY("tenant_id","party_id")
);
--> statement-breakpoint
ALTER TABLE "party_contact_point" ADD CONSTRAINT "party_contact_point_party_fk" FOREIGN KEY ("tenant_id","party_id") REFERENCES "public"."party_record"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_identity_link" ADD CONSTRAINT "party_identity_link_party_fk" FOREIGN KEY ("tenant_id","party_id") REFERENCES "public"."party_record"("tenant_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_organization_detail" ADD CONSTRAINT "party_organization_detail_party_fk" FOREIGN KEY ("tenant_id","party_id") REFERENCES "public"."party_record"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_person_detail" ADD CONSTRAINT "party_person_detail_party_fk" FOREIGN KEY ("tenant_id","party_id") REFERENCES "public"."party_record"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "party_command_receipt_resource_idx" ON "party_command_receipt" USING btree ("tenant_id","operation","resource_id");--> statement-breakpoint
CREATE INDEX "party_contact_point_tenant_party_idx" ON "party_contact_point" USING btree ("tenant_id","party_id");--> statement-breakpoint
CREATE UNIQUE INDEX "party_identity_link_tenant_membership_uidx" ON "party_identity_link" USING btree ("tenant_id","membership_id");--> statement-breakpoint
CREATE INDEX "party_identity_link_tenant_user_idx" ON "party_identity_link" USING btree ("tenant_id","auth_user_id");--> statement-breakpoint
CREATE INDEX "party_record_tenant_name_idx" ON "party_record" USING btree ("tenant_id","display_name");