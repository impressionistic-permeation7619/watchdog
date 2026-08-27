import type { CapListItem } from "../types";
import {
  capPrimaryField,
  formatCapCredentials,
  formatCapIo,
  type CapPrimaryField,
} from "./cap-run-input";
import {
  missingCredentialNames,
  missingCredentialReason,
} from "./credential-gate";

export interface CapRunInput {
  caps: readonly CapListItem[];
  capabilityId: string;
  runInput: string;
  entityId: string;
  allowThirdPartyEgress: boolean;
  configuredCredentials: ReadonlySet<string>;
}

export interface CapInfoRow {
  label: string;
  value: string;
  mono?: boolean;
}

export interface CapRunView {
  selected: CapListItem | undefined;
  primaryField: CapPrimaryField;
  needsEgress: boolean;
  missingCredentials: string[] | undefined;
  canRun: boolean;
  blockedReason: string | undefined;
  showEvidenceOnlyHint: boolean;
}

function blockedReason({
  selected,
  needsEgress,
  missingCredentials,
  hasInput,
  hasCaps,
}: {
  selected: boolean;
  needsEgress: boolean;
  missingCredentials: string[] | undefined;
  hasInput: boolean;
  hasCaps: boolean;
}): string | undefined {
  if (!selected) {
    return hasCaps ? "Select a Cap" : "No Caps match the current filters";
  }
  if (needsEgress) {
    return "Enable Case third-party egress (Cases → edit) before running this Cap";
  }
  if (missingCredentials !== undefined) {
    return missingCredentialReason(missingCredentials, "Cap");
  }
  return hasInput ? undefined : "Enter Cap input before Run";
}

function pushInfoRow(
  rows: CapInfoRow[],
  label: string,
  value: string,
  mono = false
): void {
  if (value === "") return;
  rows.push({ label, value, mono });
}

/** Cap detail rows for hover card / picker preview panel. */
export function capInfoRows(cap: CapListItem): CapInfoRow[] {
  const rows: CapInfoRow[] = [];
  const flags = new Set(cap.flags);

  pushInfoRow(rows, "Kind", cap.kind ?? "");
  pushInfoRow(rows, "Source", cap.dataSource ?? "");
  const useCases = cap.useCases ?? [];
  if (useCases.length > 0) {
    rows.push({ label: "Intent", value: useCases.join(", ") });
  }
  if (flags.size > 0) {
    rows.push({
      label: "Flags",
      value: [...flags].map((f) => f.replaceAll("_", " ")).join(", "),
    });
  }
  if ((cap.egress ?? "none") === "third_party") {
    rows.push({ label: "Egress", value: "third_party" });
  }
  pushInfoRow(rows, "Consumes", formatCapIo(cap.consumes) ?? "");
  pushInfoRow(rows, "Produces", formatCapIo(cap.produces) ?? "");
  pushInfoRow(rows, "Secrets", formatCapCredentials(cap.credentials) ?? "", true);
  return rows;
}

/** Selected Cap metadata + run gate for the Jobs Cap run form. */
export function buildCapRunView(input: CapRunInput): CapRunView {
  const {
    caps,
    capabilityId,
    runInput,
    entityId,
    allowThirdPartyEgress,
    configuredCredentials,
  } = input;

  const selected = caps.find((c) => c.id === capabilityId);
  const needsEgress =
    (selected?.egress ?? "none") === "third_party" && !allowThirdPartyEgress;
  const missingCredentials = missingCredentialNames(
    selected?.credentials,
    configuredCredentials
  );

  return {
    selected,
    primaryField: capPrimaryField(selected?.inputForm),
    needsEgress,
    missingCredentials,
    canRun:
      Boolean(selected) &&
      Boolean(runInput.trim()) &&
      !needsEgress &&
      missingCredentials === undefined,
    blockedReason: blockedReason({
      selected: Boolean(selected),
      needsEgress,
      missingCredentials,
      hasInput: Boolean(runInput.trim()),
      hasCaps: caps.length > 0,
    }),
    showEvidenceOnlyHint: entityId === "",
  };
}
