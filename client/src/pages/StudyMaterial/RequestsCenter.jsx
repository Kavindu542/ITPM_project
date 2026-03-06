import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Download,
  FolderOpen,
  MessageSquare,
  MessagesSquare,
  Search,
  Star,
  UploadCloud,
  ArrowUpRight,
  Clock3,
  ThumbsUp,
  Heart,
} from 'lucide-react';
import { studyMaterialService } from '../../services/studyMaterialService';
import StudyMaterialSidebar from '../../components/StudyMaterialSidebar';


export default function RequestsCenter({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [requestsTab, setRequestsTab] = React.useState('open');

  const [form, setForm] = React.useState({
    title: '',
    description: '',
    moduleCode: '',
    courseCode: '',
    syllabusLink: '',
  });
  const [requestModalOpen, setRequestModalOpen] = React.useState(false);

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

  const openRequests = React.useMemo(
    () => items.filter((i) => i.status !== 'completed' && i.status !== 'rejected'),
    [items],
  );

  return (
    <>
      <div className="h-[calc(100vh-6rem)] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans overflow-auto no-scrollbar lg:overflow-hidden">
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
            <div className="lg:col-span-11 lg:h-full lg:min-h-0">
              <div className="lg:h-full lg:min-h-0 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Missing Resource Requests</div>
                    <div className="text-xs text-gray-500 mt-1">Submit missing items, upvote similar requests, and track status.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold"
                  >
                    New request
                  </button>
                </div>

                {error ? <div className="p-5 text-sm text-red-700 bg-red-50 border-b border-red-100">{error}</div> : null}

                <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm text-gray-600">
                    {requestsTab === 'open' ? 'Browse open requests and upvote what you need.' : 'Track your submitted requests and outcomes.'}
                  </div>
                  <div className="inline-flex rounded-2xl bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setRequestsTab('open')}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                        requestsTab === 'open'
                          ? 'bg-gradient-to-r from-[#25f194] to-blue-600 text-gray-900'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      Open requests
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestsTab('history')}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                        requestsTab === 'history'
                          ? 'bg-gradient-to-r from-[#25f194] to-blue-600 text-gray-900'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      My history
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
                  <div className="p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {requestsTab === 'open'
                        ? openRequests.map((r) => (
                            <div key={r.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{r.title}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {r.moduleCode || '—'} {r.courseCode ? `• ${r.courseCode}` : ''}
                                  </div>
                                </div>
                                <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass(r.status)}`}>
                                  {r.status}
                                </span>
                              </div>

                              <p className="mt-2 text-sm text-gray-700 line-clamp-3">{r.description}</p>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {new Date(r.createdAt).toLocaleString()}
                                </span>
                                {r.highDemand ? (
                                  <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-semibold">
                                    High demand
                                  </span>
                                ) : null}
                                <span>Demand: {r.demandCount}</span>
                                <span>Upvotes: {r.upvoteCount}</span>
                              </div>

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
                          ))
                        : history.map((r) => (
                            <div key={r.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="font-semibold text-gray-900 min-w-0 truncate">{r.title}</div>
                                <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass(r.status)}`}>
                                  {r.status}
                                </span>
                              </div>

                              <p className="mt-2 text-sm text-gray-700 line-clamp-3">{r.description}</p>
                              <div className="mt-2 text-xs text-gray-500">Submitted: {new Date(r.createdAt).toLocaleString()}</div>
                              {r.fulfilledAt ? (
                                <div className="mt-1 text-xs text-green-700">Completed: {new Date(r.fulfilledAt).toLocaleString()}</div>
                              ) : null}
                              {r.feedback ? (
                                <div className="mt-2 text-xs text-gray-700">
                                  <span className="font-semibold">Feedback:</span> {r.feedback}
                                </div>
                              ) : null}

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

                      {!loading && requestsTab === 'open' && openRequests.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
                          No requests yet.
                        </div>
                      ) : null}
                      {!loading && requestsTab === 'history' && history.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
                          No history found.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {requestModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Submit missing resource request">
          <div className="absolute inset-0" onClick={() => setRequestModalOpen(false)} />
          <div className="relative w-full max-w-3xl rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-gray-900">New request</div>
                <div className="text-xs text-gray-500 mt-1">Be specific so others can find and upvote it.</div>
              </div>
              <button
                type="button"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
                onClick={() => setRequestModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={(e) => { submit(e); setRequestModalOpen(false); }}>
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
          </div>
        </div>
      ) : null}
    </>
  );
}
