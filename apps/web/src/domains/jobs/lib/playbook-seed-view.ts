import type { PlaybookSeedKind } from "@watchdog/schemas";

import type { PlaybookListItem } from "../types";
import {
  missingCredentialNames,
  missingCredentialReason,
} from "./credential-gate";

export interface PlaybookSeedInput {
  playbooks: readonly PlaybookListItem[];
  playbookId: string;
  host: string;
  url: string;
  evidenceId: string;
  ip: string;
  email: string;
  hash: string;
  handle: string;
  urlDumpCount: number;
  allowThirdPartyEgress: boolean;
  configuredCredentials: ReadonlySet<string>;
}

export interface PlaybookSeedView {
  selected: PlaybookListItem | undefined;
  needs: readonly PlaybookSeedKind[];
  needsHost: boolean;
  needsUrl: boolean;
  needsEvidence: boolean;
  needsIp: boolean;
  needsEmail: boolean;
  needsHash: boolean;
  needsHandle: boolean;
  /** Playbook seeds both url + evidence — one Intake URL dump fills both. */
  pickUrlDump: boolean;
  needsEgress: boolean;
  missingCredentials: string[] | undefined;
  showEgressRow: boolean;
  egressLabel: string;
  canRun: boolean;
  blockedReason: string | undefined;
}

function blockedReason({
  selected,
  needsEgress,
  missingCredentials,
  pickUrlDump,
  hasUrlDumps,
  seedOk,
}: {
  selected: boolean;
  needsEgress: boolean;
  missingCredentials: string[] | undefined;
  pickUrlDump: boolean;
  hasUrlDumps: boolean;
  seedOk: boolean;
}): string | undefined {
  if (!selected) return "No playbooks available";
  if (needsEgress) {
    return "Enable Case third-party egress (Cases → edit) before running this playbook";
  }
  if (missingCredentials !== undefined) {
    return missingCredentialReason(missingCredentials, "playbook");
  }
  if (pickUrlDump && !hasUrlDumps) {
    return "Dump a URL under Intake first — this playbook enriches that Evidence row";
  }
  if (seedOk) return undefined;
  return pickUrlDump
    ? "Select a URL dump before Run Playbook"
    : "Fill required seed fields before Run Playbook";
}

/** Seed requirements + run gate for the Jobs playbook run form. */
export function buildPlaybookSeedView(
  input: PlaybookSeedInput
): PlaybookSeedView {
  const {
    playbooks,
    playbookId,
    host,
    url,
    evidenceId,
    ip,
    email,
    hash,
    handle,
    urlDumpCount,
    allowThirdPartyEgress,
    configuredCredentials,
  } = input;

  const selected = playbooks.find((p) => p.id === playbookId) ?? playbooks[0];
  const thirdPartyEgress =
    (selected?.requires.egress ?? "none") === "third_party";
  const needsEgress = thirdPartyEgress && !allowThirdPartyEgress;
  const missingCredentials = missingCredentialNames(
    selected?.requires.credentials,
    configuredCredentials
  );
  const needs = selected?.seedKinds ?? [];
  const needsKind = (kind: PlaybookSeedKind) => needs.includes(kind);
  const needsHost = needsKind("host");
  const needsUrl = needsKind("url");
  const needsEvidence = needsKind("evidence");
  const needsIp = needsKind("ip");
  const needsEmail = needsKind("email");
  const needsHash = needsKind("hash");
  const needsHandle = needsKind("handle");
  const pickUrlDump = needsUrl && needsEvidence;

  const seedOk =
    (!needsHost || Boolean(host.trim())) &&
    (!needsIp || Boolean(ip.trim())) &&
    (!needsEmail || Boolean(email.trim())) &&
    (!needsHash || Boolean(hash.trim())) &&
    (!needsHandle || Boolean(handle.trim())) &&
    (pickUrlDump
      ? Boolean(evidenceId.trim() && url.trim())
      : (!needsUrl || Boolean(url.trim())) &&
        (!needsEvidence || Boolean(evidenceId.trim())));

  return {
    selected,
    needs,
    needsHost,
    needsUrl,
    needsEvidence,
    needsIp,
    needsEmail,
    needsHash,
    needsHandle,
    pickUrlDump,
    needsEgress,
    missingCredentials,
    showEgressRow: thirdPartyEgress,
    egressLabel: needsEgress
      ? "third party — enable on Case"
      : "third party (Case allows)",
    canRun:
      Boolean(selected) &&
      seedOk &&
      !needsEgress &&
      missingCredentials === undefined &&
      !(pickUrlDump && urlDumpCount === 0),
    blockedReason: blockedReason({
      selected: Boolean(selected),
      needsEgress,
      missingCredentials,
      pickUrlDump,
      hasUrlDumps: urlDumpCount > 0,
      seedOk,
    }),
  };
}
