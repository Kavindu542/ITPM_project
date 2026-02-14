import React from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Download,
  FolderOpen,
  MessageSquare,
  MessagesSquare,
  Search,
  Star,
  UploadCloud,
} from 'lucide-react';
import { authService } from '../../services/authService';
import UserMenu from '../../components/UserMenu';
import { studyMaterialService } from '../../services/studyMaterialService';

export default function StudyMaterial({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const { section } = useParams();
  const tab = String(section || '').trim() || 'all';
  const allowedTabs = React.useMemo(() => new Set(['all', 'favs', 'history', 'contribute']), []);

  React.useEffect(() => {
    if (!section) {
      navigate('/materials/all', { replace: true });
      return;
    }
    if (!allowedTabs.has(tab)) {
      navigate('/materials/all', { replace: true });
    }
  }, [section, tab, allowedTabs, navigate]);

  const [filters, setFilters] = React.useState({
    q: '',
    moduleCode: '',
    semester: '',
    category: '',
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [bookmarks, setBookmarks] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [myUploads, setMyUploads] = React.useState([]);

  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);

  const [expandedId, setExpandedId] = React.useState(null);
  const [detailsById, setDetailsById] = React.useState({});
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const [contrib, setContrib] = React.useState({
    title: '',
    description: '',
    moduleCode: '',
    semester: user?.semester ?? '',
    category: 'notes',
    suggested: true,
    file: null,
  });

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        q: filters.q || undefined,
        moduleCode: filters.moduleCode || undefined,
        semester: filters.semester !== '' ? filters.semester : undefined,
        category: filters.category || undefined,
      };
      const res = await studyMaterialService.listMaterials(params);
      setItems(res?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadBookmarks = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studyMaterialService.listBookmarks();
      setBookmarks(res?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load favourites');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studyMaterialService.listHistory();
      setHistory(res?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyUploads = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studyMaterialService.listMyUploads();
      setMyUploads(res?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load your uploads');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (tab === 'all') loadAll();
    if (tab === 'favs') loadBookmarks();
    if (tab === 'history') loadHistory();
    if (tab === 'contribute') loadMyUploads();
  }, [tab, loadAll, loadBookmarks, loadHistory]);

  React.useEffect(() => {
    if (tab !== 'contribute') {
      setUploadModalOpen(false);
    }
  }, [tab]);

  React.useEffect(() => {
    if (!uploadModalOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUploadModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [uploadModalOpen]);

  React.useEffect(() => {
    if (!uploadModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [uploadModalOpen]);

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  const onToggleBookmark = async (id) => {
    try {
      const res = await studyMaterialService.toggleBookmark(id);
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, bookmarked: !!res.bookmarked } : m)));
      if (tab === 'favs') loadBookmarks();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update bookmark');
    }
  };

  const openPreview = (m) => {
    if (!m?.id) return;
    const url = studyMaterialService.fileUrl(m.id, {
      versionId: m?.currentVersion?.id,
      disposition: 'inline',
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = (m) => {
    if (!m?.id) return;
    const url = studyMaterialService.fileUrl(m.id, {
      versionId: m?.currentVersion?.id,
      disposition: 'attachment',
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleVersions = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    if (detailsById[id]) return;

    try {
      const res = await studyMaterialService.getMaterial(id);
      setDetailsById((p) => ({ ...p, [id]: res?.material ?? null }));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load versions');
    }
  };

  const submitContribution = async (e) => {
    e.preventDefault();
    setError('');

    if (!contrib.file) {
      setError('Please choose a file to upload');
      return;
    }

    const fd = new FormData();
    fd.append('file', contrib.file);
    fd.append('title', contrib.title || contrib.file.name);
    fd.append('description', contrib.description);
    fd.append('moduleCode', contrib.moduleCode);
    fd.append('semester', contrib.semester);
    fd.append('category', contrib.category);
    fd.append('suggested', String(contrib.suggested));

    setLoading(true);
    try {
      await studyMaterialService.uploadSuggestion(fd);
      setContrib((p) => ({
        ...p,
        title: '',
        description: '',
        moduleCode: '',
        file: null,
        suggested: true,
      }));
      setUploadModalOpen(false);
      await loadMyUploads();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const statusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'published') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const categories = [
    { id: '', label: 'All categories' },
    { id: 'notes', label: 'Lecture Notes' },
    { id: 'tutes', label: 'Tutorials' },
    { id: 'papers', label: 'Past Papers' },
    { id: 'links', label: 'Useful Links' },
    { id: 'other', label: 'Other' },
  ];

  const semesterOptions = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'];

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
    setExpandedId(null);
  }, [tab, filters.q, filters.moduleCode, filters.semester, filters.category]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="relative w-full p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-gray-200 hover:bg-white transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-800">Back</span>
          </button>

          <UserMenu user={user} onProfile={() => navigate('/profile')} onLogout={logout} theme="light" idLabel="ID" />
        </div>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm">
          <div className="p-6 sm:p-8 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-[#25f194] shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Study Materials</h1>
              <p className="mt-1 text-sm text-gray-600">
                Browse resources by module/semester, preview, download, and contribute your own.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Filter by module & semester
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <Clock className="h-3.5 w-3.5" />
                  Preview before downloading
                </span>
                {/* Removed 'Missing resource requests' and 'Academic support forum' buttons as requested */}
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
                onClick={() => navigate('/materials/contribute')}
              >
                <UploadCloud className="h-4 w-4" />
                Contribute
              </button>
              <p className="text-xs text-gray-500">Uploads go for admin approval</p>
            </div>
          </div>
        </div>

        {/* Sidebar + Content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <div className="text-sm font-bold text-gray-900">Menu</div>
                <div className="text-xs text-gray-500 mt-1">
                  {user?.semester ? `Your semester: ${user.semester}` : 'Set your semester in Profile for access rules.'}
                </div>
              </div>
              <div className="p-3 space-y-1">
                <NavLink
                  to="/materials/all"
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                      isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <FolderOpen className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>All materials</span>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/materials/favs"
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                      isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Star className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>Favourites</span>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/materials/history"
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                      isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Clock className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>History</span>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/materials/contribute"
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                      isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <UploadCloud className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>Contribute</span>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/materials/requests"
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                      isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <MessageSquare className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>Missing resource requests</span>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/materials/reviews"
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                      isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Star className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>Ratings & reviews</span>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/materials/forum"
                  className={({ isActive }) =>
                    `w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${
                      isActive ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <MessagesSquare className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>Academic support forum</span>
                    </>
                  )}
                </NavLink>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-gray-900">
                {tab === 'all'
                  ? 'All materials'
                  : tab === 'favs'
                    ? 'Favourites'
                    : tab === 'history'
                      ? 'History'
                      : 'Contribute'}
              </div>
              {tab !== 'contribute' ? (
                <button
                  type="button"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
                  onClick={() => navigate('/materials/contribute')}
                >
                  <UploadCloud className="h-4 w-4" />
                  Contribute
                </button>
              ) : null}
            </div>

            {error ? (
              <div className="p-5 text-sm text-red-700 bg-red-50 border-b border-red-100">{error}</div>
            ) : null}

            {tab === 'all' ? (
              <>
                <div className="p-5 border-b border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        value={filters.q}
                        onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                        placeholder="Search title/description..."
                        className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                      />
                    </div>

                    <input
                      value={filters.moduleCode}
                      onChange={(e) => setFilters((p) => ({ ...p, moduleCode: e.target.value }))}
                      placeholder="Module code (e.g. SE3020)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                    />

                    <div className="flex gap-3">
                      <select
                        value={filters.semester}
                        onChange={(e) => setFilters((p) => ({ ...p, semester: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                      >
                        <option value="">Any semester</option>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Semester {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id || 'all'} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {loading
                        ? 'Loading…'
                        : `${items.length} items • Showing ${(currentPage - 1) * pageSize + (items.length ? 1 : 0)}-${Math.min(currentPage * pageSize, items.length)}`}
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm font-semibold"
                      onClick={loadAll}
                      disabled={loading}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Title</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Module</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Semester</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Downloads</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map((m) => (
                        <React.Fragment key={m.id}>
                          <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-5">
                              <div className="font-semibold text-gray-900 text-sm">{m.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{m.description || '—'}</div>
                            </td>
                            <td className="py-3 px-5 text-sm text-gray-700">{m.moduleCode || '—'}</td>
                            <td className="py-3 px-5 text-sm text-gray-700">{m.semester ?? '—'}</td>
                            <td className="py-3 px-5 text-sm text-gray-700">{m.downloadCount ?? 0}</td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                  onClick={() => openPreview(m)}
                                >
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 text-white text-sm font-semibold"
                                  onClick={() => downloadFile(m)}
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                  onClick={() => toggleVersions(m.id)}
                                >
                                  Versions
                                </button>
                                <button
                                  type="button"
                                  className={`p-2 rounded-xl border ${
                                    m.bookmarked ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                                  } hover:bg-gray-50`}
                                  onClick={() => onToggleBookmark(m.id)}
                                  title={m.bookmarked ? 'Remove from favourites' : 'Add to favourites'}
                                >
                                  <Star className={`h-4 w-4 ${m.bookmarked ? 'text-yellow-600' : 'text-gray-700'}`} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {expandedId === m.id ? (
                            <tr className="border-b border-gray-200 bg-gray-50/40">
                              <td colSpan={5} className="py-4 px-5">
                                <div className="text-sm font-semibold text-gray-900 mb-2">Versions</div>
                                <div className="space-y-2">
                                  {(detailsById[m.id]?.versions || []).map((v) => (
                                    <div
                                      key={v.id}
                                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3"
                                    >
                                      <div>
                                        <div className="text-sm font-semibold text-gray-900">{v.originalName}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {v.note ? `${v.note} • ` : ''}
                                          {v.createdAt ? new Date(v.createdAt).toLocaleString() : ''}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                          onClick={() =>
                                            window.open(
                                              studyMaterialService.fileUrl(m.id, {
                                                versionId: v.id,
                                                disposition: 'inline',
                                              }),
                                              '_blank',
                                              'noopener,noreferrer',
                                            )
                                          }
                                        >
                                          Preview
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {detailsById[m.id] && (detailsById[m.id]?.versions || []).length === 0 ? (
                                    <div className="text-sm text-gray-600">No versions found.</div>
                                  ) : null}
                                  {!detailsById[m.id] ? (
                                    <div className="text-sm text-gray-600">Loading versions…</div>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      ))}

                      {!loading && items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 px-5 text-center text-sm text-gray-600">
                            No materials found for your filters.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {!loading && items.length > 0 ? (
                  <div className="p-5 border-t border-gray-200 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setExpandedId(null);
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                        disabled={currentPage === 1}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => {
                          setExpandedId(null);
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {tab === 'favs' ? (
              <div className="p-5">
                <div className="text-sm text-gray-700 mb-3">Saved materials for quick access.</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {bookmarks.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{m.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {m.moduleCode || '—'} {m.semester ? `• Semester ${m.semester}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                          onClick={() => openPreview(m)}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 text-white text-sm font-semibold"
                          onClick={() => downloadFile(m)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
                          onClick={() => onToggleBookmark(m.id)}
                          title="Remove"
                        >
                          <Star className="h-4 w-4 text-yellow-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!loading && bookmarks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
                      No favourites yet.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {tab === 'history' ? (
              <div className="p-5">
                <div className="text-sm text-gray-700 mb-3">Your download history (latest 100).</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {history.map((h, idx) => (
                    <div key={`${h?.material?.id}-${idx}`} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{h?.material?.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {h?.material?.moduleCode || '—'} {h?.material?.semester ? `• Semester ${h.material.semester}` : ''}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Version: {h?.version?.note || h?.version?.originalName || '—'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Downloaded {new Date(h.downloadedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                        onClick={() => openPreview({ id: h?.material?.id, currentVersion: h?.version })}
                      >
                        Preview
                      </button>
                    </div>
                  ))}
                  {!loading && history.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
                      No downloads yet.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {tab === 'contribute' ? (
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="text-sm text-gray-700">
                    Upload your notes/resources for admin approval (moderation queue).
                    <div className="text-xs text-gray-500 mt-1">
                      You’ll see status updates here after review.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                      onClick={() => setUploadModalOpen(true)}
                      disabled={loading}
                    >
                      <UploadCloud className="h-4 w-4" />
                      Upload new
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                      onClick={loadMyUploads}
                      disabled={loading}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Title</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Module</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Semester</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Category</th>
                        <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Status</th>
                        <th className="text-right py-3 px-5 text-xs font-semibold text-gray-600">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myUploads.map((m, idx) => (
                        <tr key={`${m?.id || idx}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-5">
                            <div className="font-semibold text-gray-900 text-sm">{m.title || '—'}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{m.description || '—'}</div>
                          </td>
                          <td className="py-3 px-5 text-sm text-gray-700">{m.moduleCode || '—'}</td>
                          <td className="py-3 px-5 text-sm text-gray-700">{m.semester ?? '—'}</td>
                          <td className="py-3 px-5 text-sm text-gray-700">{m.category || '—'}</td>
                          <td className="py-3 px-5">
                            <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(m.status)}`}>
                              {String(m.status || 'pending')}
                            </div>
                            {String(m.status || '').toLowerCase() === 'rejected' && m?.moderation?.decisionReason ? (
                              <div className="text-xs text-gray-500 mt-1">Reason: {m.moderation.decisionReason}</div>
                            ) : null}
                          </td>
                          <td className="py-3 px-5 text-sm text-gray-700 text-right">
                            {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}

                      {!loading && myUploads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 px-5 text-center text-sm text-gray-600">
                            You haven’t uploaded anything yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>

    {uploadModalOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Upload study material"
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setUploadModalOpen(false)} />
        <div className="relative w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
          <div className="p-5 border-b border-gray-200 bg-white flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-gray-900">Upload new material</div>
              <div className="text-xs text-gray-500 mt-1">Uploads go for admin approval</div>
            </div>
            <button
              type="button"
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              onClick={() => setUploadModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            <form onSubmit={submitContribution} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={contrib.title}
                  onChange={(e) => setContrib((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Title"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                />
                <input
                  value={contrib.moduleCode}
                  onChange={(e) => setContrib((p) => ({ ...p, moduleCode: e.target.value }))}
                  placeholder="Module code"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                />
                <select
                  value={contrib.semester}
                  onChange={(e) => setContrib((p) => ({ ...p, semester: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                >
                  <option value="">Semester (optional)</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  ))}
                </select>
                <select
                  value={contrib.category}
                  onChange={(e) => setContrib((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                >
                  {categories
                    .filter((c) => c.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                </select>
              </div>

              <textarea
                value={contrib.description}
                onChange={(e) => setContrib((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none min-h-[90px]"
              />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="text-sm text-gray-700 inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={contrib.suggested}
                    onChange={(e) => setContrib((p) => ({ ...p, suggested: e.target.checked }))}
                  />
                  Suggested
                </label>

                <input
                  type="file"
                  onChange={(e) => setContrib((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                  className="text-sm"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                disabled={loading}
              >
                <UploadCloud className="h-4 w-4" />
                Submit for approval
              </button>
            </form>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
