CREATE TABLE "admin_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"target_id" text,
	"admin_email" text NOT NULL,
	"detail" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "admin_override" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "disabled_at" timestamp;