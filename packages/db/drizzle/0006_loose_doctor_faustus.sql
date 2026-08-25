DELETE FROM "cap_cache";--> statement-breakpoint
DROP INDEX "cap_cache_cap_input_uidx";--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cap_cache" ADD COLUMN "case_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cap_cache" ADD CONSTRAINT "cap_cache_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_case_status_position_idx" ON "tasks" USING btree ("case_id","status","position");--> statement-breakpoint
CREATE UNIQUE INDEX "cap_cache_case_cap_input_uidx" ON "cap_cache" USING btree ("case_id","capability_id","input_hash");