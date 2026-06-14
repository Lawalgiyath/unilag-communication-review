import { mkdir, writeFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createId } from "@paralleldrive/cuid2";
import { db } from "./db";
import type { FileKind } from "./types";

/**
 * File storage on the local filesystem under UPLOADS_DIR (outside public/).
 * Stored filenames are always {cuid}.{ext} — user filenames never touch the
 * filesystem, so path traversal is impossible.
 */

const EXT_ALLOWLIST: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
};

export const MAX_MANUSCRIPT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PUBLISHED_PDF_BYTES = 5 * 1024 * 1024; // 5 MB (Google Scholar limit)

export function uploadsRoot(): string {
  const dir = process.env.UPLOADS_DIR ?? "./uploads";
  return path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
}

function subdirFor(kind: FileKind): string {
  return kind === "TYPESET_PDF" ? "published" : "manuscripts";
}

export class FileValidationError extends Error {}

/**
 * Validate and persist an uploaded File; returns the StoredFile record.
 */
export async function saveUpload(opts: {
  file: File;
  kind: FileKind;
  uploadedById: string;
  pdfOnly?: boolean;
}): Promise<{ id: string; filename: string }> {
  const { file, kind, uploadedById } = opts;
  const ext = path.extname(file.name).toLowerCase();

  if (!EXT_ALLOWLIST[ext]) {
    throw new FileValidationError(
      "Only PDF and Word (.doc/.docx) files are accepted."
    );
  }
  if (opts.pdfOnly && ext !== ".pdf") {
    throw new FileValidationError("A PDF file is required here.");
  }
  const maxBytes =
    kind === "TYPESET_PDF" ? MAX_PUBLISHED_PDF_BYTES : MAX_MANUSCRIPT_BYTES;
  if (file.size > maxBytes) {
    throw new FileValidationError(
      `File exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit.`
    );
  }
  if (file.size === 0) {
    throw new FileValidationError("The uploaded file is empty.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Magic-byte sniffing
  if (ext === ".pdf" && !buffer.subarray(0, 5).toString("latin1").startsWith("%PDF")) {
    throw new FileValidationError("The file is not a valid PDF.");
  }
  if (ext === ".docx" && !(buffer[0] === 0x50 && buffer[1] === 0x4b)) {
    throw new FileValidationError("The file is not a valid DOCX document.");
  }

  const storedName = `${createId()}${ext}`;
  const dir = path.join(uploadsRoot(), subdirFor(kind));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), buffer);

  const record = await db.storedFile.create({
    data: {
      filename: storedName,
      originalName: file.name.slice(0, 255),
      mimeType: EXT_ALLOWLIST[ext],
      sizeBytes: file.size,
      kind,
      uploadedById,
    },
  });
  return { id: record.id, filename: storedName };
}

/** Absolute path on disk for a stored file. */
export function storedFilePath(kind: FileKind, filename: string): string {
  // filename comes from our DB (cuid + ext) but belt-and-braces:
  const safe = path.basename(filename);
  return path.join(uploadsRoot(), subdirFor(kind), safe);
}

/** Stream a stored file as a web ReadableStream Response body. */
export async function fileResponse(opts: {
  kind: FileKind;
  filename: string;
  mimeType: string;
  downloadName: string;
  inline?: boolean;
  cacheControl?: string;
}): Promise<Response | null> {
  const filePath = storedFilePath(opts.kind, opts.filename);
  try {
    const info = await stat(filePath);
    const nodeStream = createReadStream(filePath);
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: string | Buffer) =>
          controller.enqueue(
            typeof chunk === "string" ? Buffer.from(chunk) : new Uint8Array(chunk)
          )
        );
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });
    const disposition = opts.inline ? "inline" : "attachment";
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": opts.mimeType,
        "Content-Length": String(info.size),
        "Content-Disposition": `${disposition}; filename="${opts.downloadName.replace(/[^\w.\-]/g, "_")}"`,
        "Cache-Control": opts.cacheControl ?? "private, no-store",
      },
    });
  } catch {
    return null;
  }
}
