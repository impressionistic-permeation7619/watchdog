ALTER TABLE "jobs" ADD COLUMN "from_cache" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "suppressed_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "suppressed_count" integer DEFAULT 0 NOT NULL;