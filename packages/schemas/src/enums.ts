import { z } from "zod";

import {
  CLAIM_CLASSES,
  CONFIDENCE_TIERS,
  EDGE_PREDICATES,
  ENTITY_KINDS,
  EVIDENCE_KINDS,
  IDENTIFIER_STATUSES,
  IDENTIFIER_TYPES,
  GRAPH_WRITE_CHANNELS,
  JOB_STATUSES,
  PLAYBOOK_RUN_STATUSES,
  PROPOSAL_STATUSES,
  QUESTION_STATUSES,
  RETRACT_KINDS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "./vocab";

export const entityKindSchema = z.enum(ENTITY_KINDS);
export const claimClassSchema = z.enum(CLAIM_CLASSES);
export const confidenceTierSchema = z.enum(CONFIDENCE_TIERS);
export const identifierTypeSchema = z.enum(IDENTIFIER_TYPES);
export const identifierStatusSchema = z.enum(IDENTIFIER_STATUSES);
export const edgePredicateSchema = z.enum(EDGE_PREDICATES);
export const evidenceKindSchema = z.enum(EVIDENCE_KINDS);
export const jobStatusSchema = z.enum(JOB_STATUSES);
export const playbookRunStatusSchema = z.enum(PLAYBOOK_RUN_STATUSES);
export const retractKindSchema = z.enum(RETRACT_KINDS);
export const questionStatusSchema = z.enum(QUESTION_STATUSES);
export const proposalStatusSchema = z.enum(PROPOSAL_STATUSES);
export const graphWriteChannelSchema = z.enum(GRAPH_WRITE_CHANNELS);
export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);
