import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Star,
  Tag,
  User,
  Hash,
  AlertCircle,
  Upload,
  FileText,
  Image,
  Eye,
  Download,
  Paperclip,
} from 'lucide-react';
import { bookService } from '../../../services/libraryService';
import { toast } from '../../../lib/toast';

const INITIAL_BOOKS = [
  { id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Programming', copies: 5, available: 3, rating: 4.9, status: 'Active', coverImage: null, pdfFile: null },
  { id: 2, title: 'System Design Interview', author: 'Alex Xu', isbn: '979-8664653403', category: 'Engineering', copies: 3, available: 1, rating: 4.8, status: 'Active', coverImage: null, pdfFile: null },
  { id: 3, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Computer Science', copies: 4, available: 4, rating: 4.7, status: 'Active', coverImage: null, pdfFile: null },
  { id: 4, title: 'React in Action', author: 'Mark Tielens Thomas', isbn: '978-1617294655', category: 'Programming', copies: 2, available: 0, rating: 4.5, status: 'Active', coverImage: null, pdfFile: null },
  { id: 5, title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '978-0135957059', category: 'Programming', copies: 3, available: 2, rating: 4.8, status: 'Active', coverImage: null, pdfFile: null },
  { id: 6, title: 'Design Patterns', author: 'Gang of Four', isbn: '978-0201633610', category: 'Engineering', copies: 2, available: 2, rating: 4.6, status: 'Inactive', coverImage: null, pdfFile: null },
  { id: 7, title: 'The Art of War', author: 'Sun Tzu', isbn: '978-1599869773', category: 'Philosophy', copies: 6, available: 5, rating: 4.4, status: 'Active', coverImage: null, pdfFile: null },
  { id: 8, title: 'Atomic Habits', author: 'James Clear', isbn: '978-0735211292', category: 'Self Help', copies: 8, available: 6, rating: 4.9, status: 'Active', coverImage: null, pdfFile: null },
];

const CATEGORIES = ['All', 'Strategy', 'Architecture', 'Science', 'Law', 'Business', 'Philosophy', 'Cybersecurity', 'Education', 'Technology', 'Marketing', 'Environment', 'Other'];

const EMPTY_FORM = {
  title: '', author: '', isbn: '', category: 'Technology',
  description: '', pages: 1, publishedYear: '',
  copies: 1, available: 1, rating: 0, status: 'Active',
  coverImage: null, coverPreview: null,
  pdfFile: null, pdfName: null,
};

const toAssetUrl = (p) => {
  if (!p) return '';
  if (String(p).startsWith('http')) return p;
  return `http://localhost:5000/${String(p).replace(/^\/+/, '')}`;
};

// ── Helpers ────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
      }`}>{status}</span>
  );
}

// ── Avail Badge ────────────────────────────────────────────
function AvailBadge({ available, copies }) {
  const color = available === 0 ? 'bg-red-100 text-red-600'
    : available < copies / 2 ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {available}/{copies}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── Cover Upload ───────────────────────────────────────────
function CoverUpload({ form, setForm }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm(f => ({ ...f, coverImage: file, coverPreview: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
        Book Cover Image
      </label>

      {form.coverPreview ? (
        /* Preview */
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={form.coverPreview}
            alt="Cover preview"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              className="p-2 bg-white rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              title="Change image"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, coverImage: null, coverPreview: null }))}
              className="p-2 bg-white rounded-xl text-red-500 hover:bg-red-50 transition-colors"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg font-medium">
            {form.coverImage?.name} · {formatBytes(form.coverImage?.size)}
          </div>
        </div>
      ) : (
        /* Drop Zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          className={`flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all ${drag
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
        >
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Image className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              Drop image here or <span className="text-indigo-600">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · Max 5MB</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

// ── PDF Upload ─────────────────────────────────────────────
function PdfUpload({ form, setForm }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('PDF must be under 50MB');
      return;
    }
    setForm(f => ({ ...f, pdfFile: file, pdfName: file.name }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
        PDF / E-Book File
      </label>

      {form.pdfFile ? (
        /* File attached */
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="p-2.5 bg-blue-500 rounded-xl flex-shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{form.pdfName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatBytes(form.pdfFile?.size)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              className="p-2 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
              title="Replace PDF"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, pdfFile: null, pdfName: null }))}
              className="p-2 rounded-xl bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              title="Remove PDF"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Drop Zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          className={`flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all ${drag
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
        >
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <FileText className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">
              Drop PDF here or <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">PDF only · Max 50MB</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

// ── Book Form ──────────────────────────────────────────────
function BookForm({ form, setForm, onSave, onCancel, isEdit }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.isbn.trim()) e.isbn = 'ISBN is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.publishedYear.trim()) e.publishedYear = 'Published year is required';
    if (form.pages < 1) e.pages = 'Pages must be at least 1';
    if (form.copies < 1) e.copies = 'Must be at least 1';
    if (form.available > form.copies) e.available = 'Cannot exceed total copies';
    if (!isEdit && !form.coverImage && !form.pdfFile) e.files = 'Attach at least a cover or PDF';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave();
  };

  const field = (label, key, type = 'text', icon) => (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          className={`w-full ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors[key]
            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200'
            : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
            }`}
          min={type === 'number' ? 0 : undefined}
        />
      </div>
      {errors[key] && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-4">
          {field('Book Title', 'title', 'text', <BookOpen className="h-4 w-4" />)}
          {field('Author', 'author', 'text', <User className="h-4 w-4" />)}
          {field('ISBN', 'isbn', 'text', <Hash className="h-4 w-4" />)}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white appearance-none"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Total Copies', 'copies', 'number')}
            {field('Available', 'available', 'number')}
          </div>

          {field('Pages', 'pages', 'number')}
          {field('Published Year', 'publishedYear', 'text')}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Status</label>
            <div className="flex gap-3">
              {['Active', 'Inactive'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.status === s
                    ? s === 'Active'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-gray-500 text-white border-gray-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column — File Uploads */}
        <div className="space-y-4">
          {/* Cover Image */}
          <CoverUpload form={form} setForm={setForm} />

          {/* PDF Upload */}
          <PdfUpload form={form} setForm={setForm} />

          {/* Attachment Summary */}
          {(form.coverImage || form.pdfFile) && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Attached Files
              </p>
              <div className="space-y-1.5">
                {form.coverImage && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Image className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="truncate font-medium">{form.coverImage.name}</span>
                    <span className="ml-auto text-gray-400 flex-shrink-0">{formatBytes(form.coverImage.size)}</span>
                  </div>
                )}
                {form.pdfFile && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate font-medium">{form.pdfFile.name}</span>
                    <span className="ml-auto text-gray-400 flex-shrink-0">{formatBytes(form.pdfFile.size)}</span>
                  </div>
                )}
              </div>
              {errors.files && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.files}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {isEdit ? 'Update Book' : 'Add Book'}
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────
export default function BookManagement() {
  const [books, setBooks] = useState([]);
  const [usingDummy, setUsingDummy] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const [previewBook, setPreviewBook] = useState(null);
  const PER_PAGE = 6;

  const loadBooks = async () => {
    try {
      const res = await bookService.getAll();
      const raw = res?.data?.data || res?.data || [];
      const mapped = raw.map((b) => ({
        id: b._id || b.id,
        title: b.title || '',
        author: b.author || '',
        isbn: b.isbn || '',
        category: b.category || 'Other',
        copies: Number(b.physicalCopies || 0),
        available: b.availability === 'Available' ? Number(b.physicalCopies || 0) : 0,
        rating: Number(b.rating || 0),
        status: 'Active',
        coverPreview: toAssetUrl(b.coverImage),
        pdfUrl: toAssetUrl(b.pdfUrl),
        pages: Number(b.pages || 0),
        publishedYear: b.publishedYear || '',
        size: b.size || '',
      }));
      setBooks(mapped);
      setUsingDummy(false);
    } catch {
      setBooks(INITIAL_BOOKS);
      setUsingDummy(true);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const filtered = books.filter(b => {
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.includes(search);
    const matchCat = category === 'All' || b.category === category;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => {
    setEditBook(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (book) => {
    setEditBook(book);
    setForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      category: book.category || 'Other',
      description: '',
      pages: book.pages || 1,
      publishedYear: book.publishedYear || '',
      copies: book.copies || 1,
      available: book.available || 0,
      rating: book.rating || 0,
      status: 'Active',
      coverImage: null,
      coverPreview: book.coverPreview || null,
      pdfFile: null,
      pdfName: null,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const buildFormData = () => {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('author', form.author);
      fd.append('isbn', form.isbn);
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('pages', String(form.pages));
      fd.append('publishedYear', form.publishedYear);
      fd.append('rating', String(form.rating || 0));
      fd.append('size', form.pdfFile ? formatBytes(form.pdfFile.size) : form.size || '');
      fd.append('physicalCopies', String(form.copies));
      fd.append('availability', form.available > 0 ? 'Available' : 'Issued');
      if (form.coverImage) fd.append('coverImage', form.coverImage);
      if (form.pdfFile) fd.append('file', form.pdfFile);
      return fd;
    };
    if (usingDummy) {
      if (editBook?.id) {
        setBooks(bs => bs.map(b => b.id === editBook.id ? {
          ...b,
          title: form.title,
          author: form.author,
          isbn: form.isbn,
          category: form.category,
          pages: form.pages,
          publishedYear: form.publishedYear,
          copies: form.copies,
          available: form.available,
          rating: form.rating,
          status: form.status,
          coverPreview: form.coverPreview || b.coverPreview,
          pdfUrl: b.pdfUrl,
          size: form.size || b.size,
        } : b));
        toast.success('Book updated! (demo mode)');
      } else {
        const newItem = {
          id: Date.now(),
          title: form.title,
          author: form.author,
          isbn: form.isbn,
          category: form.category,
          pages: form.pages,
          publishedYear: form.publishedYear,
          copies: form.copies,
          available: form.available,
          rating: form.rating,
          status: form.status,
          coverPreview: form.coverPreview,
          pdfUrl: '',
          size: form.size || '',
        };
        setBooks(bs => [newItem, ...bs]);
        toast.success('Book added! (demo mode)');
      }
      setShowModal(false);
      return;
    }
    try {
      if (editBook?.id) {
        const fd = buildFormData();
        await bookService.update(editBook.id, fd);
        toast.success('Book updated successfully!');
      } else {
        const fd = buildFormData();
        await bookService.create(fd);
        toast.success('Book added successfully!');
      }
      setShowModal(false);
      await loadBooks();
    } catch {
      toast.error('Action failed');
    }
  };

  const handleDelete = async () => {
    if (usingDummy) {
      setBooks(bs => bs.filter(b => b.id !== deleteId));
      setDeleteId(null);
      toast.success('Book deleted. (demo mode)');
      return;
    }
    try {
      await bookService.delete(deleteId);
      await loadBooks();
      setDeleteId(null);
      toast.success('Book deleted.');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Book Management</h2>
          <p className="text-sm text-gray-500 mt-1">{books.length} books in collection</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm hover:from-indigo-700 hover:to-indigo-600 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Book
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Books', value: books.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Available', value: books.reduce((a, b) => a + b.available, 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Checked Out', value: books.reduce((a, b) => a + (b.copies - b.available), 0), color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'With PDF', value: books.filter(b => b.pdfUrl).length, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author or ISBN..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white appearance-none cursor-pointer"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Book', 'ISBN', 'Category', 'Copies', 'Rating', 'Files', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No books found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* Book */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {book.coverPreview ? (
                          <img
                            src={book.coverPreview}
                            alt="cover"
                            className="h-10 w-8 rounded-lg object-cover flex-shrink-0 shadow-sm border border-gray-100"
                          />
                        ) : (
                          <div className="h-10 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-[#25f194] flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-gray-900">{book.title}</div>
                          <div className="text-xs text-gray-400">{book.author}</div>
                        </div>
                      </div>
                    </td>
                    {/* ISBN */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                        {book.isbn}
                      </span>
                    </td>
                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {book.category}
                      </span>
                    </td>
                    {/* Copies */}
                    <td className="px-5 py-4">
                      <AvailBadge available={book.available} copies={book.copies} />
                    </td>
                    {/* Rating */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-gray-700">{book.rating}</span>
                      </div>
                    </td>
                    {/* Files */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {book.coverPreview ? (
                          <span title="Has cover image" className="p-1.5 bg-indigo-100 rounded-lg">
                            <Image className="h-3 w-3 text-indigo-500" />
                          </span>
                        ) : (
                          <span className="p-1.5 bg-gray-100 rounded-lg opacity-40">
                            <Image className="h-3 w-3 text-gray-400" />
                          </span>
                        )}
                        {book.pdfUrl ? (
                          <span title="Has PDF" className="p-1.5 bg-blue-100 rounded-lg">
                            <FileText className="h-3 w-3 text-blue-500" />
                          </span>
                        ) : (
                          <span className="p-1.5 bg-gray-100 rounded-lg opacity-40">
                            <FileText className="h-3 w-3 text-gray-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={book.status} />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {book.coverPreview && (
                          <button
                            onClick={() => setPreviewBook(book)}
                            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
                            title="Preview cover"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(book)}
                          className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(book.id)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${p === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <Modal
          title={editBook ? `Edit — ${editBook.title}` : 'Add New Book'}
          onClose={() => setShowModal(false)}
          wide
        >
          <BookForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={() => setShowModal(false)}
            isEdit={!!editBook}
          />
        </Modal>
      )}

      {/* ── Cover Preview Modal ── */}
      {previewBook && (
        <Modal title={`Cover — ${previewBook.title}`} onClose={() => setPreviewBook(null)}>
          <div className="space-y-4">
            <img
              src={previewBook.coverPreview}
              alt="Book cover"
              className="w-full rounded-xl object-cover max-h-80 shadow-md"
            />
            <div className="flex items-center gap-3 text-sm">
              {previewBook.pdfFile && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-700 font-medium">
                  <Paperclip className="h-4 w-4" />
                  {previewBook.pdfName}
                  <span className="text-blue-400 text-xs">{formatBytes(previewBook.pdfFile?.size)}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <Modal title="Delete Book" onClose={() => setDeleteId(null)}>
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Are you sure?</p>
              <p className="text-xs text-gray-500 mt-1">
                This will permanently delete <strong>{books.find(b => b.id === deleteId)?.title}</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
