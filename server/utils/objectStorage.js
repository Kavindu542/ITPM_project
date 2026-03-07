const crypto = require("crypto");
const path = require("path");
const { put, del } = require("@vercel/blob");

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const sanitizeFileName = (name) =>
  String(name || "file")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "file";

const normalizeFolder = (folder) =>
  String(folder || "uploads")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "") || "uploads";

const buildObjectPath = ({ folder, originalName }) => {
  const ext = path.extname(String(originalName || "")).toLowerCase();
  const base = sanitizeFileName(path.basename(String(originalName || "file"), ext));
  const safeExt = ext.replace(/[^a-z0-9.]/gi, "");
  const objectFolder = normalizeFolder(folder);
  return `${objectFolder}/${Date.now()}-${crypto.randomUUID()}-${base}${safeExt}`;
};

const getBlobToken = () => {
  const token = String(process.env.BLOB_READ_WRITE_TOKEN || "").trim();
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is missing. Configure Vercel Blob before uploading files.",
    );
  }
  return token;
};

const uploadBufferToObjectStorage = async ({
  buffer,
  originalName,
  mimeType,
  folder,
}) => {
  if (!buffer) throw new Error("upload buffer is required");

  const body = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const objectPath = buildObjectPath({ folder, originalName });

  const blob = await put(objectPath, body, {
    access: "public",
    token: getBlobToken(),
    addRandomSuffix: false,
    contentType: String(mimeType || "application/octet-stream"),
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
  };
};

const deleteObjectFromStorage = async (fileRef) => {
  const target = String(fileRef || "").trim();
  if (!target || !isHttpUrl(target)) return false;

  await del(target, { token: getBlobToken() });
  return true;
};

module.exports = {
  isHttpUrl,
  uploadBufferToObjectStorage,
  deleteObjectFromStorage,
};
