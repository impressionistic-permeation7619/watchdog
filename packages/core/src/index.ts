export {
  uploadArtifact,
  readArtifactBytes,
  sha256Hex,
  assertSha256Hex,
  artifactUri,
  createPresignedPut,
  createPresignedGet,
  assertUploadedObject,
  deleteCaseArtifacts,
  MAX_UPLOAD_BYTES,
} from "./infra/blob";
export type { UploadedArtifact, PresignedPut } from "./infra/blob";
export {
  CAP_JOB_QUEUE,
  ensureBossProducer,
  ensureBossWorker,
  enqueueCapJob,
  isCapJobPayload,
  type CapJobPayload,
  type BossRole,
} from "./jobs/boss";
export {
  capExpireSeconds,
  gracefulStopTimeoutMs,
  queueExpireSeconds,
  POST_RUN_SLACK_MS,
} from "./jobs/timeouts";
export {
  reconcileStaleJobs,
  reconcileStuckPlaybookRuns,
} from "./jobs/reconcile-stale-jobs";
export { parsePatch, tryParsePatch } from "./graph/patch/patch";
export {
  applyPatch,
  type ApplyPatchOpts,
  type ApplyPatchTx,
} from "./graph/patch/apply-patch";
export {
  suppressKnownFindings,
  recordRejectedFingerprints,
} from "./proposals/finding-suppress";
export { parseAgentPatch } from "./graph/patch/parse-agent-patch";
export {
  createAgentProposal,
  writeGraphFromAgent,
} from "./proposals/agent-ingress";
export {
  executeJob,
  abortActiveJob,
  listActiveJobIds,
  registerActiveJobController,
  unregisterActiveJobController,
  type JobRunOutcome,
  type JobAbortReason,
  type JobRunOutcomeName,
  type ActiveJobAbortReason,
} from "./jobs/run-job";
export { loadCapReport, artifactsHaveCapReport } from "./jobs/load-cap-report";
export {
  startJob,
  listJobsForCase,
  getJobForCase,
  cancelJob,
  findCancelledJobIds,
  type StartJobInput,
  type JobRecord,
  type JobListRecord,
} from "./jobs/start-job";
export {
  runPlaybook,
  cancelPlaybookRun,
  type RunPlaybookInput,
  type PlaybookRunResult,
} from "./jobs/run-playbook";
export {
  processEvidence,
  markEvidenceProcessed,
  enrichUrlEvidence,
} from "./evidence/process-evidence";
export {
  packEvidenceSnapshot,
  snapshotToArtifactBytes,
  MAX_SNAPSHOT_CHARS,
} from "./evidence/pack-evidence-snapshot";
export {
  listProposalsForCase,
  getProposalForCase,
  acceptProposal,
  rejectProposal,
  type ProposalRecord,
} from "./proposals/proposals";
export type { IdentifierCollision } from "./graph/identifier-collisions";
export {
  VaultError,
  listCredentialMeta,
  hasCredential,
  getCredential,
  putCredential,
  deleteCredential,
  assertCredentialName,
  type CredentialMeta,
} from "./infra/vault";
export {
  listCredentialSlots,
  putCredentialSlot,
  type CredentialSlot,
} from "./infra/credential-slots";
export {
  listCases,
  getCaseById,
  getCaseBySlug,
  createCase,
  updateCase,
  deleteCase,
  type CaseRecord,
  type CreateCaseInput,
} from "./cases/cases";
export {
  listClaimsForEntity,
  createClaim,
  updateClaim,
  retractClaim,
  type ClaimRecord,
  type CreateClaimInput,
  type UpdateClaimInput,
  type RetractClaimInput,
} from "./graph/claims";
export {
  listEventsForEntity,
  createEvent,
  updateEvent,
  deleteEvent,
  type EventRecord,
  type CreateEventInput,
  type UpdateEventInput,
} from "./graph/events-timeline";
export {
  listQuestionsForEntity,
  createQuestion,
  updateQuestion,
  resolveQuestion,
  reopenQuestion,
  type QuestionRecord,
  type CreateQuestionInput,
  type UpdateQuestionInput,
  type ResolveQuestionInput,
  type ReopenQuestionInput,
} from "./graph/questions";
export {
  listIdentifiersForEntity,
  listIdentifiersForCase,
  toCaseIdentifierRecord,
  createIdentifier,
  updateIdentifier,
  type IdentifierRecord,
  type CaseIdentifierRecord,
  type CreateIdentifierInput,
  type UpdateIdentifierInput,
} from "./graph/identifiers";
export {
  listEdgesForEntity,
  listEdgesForCase,
  toCaseEdgeRecord,
  createEdge,
  updateEdge,
  deleteEdge,
  type EdgeRecord,
  type CaseEdgeRecord,
  type CreateEdgeInput,
  type UpdateEdgeInput,
} from "./graph/edges";
export {
  assertCaseExists,
  assertEntityInCase,
  assertConfidenceEvidence,
} from "./graph/patch/guards";
export {
  listEntitiesForCase,
  getEntityByCaseSlug,
  createEntity,
  updateEntityFields,
  type EntityRecord,
  type CreateEntityInput,
  type UpdateEntityFieldsInput,
} from "./graph/entities";
export {
  listEvidenceForCase,
  dumpPaste,
  dumpUrl,
  softDeleteEvidence,
  restoreEvidence,
  attachEvidenceEntity,
  presignUpload,
  confirmFileUpload,
  getEvidenceDownloadUrl,
  createAttestation,
  assertEvidenceInCase,
  type EvidenceRecord,
  type ListEvidenceOpts,
  type DumpPasteInput,
  type DumpUrlInput,
  type SoftDeleteInput,
  type PresignUploadInput,
  type ConfirmFileUploadInput,
  type CreateAttestationInput,
} from "./evidence/evidence";
export type { DbTx, DbExec } from "@watchdog/db";
export {
  DomainError,
  errorMessage,
  isUniqueViolation,
  type DomainErrorCode,
} from "./infra/domain-error";
export {
  notifyEvent,
  notifyEntityChanged,
  notifyTaskChanged,
  listenForEvents,
  isWatchdogEvent,
  WATCHDOG_CHANNEL,
  type WatchdogEvent,
} from "./infra/events";
export {
  renderEntityMarkdown,
  renderCaseExport,
  type EntityExport,
} from "./infra/export";
export {
  writeEntityExport,
  writeCaseExport,
  scheduleCaseExport,
  removeCaseExportDir,
} from "./infra/export-sync";
export {
  listTasksForCase,
  getTaskInCase,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  type TaskRecord,
  type CreateTaskInput,
  type UpdateTaskInput,
  type ReorderTasksInput,
  type ListTasksOpts,
} from "./tasks/tasks";
export {
  listRecentActivity,
  mergeActivityItems,
  taskEventAction,
  jobActivityAction,
  type ActivityItem,
  type ActivityKind,
  type ListRecentActivityOpts,
} from "./activity/recent-activity";
export {
  searchCase,
  type SearchCaseOpts,
  type SearchCaseResult,
  type SearchCaseEntityHit,
  type SearchCaseIdentifierHit,
  type SearchCaseEvidenceHit,
  type SearchCaseTaskHit,
  type SearchCaseJobHit,
  type SearchCaseProposalHit,
  type SearchCaseCaseHit,
} from "./search/search-case";
