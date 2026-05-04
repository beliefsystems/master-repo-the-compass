CREATE TYPE "public"."objective_status" AS ENUM('LAUNCHED', 'ONGOING', 'COMPLETED', 'DELETED');--> statement-breakpoint
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
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_organisation_id_organisation_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;
