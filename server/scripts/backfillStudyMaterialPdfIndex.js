const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const StudyMaterial = require("../models/StudyMaterial");

const MAX_PDF_EXTRACT_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_EXTRACTED_TEXT_CHARS = 20000;

const parsePdfTextFromBuffer = async (buf) => {
  const data = await pdfParse(buf, { max: 5 });
  return String(data.text || "");
};

const extractModuleCodesFromText = (text) => {
  const upper = String(text || "").toUpperCase();
  const out = new Set();

  const contiguous = upper.match(/\b[A-Z]{2,4}\d{3,4}\b/g) || [];
  for (const m of contiguous) out.add(String(m).trim());

  const spaced4 = upper.match(/\b[A-Z]{2,4}(?:\s*\d){4}\b/g) || [];
  for (const raw of spaced4) {
    const normalized = raw.replace(/\s+/g, "").trim();
    if (/^[A-Z]{2,4}\d{4}$/.test(normalized)) out.add(normalized);
  }
  const spaced3 = upper.match(/\b[A-Z]{2,4}(?:\s*\d){3}\b/g) || [];
  for (const raw of spaced3) {
    const normalized = raw.replace(/\s+/g, "").trim();
    if (/^[A-Z]{2,4}\d{3}$/.test(normalized)) out.add(normalized);
  }

  return Array.from(out).filter(Boolean);
};

const tryExtractPdfText = async (absolutePath, sizeBytes) => {
  try {
    const ext = String(path.extname(absolutePath) || "").toLowerCase();
    if (ext !== ".pdf") return { text: "", moduleCodes: [] };

    const knownSize = Number.isFinite(sizeBytes) ? sizeBytes : null;
    if (knownSize !== null && knownSize > MAX_PDF_EXTRACT_BYTES) {
      return { text: "", moduleCodes: [] };
    }

    const buf = await fs.promises.readFile(absolutePath);
    if (buf.length > MAX_PDF_EXTRACT_BYTES)
      return { text: "", moduleCodes: [] };

    const rawText = await parsePdfTextFromBuffer(buf);
    const text = String(rawText || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_EXTRACTED_TEXT_CHARS);

    return { text, moduleCodes: extractModuleCodesFromText(text) };
  } catch {
    return { text: "", moduleCodes: [] };
  }
};

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(2);
  }

  await mongoose.connect(uri);

  const cursor = StudyMaterial.find({ status: "published" })
    .select(
      "_id title moduleCode extractedModuleCodes extractedText versions currentVersionId",
    )
    .cursor();

  let scanned = 0;
  let updated = 0;

  for await (const m of cursor) {
    scanned += 1;

    const hasCodes =
      Array.isArray(m.extractedModuleCodes) &&
      m.extractedModuleCodes.length > 0;
    const hasText = Boolean(String(m.extractedText || "").trim());
    if (hasCodes && hasText) continue;

    const current = (m.versions || []).find(
      (v) => String(v._id) === String(m.currentVersionId),
    );
    if (!current?.filePath) continue;

    const abs = path.join(__dirname, "..", String(current.filePath));
    const { text, moduleCodes } = await tryExtractPdfText(
      abs,
      current.sizeBytes,
    );
    if (!text && (!moduleCodes || moduleCodes.length === 0)) continue;

    const existingCodes = Array.isArray(m.extractedModuleCodes)
      ? m.extractedModuleCodes
          .map((c) => String(c).trim().toUpperCase())
          .filter(Boolean)
      : [];
    const mergedCodes = Array.from(
      new Set([...existingCodes, ...(moduleCodes || [])]),
    );

    const patch = {
      extractedModuleCodes: mergedCodes,
    };

    if (text) {
      const currentText = String(m.extractedText || "").trim();
      patch.extractedText = (currentText ? `${currentText}\n` : "")
        .concat(text)
        .slice(0, MAX_EXTRACTED_TEXT_CHARS);
    }

    await StudyMaterial.updateOne({ _id: m._id }, { $set: patch });
    updated += 1;
  }

  await mongoose.disconnect();
  console.log(JSON.stringify({ scanned, updated }));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
