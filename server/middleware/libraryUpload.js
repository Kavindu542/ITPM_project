const multer = require('multer');

const toPositiveInt = (rawValue, fallback) => {
  const n = Number(rawValue);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

const maxUploadMb = toPositiveInt(process.env.LIBRARY_UPLOAD_MAX_MB, 4);

const fileFilter = (_req, file, cb) => {
  const ok =
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf';
  cb(ok ? null : new Error('Only images and PDFs are allowed'), ok);
};

module.exports = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: maxUploadMb * 1024 * 1024,
    files: 2,
  },
});