import React from 'react';
import { UploadCloud } from 'lucide-react';

import { studyMaterialService } from '../../../services/studyMaterialService';
import { toast } from '../../../lib/toast';

export default function RequestsManagementPage() {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [feedbackById, setFeedbackById] = React.useState({});
  const [fileById, setFileById] = React.useState({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await studyMaterialService.adminListRequests();
      setItems(res?.items ?? []);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const markInProgress = async (id) => {
    if (loading) return;
    setLoading(true);
    try {
      await studyMaterialService.adminMarkRequestInProgress(id);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const fulfill = async (id) => {
    if (loading) return;
    const file = fileById[id];
    if (!file) {
      toast.error('Select a file to fulfill this request');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('feedback', feedbackById[id] || 'Completed: requested material uploaded.');

    setLoading(true);
    try {
      await studyMaterialService.adminFulfillRequest(id, fd);
      setFileById((p) => ({ ...p, [id]: null }));
      setFeedbackById((p) => ({ ...p, [id]: '' }));
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to fulfill request');
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id) => {
    if (loading) return;
    const reason = String(feedbackById[id] || '').trim();
    if (!reason) {
      toast.error('Reason is required for rejection');
      return;
    }

    setLoading(true);
    try {
      await studyMaterialService.adminRejectRequest(id, reason);
      setFeedbackById((p) => ({ ...p, [id]: '' }));
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'in-progress') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const completedCount = items.filter((i) => i.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Total requests</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{items.length}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Fulfilled</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{completedCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Request Dashboard</h2>
          <button type="button" onClick={load} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700">Refresh</button>
        </div>

        <div className="divide-y divide-gray-200">
          {items.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold text-gray-900">{r.title}</div>
                    {r.highDemand ? <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold">High demand</span> : null}
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">Requester: {r.requester?.name || 'Student'} ({r.requester?.studentId || '—'}) • {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-gray-500">Demand: {r.demandCount} • Upvotes: {r.upvoteCount}</div>
              </div>

              <p className="mt-2 text-sm text-gray-700">{r.description}</p>
              {r.feedback ? <div className="mt-2 text-xs text-gray-700"><span className="font-semibold">Feedback:</span> {r.feedback}</div> : null}

              {(r.status === 'pending' || r.status === 'in-progress') ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    value={feedbackById[r.id] || ''}
                    onChange={(e) => setFeedbackById((p) => ({ ...p, [r.id]: e.target.value }))}
                    placeholder="Feedback / rejection reason"
                    className="md:col-span-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  />
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFileById((p) => ({ ...p, [r.id]: e.target.files?.[0] || null }))}
                    />
                    <UploadCloud className="h-4 w-4" />
                    {fileById[r.id]?.name || 'Choose file'}
                  </label>

                  <div className="md:col-span-3 flex flex-wrap gap-2">
                    {r.status === 'pending' ? (
                      <button type="button" onClick={() => markInProgress(r.id)} disabled={loading} className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 disabled:opacity-60">
                        Mark In Progress
                      </button>
                    ) : null}
                    <button type="button" onClick={() => fulfill(r.id)} disabled={loading} className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white text-sm font-semibold disabled:opacity-60">
                      Fulfill & Notify
                    </button>
                    <button type="button" onClick={() => reject(r.id)} disabled={loading} className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 disabled:opacity-60">
                      Reject with Feedback
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {!loading && items.length === 0 ? <div className="p-6 text-sm text-gray-600">No requests found.</div> : null}
        </div>
      </div>
    </div>
  );
}
