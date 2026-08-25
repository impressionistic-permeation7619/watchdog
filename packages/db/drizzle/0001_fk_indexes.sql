CREATE INDEX "session_user_id_idx" ON "auth"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "evidence_case_id_idx" ON "evidence" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "claims_entity_id_idx" ON "claims" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "jobs_case_id_idx" ON "jobs" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_playbook_run_step_uq" ON "jobs" USING btree ("playbook_run_id","playbook_step") WHERE "jobs"."playbook_run_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "proposals_case_id_idx" ON "proposals" USING btree ("case_id");
