CREATE TABLE "pos_price_override" (
	"approved_at" timestamp with time zone,
	"approved_by_actor_user_id" text,
	"approved_by_party_id" text,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"currency" text NOT NULL,
	"id" text NOT NULL,
	"line_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"reason" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"requested_by_actor_user_id" text NOT NULL,
	"requested_by_party_id" text NOT NULL,
	"requested_price_minor" bigint NOT NULL,
	"sale_id" text NOT NULL,
	"state" text DEFAULT 'Pending' NOT NULL,
	"tenant_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pos_price_override_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_price_override_currency_check" CHECK ("pos_price_override"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_price_override_state_check" CHECK ("pos_price_override"."state" in ('Pending', 'Approved')),
	CONSTRAINT "pos_price_override_requested_price_check" CHECK ("pos_price_override"."requested_price_minor" > 0),
	CONSTRAINT "pos_price_override_approval_check" CHECK (("pos_price_override"."state" = 'Approved') = ("pos_price_override"."approved_at" is not null and "pos_price_override"."approved_by_actor_user_id" is not null and "pos_price_override"."approved_by_party_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "pos_receipt" (
	"cashier_party_id" text NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"id" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"kind" text NOT NULL,
	"lines" jsonb NOT NULL,
	"organization_id" text NOT NULL,
	"original_receipt_id" text,
	"price_suppressed" boolean DEFAULT false NOT NULL,
	"receipt_number" text NOT NULL,
	"register_id" text NOT NULL,
	"return_id" text,
	"sale_id" text,
	"tenant_id" text NOT NULL,
	"tenders" jsonb NOT NULL,
	"total_minor" bigint,
	CONSTRAINT "pos_receipt_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_receipt_currency_check" CHECK ("pos_receipt"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_receipt_kind_check" CHECK ("pos_receipt"."kind" in ('Sale', 'Return', 'Reissue'))
);
--> statement-breakpoint
CREATE TABLE "pos_sale_line" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discount_minor" bigint NOT NULL,
	"gross_minor" bigint NOT NULL,
	"id" text NOT NULL,
	"line_total_minor" bigint NOT NULL,
	"price_override_id" text,
	"price_override_state" text,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"quantity" numeric(38, 6) NOT NULL,
	"sale_id" text NOT NULL,
	"tax_amount_minor" bigint NOT NULL,
	"taxable_base_minor" bigint NOT NULL,
	"tax_category" text NOT NULL,
	"tenant_id" text NOT NULL,
	"unit" text NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variant_id" text,
	CONSTRAINT "pos_sale_line_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_sale_line_quantity_check" CHECK ("pos_sale_line"."quantity" > 0),
	CONSTRAINT "pos_sale_line_tax_category_check" CHECK ("pos_sale_line"."tax_category" in ('GY_STANDARD_14', 'GY_ZERO_RATED', 'GY_EXEMPT', 'GY_OUT_OF_SCOPE')),
	CONSTRAINT "pos_sale_line_price_override_state_check" CHECK ("pos_sale_line"."price_override_state" is null or "pos_sale_line"."price_override_state" in ('Pending', 'Approved'))
);
--> statement-breakpoint
CREATE TABLE "pos_sale" (
	"change_minor" bigint,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_actor_user_id" text NOT NULL,
	"created_by_party_id" text NOT NULL,
	"currency" text NOT NULL,
	"customer_party_id" text,
	"discount_minor" bigint NOT NULL,
	"gross_minor" bigint NOT NULL,
	"held_at" timestamp with time zone,
	"id" text NOT NULL,
	"location_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"receipt_id" text,
	"register_id" text NOT NULL,
	"session_id" text NOT NULL,
	"state" text DEFAULT 'Open' NOT NULL,
	"tax_minor" bigint NOT NULL,
	"tenant_id" text NOT NULL,
	"tendered_minor" bigint,
	"tenders" jsonb,
	"total_minor" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pos_sale_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_sale_currency_check" CHECK ("pos_sale"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_sale_state_check" CHECK ("pos_sale"."state" in ('Open', 'Held', 'Completed')),
	CONSTRAINT "pos_sale_held_check" CHECK (("pos_sale"."state" <> 'Held') or ("pos_sale"."held_at" is not null)),
	CONSTRAINT "pos_sale_completed_check" CHECK (("pos_sale"."state" = 'Completed') = ("pos_sale"."completed_at" is not null and "pos_sale"."receipt_id" is not null and "pos_sale"."tendered_minor" is not null and "pos_sale"."change_minor" is not null))
);
--> statement-breakpoint
ALTER TABLE "pos_price_override" ADD CONSTRAINT "pos_price_override_sale_fk" FOREIGN KEY ("tenant_id","sale_id") REFERENCES "public"."pos_sale"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD CONSTRAINT "pos_sale_line_sale_fk" FOREIGN KEY ("tenant_id","sale_id") REFERENCES "public"."pos_sale"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sale" ADD CONSTRAINT "pos_sale_session_fk" FOREIGN KEY ("tenant_id","session_id") REFERENCES "public"."pos_register_session"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pos_price_override_tenant_sale_state_idx" ON "pos_price_override" USING btree ("tenant_id","sale_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "pos_receipt_tenant_register_number_uidx" ON "pos_receipt" USING btree ("tenant_id","register_id","receipt_number");--> statement-breakpoint
CREATE INDEX "pos_receipt_tenant_sale_idx" ON "pos_receipt" USING btree ("tenant_id","sale_id");--> statement-breakpoint
CREATE INDEX "pos_sale_line_tenant_sale_idx" ON "pos_sale_line" USING btree ("tenant_id","sale_id");--> statement-breakpoint
CREATE INDEX "pos_sale_tenant_register_state_idx" ON "pos_sale" USING btree ("tenant_id","register_id","state","id");