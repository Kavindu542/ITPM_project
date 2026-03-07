const Book = require('../models/Book');
const {
  uploadBufferToObjectStorage,
  deleteObjectFromStorage,
} = require('../utils/objectStorage');

const normalizePath = (p) => (p ? p.replace(/\\/g, '/') : p);

const uploadLibraryAsset = async (file, folder) => {
  if (!file) return '';

  const uploaded = await uploadBufferToObjectStorage({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    folder,
  });

  return normalizePath(uploaded.url);
};

const cleanupOldAsset = async (oldRef, newRef) => {
  const oldValue = String(oldRef || '').trim();
  const newValue = String(newRef || '').trim();
  if (!oldValue || !newValue || oldValue === newValue) return;
  await deleteObjectFromStorage(oldValue).catch(() => {});
};

exports.getAllBooks = async (req, res) => {
  try {
    const { search = '', category, status } = req.query;
    const q = {};

    if (search) {
      q.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') q.category = category;
    if (status && status !== 'All') q.status = status;

    const books = await Book.find(q).sort({ createdAt: -1 });
    res.json({ success: true, data: books });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.files?.coverImage?.[0]) {
      payload.coverImage = await uploadLibraryAsset(
        req.files.coverImage[0],
        'library/cover-images',
      );
    }
    if (req.files?.file?.[0]) {
      payload.pdfUrl = await uploadLibraryAsset(
        req.files.file[0],
        'library/book-pdfs',
      );
    }

    const book = await Book.create(payload);
    res.status(201).json({ success: true, data: book });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const existing = await Book.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const payload = { ...req.body };
    const oldCoverImage = existing.coverImage;
    const oldPdfUrl = existing.pdfUrl;

    if (req.files?.coverImage?.[0]) {
      payload.coverImage = await uploadLibraryAsset(
        req.files.coverImage[0],
        'library/cover-images',
      );
    }
    if (req.files?.file?.[0]) {
      payload.pdfUrl = await uploadLibraryAsset(
        req.files.file[0],
        'library/book-pdfs',
      );
    }

    Object.assign(existing, payload);
    await existing.save();

    if (payload.coverImage) {
      await cleanupOldAsset(oldCoverImage, payload.coverImage);
    }
    if (payload.pdfUrl) {
      await cleanupOldAsset(oldPdfUrl, payload.pdfUrl);
    }

    res.json({ success: true, data: existing });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    await Promise.all([
      deleteObjectFromStorage(book.coverImage).catch(() => {}),
      deleteObjectFromStorage(book.pdfUrl).catch(() => {}),
    ]);

    res.json({ success: true, message: 'Book deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getLibraryStats = async (_req, res) => {
  try {
    const [totalBooks, activeBooks, totalCopiesAgg, availableAgg, withPdf] = await Promise.all([
      Book.countDocuments(),
      Book.countDocuments({ status: 'Active' }),
      Book.aggregate([{ $group: { _id: null, n: { $sum: '$copies' } } }]),
      Book.aggregate([{ $group: { _id: null, n: { $sum: '$available' } } }]),
      Book.countDocuments({ pdfUrl: { $exists: true, $ne: null, $ne: '' } }),
    ]);

    res.json({
      success: true,
      data: {
        totalBooks,
        activeBooks,
        totalCopies: totalCopiesAgg[0]?.n || 0,
        availableCopies: availableAgg[0]?.n || 0,
        withPdf,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};