CREATE TABLE "whats_new_seen" (
	"parent_id" text PRIMARY KEY NOT NULL,
	"last_seen_entry_id" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whats_new_seen" ADD CONSTRAINT "whats_new_seen_parent_id_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;