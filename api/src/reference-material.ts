import path from "node:path";
import { PDFParse } from "pdf-parse";
import type { ReferenceMaterial } from "./types.js";

const MAX_REFERENCE_FILES = 5;
const MAX_REFERENCE_FILE_BYTES = 5 * 1024 * 1024;
const MAX_REFERENCE_CHARS = 12_000;

const TEXT_FILE_EXTENSIONS = new Set([".txt", ".md", ".mdx", ".markdown"]);
const PDF_FILE_EXTENSIONS = new Set([".pdf"]);

type SupportedReferenceKind = "text" | "pdf";

function getSupportedReferenceKind(file: Express.Multer.File): SupportedReferenceKind | null {
  const extension = path.extname(file.originalname).toLowerCase();
  if (TEXT_FILE_EXTENSIONS.has(extension)) {
    return "text";
  }
  if (PDF_FILE_EXTENSIONS.has(extension)) {
    return "pdf";
  }
  if (file.mimetype === "text/plain" || file.mimetype === "text/markdown") {
    return "text";
  }
  if (file.mimetype === "application/pdf") {
    return "pdf";
  }
  return null;
}

function normalizeExtractedText(text: string) {
  return text.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildTrimmedText(text: string) {
  const normalized = normalizeExtractedText(text);
  if (normalized.length <= MAX_REFERENCE_CHARS) {
    return { extractedText: normalized, truncated: false };
  }

  const trimmed = normalized.slice(0, MAX_REFERENCE_CHARS).trimEnd();
  return {
    extractedText: `${trimmed}\n\n[Truncated to fit the reference context limit.]`,
    truncated: true,
  };
}

async function extractTextFromFile(file: Express.Multer.File, kind: SupportedReferenceKind) {
  if (kind === "text") {
    return file.buffer.toString("utf8");
  }

  const parser = new PDFParse({ data: file.buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export function getReferenceUploadLimits() {
  return {
    maxFiles: MAX_REFERENCE_FILES,
    maxFileBytes: MAX_REFERENCE_FILE_BYTES,
  };
}

export async function extractReferenceMaterials(files: Express.Multer.File[]) {
  if (files.length > MAX_REFERENCE_FILES) {
    throw new Error(`You can attach up to ${MAX_REFERENCE_FILES} files per request.`);
  }

  const references: ReferenceMaterial[] = [];
  for (const [index, file] of files.entries()) {
    if (file.size > MAX_REFERENCE_FILE_BYTES) {
      throw new Error(`"${file.originalname}" exceeds the 5 MB per-file limit.`);
    }

    const kind = getSupportedReferenceKind(file);
    if (!kind) {
      throw new Error(`"${file.originalname}" is not supported. Use TXT, MD, MDX, MARKDOWN, or PDF files.`);
    }

    const extracted = await extractTextFromFile(file, kind);
    const { extractedText, truncated } = buildTrimmedText(extracted);
    if (!extractedText) {
      throw new Error(`"${file.originalname}" did not contain readable text.`);
    }

    references.push({
      id: `${file.originalname}-${file.size}-${index}`,
      kind: "file",
      name: file.originalname,
      mimeType: file.mimetype || undefined,
      extractedText,
      charCount: extractedText.length,
      truncated,
    });
  }

  return references;
}
