const Book = require('../models/Book');

const normalizePath = (p) => (p ? p.replace(/\\/g, '/') : p);

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
      payload.coverImage = normalizePath(`uploads/library/${req.files.coverImage[0].filename}`);
    }
    if (req.files?.file?.[0]) {
      payload.pdfUrl = normalizePath(`uploads/library/${req.files.file[0].filename}`);
    }

    const book = await Book.create(payload);
    res.status(201).json({ success: true, data: book });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (req.files?.coverImage?.[0]) {
      payload.coverImage = normalizePath(`uploads/library/${req.files.coverImage[0].filename}`);
    }
    if (req.files?.file?.[0]) {
      payload.pdfUrl = normalizePath(`uploads/library/${req.files.file[0].filename}`);
    }

    const book = await Book.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: book });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
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