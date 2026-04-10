import React from 'react';
import { Download, Eye, RefreshCw } from 'lucide-react';

import { studyMaterialService } from '../../../services/studyMaterialService';
import { toast } from '../../../lib/toast';

export default function StudentUploadsPage() {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [status, setStatus] = React.useState('published');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await studyMaterialService.adminListMaterials({
        status,
        suggested: true,
        uploaderRole: 'student',
      });
      setItems(res?.items ?? []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to load student uploads');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    load();
  }, [load]);

  const previewUrl = (m) =>
    studyMaterialService.fileUrl(m.id, { versionId: m?.currentVersion?.id, disposition: 'inline' });
  const downloadUrl = (m) =>
    studyMaterialService.fileUrl(m.id, { versionId: m?.currentVersion?.id, disposition: 'attachment' });

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Student uploads</h2>
          <p className="text-sm text-gray-500 mt-1">Shows student-submitted materials (suggested)</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
          >
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
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
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Student</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Module</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Semester</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Downloads</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-b border-gray-200 hover:bg-gray-100/60 transition-colors">
                <td className="py-3 px-6">
                  <div className="font-semibold text-gray-900">{m.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.description || '—'}</div>
                </td>
                <td className="py-3 px-6">
                  <div className="text-sm font-semibold text-gray-900">
                    {m?.uploadedByUser?.name || '—'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(() => {
                      const studentId = m?.uploadedByUser?.studentId;
                      const email = m?.uploadedByUser?.email;
                      if (studentId && email) return `${studentId} • ${email}`;
                      return studentId || email || '';
                    })()}
                  </div>
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
                  </div>
                </td>
              </tr>
            ))}

            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 px-6 text-center text-sm text-gray-600">
                  No student uploads for this status.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
