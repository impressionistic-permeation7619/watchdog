import { ORPCError } from "@orpc/server";
import { z } from "zod";

import {
  cancelJob,
  cancelPlaybookRun,
  getJobForCase,
  listJobsForCase,
  runPlaybook,
  startJob,
} from "@watchdog/core";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import { jobListSchema, jobSchema, jsonObjectSchema } from "../schemas";

export const listForCase = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/jobs",
    summary: "List jobs for a case",
    tags: ["jobs"],
  })
  .input(z.object({ caseId: z.uuid() }))
  .output(z.array(jobListSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () => listJobsForCase(input.caseId))
  );

export const get = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/jobs/{jobId}",
    summary: "Get a job by id (includes logs)",
    tags: ["jobs"],
  })
  .input(z.object({ caseId: z.uuid(), jobId: z.uuid() }))
  .output(jobSchema)
  .handler(async ({ input }) => {
    const row = await mapDomainError(async () =>
      getJobForCase(input.caseId, input.jobId)
    );
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Job not found" });
    return row;
  });

export const start = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/jobs",
    summary: "Start a Cap Job",
    tags: ["jobs"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      capabilityId: z.string().min(1),
      input: jsonObjectSchema.default({}),
    })
  )
  .output(jobSchema)
  .handler(async ({ input, context }) =>
    mapDomainError(async () =>
      startJob({
        caseId: input.caseId,
        capabilityId: input.capabilityId,
        input: input.input,
        actorId: context.actor.userId,
      })
    )
  );

export const cancel = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/jobs/{jobId}/cancel",
    summary: "Cancel a queued, running, or blocked Job",
    tags: ["jobs"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      jobId: z.uuid(),
    })
  )
  .output(jobSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () => cancelJob(input.caseId, input.jobId))
  );

export const startPlaybook = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/playbooks/{playbookId}/run",
    summary: "Start a playbook (later steps are created after each success)",
    tags: ["jobs"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      playbookId: z.string().min(1),
      seed: z.object({
        host: z.string().optional(),
        url: z.string().optional(),
        evidenceId: z.uuid().optional(),
        entityId: z.uuid().optional(),
        ip: z.string().optional(),
        email: z.string().optional(),
        hash: z.string().optional(),
        handle: z.string().optional(),
      }),
    })
  )
  .output(
    z.object({
      playbookId: z.string(),
      playbookRunId: z.uuid(),
      jobs: z.array(jobSchema),
    })
  )
  .handler(async ({ input, context }) =>
    mapDomainError(async () =>
      runPlaybook({
        caseId: input.caseId,
        playbookId: input.playbookId,
        seed: input.seed,
        actorId: context.actor.userId,
      })
    )
  );

export const cancelPlaybook = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/playbook-runs/{playbookRunId}/cancel",
    summary: "Cancel a playbook run (queued and running members)",
    tags: ["jobs"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      playbookRunId: z.uuid(),
    })
  )
  .output(
    z.object({
      playbookRunId: z.uuid(),
      cancelledJobIds: z.array(z.uuid()),
    })
  )
  .handler(async ({ input }) =>
    mapDomainError(async () =>
      cancelPlaybookRun(input.caseId, input.playbookRunId)
    )
  );
