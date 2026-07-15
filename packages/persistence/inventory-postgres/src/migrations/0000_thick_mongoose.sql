CREATE TABLE "inventory_adjustment" (
	"approved_by_user_id" text,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"conversion_source_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text NOT NULL,
	"id" text NOT NULL,
	"item_key" text NOT NULL,
	"location_id" text NOT NULL,
	"movement_id" text,
	"organization_id" text NOT NULL,
	"posted_at" timestamp with time zone,
	"product_id" text NOT NULL,
	"quantity" numeric(38, 6) NOT NULL,
	"reason" text NOT NULL,
	"reversal_movement_id" text,
	"state" text DEFAULT 'PendingApproval' NOT NULL,
	"tenant_id" text NOT NULL,
	"unit" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variant_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "inventory_adjustment_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "inventory_adjustment_state_check" CHECK ("inventory_adjustment"."state" in ('Draft', 'PendingApproval', 'Approved', 'Posted', 'Reversed', 'Rejected')),
	CONSTRAINT "inventory_adjustment_posted_check" CHECK (("inventory_adjustment"."state" in ('Posted', 'Reversed') and "inventory_adjustment"."movement_id" is not null and "inventory_adjustment"."posted_at" is not null and "inventory_adjustment"."approved_by_user_id" is not null) or ("inventory_adjustment"."state" not in ('Posted', 'Reversed'))),
	CONSTRAINT "inventory_adjustment_reversed_check" CHECK (("inventory_adjustment"."state" = 'Reversed' and "inventory_adjustment"."reversal_movement_id" is not null) or ("inventory_adjustment"."state" <> 'Reversed' and "inventory_adjustment"."reversal_movement_id" is null))
);
--> statement-breakpoint
CREATE TABLE "inventory_command_receipt" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"resource_id" text NOT NULL,
	"result" jsonb NOT NULL,
	"source_channel" text DEFAULT 'api' NOT NULL,
	"source_command_id" text,
	"source_sequence" integer,
	"tenant_id" text NOT NULL,
	CONSTRAINT "inventory_command_receipt_pk" PRIMARY KEY("tenant_id","operation","idempotency_key"),
	CONSTRAINT "inventory_command_receipt_source_check" CHECK ("inventory_command_receipt"."source_channel" in ('api', 'offline')),
	CONSTRAINT "inventory_command_receipt_offline_check" CHECK (("inventory_command_receipt"."source_channel" = 'api' and "inventory_command_receipt"."source_command_id" is null and "inventory_command_receipt"."source_sequence" is null) or ("inventory_command_receipt"."source_channel" = 'offline' and "inventory_command_receipt"."source_command_id" is not null and "inventory_command_receipt"."source_sequence" is not null and "inventory_command_receipt"."source_sequence" >= 0))
);
--> statement-breakpoint
CREATE TABLE "inventory_count_line" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"conversion_source_id" text,
	"count_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_quantity" numeric(38, 6),
	"id" text NOT NULL,
	"item_key" text NOT NULL,
	"movement_id" text,
	"observed_quantity" numeric(38, 6) NOT NULL,
	"product_id" text NOT NULL,
	"tenant_id" text NOT NULL,
	"unit" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variance_quantity" numeric(38, 6),
	"variant_id" text,
	CONSTRAINT "inventory_count_line_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "inventory_count_line_observed_check" CHECK ("inventory_count_line"."observed_quantity" >= 0),
	CONSTRAINT "inventory_count_line_variance_pair_check" CHECK (("inventory_count_line"."expected_quantity" is null and "inventory_count_line"."variance_quantity" is null and "inventory_count_line"."movement_id" is null) or ("inventory_count_line"."expected_quantity" is not null and "inventory_count_line"."variance_quantity" is not null))
);
--> statement-breakpoint
CREATE TABLE "inventory_count" (
	"approved_by_user_id" text,
	"blind" boolean DEFAULT true NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text NOT NULL,
	"id" text NOT NULL,
	"location_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"posted_at" timestamp with time zone,
	"state" text DEFAULT 'Draft' NOT NULL,
	"submitted_by_user_id" text,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "inventory_count_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "inventory_count_state_check" CHECK ("inventory_count"."state" in ('Draft', 'InProgress', 'Submitted', 'Approved', 'Posted', 'Rejected')),
	CONSTRAINT "inventory_count_posted_check" CHECK (("inventory_count"."state" = 'Posted' and "inventory_count"."posted_at" is not null and "inventory_count"."approved_by_user_id" is not null) or ("inventory_count"."state" <> 'Posted'))
);
--> statement-breakpoint
CREATE TABLE "inventory_reservation" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text NOT NULL,
	"expires_at" timestamp with time zone,
	"id" text NOT NULL,
	"item_key" text NOT NULL,
	"location_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" numeric(38, 6) NOT NULL,
	"reason" text,
	"released_at" timestamp with time zone,
	"source_id" text,
	"state" text DEFAULT 'Active' NOT NULL,
	"tenant_id" text NOT NULL,
	"unit" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variant_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "inventory_reservation_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "inventory_reservation_quantity_check" CHECK ("inventory_reservation"."quantity" > 0),
	CONSTRAINT "inventory_reservation_state_check" CHECK ("inventory_reservation"."state" in ('Active', 'Released', 'Expired')),
	CONSTRAINT "inventory_reservation_release_check" CHECK (("inventory_reservation"."state" = 'Active' and "inventory_reservation"."released_at" is null) or ("inventory_reservation"."state" <> 'Active'))
);
--> statement-breakpoint
CREATE TABLE "inventory_stock_balance" (
	"as_of" timestamp with time zone NOT NULL,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"item_key" text NOT NULL,
	"location_id" text NOT NULL,
	"on_hand" numeric(38, 6) NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" text NOT NULL,
	"reconciliation_state" text DEFAULT 'Current' NOT NULL,
	"tenant_id" text NOT NULL,
	"unit" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variant_id" text,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "inventory_stock_balance_pk" PRIMARY KEY("tenant_id","location_id","item_key","unit"),
	CONSTRAINT "inventory_stock_balance_nonnegative_check" CHECK ("inventory_stock_balance"."on_hand" >= 0),
	CONSTRAINT "inventory_stock_balance_reconciliation_state_check" CHECK ("inventory_stock_balance"."reconciliation_state" in ('Current', 'RequiresReview')),
	CONSTRAINT "inventory_stock_balance_version_check" CHECK ("inventory_stock_balance"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "inventory_stock_movement" (
	"actor_user_id" text NOT NULL,
	"causation_id" text,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"conversion_source_id" text,
	"correlation_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decision_id" text,
	"id" text NOT NULL,
	"item_key" text NOT NULL,
	"location_id" text NOT NULL,
	"movement_type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" numeric(38, 6) NOT NULL,
	"reversal_of_movement_id" text,
	"source_id" text NOT NULL,
	"source_type" text NOT NULL,
	"tenant_id" text NOT NULL,
	"unit" text NOT NULL,
	"variant_id" text,
	CONSTRAINT "inventory_stock_movement_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "inventory_stock_movement_type_check" CHECK ("inventory_stock_movement"."movement_type" in ('Adjustment', 'CountVariance', 'TransferOut', 'TransferIn', 'Reversal', 'Offline')),
	CONSTRAINT "inventory_stock_movement_source_type_check" CHECK ("inventory_stock_movement"."source_type" in ('Adjustment', 'Count', 'Transfer', 'OfflineCommand')),
	CONSTRAINT "inventory_stock_movement_reversal_check" CHECK (("inventory_stock_movement"."movement_type" = 'Reversal' and "inventory_stock_movement"."reversal_of_movement_id" is not null) or ("inventory_stock_movement"."movement_type" <> 'Reversal' and "inventory_stock_movement"."reversal_of_movement_id" is null))
);
--> statement-breakpoint
CREATE TABLE "inventory_transfer_line" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"conversion_source_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dispatched_quantity" numeric(38, 6) NOT NULL,
	"exception_quantity" numeric(38, 6) NOT NULL,
	"id" text NOT NULL,
	"item_key" text NOT NULL,
	"product_id" text NOT NULL,
	"received_quantity" numeric(38, 6) NOT NULL,
	"requested_quantity" numeric(38, 6) NOT NULL,
	"source_movement_id" text,
	"tenant_id" text NOT NULL,
	"transfer_id" text NOT NULL,
	"unit" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"variant_id" text,
	CONSTRAINT "inventory_transfer_line_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "inventory_transfer_line_quantities_check" CHECK ("inventory_transfer_line"."requested_quantity" > 0 and "inventory_transfer_line"."dispatched_quantity" >= 0 and "inventory_transfer_line"."received_quantity" >= 0 and "inventory_transfer_line"."exception_quantity" >= 0 and "inventory_transfer_line"."dispatched_quantity" <= "inventory_transfer_line"."requested_quantity" and ("inventory_transfer_line"."received_quantity" + "inventory_transfer_line"."exception_quantity") <= "inventory_transfer_line"."dispatched_quantity")
);
--> statement-breakpoint
CREATE TABLE "inventory_transfer" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text NOT NULL,
	"destination_location_id" text NOT NULL,
	"dispatched_at" timestamp with time zone,
	"dispatched_by_user_id" text,
	"exception_reason" text,
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"received_at" timestamp with time zone,
	"received_by_user_id" text,
	"source_location_id" text NOT NULL,
	"state" text DEFAULT 'Draft' NOT NULL,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "inventory_transfer_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "inventory_transfer_locations_check" CHECK ("inventory_transfer"."source_location_id" <> "inventory_transfer"."destination_location_id"),
	CONSTRAINT "inventory_transfer_state_check" CHECK ("inventory_transfer"."state" in ('Draft', 'Dispatched', 'PartiallyReceived', 'Received', 'Exception', 'Cancelled')),
	CONSTRAINT "inventory_transfer_exception_check" CHECK (("inventory_transfer"."state" = 'Exception' and "inventory_transfer"."exception_reason" is not null) or ("inventory_transfer"."state" <> 'Exception'))
);
--> statement-breakpoint
ALTER TABLE "inventory_count_line" ADD CONSTRAINT "inventory_count_line_count_fk" FOREIGN KEY ("tenant_id","count_id") REFERENCES "public"."inventory_count"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transfer_line" ADD CONSTRAINT "inventory_transfer_line_transfer_fk" FOREIGN KEY ("tenant_id","transfer_id") REFERENCES "public"."inventory_transfer"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_adjustment_tenant_state_idx" ON "inventory_adjustment" USING btree ("tenant_id","state","id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_command_receipt_offline_uidx" ON "inventory_command_receipt" USING btree ("tenant_id","source_command_id") WHERE "inventory_command_receipt"."source_command_id" is not null;--> statement-breakpoint
CREATE INDEX "inventory_command_receipt_resource_idx" ON "inventory_command_receipt" USING btree ("tenant_id","operation","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_count_line_tenant_item_uidx" ON "inventory_count_line" USING btree ("tenant_id","count_id","item_key","unit");--> statement-breakpoint
CREATE INDEX "inventory_count_tenant_location_state_idx" ON "inventory_count" USING btree ("tenant_id","location_id","state","id");--> statement-breakpoint
CREATE INDEX "inventory_reservation_tenant_item_state_idx" ON "inventory_reservation" USING btree ("tenant_id","location_id","item_key","unit","state","expires_at");--> statement-breakpoint
CREATE INDEX "inventory_stock_balance_tenant_product_idx" ON "inventory_stock_balance" USING btree ("tenant_id","product_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_stock_movement_tenant_reversal_uidx" ON "inventory_stock_movement" USING btree ("tenant_id","reversal_of_movement_id") WHERE "inventory_stock_movement"."reversal_of_movement_id" is not null;--> statement-breakpoint
CREATE INDEX "inventory_stock_movement_tenant_item_time_idx" ON "inventory_stock_movement" USING btree ("tenant_id","location_id","item_key","unit","occurred_at","id");--> statement-breakpoint
CREATE INDEX "inventory_stock_movement_tenant_source_idx" ON "inventory_stock_movement" USING btree ("tenant_id","source_type","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_transfer_line_tenant_item_uidx" ON "inventory_transfer_line" USING btree ("tenant_id","transfer_id","item_key","unit");--> statement-breakpoint
CREATE INDEX "inventory_transfer_tenant_state_idx" ON "inventory_transfer" USING btree ("tenant_id","state","id");