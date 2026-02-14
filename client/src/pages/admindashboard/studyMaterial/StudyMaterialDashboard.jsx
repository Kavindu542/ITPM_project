import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserMenu from '../../../components/UserMenu';
import { authService } from '../../../services/authService';
import { studyMaterialService } from '../../../services/studyMaterialService';
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle,
  Download,
  Eye,
  RefreshCw,
  UploadCloud,
  XCircle,
} from 'lucide-react';

export default function StudyMaterialDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [materials, setMaterials] = React.useState([]);
  const [queue, setQueue] = React.useState([]);
  const [analytics, setAnalytics] = React.useState({ topMaterials: [], popularModules: [], recentDownloads: [] });

  const [expandedId, setExpandedId] = React.useState(null);
  const [detailsById, setDetailsById] = React.useState({});

  const [statusFilter, setStatusFilter] = React.useState('published');

  const [uploadMeta, setUploadMeta] = React.useState({
    title: '',
    description: '',
    moduleCode: '',
    subject: '',
    semester: '',
    category: 'notes',
    status: 'published',
    allowedSemesters: '',
    allowedModules: '',
    allowedRoles: '',
  });
  const [uploadFiles, setUploadFiles] = React.useState([]);

  const [rejectReason, setRejectReason] = React.useState({});

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/signin', { replace: true });
  };

  const refreshAll = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mRes, qRes, aRes] = await Promise.all([
        studyMaterialService.adminListMaterials({ status: statusFilter }),
        studyMaterialService.adminQueue('pending'),
        studyMaterialService.adminAnalytics(),
      ]);
      setMaterials(mRes?.items ?? []);
      setQueue(qRes?.items ?? []);
      setAnalytics(aRes ?? { topMaterials: [], popularModules: [], recentDownloads: [] });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const previewUrl = (m) =>
    studyMaterialService.fileUrl(m.id, { versionId: m?.currentVersion?.id, disposition: 'inline' });
  const downloadUrl = (m) =>
    studyMaterialService.fileUrl(m.id, { versionId: m?.currentVersion?.id, disposition: 'attachment' });

  const submitUpload = async (e) => {
    e.preventDefault();
    setError('');
    if (!uploadFiles.length) {
      setError('Please choose at least one file');
      return;
    }

    const fd = new FormData();
    uploadFiles.forEach((f) => fd.append('files', f));

    // Only append optional metadata if provided
    Object.entries(uploadMeta).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) return;
      fd.append(k, v);
    });

    setLoading(true);
    try {
      await studyMaterialService.adminUpload(fd);
      setUploadFiles([]);
      setUploadMeta((p) => ({ ...p, title: '', description: '' }));
      await refreshAll();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const uploadNewVersion = async (materialId, file) => {
    if (!file) return;
    setError('');
    const note = window.prompt('Version note (optional):', '') ?? '';

    const fd = new FormData();
    fd.append('file', file);
    if (note) fd.append('note', note);

    setLoading(true);
    try {
      await studyMaterialService.adminAddVersion(materialId, fd);
      await refreshAll();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to upload new version');
    } finally {
      setLoading(false);
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

  const approve = async (id) => {
    setLoading(true);
    setError('');
    try {
      await studyMaterialService.adminApprove(id, '');
      await refreshAll();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Approve failed');
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id) => {
    const reason = String(rejectReason[id] || '').trim();
    if (!reason) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await studyMaterialService.adminReject(id, reason);
      setRejectReason((p) => ({ ...p, [id]: '' }));
      await refreshAll();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Reject failed');
    } finally {
      setLoading(false);
    }
  };

  const totalMaterials = analytics?.topMaterials?.length ? materials.length : materials.length;
  const totalDownloads = (analytics?.topMaterials ?? []).reduce((sum, t) => sum + (t.downloadCount || 0), 0);

  const adminUploads = materials.filter((m) => !m?.suggested);
  const studentUploads = materials.filter((m) => !!m?.suggested);

  const renderMaterialRows = (items) =>
    items.map((m) => (
      <React.Fragment key={m.id}>
        <tr className="border-b border-gray-200 hover:bg-gray-100/60 transition-colors">
          <td className="py-3 px-6">
            <div className="font-semibold text-gray-900">{m.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{m.description || '—'}</div>
          </td>
          <td className="py-3 px-6 text-sm text-gray-700">{m.moduleCode || '—'}</td>
          <td className="py-3 px-6 text-sm text-gray-700">{m.semester ?? '—'}</td>
          <td className="py-3 px-6 text-sm text-gray-700">{m.downloadCount ?? 0}</td>
          <td className="py-3 px-6">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={previewUrl(m)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                Preview
              </a>
              <a
                href={downloadUrl(m)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white text-sm font-semibold"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => toggleVersions(m.id)}
              >
                Versions
              </button>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => uploadNewVersion(m.id, e.target.files?.[0] || null)}
                />
                <UploadCloud className="h-4 w-4" />
                New version
              </label>
            </div>
          </td>
        </tr>

        {expandedId === m.id ? (
          <tr className="border-b border-gray-200 bg-gray-100/30">
            <td colSpan={5} className="py-4 px-6">
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
                      <a
                        href={studyMaterialService.fileUrl(m.id, { versionId: v.id, disposition: 'inline' })}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Preview
                      </a>
                      <a
                        href={studyMaterialService.fileUrl(m.id, { versionId: v.id, disposition: 'attachment' })}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white text-sm font-semibold"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
                {detailsById[m.id] && (detailsById[m.id]?.versions || []).length === 0 ? (
                  <div className="text-sm text-gray-600">No versions found.</div>
                ) : null}
                {!detailsById[m.id] ? <div className="text-sm text-gray-600">Loading versions…</div> : null}
              </div>
            </td>
          </tr>
        ) : null}
      </React.Fragment>
    ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
      <div className="fixed inset-0 opacity-[0.06]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-[#25f194] rounded-xl">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Study Material</h1>
                  <p className="text-xs text-gray-500">Admin Dashboard</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors relative" type="button">
                  <Bell className="h-5 w-5 text-gray-600" />
                </button>

                <UserMenu user={user} onProfile={() => navigate('/profile')} onLogout={logout} theme="light" idLabel="ID" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Materials (filtered)</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalMaterials}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Top downloads (sum)</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalDownloads.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-[#25f194]/20 rounded-xl">
                  <Download className="h-6 w-6 text-[#25f194]" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending moderation</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{queue.length}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Upload */}
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Central Upload</h2>
                    <p className="text-sm text-gray-500 mt-1">Add official materials with metadata (single or bulk/folder)</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
                    onClick={refreshAll}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={submitUpload} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={uploadMeta.title}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Title (optional; if blank, uses file name)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      />
                      <input
                        value={uploadMeta.moduleCode}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, moduleCode: e.target.value }))}
                        placeholder="Module code (e.g. SE3020)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      />
                      <input
                        value={uploadMeta.subject}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, subject: e.target.value }))}
                        placeholder="Subject (optional)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      />
                      <select
                        value={uploadMeta.semester}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, semester: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      >
                        <option value="">Semester (optional)</option>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Semester {i + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        value={uploadMeta.category}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      >
                        <option value="notes">Lecture Notes</option>
                        <option value="tutes">Tutorials</option>
                        <option value="papers">Past Papers</option>
                        <option value="links">Useful Links</option>
                        <option value="other">Other</option>
                      </select>
                      <select
                        value={uploadMeta.status}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <textarea
                      value={uploadMeta.description}
                      onChange={(e) => setUploadMeta((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm min-h-[90px]"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        value={uploadMeta.allowedSemesters}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, allowedSemesters: e.target.value }))}
                        placeholder="Allowed semesters (e.g. 1,2,3)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      />
                      <input
                        value={uploadMeta.allowedModules}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, allowedModules: e.target.value }))}
                        placeholder="Allowed modules (comma-separated)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      />
                      <input
                        value={uploadMeta.allowedRoles}
                        onChange={(e) => setUploadMeta((p) => ({ ...p, allowedRoles: e.target.value }))}
                        placeholder="Allowed roles (e.g. student)"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-600">Select files (bulk) or folder</div>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                          className="text-sm"
                        />
                        <input
                          type="file"
                          multiple
                          webkitdirectory=""
                          directory=""
                          onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                          className="text-sm"
                        />
                        <div className="text-xs text-gray-500">Selected: {uploadFiles.length} file(s)</div>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#25f194] text-white rounded-xl font-semibold disabled:opacity-60"
                        disabled={loading}
                      >
                        <UploadCloud className="h-4 w-4" />
                        Upload
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Materials */}
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Materials</h2>
                    <p className="text-sm text-gray-500 mt-1">Version control supported (upload new versions)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Title</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Module</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Semester</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Downloads</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUploads.length ? (
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <td colSpan={5} className="py-2.5 px-6 text-sm font-semibold text-gray-800">
                            Admin uploads ({adminUploads.length})
                          </td>
                        </tr>
                      ) : null}
                      {renderMaterialRows(adminUploads)}

                      {studentUploads.length ? (
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <td colSpan={5} className="py-2.5 px-6 text-sm font-semibold text-gray-800">
                            Student uploads ({studentUploads.length})
                          </td>
                        </tr>
                      ) : null}
                      {renderMaterialRows(studentUploads)}

                      {!loading && materials.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 px-6 text-center text-sm text-gray-600">
                            No materials for this status.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Moderation Queue */}
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Moderation Queue</h2>
                  <p className="text-sm text-gray-500 mt-1">Review student uploads before publishing</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Material</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Student</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Reason (reject)</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {queue.map((q) => (
                        <tr key={q.id} className="border-b border-gray-200 hover:bg-gray-100/60 transition-colors">
                          <td className="py-3 px-6">
                            <div className="font-semibold text-gray-900">{q.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{q.moduleCode || '—'} {q.semester ? `• Semester ${q.semester}` : ''}</div>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-700">
                            {q?.uploadedBy?.name || '—'}
                            <div className="text-xs text-gray-500">{q?.uploadedBy?.studentId || q?.uploadedBy?.email || ''}</div>
                          </td>
                          <td className="py-3 px-6">
                            <input
                              value={rejectReason[q.id] || ''}
                              onChange={(e) => setRejectReason((p) => ({ ...p, [q.id]: e.target.value }))}
                              placeholder="Required to reject"
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                            />
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={studyMaterialService.fileUrl(q.id, { versionId: q?.currentVersion?.id, disposition: 'inline' })}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4" />
                                Preview
                              </a>
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60"
                                onClick={() => approve(q.id)}
                                disabled={loading}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
                                onClick={() => reject(q.id)}
                                disabled={loading}
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!loading && queue.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 px-6 text-center text-sm text-gray-600">
                            No pending items.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right column: Analytics */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
                  <p className="text-sm text-gray-500 mt-1">Most downloaded items, popular modules, and recent activity</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Top downloads</div>
                    <div className="space-y-2">
                      {(analytics?.topMaterials ?? []).slice(0, 5).map((t) => (
                        <div key={t._id || t.id || t.title} className="flex items-center justify-between text-sm">
                          <span className="text-gray-800 line-clamp-1">{t.title}</span>
                          <span className="text-gray-500">{t.downloadCount ?? 0}</span>
                        </div>
                      ))}
                      {(analytics?.topMaterials ?? []).length === 0 ? (
                        <div className="text-sm text-gray-600">No data yet.</div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Popular modules</div>
                    <div className="space-y-2">
                      {(analytics?.popularModules ?? []).slice(0, 6).map((m) => (
                        <div key={m.moduleCode} className="flex items-center justify-between text-sm">
                          <span className="text-gray-800">{m.moduleCode}</span>
                          <span className="text-gray-500">{m.downloads}</span>
                        </div>
                      ))}
                      {(analytics?.popularModules ?? []).length === 0 ? (
                        <div className="text-sm text-gray-600">No data yet.</div>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">Recent downloads</div>
                    <div className="space-y-3">
                      {(analytics?.recentDownloads ?? []).slice(0, 6).map((d, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="text-gray-900">
                            <span className="font-semibold">{d?.user?.name || 'User'}</span> downloaded{' '}
                            <span className="font-semibold">{d?.material?.title || 'Material'}</span>
                          </div>
                          <div className="text-xs text-gray-500">{new Date(d.downloadedAt).toLocaleString()}</div>
                        </div>
                      ))}
                      {(analytics?.recentDownloads ?? []).length === 0 ? (
                        <div className="text-sm text-gray-600">No recent activity.</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}