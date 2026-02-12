import React from 'react';
import { CheckCircle, Eye, RefreshCw, XCircle } from 'lucide-react';

import { studyMaterialService } from '../../../services/studyMaterialService';

export default function ModerationQueuePage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [queue, setQueue] = React.useState([]);
  const [rejectReason, setRejectReason] = React.useState({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await studyMaterialService.adminQueue('pending');
      setQueue(res?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    setLoading(true);
    setError('');
    try {
      await studyMaterialService.adminApprove(id, '');
      await load();
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
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Reject failed');
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = (m) =>
    studyMaterialService.fileUrl(m.id, { versionId: m?.currentVersion?.id, disposition: 'inline' });

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Moderation Queue</h2>
          <p className="text-sm text-gray-500 mt-1">Review student uploads before publishing</p>
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

      {error ? (
        <div className="px-6 py-3 text-sm text-red-700 bg-red-50 border-b border-red-100">{error}</div>
      ) : null}

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
                  <div className="text-xs text-gray-500 mt-0.5">{q.description || '—'}</div>
                </td>
                <td className="py-3 px-6">
                  <div className="text-sm font-semibold text-gray-900">{q?.uploadedBy?.name || '—'}</div>
                  <div className="text-xs text-gray-500">{q?.uploadedBy?.studentId || q?.uploadedBy?.email || ''}</div>
                </td>
                <td className="py-3 px-6">
                  <input
                    value={rejectReason[q.id] || ''}
                    onChange={(e) => setRejectReason((p) => ({ ...p, [q.id]: e.target.value }))}
                    placeholder="Reason"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  />
                </td>
                <td className="py-3 px-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={previewUrl(q)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </a>
                    <button
                      type="button"
                      onClick={() => approve(q.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(q.id)}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
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
  );
}
