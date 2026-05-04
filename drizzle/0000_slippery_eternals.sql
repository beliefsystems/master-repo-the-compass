CREATE TYPE "public"."employee_status" AS ENUM('ACTIVE', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "public"."fiscal_year_start" AS ENUM('APRIL', 'JANUARY');--> statement-breakpoint
CREATE TYPE "public"."organisation_status" AS ENUM('ACTIVE', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "public"."objective_status" AS ENUM('LAUNCHED', 'ONGOING', 'COMPLETED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('ACTIVE', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."system_event_type" AS ENUM('USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'USER_RESTORED', 'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED', 'EMPLOYEE_DEACTIVATED', 'EMPLOYEE_RESTORED', 'SESSION_REVOKED', 'CONFIG_UPDATED', 'ORG_UPDATED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'EMPLOYEE');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'DEACTIVATED');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"manager_id" uuid,
	"full_name" varchar(255) NOT NULL,
	"employee_code" varchar(100) NOT NULL,
	"department" varchar(100),
	"division" varchar(100),
	"business_unit" varchar(100),
	"location" varchar(100),
	"designation" varchar(100),
	"status" "employee_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idempotency_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"fiscal_year_start" "fiscal_year_start" NOT NULL,
	"timezone" varchar(100) DEFAULT 'Asia/Kolkata' NOT NULL,
	"status" "organisation_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organisation_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"max_import_file_size_mb" integer DEFAULT 10 NOT NULL,
	"pms_cadences_enabled" text[] DEFAULT ARRAY['QUARTERLY','HALF_YEARLY','ANNUAL']::text[] NOT NULL,
	"kpi_status_bands" jsonb DEFAULT '{"at_risk":{"min":0,"max":59,"label":"At Risk","color":"#EF4444"},"off_track":{"min":60,"max":79,"label":"Off Track","color":"#F59E0B"},"on_track":{"min":80,"max":99,"label":"On Track","color":"#84CC16"},"achieved":{"min":100,"max":null,"label":"Achieved","color":"#22C55E"}}'::jsonb NOT NULL,
	"pms_rating_bands" jsonb DEFAULT '[{"min":100,"max":null,"label":"Exceeds Expectations"},{"min":90,"max":99.99,"label":"Meets Expectations"},{"min":70,"max":89.99,"label":"Below Expectations"},{"min":0,"max":69.99,"label":"Disappointing"}]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"month" integer NOT NULL,
	"fiscal_year" integer NOT NULL,
	"weightage" numeric(5, 2) NOT NULL,
	"status" "objective_status" DEFAULT 'LAUNCHED' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"status" "session_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"event_type" "system_event_type" NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"executive_label" boolean DEFAULT false NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"deleted_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_config" ADD CONSTRAINT "organisation_config_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "employees_organisation_id_employee_code_unique" ON "employees" USING btree ("organisation_id","employee_code");--> statement-breakpoint
CREATE UNIQUE INDEX "employees_organisation_id_user_id_unique" ON "employees" USING btree ("organisation_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_records_key_user_unique" ON "idempotency_records" USING btree ("idempotency_key","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organisation_config_organisation_id_unique" ON "organisation_config" USING btree ("organisation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("session_token");--> statement-breakpoint
CREATE UNIQUE INDEX "users_organisation_id_email_unique" ON "users" USING btree ("organisation_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_organisation_id_username_unique" ON "users" USING btree ("organisation_id","username");
