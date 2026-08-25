/**
 * GET /api/v1/cases/:caseId/export.zip
 *
 * Downloads a zip of all entity markdown files + evidence for the Case.
 * Auth: session cookie or API key.
 */
import { createFileRoute } from "@tanstack/react-router";
import { zipSync, strToU8 } from "fflate";

import { createApiContext } from "@/auth/api-context.server";
import {
  getCaseById,
  readArtifactBytes,
  renderCaseExport,
} from "@watchdog/core";

function safeFilename(label: string): string {
  return (
    label
      // oxlint-disable-next-line eslint/no-control-regex -- intentionally strips filesystem-illegal control chars
      .replaceAll(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
      .replaceAll(/\s+/g, "-")
      .slice(0, 80)
  );
}

function evidenceExt(mime: string | null, label: string | null): string {
  if (label) {
    const e = /\.[a-z0-9]+$/i.exec(label)?.[0];
    if (e) return e;
  }
  const map: Record<string, string> = {
    "application/json": ".json",
    "text/plain": ".txt",
    "text/html": ".html",
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
  };
  return map[mime?.split(";")[0]?.trim() ?? ""] ?? ".bin";
}

export const Route = createFileRoute("/api/v1/cases/$caseId/export.zip")({
  server: {
    handlers: {
      GET: async ({
        request,
        params,
      }: {
        request: Request;
        params: { caseId: string };
      }) => {
        const ctx = await createApiContext(request);
        if (!ctx.actor) return new Response("Unauthorized", { status: 401 });

        const { caseId } = params;

        const activeCase = await getCaseById(caseId);
        if (!activeCase) return new Response("Not Found", { status: 404 });
        const caseSlug = activeCase.slug;

        const { files: mdFiles, evidenceRows } = await renderCaseExport(caseId);

        if (mdFiles.size === 0)
          return new Response("No entities to export", { status: 404 });

        const zipInput: Record<string, Uint8Array> = {};
        let evidenceIncluded = 0;
        let evidenceSkipped = 0;

        // Markdown files
        for (const [path, content] of mdFiles) {
          zipInput[`${caseSlug}/${path}`] = strToU8(content);
        }

        // Evidence files — independent blob reads, fetched concurrently.
        await Promise.all(
          evidenceRows.map(async (ev) => {
            const prefix = ev.id.slice(0, 8);
            const labelBase = safeFilename(
              ev.label ?? ev.sourceUrl ?? ev.id.slice(0, 8)
            );

            if (ev.uri) {
              try {
                const bytes = await readArtifactBytes(ev.uri);
                const ext = evidenceExt(ev.mime, ev.label);
                zipInput[`${caseSlug}/evidence/${prefix}--${labelBase}${ext}`] =
                  bytes;
                evidenceIncluded += 1;
              } catch {
                evidenceSkipped += 1;
              }
            } else if (ev.text && ev.kind !== "attestation") {
              zipInput[`${caseSlug}/evidence/${prefix}--${labelBase}.txt`] =
                strToU8(ev.text);
              evidenceIncluded += 1;
            }
            // attestations handled in evidence/attestations.md
          })
        );

        ctx.log?.set({
          case: { caseId },
          export: {
            kind: "zip",
            markdownFiles: mdFiles.size,
            evidenceIncluded,
            evidenceSkipped,
          },
        });

        const zipped = zipSync(zipInput, { level: 6 });
        const ts = new Date()
          .toISOString()
          .slice(0, 16)
          .replaceAll(/[-T:]/g, "");
        const filename = `${caseSlug}-${ts}.zip`;

        return new Response(zipped, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
