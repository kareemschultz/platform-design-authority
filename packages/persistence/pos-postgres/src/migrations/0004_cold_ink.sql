CREATE TABLE "pos_refund" (
	"amount_minor" bigint NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_actor_user_id" text,
	"approved_by_party_id" text,
	"cash_movement_id" text,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"currency" text NOT NULL,
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"register_id" text NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"requested_by_actor_user_id" text NOT NULL,
	"requested_by_party_id" text NOT NULL,
	"return_id" text NOT NULL,
	"state" text DEFAULT 'Requested' NOT NULL,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pos_refund_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_refund_currency_check" CHECK ("pos_refund"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_refund_amount_check" CHECK ("pos_refund"."amount_minor" > 0),
	CONSTRAINT "pos_refund_state_check" CHECK ("pos_refund"."state" in ('Requested', 'Posted')),
	CONSTRAINT "pos_refund_posted_check" CHECK (("pos_refund"."state" = 'Posted') = ("pos_refund"."approved_at" is not null and "pos_refund"."approved_by_actor_user_id" is not null and "pos_refund"."approved_by_party_id" is not null and "pos_refund"."cash_movement_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "pos_return_line" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"discount_minor" bigint NOT NULL,
	"gross_minor" bigint NOT NULL,
	"id" text NOT NULL,
	"line_total_minor" bigint NOT NULL,
	"non_statutory" boolean DEFAULT true NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"quantity" numeric(38, 6) NOT NULL,
	"return_id" text NOT NULL,
	"sale_line_id" text NOT NULL,
	"tax_amount_minor" bigint NOT NULL,
	"taxable_base_minor" bigint NOT NULL,
	"tax_category" text NOT NULL,
	"tenant_id" text NOT NULL,
	"unit" text NOT NULL,
	"unit_price_minor" bigint NOT NULL,
	"variant_id" text,
	CONSTRAINT "pos_return_line_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_return_line_quantity_check" CHECK ("pos_return_line"."quantity" > 0),
	CONSTRAINT "pos_return_line_tax_category_check" CHECK ("pos_return_line"."tax_category" in ('GY_STANDARD_14', 'GY_ZERO_RATED', 'GY_EXEMPT', 'GY_OUT_OF_SCOPE')),
	CONSTRAINT "pos_return_line_non_statutory_check" CHECK ("pos_return_line"."non_statutory" = true)
);
--> statement-breakpoint
CREATE TABLE "pos_return" (
	"approved_at" timestamp with time zone,
	"approved_by_actor_user_id" text,
	"approved_by_party_id" text,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_actor_user_id" text NOT NULL,
	"created_by_party_id" text NOT NULL,
	"currency" text NOT NULL,
	"exchange_sale_id" text,
	"id" text NOT NULL,
	"mode" text DEFAULT 'Return' NOT NULL,
	"organization_id" text NOT NULL,
	"reason" text NOT NULL,
	"receipt_id" text,
	"register_id" text NOT NULL,
	"sale_id" text NOT NULL,
	"state" text DEFAULT 'Pending' NOT NULL,
	"tenant_id" text NOT NULL,
	"total_refundable_minor" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "pos_return_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "pos_return_currency_check" CHECK ("pos_return"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pos_return_mode_check" CHECK ("pos_return"."mode" in ('Return', 'Void')),
	CONSTRAINT "pos_return_state_check" CHECK ("pos_return"."state" in ('Pending', 'Completed')),
	CONSTRAINT "pos_return_completed_check" CHECK (("pos_return"."state" = 'Completed') = ("pos_return"."approved_at" is not null and "pos_return"."approved_by_actor_user_id" is not null and "pos_return"."approved_by_party_id" is not null and "pos_return"."receipt_id" is not null)),
	CONSTRAINT "pos_return_total_refundable_check" CHECK ("pos_return"."total_refundable_minor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "pos_sale_line" ADD COLUMN "inventory_movement_id" text;--> statement-breakpoint
ALTER TABLE "pos_refund" ADD CONSTRAINT "pos_refund_return_fk" FOREIGN KEY ("tenant_id","return_id") REFERENCES "public"."pos_return"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_return_line" ADD CONSTRAINT "pos_return_line_return_fk" FOREIGN KEY ("tenant_id","return_id") REFERENCES "public"."pos_return"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_return_line" ADD CONSTRAINT "pos_return_line_sale_line_fk" FOREIGN KEY ("tenant_id","sale_line_id") REFERENCES "public"."pos_sale_line"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_return" ADD CONSTRAINT "pos_return_sale_fk" FOREIGN KEY ("tenant_id","sale_id") REFERENCES "public"."pos_sale"("tenant_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pos_refund_tenant_return_uidx" ON "pos_refund" USING btree ("tenant_id","return_id");--> statement-breakpoint
CREATE INDEX "pos_return_line_tenant_return_idx" ON "pos_return_line" USING btree ("tenant_id","return_id");--> statement-breakpoint
CREATE INDEX "pos_return_line_tenant_sale_line_idx" ON "pos_return_line" USING btree ("tenant_id","sale_line_id");--> statement-breakpoint
CREATE INDEX "pos_return_tenant_sale_idx" ON "pos_return" USING btree ("tenant_id","sale_id","state");