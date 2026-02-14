import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowLeft, Clock3, Download, ThumbsUp } from 'lucide-react';

import UserMenu from '../../components/UserMenu';
import { authService } from '../../services/authService';
import { studyMaterialService } from '../../services/studyMaterialService';

export default function RequestsCenter({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [history, setHistory] = React.useState([]);

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    moduleCode: '',
    courseCode: '',
    syllabusLink: '',
  });

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allRes, myRes] = await Promise.all([
        studyMaterialService.listRequests(),
        studyMaterialService.listRequests({ mine: true }),
      ]);
      setItems(allRes?.items ?? []);
      setHistory(myRes?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      await studyMaterialService.submitRequest(form);
      setForm({ title: '', description: '', moduleCode: '', courseCode: '', syllabusLink: '' });
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const upvote = async (id) => {
    setError('');
    try {
      await studyMaterialService.upvoteRequest(id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to upvote');
    }
  };

  const statusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'in-progress') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'rejected') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const getMaterialFromRequest = (request) => {
    const raw = request?.fulfilledMaterialId;
    if (!raw) return null;
    if (typeof raw === 'string') return { id: raw, title: 'Requested material' };
    const id = raw.id || raw._id;
    if (!id) return null;
    return {
      id,
      title: raw.title || 'Requested material',
      moduleCode: raw.moduleCode || '',
      semester: raw.semester,
    };
  };

  const openFulfilledMaterial = (request) => {
    const material = getMaterialFromRequest(request);
    if (!material?.id) return;
    const url = studyMaterialService.fileUrl(material.id, { disposition: 'inline' });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFulfilledMaterial = (request) => {
    const material = getMaterialFromRequest(request);
    if (!material?.id) return;
    const url = studyMaterialService.fileUrl(material.id, { disposition: 'attachment' });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 font-medium"
            onClick={() => navigate('/materials/all')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Materials
          </button>
          <UserMenu user={user} onProfile={() => navigate('/profile')} onLogout={logout} theme="light" idLabel="ID" />
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Missing Resources</h1>
          <p className="text-sm text-gray-600 mt-1">Submit what is missing, upvote similar requests, and track status updates.</p>

          <form className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Request title"
            />
            <input
              value={form.moduleCode}
              onChange={(e) => setForm((p) => ({ ...p, moduleCode: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Module code (optional)"
            />
            <input
              value={form.courseCode}
              onChange={(e) => setForm((p) => ({ ...p, courseCode: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Course code (optional)"
            />
            <input
              value={form.syllabusLink}
              onChange={(e) => setForm((p) => ({ ...p, syllabusLink: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Syllabus link (optional)"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="md:col-span-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm min-h-24"
              placeholder="Describe the missing material"
            />
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Open Requests (Upvote)</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[520px] overflow-auto">
              {items.filter((i) => i.status !== 'completed' && i.status !== 'rejected').map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{r.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{r.moduleCode || '—'} {r.courseCode ? `• ${r.courseCode}` : ''}</div>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{r.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(r.createdAt).toLocaleString()}</span>
                    {r.highDemand ? <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-semibold">High demand</span> : null}
                    <span>Demand: {r.demandCount}</span>
                    <span>Upvotes: {r.upvoteCount}</span>
                  </div>
                  {r.status === 'completed' && getMaterialFromRequest(r) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openFulfilledMaterial(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-sm font-semibold text-green-700 hover:bg-green-100"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        Open Document
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFulfilledMaterial(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="h-4 w-4" />
                        Download Document
                      </button>
                    </div>
                  ) : null}
                  {!r.isRequester ? (
                    <button
                      type="button"
                      onClick={() => upvote(r.id)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {r.upvoted ? 'Upvoted' : 'Upvote'}
                    </button>
                  ) : null}
                </div>
              ))}
              {!loading && items.length === 0 ? <div className="p-6 text-sm text-gray-600">No requests yet.</div> : null}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">My Request History</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[520px] overflow-auto">
              {history.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-gray-900">{r.title}</div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{r.description}</p>
                  <div className="mt-2 text-xs text-gray-500">Submitted: {new Date(r.createdAt).toLocaleString()}</div>
                  {r.fulfilledAt ? <div className="mt-1 text-xs text-green-700">Completed: {new Date(r.fulfilledAt).toLocaleString()}</div> : null}
                  {r.feedback ? <div className="mt-2 text-xs text-gray-700"><span className="font-semibold">Feedback:</span> {r.feedback}</div> : null}
                  {r.status === 'completed' && getMaterialFromRequest(r) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openFulfilledMaterial(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-sm font-semibold text-green-700 hover:bg-green-100"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        Open Document
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFulfilledMaterial(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Download className="h-4 w-4" />
                        Download Document
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {!loading && history.length === 0 ? <div className="p-6 text-sm text-gray-600">No history found.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
