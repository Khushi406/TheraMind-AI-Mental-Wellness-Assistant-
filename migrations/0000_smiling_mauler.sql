CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"emotions" jsonb NOT NULL,
	"reflection" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "journal_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"affirmation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_prompts" ADD CONSTRAINT "journal_prompts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");