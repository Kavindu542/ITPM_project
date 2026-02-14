import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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

import UserMenu from '../../components/UserMenu';
import { authService } from '../../services/authService';
import { studyMaterialService } from '../../services/studyMaterialService';


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

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>
      <div className="relative w-full p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-gray-200 hover:bg-white transition-colors"
            onClick={() => navigate('/materials/all')}
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-800">Back to Materials</span>
          </button>
          <UserMenu user={user} onProfile={() => navigate('/profile')} onLogout={logout} theme="light" idLabel="ID" />
        </div>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm">
          <div className="p-6 sm:p-8 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-[#25f194] shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h4" /></svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Study Materials</h1>
              <p className="mt-1 text-sm text-gray-600">
                Browse resources by module/semester, preview, download, and contribute your own.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7V6a2 2 0 012-2h2a2 2 0 012 2v1m10 0V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v1m-6 4h16m-2 4h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v1m-6 4H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1" /></svg>
                  Filter by module & semester
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                  Preview before downloading
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#25f194] to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
                onClick={() => navigate('/materials/contribute')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Contribute
              </button>
              <p className="text-xs text-gray-500">Uploads go for admin approval</p>
            </div>
          </div>
        </div>

        {/* Sidebar + Content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <div className="text-sm font-bold text-gray-900">Menu</div>
                <div className="text-xs text-gray-500 mt-1">
                  {user?.semester ? `Your semester: ${user.semester}` : 'Set your semester in Profile for access rules.'}
                </div>
              </div>
              <div className="p-3 space-y-1">
                <button
                  onClick={() => navigate('/materials/all')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-white border-gray-200 hover:bg-gray-50"
                >
                  < FolderOpen className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-800">All materials</span>
                </button>
                <button
                  onClick={() => navigate('/materials/favs')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-white border-gray-200 hover:bg-gray-50"
                >
                  <Heart className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-800">Favourites</span>
                </button>
                <button
                  onClick={() => navigate('/materials/history')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-white border-gray-200 hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-800">History</span>
                </button>
                <button
                  onClick={() => navigate('/materials/contribute')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-white border-gray-200 hover:bg-gray-50"
                >
                  <UploadCloud className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-800">Contribute</span>
                </button>
                <button
                  onClick={() => navigate('/materials/requests')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-white border-gray-200 hover:bg-gray-50"
                >
                  <FolderOpen className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-800">Missing resource requests</span>
                </button>
                <button
                  onClick={() => navigate('/materials/reviews')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-white border-gray-200 hover:bg-gray-50"
                >
                  <Star className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-800">Ratings & reviews</span>
                </button>
                <button
                  onClick={() => navigate('/materials/forum')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-gray-900 border-gray-900"
                >
                  <MessagesSquare className="h-4 w-4 text-white" />
                  <span className="text-white">Academic support forum</span>
                </button>
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="lg:col-span-9">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Academic Support Forum</h1>
              <p className="text-sm text-gray-600 mt-1">Post questions, answer peers, vote useful replies, and subscribe for updates.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    <option key={c._id || c.slug} value={c.slug}>{c.name}</option>
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
              <div className="mt-5">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white px-4 py-2 text-sm font-semibold"
                  onClick={() => setShowThreadModal(true)}
                >
                  Post Thread
                </button>
              </div>
              {showThreadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-xl shadow-xl relative">
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
            </div>
            <div className="space-y-4 mt-6">
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
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{t.body}</p>
                  <div className="mt-3 space-y-2">
                    {(t.replies || []).filter((r) => !r.removed).map((r) => (
                      <div key={r.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm text-gray-800">{r.body}</div>
                          <div className="flex items-center gap-2">
                            {r.accepted ? <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">Accepted</span> : null}
                            <button type="button" onClick={() => upvoteReply(r.id)} className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700">Upvote ({r.upvoteCount || 0})</button>
                            {t.isMine && !r.accepted ? (
                              <button type="button" onClick={() => acceptReply(r.id)} className="px-2.5 py-1 rounded-lg border border-green-200 bg-green-50 text-xs font-semibold text-green-700">Accept</button>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-2">
                          <img
                            src={
                              (user && r.createdBy && user.id === r.createdBy.id && user.profilePicture && user.profilePicture.trim() !== "")
                                ? user.profilePicture
                                : (r.createdBy?.profilePicture && r.createdBy.profilePicture.trim() !== "")
                                  ? r.createdBy.profilePicture
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.createdBy?.name || "Student")}&background=random`
                            }
                            alt={r.createdBy?.name || 'Student'}
                            className="w-8 h-8 rounded-full border-2 border-blue-200 shadow-sm object-cover bg-white"
                            style={{ minWidth: 32, minHeight: 32, objectFit: 'cover', backgroundColor: '#fff' }}
                            onError={e => {
                              e.target.onerror = null;
                              e.target.src = "/default-avatar.png";
                            }}
                          />
                          <span>by {r.createdBy?.name || 'Student'} • {new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
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
  );
}
