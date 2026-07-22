CREATE TABLE "pos_deposit_custody_transfer" (
	"amount_minor" bigint NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"confirmed_by_actor_user_id" text NOT NULL,
	"confirmed_by_party_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"deposit_id" text NOT NULL,
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"posted_at" timestamp with time zone NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "pos_deposit_custody_transfer_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_deposit_custody_transfer_currency_check" CHECK ("pos_deposit_custody_transfer"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_deposit_custody_transfer_amount_check" CHECK ("pos_deposit_custody_transfer"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "pos_deposit_source_shift" (
	"deposit_id" text NOT NULL,
	"session_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "pos_deposit_source_shift_pk" PRIMARY KEY("tenant_id","deposit_id","session_id")
);
--> statement-breakpoint
CREATE TABLE "pos_deposit" (
	"amount_minor" bigint NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by_actor_user_id" text,
	"confirmed_by_party_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"deposit_reference" text NOT NULL,
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"prepared_at" timestamp with time zone NOT NULL,
	"prepared_by_actor_user_id" text NOT NULL,
	"prepared_by_party_id" text NOT NULL,
	"state" text DEFAULT 'Prepared' NOT NULL,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pos_deposit_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_deposit_currency_check" CHECK ("pos_deposit"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_deposit_amount_check" CHECK ("pos_deposit"."amount_minor" > 0),
	CONSTRAINT "pos_deposit_state_check" CHECK ("pos_deposit"."state" in ('Prepared', 'Reconciled')),
	CONSTRAINT "pos_deposit_reconciled_check" CHECK (("pos_deposit"."state" = 'Reconciled') = ("pos_deposit"."confirmed_at" is not null and "pos_deposit"."confirmed_by_actor_user_id" is not null and "pos_deposit"."confirmed_by_party_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "pos_deposit_custody_transfer" ADD CONSTRAINT "pos_deposit_custody_transfer_deposit_fk" FOREIGN KEY ("tenant_id","deposit_id") REFERENCES "public"."pos_deposit"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_deposit_source_shift" ADD CONSTRAINT "pos_deposit_source_shift_deposit_fk" FOREIGN KEY ("tenant_id","deposit_id") REFERENCES "public"."pos_deposit"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_deposit_source_shift" ADD CONSTRAINT "pos_deposit_source_shift_session_fk" FOREIGN KEY ("tenant_id","session_id") REFERENCES "public"."pos_register_session"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pos_deposit_custody_transfer_tenant_deposit_uidx" ON "pos_deposit_custody_transfer" USING btree ("tenant_id","deposit_id");--> statement-breakpoint
CREATE INDEX "pos_deposit_source_shift_tenant_session_idx" ON "pos_deposit_source_shift" USING btree ("tenant_id","session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pos_deposit_tenant_reference_uidx" ON "pos_deposit" USING btree ("tenant_id","deposit_reference");--> statement-breakpoint
CREATE INDEX "pos_deposit_tenant_state_idx" ON "pos_deposit" USING btree ("tenant_id","organization_id","state");--> statement-breakpoint
CREATE INDEX "pos_deposit_tenant_prepared_at_idx" ON "pos_deposit" USING btree ("tenant_id","organization_id","prepared_at");--> statement-breakpoint
CREATE INDEX "pos_deposit_tenant_confirmed_at_idx" ON "pos_deposit" USING btree ("tenant_id","organization_id","confirmed_at");