import { defineCapability, type JobHandoff } from "@watchdog/cap-sdk";
import { analyzeFileBytes } from "@watchdog/tools";

import {
  interpretProcessDraft,
  uploadProcessArtifacts,
} from "../lib/process-shared";
import { fileAnalyzeInput } from "./input";
import { fileAnalyzeToDraft } from "./to-draft";

export const fileAnalyze = defineCapability({
  id: "evidence.file.analyze",
  version: "1",
  title: "Analyze file",
  description:
    "Structure held file Evidence (MIME/magic, light EXIF/PDF strings, sha256) into a findings draft for Inbox.",
  dataSource: "local file bytes",
  input: fileAnalyzeInput,
  timeoutMs: 30_000,
  kind: "process",
  useCases: ["Passive"],
  consumes: [{ kind: "evidence", evidenceKind: "file" }],
  produces: [{ kind: "evidence", evidenceKind: "file" }],
  jobPolicy: {
    needsEvidenceSnapshot: true,
    linkEvidenceFromInput: ["evidenceId"],
    markEvidenceProcessed: true,
  },
  async run(ctx) {
    const snapshot = ctx.evidenceSnapshot;
    if (!snapshot) {
      throw new Error("EvidenceSnapshot missing — packer did not run");
    }
    const uri = snapshot.uri?.trim() ?? "";
    let bytes: Uint8Array;
    if (uri === "") {
      if (snapshot.text.trim() === "") {
        throw new Error(
          "File Evidence has no bytes (missing uri and empty text)"
        );
      }
      bytes = new TextEncoder().encode(snapshot.text);
      ctx.log(`analyzing snapshot text (${bytes.byteLength} bytes)`);
    } else {
      bytes = new Uint8Array(await ctx.readArtifact(uri));
      ctx.log(`read Evidence bytes (${bytes.byteLength})`);
    }
    const snap = analyzeFileBytes(snapshot.evidenceId, bytes);
    const draft = fileAnalyzeToDraft(snap, snapshot.label);
    const reportBody = { ...draft, sha256: snap.sha256 };
    const artifacts = await uploadProcessArtifacts(
      ctx.uploadArtifact,
      snapshot,
      reportBody
    );
    return { artifacts };
  },
  handoff(report): JobHandoff | undefined {
    let bags: JobHandoff | undefined;
    if (
      report !== null &&
      typeof report === "object" &&
      !Array.isArray(report)
    ) {
      const sha256 = (report as { sha256?: unknown }).sha256;
      if (typeof sha256 === "string" && sha256.trim() !== "") {
        bags = { hash: [sha256.trim()] };
      }
    }
    return bags;
  },
  interpret(report, opts) {
    return interpretProcessDraft(report, opts, {
      noEntity:
        "File analyze found signal but no Entity attached — attach Entity and re-run",
      empty: "No analyzable file signal in Evidence",
    });
  },
});
