const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'library');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ok =
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf';
  cb(ok ? null : new Error('Only images and PDFs are allowed'), ok);
};

module.exports = multer({ storage, fileFilter });