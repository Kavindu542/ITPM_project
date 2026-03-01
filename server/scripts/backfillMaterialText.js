const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const pdfParseLib = require("pdf-parse");
const mammoth = require("mammoth");

const { connectDB } = require("../config/db");
const StudyMaterial = require("../models/StudyMaterial");

dotenv.config();

const EXTRACT_MAX_BYTES = 25 * 1024 * 1024; // 25MB
const EXTRACT_MAX_CHARS = 140_000;

const normalizeExtractedText = (value) =>
  String(value || "")
    .replace(/\u0000/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTextFromVersion = async ({ filePath, originalName, mimeType }) => {
  try {
    if (!filePath) return "";
    const abs = path.isAbsolute(filePath)
      ? filePath
      : path.join(__dirname, "..", filePath);
    if (!fs.existsSync(abs)) return "";

    const stat = fs.statSync(abs);
    if (!stat?.size || stat.size <= 0) return "";
    if (stat.size > EXTRACT_MAX_BYTES) return "";

    const mt = String(mimeType || "").toLowerCase();
    const ext = path.extname(String(originalName || "")).toLowerCase();

    if (mt === "application/pdf" || ext === ".pdf") {
      if (typeof pdfParseLib?.PDFParse === "function") {
        const parser = new pdfParseLib.PDFParse({ url: abs });
        await parser.load();
        const out = await parser.getText();
        await parser.destroy();
        const text = normalizeExtractedText(out?.text || "");
        return text.slice(0, EXTRACT_MAX_CHARS);
      }

      const pdfParse =
        typeof pdfParseLib === "function" ? pdfParseLib : pdfParseLib?.default;
      if (typeof pdfParse !== "function") return "";
      const buf = fs.readFileSync(abs);
      const parsed = await pdfParse(buf);
      const text = normalizeExtractedText(parsed?.text || "");
      return text.slice(0, EXTRACT_MAX_CHARS);
    }

    if (
      mt ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === ".docx"
    ) {
      const buf = fs.readFileSync(abs);
      const parsed = await mammoth.extractRawText({ buffer: buf });
      const text = normalizeExtractedText(parsed?.value || "");
      return text.slice(0, EXTRACT_MAX_CHARS);
    }

    if (mt.startsWith("text/") || ext === ".txt" || ext === ".md") {
      const buf = fs.readFileSync(abs);
      const text = normalizeExtractedText(buf.toString("utf8"));
      return text.slice(0, EXTRACT_MAX_CHARS);
    }

    return "";
  } catch {
    return "";
  }
};

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    // eslint-disable-next-line no-console
    console.error("MONGODB_URI is missing");
    process.exit(1);
  }

  await connectDB(mongoUri);

  const q = {
    status: { $ne: "archived" },
  };

  const cursor = StudyMaterial.find(q)
    .select(
      "_id extractedFromVersionId extractedText currentVersionId versions",
    )
    .cursor();

  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for await (const material of cursor) {
    scanned += 1;

    const versions = Array.isArray(material.versions) ? material.versions : [];
    const current =
      versions.find(
        (v) => String(v._id) === String(material.currentVersionId),
      ) || versions[0];

    if (!current) {
      skipped += 1;
      continue;
    }

    const alreadyUpToDate =
      material.extractedText &&
      String(material.extractedFromVersionId || "") ===
        String(material.currentVersionId || "");

    if (alreadyUpToDate) {
      skipped += 1;
      continue;
    }

    const text = await extractTextFromVersion({
      filePath: current.filePath,
      originalName: current.originalName,
      mimeType: current.mimeType,
    });

    // Save even if empty? No — avoid wiping any existing content.
    if (!text) {
      skipped += 1;
      continue;
    }

    material.extractedText = text;
    material.extractedAt = new Date();
    material.extractedFromVersionId = material.currentVersionId;
    await material.save();
    updated += 1;

    if (updated % 20 === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `Progress: scanned=${scanned} updated=${updated} skipped=${skipped}`,
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Done: scanned=${scanned} updated=${updated} skipped=${skipped}`);
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
