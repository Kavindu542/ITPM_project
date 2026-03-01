import React from 'react';
import { Download, Eye, FileDown, Pencil, RefreshCw, Trash2, UploadCloud } from 'lucide-react';

import { studyMaterialService } from '../../../services/studyMaterialService';
import { exportPdfTable } from '../../../utils/pdfExport';

const SEMESTER_OPTIONS = ['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'];

export default function CentralUploadAndMaterialsPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  const [materials, setMaterials] = React.useState([]);

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

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [expandedId, setExpandedId] = React.useState(null);
  const [detailsById, setDetailsById] = React.useState({});
  const [editMeta, setEditMeta] = React.useState({
    title: '',
    description: '',
    moduleCode: '',
    subject: '',
    semester: '',
    category: 'notes',
    status: 'published',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studyMaterialService.adminListMaterials({ status: 'published' });
      setMaterials(res?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

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

    Object.entries(uploadMeta).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) return;
      fd.append(k, v);
    });

    setLoading(true);
    try {
      await studyMaterialService.adminUpload(fd);
      setUploadFiles([]);
      setUploadMeta((p) => ({ ...p, title: '', description: '' }));
      setIsUploadOpen(false);
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!isUploadOpen) return;

    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') setIsUploadOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isUploadOpen]);

  const deleteMaterial = async (id) => {
    const ok = window.confirm('Delete this material?');
    if (!ok) return;

    setLoading(true);
    setError('');
    try {
      await studyMaterialService.adminDeleteMaterial(id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (m) => {
    setEditId(m.id);
    setEditMeta({
      title: m.title || '',
      description: m.description || '',
      moduleCode: m.moduleCode || '',
      subject: m.subject || '',
      semester: m.semester ?? '',
      category: m.category || 'notes',
      status: m.status || 'published',
    });
    setIsEditOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editId) return;

    setLoading(true);
    setError('');
    try {
      await studyMaterialService.adminUpdateMaterial(editId, editMeta);
      setIsEditOpen(false);
      setEditId(null);
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Update failed');
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
      setDetailsById((p) => ({ ...p, [materialId]: null }));
      await load();
      if (expandedId === materialId) {
        const res = await studyMaterialService.getMaterial(materialId);
        setDetailsById((p) => ({ ...p, [materialId]: res?.material ?? null }));
      }
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

  const exportMaterialsPdf = () => {
    exportPdfTable({
      title: 'Materials list',
      filenameBase: 'materials_list',
      columns: ['Title', 'Module', 'Semester', 'Status', 'Downloads'],
      rows: (materials || []).map((m) => [
        m?.title || '—',
        m?.moduleCode || '—',
        m?.semester ?? '—',
        m?.status || '—',
        m?.downloadCount ?? 0,
      ]),
    });
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Central upload & materials</h2>
            <p className="text-sm text-gray-500 mt-1">Upload and manage all materials (admin can delete)</p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#25f194] text-white rounded-xl font-semibold disabled:opacity-60"
            disabled={loading}
          >
            <UploadCloud className="h-4 w-4" />
            Upload
          </button>
        </div>

        <div className="p-6">
          <div className="text-sm text-gray-600">
            Click <span className="font-semibold">Upload</span> to add new materials.
          </div>
        </div>
      </div>

      {isUploadOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Upload materials"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsUploadOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-gray-900">Upload materials</div>
                <div className="text-sm text-gray-500">Add one or multiple files (bulk / folder)</div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={submitUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={uploadMeta.title}
                    onChange={(e) => setUploadMeta((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  />
                  <input
                    value={uploadMeta.moduleCode}
                    onChange={(e) => setUploadMeta((p) => ({ ...p, moduleCode: e.target.value }))}
                    placeholder="Module code (optional)"
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
                    {SEMESTER_OPTIONS.map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={uploadMeta.description}
                    onChange={(e) => setUploadMeta((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optional)"
                    className="md:col-span-2 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    rows={3}
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
        </div>
      ) : null}

      {isEditOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit material"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsEditOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-gray-900">Edit material</div>
                <div className="text-sm text-gray-500">Update title and details</div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={submitEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={editMeta.title}
                    onChange={(e) => setEditMeta((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    required
                  />
                  <input
                    value={editMeta.moduleCode}
                    onChange={(e) => setEditMeta((p) => ({ ...p, moduleCode: e.target.value }))}
                    placeholder="Module code (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  />
                  <input
                    value={editMeta.subject}
                    onChange={(e) => setEditMeta((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Subject (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  />
                  <select
                    value={editMeta.semester}
                    onChange={(e) => setEditMeta((p) => ({ ...p, semester: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="">Semester (optional)</option>
                    {SEMESTER_OPTIONS.map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editMeta.category}
                    onChange={(e) => setEditMeta((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="notes">Notes</option>
                    <option value="tutes">Tutes</option>
                    <option value="papers">Papers</option>
                    <option value="links">Links</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={editMeta.status}
                    onChange={(e) => setEditMeta((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <textarea
                    value={editMeta.description}
                    onChange={(e) => setEditMeta((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optional)"
                    className="md:col-span-2 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#25f194] text-white rounded-xl font-semibold disabled:opacity-60"
                    disabled={loading}
                  >
                    <Pencil className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Materials</h3>
            <p className="text-sm text-gray-500 mt-1">All published materials</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportMaterialsPdf}
              disabled={!materials.length}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Title</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Module</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Semester</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <React.Fragment key={m.id}>
                  <tr className="border-b border-gray-200 hover:bg-gray-100/60 transition-colors">
                    <td className="py-3 px-6">
                      <div className="font-semibold text-gray-900">{m.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{m.description || '—'}</div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700">{m.moduleCode || '—'}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">{m.semester ?? '—'}</td>
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
                          onClick={() => toggleVersions(m.id)}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
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
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMaterial(m.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === m.id ? (
                    <tr className="border-b border-gray-200 bg-gray-100/30">
                      <td colSpan={4} className="py-4 px-6">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Versions</div>
                        <div className="space-y-2">
                          {(detailsById[m.id]?.versions || []).map((v) => (
                            <div
                              key={v.id}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                            >
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{v.originalName}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {v.note ? `${v.note} • ` : ''}
                                  {v.createdAt ? new Date(v.createdAt).toLocaleString() : ''}
                                </div>
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
              ))}

              {!loading && materials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 px-6 text-center text-sm text-gray-600">
                    No materials.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
