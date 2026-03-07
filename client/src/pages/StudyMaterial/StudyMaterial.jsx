import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Download,
  FolderOpen,
  Heart,
  MessageSquare,
  MessagesSquare,
  Search,
  Star,
  UploadCloud,
} from 'lucide-react';
import { studyMaterialService } from '../../services/studyMaterialService';
import AIChatBot from '../../components/AIChatBot';
import StudyMaterialSidebar from '../../components/StudyMaterialSidebar';
// Removed AI PDF export utilities

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
  const [scanLoading, setScanLoading] = React.useState(false);
  const [scanError, setScanError] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [bookmarks, setBookmarks] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [myUploads, setMyUploads] = React.useState([]);

  const [uploadModalOpen, setUploadModalOpen] = React.useState(false);

  // AI assistant removed

  // No auto-load — results only after user submits a prompt

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

  const contribTouchedRef = React.useRef({
    title: false,
    moduleCode: false,
    semester: false,
    category: false,
    description: false,
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

  React.useEffect(() => {
    if (!uploadModalOpen) return;
    setScanLoading(false);
    setScanError('');
    contribTouchedRef.current = {
      title: false,
      moduleCode: false,
      semester: false,
      category: false,
      description: false,
    };
  }, [uploadModalOpen]);

  const scanAndAutofillFromFile = React.useCallback(async (file) => {
    if (!file) return;

    setScanLoading(true);
    setScanError('');

    try {
      const extracted = await studyMaterialService.scanSuggestionDocument(file);
      setContrib((prev) => {
        const next = { ...prev };

        const title = String(extracted?.title || '').trim();
        const moduleCode = String(extracted?.moduleCode || '').trim();
        const semester = String(extracted?.semester || '').trim();
        const category = String(extracted?.category || '').trim();
        const description = String(extracted?.description || '').trim();

        if (!contribTouchedRef.current.title && !next.title && title) next.title = title;
        if (!contribTouchedRef.current.moduleCode && !next.moduleCode && moduleCode) next.moduleCode = moduleCode;
        if (!contribTouchedRef.current.semester && !next.semester && semester) next.semester = semester;
        if (!contribTouchedRef.current.category && category) next.category = category;
        if (!contribTouchedRef.current.description && !next.description && description) next.description = description;

        return next;
      });
    } catch (e) {
      setScanError(e?.response?.data?.message || e?.message || 'Scan failed');
    } finally {
      setScanLoading(false);
    }
  }, []);

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

  const downloadFile = async (m) => {
    if (!m?.id) return;
    const url = studyMaterialService.fileUrl(m.id, {
      versionId: m?.currentVersion?.id,
      disposition: 'attachment',
    });
    const filename = String(m?.title || 'material').replace(/[^a-z0-9_\-\.]/gi, '_');
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('network');
      const blob = await res.blob();
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
      }
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener,noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objUrl);
    } catch (e) {
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener,noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
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

  const getCategoryLabel = React.useCallback(
    (categoryId) => {
      const key = String(categoryId || '').trim();
      if (!key) return '';
      const found = categories.find((c) => String(c.id) === key);
      return found?.label || key;
    },
    [categories],
  );

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

  const renderRating = (avgRating, reviewCount) => {
    const count = Number(reviewCount || 0);
    const avg = Number(avgRating || 0);

    if (!count) {
      return <div className="text-xs text-gray-500">No ratings yet</div>;
    }

    const filledStars = Math.max(0, Math.min(5, Math.round(avg)));
    const shownAvg = Number.isFinite(avg) ? avg.toFixed(1) : '0.0';

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < filledStars ? 'text-yellow-600' : 'text-gray-300'}`}
              fill={i < filledStars ? 'currentColor' : 'none'}
            />
          ))}
        </div>
        <div className="text-xs text-gray-600">
          {shownAvg} ({count})
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="h-[calc(100vh-6rem)] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans overflow-auto no-scrollbar lg:overflow-hidden">
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

        <div className="relative w-full h-full p-6 lg:pt-0 lg:pb-0 flex flex-col">

          {/* Sidebar + Content */}
          <div className="mt-0 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:h-full lg:overflow-hidden lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]">
            {/* Sidebar */}
            <div className="lg:col-span-1 lg:h-full lg:min-h-0">
              <StudyMaterialSidebar user={user} />
            </div>

            {/* Content */}
            <div className="lg:col-span-11 lg:h-full lg:min-h-0 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm lg:overflow-y-auto no-scrollbar">
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

                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {paginatedItems.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 text-sm truncate">{m.title || '—'}</div>
                              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{m.description || '—'}</div>
                            </div>
                            <button
                              type="button"
                              className={`shrink-0 p-2 rounded-xl border ${m.bookmarked ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'} hover:bg-gray-50`}
                              onClick={() => onToggleBookmark(m.id)}
                              title={m.bookmarked ? 'Remove from favourites' : 'Add to favourites'}
                            >
                              <Star className={`h-4 w-4 ${m.bookmarked ? 'text-yellow-600' : 'text-gray-700'}`} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {m.moduleCode ? (
                              <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">{m.moduleCode}</span>
                            ) : (
                              <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">—</span>
                            )}
                            {m.semester != null && String(m.semester) !== '' ? (
                              <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">Sem {m.semester}</span>
                            ) : null}
                            {m.category ? (
                              <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">{getCategoryLabel(m.category)}</span>
                            ) : null}
                            <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">
                              Downloads {m.downloadCount ?? 0}
                            </span>
                          </div>

                          {renderRating(m.avgRating, m.reviewCount)}

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
                          </div>

                          {expandedId === m.id ? (
                            <div className="pt-2 border-t border-gray-200">
                              <div className="text-sm font-semibold text-gray-900 mb-2">Versions</div>
                              <div className="space-y-2">
                                {(detailsById[m.id]?.versions || []).map((v) => (
                                  <div
                                    key={v.id}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-gray-900 truncate">{v.originalName}</div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {v.note ? `${v.note} • ` : ''}
                                        {v.createdAt ? new Date(v.createdAt).toLocaleString() : ''}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="shrink-0 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
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
                                ))}
                                {detailsById[m.id] && (detailsById[m.id]?.versions || []).length === 0 ? (
                                  <div className="text-sm text-gray-600">No versions found.</div>
                                ) : null}
                                {!detailsById[m.id] ? <div className="text-sm text-gray-600">Loading versions…</div> : null}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}

                      {!loading && items.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
                          No materials found for your filters.
                        </div>
                      ) : null}
                    </div>
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
                            {m.moduleCode || '—'}
                            {m.semester ? ` • Semester ${m.semester}` : ''}
                            {m.category ? ` • ${getCategoryLabel(m.category)}` : ''}
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
                            {h?.material?.moduleCode || '—'}
                            {h?.material?.semester ? ` • Semester ${h.material.semester}` : ''}
                            {h?.material?.category ? ` • ${getCategoryLabel(h.material.category)}` : ''}
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

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {myUploads.map((m, idx) => (
                      <div
                        key={`${m?.id || idx}`}
                        className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                              m.status,
                            )}`}
                          >
                            {String(m.status || 'pending')}
                          </div>
                          <span className="text-xs text-gray-400">
                            {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                          </span>
                        </div>

                        <div className="font-bold text-gray-900 text-sm">{m.title || '—'}</div>
                        {m.description ? (
                          <div className="text-xs text-gray-500 line-clamp-2">{m.description}</div>
                        ) : (
                          <div className="text-xs text-gray-500">—</div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {m.moduleCode ? (
                            <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">{m.moduleCode}</span>
                          ) : null}
                          {m.semester != null && String(m.semester) !== '' ? (
                            <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">Sem {m.semester}</span>
                          ) : null}
                          {m.category ? (
                            <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">{getCategoryLabel(m.category)}</span>
                          ) : null}
                        </div>

                        {String(m.status || '').toLowerCase() === 'rejected' && m?.moderation?.decisionReason ? (
                          <div className="text-xs text-red-600 mt-1">Reason: {m.moderation.decisionReason}</div>
                        ) : null}
                      </div>
                    ))}

                    {!loading && myUploads.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
                        You haven’t uploaded anything yet.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {uploadModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Upload study material"
        >
          <div className="absolute inset-0" onClick={() => setUploadModalOpen(false)} />
          <div className="relative w-full max-w-5xl rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">
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

            <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
              <form onSubmit={submitContribution} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={contrib.title}
                    onChange={(e) => {
                      contribTouchedRef.current.title = true;
                      setContrib((p) => ({ ...p, title: e.target.value }));
                    }}
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                  />
                  <input
                    value={contrib.moduleCode}
                    onChange={(e) => {
                      contribTouchedRef.current.moduleCode = true;
                      setContrib((p) => ({ ...p, moduleCode: e.target.value }));
                    }}
                    placeholder="Module code"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none"
                  />
                  <select
                    value={contrib.semester}
                    onChange={(e) => {
                      contribTouchedRef.current.semester = true;
                      setContrib((p) => ({ ...p, semester: e.target.value }));
                    }}
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
                    onChange={(e) => {
                      contribTouchedRef.current.category = true;
                      setContrib((p) => ({ ...p, category: e.target.value }));
                    }}
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
                  onChange={(e) => {
                    contribTouchedRef.current.description = true;
                    setContrib((p) => ({ ...p, description: e.target.value }));
                  }}
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

                  <div className="flex items-center gap-3">
                    {scanLoading ? (
                      <div className="text-xs text-gray-500">Scanning…</div>
                    ) : scanError ? (
                      <div className="text-xs text-red-600">{scanError}</div>
                    ) : null}

                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setContrib((p) => ({ ...p, file }));
                        if (file) scanAndAutofillFromFile(file);
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                  disabled={loading || scanLoading}
                >
                  <UploadCloud className="h-4 w-4" />
                  Submit for approval
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <AIChatBot />
    </>
  );
}
