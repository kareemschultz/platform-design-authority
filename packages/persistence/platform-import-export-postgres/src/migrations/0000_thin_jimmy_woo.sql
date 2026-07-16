CREATE TABLE "platform_import_command_receipt" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"idempotency_key" text NOT NULL,
	"import_id" text NOT NULL,
	"operation" text NOT NULL,
	"request_fingerprint" text NOT NULL,
	"result" jsonb NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_import_command_receipt_pk" PRIMARY KEY("tenant_id","operation","idempotency_key"),
	CONSTRAINT "platform_import_command_receipt_operation_ck" CHECK ("platform_import_command_receipt"."operation" IN ('create:Product','create:OpeningStock','approve:Product','approve:OpeningStock')),
	CONSTRAINT "platform_import_command_receipt_classification_ck" CHECK ("platform_import_command_receipt"."classification" = 'Confidential')
);
--> statement-breakpoint
CREATE TABLE "platform_import_finding" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"field" text,
	"id" text NOT NULL,
	"import_id" text NOT NULL,
	"row_id" text NOT NULL,
	"row_number" integer NOT NULL,
	"severity" text NOT NULL,
	"source_key" text NOT NULL,
	"tenant_id" text NOT NULL,
	CONSTRAINT "platform_import_finding_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "platform_import_finding_severity_ck" CHECK ("platform_import_finding"."severity" IN ('Info','Warning','Error'))
);
--> statement-breakpoint
CREATE TABLE "platform_import_job" (
	"applied_rows" integer DEFAULT 0 NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_user_id" text,
	"audit_record_id" text,
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"created_by_user_id" text NOT NULL,
	"create_idempotency_key" text NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"failure_code" text,
	"id" text NOT NULL,
	"last_completed_row" integer DEFAULT 0 NOT NULL,
	"manifest" jsonb NOT NULL,
	"organization_id" text NOT NULL,
	"rejected_rows" integer DEFAULT 0 NOT NULL,
	"request_fingerprint" text NOT NULL,
	"scanner_result" text NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"source_content_type" text NOT NULL,
	"source_file_name" text NOT NULL,
	"source_sha256" text NOT NULL,
	"staging_purged_at" timestamp with time zone,
	"state" text NOT NULL,
	"target_capability" text NOT NULL,
	"target_type" text NOT NULL,
	"tenant_id" text NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"warning_rows" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "platform_import_job_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "platform_import_job_target_ck" CHECK ("platform_import_job"."target_type" IN ('Product','OpeningStock')),
	CONSTRAINT "platform_import_job_scanner_ck" CHECK ("platform_import_job"."scanner_result" IN ('Clean','Blocked','Unavailable')),
	CONSTRAINT "platform_import_job_state_ck" CHECK ("platform_import_job"."state" IN ('Uploaded','Validating','ReadyForApproval','Approved','Committing','Completed','Failed','Cancelled')),
	CONSTRAINT "platform_import_job_counts_ck" CHECK ("platform_import_job"."total_rows" >= 0 AND "platform_import_job"."valid_rows" >= 0 AND "platform_import_job"."warning_rows" >= 0 AND "platform_import_job"."rejected_rows" >= 0 AND "platform_import_job"."applied_rows" >= 0 AND "platform_import_job"."skipped_rows" >= 0 AND "platform_import_job"."failed_rows" >= 0 AND "platform_import_job"."last_completed_row" >= 0),
	CONSTRAINT "platform_import_job_purge_state_ck" CHECK ("platform_import_job"."staging_purged_at" IS NULL OR "platform_import_job"."state" IN ('Completed','Cancelled')),
	CONSTRAINT "platform_import_job_version_ck" CHECK ("platform_import_job"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "platform_import_row" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"id" text NOT NULL,
	"import_id" text NOT NULL,
	"normalized_data" jsonb NOT NULL,
	"row_fingerprint" text NOT NULL,
	"row_number" integer NOT NULL,
	"source_key" text NOT NULL,
	"state" text NOT NULL,
	"target_id" text,
	"tenant_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "platform_import_row_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "platform_import_row_number_ck" CHECK ("platform_import_row"."row_number" > 0),
	CONSTRAINT "platform_import_row_state_ck" CHECK ("platform_import_row"."state" IN ('Valid','Warning','Rejected','Applied','Skipped','Failed'))
);
--> statement-breakpoint
CREATE TABLE "platform_import_wave" (
	"classification" text DEFAULT 'Confidential' NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_rows" integer DEFAULT 0 NOT NULL,
	"failure_code" text,
	"first_row_number" integer NOT NULL,
	"id" text NOT NULL,
	"import_id" text NOT NULL,
	"last_completed_row" integer DEFAULT 0 NOT NULL,
	"last_row_number" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"state" text NOT NULL,
	"tenant_id" text NOT NULL,
	"wave_number" integer NOT NULL,
	CONSTRAINT "platform_import_wave_pk" PRIMARY KEY("tenant_id","id"),
	CONSTRAINT "platform_import_wave_range_ck" CHECK ("platform_import_wave"."wave_number" > 0 AND "platform_import_wave"."first_row_number" > 0 AND "platform_import_wave"."last_row_number" >= "platform_import_wave"."first_row_number" AND "platform_import_wave"."completed_rows" >= 0 AND "platform_import_wave"."last_completed_row" >= 0),
	CONSTRAINT "platform_import_wave_state_ck" CHECK ("platform_import_wave"."state" IN ('Pending','Running','Completed','Failed'))
);
--> statement-breakpoint
ALTER TABLE "platform_import_command_receipt" ADD CONSTRAINT "platform_import_command_receipt_job_fk" FOREIGN KEY ("tenant_id","import_id") REFERENCES "public"."platform_import_job"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_import_finding" ADD CONSTRAINT "platform_import_finding_job_fk" FOREIGN KEY ("tenant_id","import_id") REFERENCES "public"."platform_import_job"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_import_finding" ADD CONSTRAINT "platform_import_finding_row_fk" FOREIGN KEY ("tenant_id","row_id") REFERENCES "public"."platform_import_row"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_import_row" ADD CONSTRAINT "platform_import_row_job_fk" FOREIGN KEY ("tenant_id","import_id") REFERENCES "public"."platform_import_job"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_import_wave" ADD CONSTRAINT "platform_import_wave_job_fk" FOREIGN KEY ("tenant_id","import_id") REFERENCES "public"."platform_import_job"("tenant_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_import_finding_list_idx" ON "platform_import_finding" USING btree ("tenant_id","import_id","row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_import_job_create_uidx" ON "platform_import_job" USING btree ("tenant_id","target_type","create_idempotency_key");--> statement-breakpoint
CREATE INDEX "platform_import_job_status_idx" ON "platform_import_job" USING btree ("tenant_id","target_type","state","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_import_row_number_uidx" ON "platform_import_row" USING btree ("tenant_id","import_id","row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_import_wave_number_uidx" ON "platform_import_wave" USING btree ("tenant_id","import_id","wave_number");