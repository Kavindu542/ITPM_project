import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import StudyMaterialSidebar from '../../components/StudyMaterialSidebar';


export default function ForumSupport({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [categories, setCategories] = React.useState([]);
  const [threads, setThreads] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('');

  const [threadForm, setThreadForm] = React.useState({
    title: '',
    body: '',
    tags: '',
    moduleCode: '',
    topic: '',
    categorySlug: 'general-queries',
  });

  const [replyBodyByThread, setReplyBodyByThread] = React.useState({});

  const [showThreadModal, setShowThreadModal] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, tRes] = await Promise.all([
        studyMaterialService.listForumCategories(),
        studyMaterialService.listForumThreads({ q: query || undefined, category: category || undefined }),
      ]);
      const c = cRes?.items ?? [];
      setCategories(c);
      setThreads(tRes?.items ?? []);

      if (!threadForm.categorySlug && c.length) {
        setThreadForm((p) => ({ ...p, categorySlug: c[0].slug }));
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load forum');
    } finally {
      setLoading(false);
    }
  }, [query, category, threadForm.categorySlug]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submitThread = async (e) => {
    e.preventDefault();
    if (!threadForm.title.trim() || !threadForm.body.trim()) {
      setError('Title and question are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await studyMaterialService.createForumThread(threadForm);
      setThreadForm((p) => ({ ...p, title: '', body: '', tags: '', moduleCode: '', topic: '' }));
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to post thread');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (threadId) => {
    const body = String(replyBodyByThread[threadId] || '').trim();
    if (!body) return;

    setLoading(true);
    setError('');
    try {
      await studyMaterialService.createForumReply(threadId, body);
      setReplyBodyByThread((p) => ({ ...p, [threadId]: '' }));
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const deleteOwnThread = async (threadId) => {
    setError('');
    try {
      await studyMaterialService.deleteOwnForumThread(threadId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete thread');
    }
  };

  const upvoteThread = async (threadId) => {
    setError('');
    try {
      await studyMaterialService.upvoteForumThread(threadId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to vote');
    }
  };

  const upvoteReply = async (replyId) => {
    setError('');
    try {
      await studyMaterialService.upvoteForumReply(replyId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to vote');
    }
  };

  const acceptReply = async (replyId) => {
    setError('');
    try {
      await studyMaterialService.acceptForumReply(replyId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to accept');
    }
  };

  const subscribe = async (threadId) => {
    setError('');
    try {
      await studyMaterialService.subscribeForumThread(threadId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to subscribe');
    }
  };

  return (
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
                  <div className="text-sm font-bold text-gray-900">Academic Support Forum</div>
                  <div className="text-xs text-gray-500 mt-1">Ask questions, reply, vote, and subscribe for updates.</div>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white px-4 py-2 text-sm font-semibold"
                  onClick={() => setShowThreadModal(true)}
                >
                  Post Thread
                </button>
              </div>

              {error ? <div className="p-5 text-sm text-red-700 bg-red-50 border-b border-red-100">{error}</div> : null}

              <div className="p-5 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search threads"
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c._id || c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={load}
                    className="rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
                <div className="p-5">
                  {showThreadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 p-8 w-full max-w-xl shadow-xl relative">
                        <button
                          type="button"
                          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
                          onClick={() => setShowThreadModal(false)}
                        >
                          ×
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Post a Question</h2>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={(e) => { submitThread(e); setShowThreadModal(false); }}>
                      <input
                        value={threadForm.title}
                        onChange={(e) => setThreadForm((p) => ({ ...p, title: e.target.value }))}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Question title"
                      />
                      <input
                        value={threadForm.moduleCode}
                        onChange={(e) => setThreadForm((p) => ({ ...p, moduleCode: e.target.value }))}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Module code (tag)"
                      />
                      <input
                        value={threadForm.topic}
                        onChange={(e) => setThreadForm((p) => ({ ...p, topic: e.target.value }))}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Topic"
                      />
                      <input
                        value={threadForm.tags}
                        onChange={(e) => setThreadForm((p) => ({ ...p, tags: e.target.value }))}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                        placeholder="Tags (comma separated)"
                      />
                      <select
                        value={threadForm.categorySlug}
                        onChange={(e) => setThreadForm((p) => ({ ...p, categorySlug: e.target.value }))}
                        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      >
                        {(categories.length ? categories : [{ slug: 'general-queries', name: 'General Queries' }]).map((c) => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                      <textarea
                        value={threadForm.body}
                        onChange={(e) => setThreadForm((p) => ({ ...p, body: e.target.value }))}
                        className="md:col-span-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm min-h-24"
                        placeholder="Write your question"
                      />
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        >
                          Post Thread
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                  )}

                  <div className="space-y-4">
                    {threads.map((t) => (
                      <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">{t.title}</h3>
                        {t.sticky ? <span className="px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold">Sticky</span> : null}
                        {t.announcement ? <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">Announcement</span> : null}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{t.categorySlug} • {t.moduleCode || '—'} • {new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => upvoteThread(t.id)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700">Upvote ({t.upvoteCount || 0})</button>
                      <button type="button" onClick={() => subscribe(t.id)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700">{t.subscribed ? 'Subscribed' : 'Subscribe'}</button>
                      {t.isMine ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this thread?')) deleteOwnThread(t.id);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{t.body}</p>
                  <div className="mt-3 space-y-2">
                    {(t.replies || []).filter((r) => !r.removed).map((r) => {
                      const isMine = !!r.isMine;
                      const avatar =
                        r.createdBy?.avatarUrl && String(r.createdBy.avatarUrl).trim() !== ''
                          ? r.createdBy.avatarUrl
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.createdBy?.name || 'Student')}&background=random`;
                      return (
                        <div key={r.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-end gap-2 max-w-[85%] ${isMine ? 'flex-row-reverse' : ''}`}>
                            <img
                              src={avatar}
                              alt={r.createdBy?.name || 'Student'}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.createdBy?.name || 'Student')}&background=random`;
                              }}
                            />
                            <div className={`rounded-2xl px-3 py-2 border text-sm ${isMine ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                              <div>{r.body}</div>
                              <div className={`mt-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                                {r.accepted ? 'Accepted • ' : ''}{r.createdBy?.name || 'Student'} • {new Date(r.createdAt).toLocaleString()}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <button type="button" onClick={() => upvoteReply(r.id)} className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${isMine ? 'border-blue-500/40 bg-blue-500/20 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>Upvote ({r.upvoteCount || 0})</button>
                                {t.isMine && !r.accepted ? (
                                  <button type="button" onClick={() => acceptReply(r.id)} className="px-2.5 py-1 rounded-lg border border-green-200 bg-green-50 text-xs font-semibold text-green-700">Accept</button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!t.locked ? (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        value={replyBodyByThread[t.id] || ''}
                        onChange={(e) => setReplyBodyByThread((p) => ({ ...p, [t.id]: e.target.value }))}
                        placeholder="Write a reply"
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => submitReply(t.id)}
                        className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
                      >
                        Reply
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-500">Thread is locked.</div>
                  )}
                      </div>
                    ))}
                    {!loading && threads.length === 0 ? <div className="text-sm text-gray-600">No threads found.</div> : null}
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
