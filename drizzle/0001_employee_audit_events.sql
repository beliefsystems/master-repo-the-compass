ALTER TYPE "public"."system_event_type" ADD VALUE IF NOT EXISTS 'EMPLOYEE_CREATED';--> statement-breakpoint
ALTER TYPE "public"."system_event_type" ADD VALUE IF NOT EXISTS 'EMPLOYEE_UPDATED';--> statement-breakpoint
ALTER TYPE "public"."system_event_type" ADD VALUE IF NOT EXISTS 'EMPLOYEE_DEACTIVATED';--> statement-breakpoint
ALTER TYPE "public"."system_event_type" ADD VALUE IF NOT EXISTS 'EMPLOYEE_RESTORED';
