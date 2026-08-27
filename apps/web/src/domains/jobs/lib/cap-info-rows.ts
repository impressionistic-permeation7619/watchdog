import type { CapListItem } from "../types";
import { formatCapCredentials, formatCapIo } from "./cap-run-input";

export interface CapInfoRow {
  label: string;
  value: string;
  mono?: boolean;
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

function pushFlagRows(rows: CapInfoRow[], flags: Set<string>): void {
  if (flags.size === 0) return;
  rows.push({
    label: "Flags",
    value: [...flags].map((flag) => flag.replaceAll("_", " ")).join(", "),
  });
}

function pushUseCaseRow(rows: CapInfoRow[], useCases: readonly string[]): void {
  if (useCases.length === 0) return;
  rows.push({ label: "Intent", value: useCases.join(", ") });
}

/** Cap detail rows for hover card / picker preview panel. */
export function capInfoRows(cap: CapListItem): CapInfoRow[] {
  const rows: CapInfoRow[] = [];
  const flags = new Set(cap.flags);

  pushInfoRow(rows, "Kind", cap.kind ?? "");
  pushInfoRow(rows, "Source", cap.dataSource ?? "");
  pushUseCaseRow(rows, cap.useCases ?? []);
  pushFlagRows(rows, flags);
  if ((cap.egress ?? "none") === "third_party") {
    rows.push({ label: "Egress", value: "third_party" });
  }
  pushInfoRow(rows, "Consumes", formatCapIo(cap.consumes) ?? "");
  pushInfoRow(rows, "Produces", formatCapIo(cap.produces) ?? "");
  pushInfoRow(rows, "Secrets", formatCapCredentials(cap.credentials) ?? "", true);
  return rows;
}
