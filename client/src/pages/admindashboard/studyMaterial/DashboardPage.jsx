import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

import { studyMaterialService } from '../../../services/studyMaterialService';
import { toast } from '../../../lib/toast';

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState({ topMaterials: [], popularModules: [], recentDownloads: [] });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await studyMaterialService.adminAnalytics();
      setData(res ?? { topMaterials: [], popularModules: [], recentDownloads: [] });
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const topMaterials = data?.topMaterials ?? [];
  const popularModules = data?.popularModules ?? [];
  const recentDownloads = data?.recentDownloads ?? [];
  const moderationQueuePendingCount = Number(data?.moderationQueuePendingCount ?? 0);

  const topMaterialsTop5 = topMaterials.slice(0, 5);
  const popularModulesTop5 = popularModules.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Analytics overview</p>
          </div>
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

        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Top materials</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{topMaterials.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Popular modules</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{popularModules.length}</p>
              </div>
              <div className="p-3 bg-[#25f194]/20 rounded-xl">
                <BarChart3 className="h-6 w-6 text-[#25f194]" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent downloads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{recentDownloads.length}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Download className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <Link
            to="/admin/study-material/moderation-queue"
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Moderation Queue (pending)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{moderationQueuePendingCount}</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <BarChart3 className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-900">Top materials</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Title</th>
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Module</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-600">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {topMaterialsTop5.map((m, idx) => (
                  <tr key={`${m?._id || m?.id || idx}`} className="border-b border-gray-200">
                    <td className="py-3 px-5 text-sm text-gray-900 font-semibold">{m.title || '—'}</td>
                    <td className="py-3 px-5 text-sm text-gray-700">{m.moduleCode || '—'}</td>
                    <td className="py-3 px-5 text-sm text-gray-700 text-right">{m.downloadCount ?? 0}</td>
                  </tr>
                ))}
                {!loading && topMaterialsTop5.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 px-5 text-center text-sm text-gray-600">
                      No data.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-900">Popular modules</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-600">Module</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-600">Materials</th>
                  <th className="text-right py-3 px-5 text-xs font-semibold text-gray-600">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {popularModulesTop5.map((m, idx) => (
                  <tr key={`${m?.moduleCode || idx}`} className="border-b border-gray-200">
                    <td className="py-3 px-5 text-sm text-gray-900 font-semibold">{m.moduleCode || '—'}</td>
                    <td className="py-3 px-5 text-sm text-gray-700 text-right">{m.materials ?? 0}</td>
                    <td className="py-3 px-5 text-sm text-gray-700 text-right">{m.downloads ?? 0}</td>
                  </tr>
                ))}
                {!loading && popularModulesTop5.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 px-5 text-center text-sm text-gray-600">
                      No data.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
