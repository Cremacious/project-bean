CREATE TABLE "subscription" (
	"parent_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'none' NOT NULL,
	"product_id" text,
	"source" text DEFAULT 'internal' NOT NULL,
	"current_period_end" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_parent_id_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;