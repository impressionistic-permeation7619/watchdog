DROP INDEX "jobs_playbook_run_step_uq";--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "playbook_fan_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "handoff" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_playbook_run_step_fan_uq" ON "jobs" USING btree ("playbook_run_id","playbook_step","playbook_fan_index") WHERE "jobs"."playbook_run_id" IS NOT NULL;