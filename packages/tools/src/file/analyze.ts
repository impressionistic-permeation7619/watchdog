import { createHash } from "node:crypto";

import { z } from "zod";

export const fileAnalyzeSnapshotSchema = z.object({
  evidenceId: z.uuid(),
  queriedAt: z.string().min(1),
  byteLength: z.number().int().nonnegative(),
  sha256: z.string(),
  magic: z.string().nullable(),
  mimeGuess: z.string().nullable(),
  exifHints: z.array(z.string()),
  pdfHints: z.array(z.string()),
  textPreview: z.string().nullable(),
});

export type FileAnalyzeSnapshot = z.infer<typeof fileAnalyzeSnapshotSchema>;

function detectMagic(
  bytes: Uint8Array
): { magic: string; mime: string } | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { magic: "JPEG", mime: "image/jpeg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { magic: "PNG", mime: "image/png" };
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return { magic: "PDF", mime: "application/pdf" };
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  ) {
    return { magic: "ZIP", mime: "application/zip" };
  }
  return null;
}

/** Lightweight EXIF/PDF string harvesting — no native deps. */
export function analyzeFileBytes(
  evidenceId: string,
  bytes: Uint8Array
): FileAnalyzeSnapshot {
  const magic = detectMagic(bytes);
  const asLatin = new TextDecoder("latin1").decode(
    bytes.slice(0, Math.min(bytes.length, 256_000))
  );
  const exifHints: string[] = [];
  for (const key of [
    "Make",
    "Model",
    "DateTimeOriginal",
    "GPSLatitude",
    "Software",
    "Artist",
    "Copyright",
  ]) {
    if (asLatin.includes(key)) exifHints.push(key);
  }

  const pdfHints: string[] = [];
  if (magic?.magic === "PDF" || asLatin.startsWith("%PDF")) {
    for (const key of [
      "/Author",
      "/Creator",
      "/Producer",
      "/Title",
      "/ModDate",
      "/CreationDate",
    ]) {
      const idx = asLatin.indexOf(key);
      if (idx !== -1) {
        const slice = asLatin
          .slice(idx, idx + 80)
          .replaceAll(/[^\u0020-\u007E]/g, " ");
        pdfHints.push(slice.trim());
      }
    }
  }

  let textPreview: string | null = null;
  if (!magic || magic.mime.startsWith("text/") || magic.magic === "PDF") {
    const utf = new TextDecoder().decode(bytes.slice(0, 4000));
    if (/^[\t\n\r\u0020-\u007E\u00A0-\uFFFF]*$/u.test(utf.slice(0, 200))) {
      textPreview = utf.slice(0, 2000);
    }
  }

  return fileAnalyzeSnapshotSchema.parse({
    evidenceId,
    queriedAt: new Date().toISOString(),
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    magic: magic?.magic ?? null,
    mimeGuess: magic?.mime ?? null,
    exifHints,
    pdfHints,
    textPreview,
  });
}
