import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
          <h1 className="text-2xl font-bold text-gray-900">Discussion Forum</h1>
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

          <form className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submitThread}>
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
            <div className="md:col-span-2">
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
                    <div className="mt-1 text-[11px] text-gray-500">by {r.createdBy?.name || 'Student'} • {new Date(r.createdAt).toLocaleString()}</div>
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
  );
}
