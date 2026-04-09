import React from 'react';
import { FileDown, RefreshCw } from 'lucide-react';

import { studyMaterialService } from '../../../services/studyMaterialService';
import { exportPdfTable } from '../../../utils/pdfExport';
import { toast } from '../../../lib/toast';

export default function DownloadsHistoryPage() {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await studyMaterialService.adminDownloadsHistory({ limit: 200 });
      setItems(res?.items ?? []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to load downloads history');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const exportPdf = () => {
    exportPdfTable({
      title: 'Downloads history',
      filenameBase: 'downloads_history',
      columns: ['When', 'Student', 'Student ID', 'Email', 'Material', 'Module'],
      rows: (items || []).map((d) => [
        d?.downloadedAt ? new Date(d.downloadedAt).toLocaleString() : '—',
        d?.user?.name || '—',
        d?.user?.studentId || '—',
        d?.user?.email || '—',
        d?.material?.title || '—',
        d?.material?.moduleCode || '—',
      ]),
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Downloads history</h2>
          <p className="text-sm text-gray-500 mt-1">Shows all downloads</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportPdf}
            disabled={!items.length}
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
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">When</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Student</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Material</th>
              <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Module</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d, idx) => (
              <tr key={`${d?.downloadedAt || idx}`} className="border-b border-gray-200 hover:bg-gray-100/60 transition-colors">
                <td className="py-3 px-6 text-sm text-gray-700">
                  {d.downloadedAt ? new Date(d.downloadedAt).toLocaleString() : '—'}
                </td>
                <td className="py-3 px-6">
                  <div className="text-sm font-semibold text-gray-900">{d?.user?.name || '—'}</div>
                  <div className="text-xs text-gray-500">{d?.user?.studentId || d?.user?.email || ''}</div>
                </td>
                <td className="py-3 px-6 text-sm text-gray-900 font-semibold">{d?.material?.title || '—'}</td>
                <td className="py-3 px-6 text-sm text-gray-700">{d?.material?.moduleCode || '—'}</td>
              </tr>
            ))}

            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 px-6 text-center text-sm text-gray-600">
                  No downloads.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
