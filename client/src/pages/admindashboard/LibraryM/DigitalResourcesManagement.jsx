import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Monitor, Plus, Search, Edit2, Trash2, X, Save,
  ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  FileText, Image, Download, Eye, Upload,
  Tag, User, Calendar, Link, File,
  BookOpen, Film, Music, ExternalLink, Loader2, RefreshCw,
} from 'lucide-react';
import { digitalResourceService } from '../../../services/libraryService';

// ── Sample Data (fallback) ─────────────────────────────────
const INITIAL_RESOURCES = [
  { id: 1, _id: '1', title: 'Introduction to Python', type: 'Video', category: 'Programming', author: 'John Smith', url: 'https://youtube.com', fileSize: '245 MB', uploadDate: '2026-01-10', status: 'Active', downloads: 128, description: 'Beginner-friendly Python course.' },
  { id: 2, _id: '2', title: 'Data Structures E-Book', type: 'E-Book', category: 'Computer Science', author: 'Alice Johnson', url: '', fileSize: '12 MB', uploadDate: '2026-01-15', status: 'Active', downloads: 95, description: 'Comprehensive guide to data structures.' },
  { id: 3, _id: '3', title: 'UI/UX Design Principles', type: 'PDF', category: 'Design', author: 'Mark Williams', url: '', fileSize: '8 MB', uploadDate: '2026-02-01', status: 'Active', downloads: 67, description: 'Core principles of modern UI/UX design.' },
  { id: 4, _id: '4', title: 'Machine Learning Podcast', type: 'Audio', category: 'AI / ML', author: 'Sara Davis', url: 'https://spotify.com', fileSize: '55 MB', uploadDate: '2026-02-05', status: 'Active', downloads: 44, description: 'Weekly podcast on latest ML trends.' },
  { id: 5, _id: '5', title: 'React Advanced Patterns', type: 'Video', category: 'Programming', author: 'Tom Clark', url: 'https://vimeo.com', fileSize: '1.2 GB', uploadDate: '2026-02-10', status: 'Inactive', downloads: 210, description: 'Deep dive into advanced React patterns.' },
  { id: 6, _id: '6', title: 'Database Design Guide', type: 'PDF', category: 'Database', author: 'Lily Turner', url: '', fileSize: '6 MB', uploadDate: '2026-02-15', status: 'Active', downloads: 33, description: 'Step-by-step guide to relational databases.' },
  { id: 7, _id: '7', title: 'Cloud Computing Overview', type: 'E-Book', category: 'Cloud', author: 'Chris Brown', url: '', fileSize: '18 MB', uploadDate: '2026-02-20', status: 'Active', downloads: 78, description: 'Overview of cloud computing platforms.' },
  { id: 8, _id: '8', title: 'Cybersecurity Fundamentals', type: 'PDF', category: 'Security', author: 'Nina White', url: '', fileSize: '9 MB', uploadDate: '2026-02-22', status: 'Active', downloads: 150, description: 'Introduction to cybersecurity concepts.' },
];

const CATEGORIES = ['All', 'Strategy', 'Architecture', 'Science', 'Law', 'Business', 'Philosophy', 'Cybersecurity', 'Education', 'Technology', 'Marketing', 'Environment', 'Other'];

const RESOURCE_TYPES = [
  { key: 'PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  { key: 'E-Book', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { key: 'Video', icon: Film, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
  { key: 'Audio', icon: Music, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  { key: 'Image', icon: Image, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'Other', icon: File, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
];

const EMPTY_FORM = {
  title: '', type: 'PDF', category: 'Technology',
  author: '', url: '', fileSize: '', uploadDate: '',
  status: 'Active', downloads: 0, description: '',
  thumbnail: null, thumbnailPreview: null,
  file: null, fileName: null,
};

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getTypeMeta(type) {
  return RESOURCE_TYPES.find(t => t.key === type) || RESOURCE_TYPES[5];
}

function getThumbnailSrc(resource) {
  if (resource.thumbnailPreview) return resource.thumbnailPreview;
  if (resource.thumbnailImage) return `http://localhost:5000/${resource.thumbnailImage}`;
  return null;
}

function TypeBadge({ type }) {
  const meta = getTypeMeta(type);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
      <Icon className="h-3 w-3" />{type}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{status}</span>
  );
}

function ApiBanner({ usingDummy, loading, onRetry }) {
  if (loading || !usingDummy) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium">Showing demo data — backend not connected</span>
      <button onClick={onRetry} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold">
        <RefreshCw className="h-3 w-3" /> Retry
      </button>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-4`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ThumbnailUpload({ form, setForm }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setForm(f => ({ ...f, thumbnail: file, thumbnailPreview: e.target.result }));
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Thumbnail Image</label>
      {form.thumbnailPreview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img src={form.thumbnailPreview} alt="Thumbnail" className="w-full h-32 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current.click()} className="p-2 bg-white rounded-xl text-gray-700"><Edit2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setForm(f => ({ ...f, thumbnail: null, thumbnailPreview: null }))} className="p-2 bg-white rounded-xl text-red-500"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current.click()}
          className={`flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all ${drag ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
          <div className="p-2.5 bg-indigo-100 rounded-xl"><Image className="h-5 w-5 text-indigo-500" /></div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Drop image or <span className="text-indigo-600">browse</span></p>
            <p className="text-xs text-gray-400">JPG, PNG · Max 5MB</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
}

function ResourceFileUpload({ form, setForm }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);
  const ACCEPTED = {
    'PDF': { accept: '.pdf', label: 'PDF', maxMB: 50 },
    'E-Book': { accept: '.pdf,.epub,.mobi', label: 'PDF, EPUB, MOBI', maxMB: 100 },
    'Video': { accept: '.mp4,.mov,.avi', label: 'MP4, MOV, AVI', maxMB: 500 },
    'Audio': { accept: '.mp3,.wav,.aac', label: 'MP3, WAV, AAC', maxMB: 100 },
    'Image': { accept: 'image/*', label: 'JPG, PNG, WEBP', maxMB: 20 },
    'Other': { accept: '*', label: 'Any file', maxMB: 200 },
  };
  const cfg = ACCEPTED[form.type] || ACCEPTED['Other'];
  const handleFile = (file) => {
    if (!file) return;
    if (file.size > cfg.maxMB * 1024 * 1024) { alert(`File must be under ${cfg.maxMB}MB`); return; }
    setForm(f => ({ ...f, file, fileName: file.name, fileSize: formatBytes(file.size) }));
  };
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Resource File <span className="text-gray-400 normal-case font-normal">(Max {cfg.maxMB}MB)</span></label>
      {form.file ? (
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="p-2.5 bg-indigo-500 rounded-xl flex-shrink-0"><FileText className="h-5 w-5 text-white" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{form.fileName}</p>
            <p className="text-xs text-gray-500">{formatBytes(form.file?.size)}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button type="button" onClick={() => inputRef.current.click()} className="p-2 rounded-xl bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100"><Upload className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => setForm(f => ({ ...f, file: null, fileName: null, fileSize: '' }))} className="p-2 rounded-xl bg-white border border-red-200 text-red-500 hover:bg-red-50"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current.click()}
          className={`flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all ${drag ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
          <div className="p-2.5 bg-indigo-100 rounded-xl"><Upload className="h-5 w-5 text-indigo-500" /></div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Drop file or <span className="text-indigo-600">browse</span></p>
            <p className="text-xs text-gray-400">{cfg.label} · Max {cfg.maxMB}MB</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept={cfg.accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
}

function ResourceForm({ form, setForm, onSave, onCancel, isEdit, saving }) {
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };
  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave();
  };
  const field = (label, key, type = 'text', icon, placeholder = '') => (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input type={type} value={form[key]} placeholder={placeholder}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className={`w-full ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all ${errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`} />
      </div>
      {errors[key] && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          {field('Title', 'title', 'text', <BookOpen className="h-4 w-4" />, 'Resource title...')}
          {field('Author / Publisher', 'author', 'text', <User className="h-4 w-4" />, 'Author name...')}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Resource Type</label>
            <div className="grid grid-cols-3 gap-2">
              {RESOURCE_TYPES.map(({ key, icon: Icon, color, bg, border }) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, type: key, file: null, fileName: null }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-[11px] font-bold transition-all ${form.type === key ? `${bg} ${color} ${border} scale-105 shadow-sm` : 'bg-gray-50 text-gray-400 border-transparent hover:border-gray-200'}`}>
                  <Icon className="h-4 w-4" />{key}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white appearance-none">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {field('External URL (optional)', 'url', 'url', <Link className="h-4 w-4" />, 'https://...')}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Upload Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="date" value={form.uploadDate} onChange={e => setForm(f => ({ ...f, uploadDate: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Status</label>
            <div className="flex gap-3">
              {['Active', 'Inactive'].map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.status === s ? (s === 'Active' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-500 text-white border-gray-500') : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <ThumbnailUpload form={form} setForm={setForm} />
          <ResourceFileUpload form={form} setForm={setForm} />
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
              placeholder="Brief description..."
              className={`w-full px-4 py-2.5 text-sm border rounded-xl outline-none resize-none transition-all ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`} />
            {errors.description && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.description}</p>}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : isEdit ? 'Update Resource' : 'Add Resource'}
        </button>
      </div>
    </div>
  );
}

function ResourceCard({ resource, onEdit, onDelete, onView }) {
  const meta = getTypeMeta(resource.type);
  const Icon = meta.icon;
  const thumb = getThumbnailSrc(resource);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className={`h-32 ${meta.bg} flex items-center justify-center relative overflow-hidden`}>
        {thumb ? <img src={thumb} alt="thumbnail" className="w-full h-full object-cover" /> : <Icon className={`h-12 w-12 ${meta.color} opacity-30`} />}
        <div className="absolute top-3 left-3"><TypeBadge type={resource.type} /></div>
        <div className="absolute top-3 right-3"><StatusBadge status={resource.status} /></div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-sm font-black text-gray-900 line-clamp-1">{resource.title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{resource.author}</p>
        </div>
        <span className="inline-block text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{resource.category}</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1"><Download className="h-3 w-3 text-emerald-500" /><span className="font-bold text-gray-700">{resource.downloads || 0}</span> downloads</div>
          {resource.fileSize && <div className="flex items-center gap-1"><File className="h-3 w-3 text-gray-400" /><span>{resource.fileSize}</span></div>}
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">{resource.description}</p>
        <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
          <button onClick={() => onView(resource)} className="flex-1 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-1">
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          <button onClick={() => onEdit(resource)} className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center gap-1">
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={() => onDelete(resource._id || resource.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DigitalResourcesManagement() {
  const [resources, setResources] = useState(INITIAL_RESOURCES); // show mock initially
  const [usingDummy, setUsingDummy] = useState(true);
  const [apiError, setApiError] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editResource, setEditResource] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [viewResource, setViewResource] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const PER_PAGE = 6;

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await digitalResourceService.getAll();
      const apiData = res?.data?.data || [];

      if (Array.isArray(apiData) && apiData.length > 0) {
        setResources(apiData);
        setUsingDummy(false);
        setApiError('');
      } else {
        // backend reachable but empty -> still show empty real data
        setResources([]);
        setUsingDummy(false);
        setApiError('');
      }
    } catch (e) {
      // fallback to mock data like other librarian pages
      setResources(INITIAL_RESOURCES);
      setUsingDummy(true);
      setApiError('Backend not connected. Showing demo data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const filtered = resources.filter(r => {
    const matchSearch =
      (r.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.author || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || r.category === categoryFilter;
    const matchType = typeFilter === 'All' || r.type === typeFilter;
    return matchSearch && matchCat && matchType;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditResource(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (r) => {
    setEditResource(r);
    setForm({
      title: r.title || '',
      type: r.type || 'PDF',
      category: r.category || 'Programming',
      author: r.author || '',
      url: r.url || '',
      fileSize: r.fileSize || '',
      uploadDate: r.uploadDate || '',
      status: r.status || 'Active',
      downloads: r.downloads || 0,
      description: r.description || '',
      thumbnail: null,
      thumbnailPreview: getThumbnailSrc(r),
      file: null,
      fileName: r.url ? 'Existing file' : null,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (usingDummy) {
      if (editResource) {
        setResources(rs => rs.map(r => (r._id === editResource._id || r.id === editResource.id) ? { ...r, ...form } : r));
        showToast('Resource updated! (demo mode)');
      } else {
        setResources(rs => [{ ...form, id: Date.now(), _id: String(Date.now()) }, ...rs]);
        showToast('Resource added! (demo mode)');
      }
      setShowModal(false);
      return;
    }

    // Map frontend type names to backend model enum values
    const typeMap = { 'PDF': 'Document', 'E-Book': 'eBook', 'Video': 'Video', 'Audio': 'Audio', 'Image': 'Document', 'Other': 'Document' };
    // Map frontend type names to format enum values
    const formatMap = { 'PDF': 'PDF', 'E-Book': 'EPUB', 'Video': 'MP4', 'Audio': 'MP3', 'Image': 'PDF', 'Other': 'PDF' };

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('type', typeMap[form.type] || 'Document');
      formData.append('category', form.category);
      formData.append('author', form.author);
      formData.append('url', form.url || 'pending-upload');
      formData.append('size', form.fileSize || '0 MB');
      formData.append('format', formatMap[form.type] || 'PDF');
      formData.append('isPublic', form.status === 'Active' ? 'true' : 'false');
      formData.append('description', form.description);
      if (form.thumbnail) formData.append('thumbnailImage', form.thumbnail);
      if (form.file) formData.append('file', form.file);

      const res = editResource?._id
        ? await digitalResourceService.update(editResource._id, formData)
        : await digitalResourceService.create(formData);

      if (res?.data?.success) {
        showToast(editResource ? 'Resource updated successfully ✅' : 'Resource added successfully ✅');
        await fetchResources();
        setShowModal(false);
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (usingDummy) {
      setResources(rs => rs.filter(r => r._id !== deleteId && r.id !== deleteId));
      setDeleteId(null);
      showToast('Resource deleted. (demo mode)', 'error');
      return;
    }
    try {
      setDeleting(true);
      await digitalResourceService.delete(deleteId);
      setDeleteId(null);
      showToast('Resource deleted.', 'error');
      fetchResources();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Digital Resources</h2>
          <p className="text-sm text-gray-500 mt-1">{resources.length} resources available</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm hover:from-indigo-700 hover:to-indigo-600 transition-all hover:scale-105">
          <Plus className="h-4 w-4" /> Add Resource
        </button>
      </div>

      <ApiBanner usingDummy={usingDummy} loading={loading} onRetry={fetchResources} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Resources', value: resources.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: resources.filter(r => r.status === 'Active').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Downloads', value: resources.reduce((a, r) => a + (r.downloads || 0), 0), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Resource Types', value: [...new Set(resources.map(r => r.type))].length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search resources..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-indigo-400 bg-white cursor-pointer">
            <option value="All">All Types</option>
            {RESOURCE_TYPES.map(t => <option key={t.key} value={t.key}>{t.key}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {['grid', 'table'].map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${viewMode === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <span className="ml-3 text-sm text-gray-400 font-medium">Loading resources...</span>
        </div>
      )}

      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-gray-400 text-sm">No resources found.</div>
          ) : paginated.map(r => (
            <ResourceCard key={r._id || r.id} resource={r} onEdit={openEdit} onDelete={setDeleteId} onView={setViewResource} />
          ))}
        </div>
      )}

      {!loading && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Resource', 'Type', 'Category', 'Author', 'Size', 'Downloads', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">No resources found.</td></tr>
                ) : paginated.map(r => {
                  const meta = getTypeMeta(r.type);
                  const Icon = meta.icon;
                  const thumb = getThumbnailSrc(r);
                  return (
                    <tr key={r._id || r.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {thumb ? <img src={thumb} alt="thumb" className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                            : <div className={`h-10 w-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}><Icon className={`h-5 w-5 ${meta.color}`} /></div>}
                          <div>
                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{r.title}</div>
                            <div className="text-xs text-gray-400 line-clamp-1">{r.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><TypeBadge type={r.type} /></td>
                      <td className="px-5 py-4"><span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{r.category}</span></td>
                      <td className="px-5 py-4 text-sm text-gray-600">{r.author}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{r.fileSize || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Download className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-sm font-bold text-gray-700">{r.downloads || 0}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewResource(r)} className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600"><Eye className="h-3.5 w-3.5" /></button>
                          <button onClick={() => openEdit(r)} className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeleteId(r._id || r.id)} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
          <span className="text-xs text-gray-500">Showing {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4 text-gray-600" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${p === page ? 'bg-indigo-600 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4 text-gray-600" /></button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editResource ? `Edit — ${editResource.title}` : 'Add New Resource'} onClose={() => setShowModal(false)} wide>
          <ResourceForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => setShowModal(false)} isEdit={!!editResource} saving={saving} />
        </Modal>
      )}

      {viewResource && (
        <Modal title={viewResource.title} onClose={() => setViewResource(null)}>
          <div className="space-y-4">
            {getThumbnailSrc(viewResource) && <img src={getThumbnailSrc(viewResource)} alt="thumbnail" className="w-full h-40 object-cover rounded-xl" />}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <TypeBadge type={viewResource.type} />
              <StatusBadge status={viewResource.status} />
            </div>
            <div>
              <p className="text-lg font-black text-gray-900">{viewResource.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">By {viewResource.author}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3"><p className="text-xs text-gray-500">Category</p><p className="text-sm font-bold text-indigo-700 mt-0.5">{viewResource.category}</p></div>
              <div className="bg-emerald-50 rounded-xl p-3"><p className="text-xs text-gray-500">Downloads</p><p className="text-sm font-bold text-emerald-700 mt-0.5">{viewResource.downloads || 0}</p></div>
              {viewResource.fileSize && <div className="bg-amber-50 rounded-xl p-3"><p className="text-xs text-gray-500">File Size</p><p className="text-sm font-bold text-amber-700 mt-0.5">{viewResource.fileSize}</p></div>}
              {viewResource.uploadDate && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Upload Date</p><p className="text-sm font-bold text-gray-700 mt-0.5">{viewResource.uploadDate}</p></div>}
            </div>
            {viewResource.description && <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</p><p className="text-sm text-gray-700">{viewResource.description}</p></div>}
            {viewResource.url && <a href={viewResource.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm font-bold hover:bg-blue-100"><ExternalLink className="h-4 w-4" /> Open External Link</a>}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => { setViewResource(null); openEdit(viewResource); }} className="flex-1 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 flex items-center justify-center gap-2"><Edit2 className="h-4 w-4" /> Edit</button>
              <button onClick={() => { setViewResource(null); setDeleteId(viewResource._id || viewResource.id); }} className="py-2.5 px-4 rounded-xl bg-red-50 text-red-500 text-sm font-bold hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Resource" onClose={() => setDeleteId(null)}>
          <div className="text-center space-y-4">
            <div className="mx-auto h-14 w-14 bg-red-100 rounded-2xl flex items-center justify-center"><Trash2 className="h-7 w-7 text-red-500" /></div>
            <div>
              <p className="text-sm font-bold text-gray-900">Are you sure?</p>
              <p className="text-xs text-gray-500 mt-1">This will permanently delete <strong>{resources.find(r => r._id === deleteId || r.id === deleteId)?.title}</strong>.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}