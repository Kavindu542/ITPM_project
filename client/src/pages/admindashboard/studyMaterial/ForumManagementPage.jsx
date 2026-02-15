import React from 'react';

import { studyMaterialService } from '../../../services/studyMaterialService';

export default function ForumManagementPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [categories, setCategories] = React.useState([]);
  const [threads, setThreads] = React.useState([]);
  const [contributors, setContributors] = React.useState([]);

  const [newCategory, setNewCategory] = React.useState({ name: '', slug: '', description: '' });
  const [banUserId, setBanUserId] = React.useState('');
  const [banReason, setBanReason] = React.useState('');

  const [threadActionById, setThreadActionById] = React.useState({});
  const [threadCategoryById, setThreadCategoryById] = React.useState({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, tRes, topRes] = await Promise.all([
        studyMaterialService.listForumCategories(),
        studyMaterialService.listForumThreads(),
        studyMaterialService.adminForumTopContributors(),
      ]);
      setCategories(cRes?.items ?? []);
      setThreads(tRes?.items ?? []);
      setContributors(topRes?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load forum admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError('Category name is required');
      return;
    }

    setError('');
    try {
      await studyMaterialService.createForumCategory(newCategory);
      setNewCategory({ name: '', slug: '', description: '' });
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to create category');
    }
  };

  const deleteCategory = async (slug) => {
    if (!slug) return;
    if (!window.confirm(`Delete category "${slug}"? Threads will be moved to General Queries.`)) return;
    setError('');
    try {
      await studyMaterialService.adminDeleteForumCategory(slug);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete category');
    }
  };

  const updateThread = async (threadId) => {
    const thread = threads.find((item) => item.id === threadId);
    const action = threadActionById[threadId] || 'update';
    const payload = { action };
    if (action === 'move') {
      const categorySlug = (threadCategoryById[threadId] || thread?.categorySlug || '').trim();
      if (!categorySlug) {
        setError('Please select a valid category before moving this thread');
        return;
      }
      payload.categorySlug = categorySlug;
    }

    setError('');
    try {
      await studyMaterialService.adminUpdateForumThread(threadId, payload);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Thread update failed');
    }
  };

  const toggleReplyHelpful = async (replyId, helpful) => {
    setError('');
    try {
      await studyMaterialService.adminUpdateForumReply(replyId, {
        action: helpful ? 'mark-helpful' : 'unmark-helpful',
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Reply update failed');
    }
  };

  const removeReply = async (replyId) => {
    const reason = window.prompt('Reason for removing reply:', '') || '';
    setError('');
    try {
      await studyMaterialService.adminUpdateForumReply(replyId, { action: 'remove', reason });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to remove reply');
    }
  };

  const ban = async () => {
    const userId = banUserId.trim();
    if (!userId) {
      setError('User ID is required to ban');
      return;
    }

    setError('');
    try {
      await studyMaterialService.adminBanForumUser(userId, banReason);
      setBanUserId('');
      setBanReason('');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to ban user');
    }
  };

  const unban = async () => {
    const userId = banUserId.trim();
    if (!userId) {
      setError('User ID is required to unban');
      return;
    }

    setError('');
    try {
      await studyMaterialService.adminUnbanForumUser(userId);
      setBanUserId('');
      setBanReason('');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to unban user');
    }
  };

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900">Category Management</h2>
          <form className="mt-3 grid grid-cols-1 gap-2" onSubmit={createCategory}>
            <input
              value={newCategory.name}
              onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Category name"
            />
            <input
              value={newCategory.slug}
              onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Slug (optional)"
            />
            <input
              value={newCategory.description}
              onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Description"
            />
            <button type="submit" className="mt-1 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold">Create Category</button>
          </form>

          <div className="mt-4 space-y-2">
            {categories.map((c) => (
              <div key={c._id || c.slug} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-600">{c.slug}</div>
                </div>
                {c.slug !== 'general-queries' ? (
                  <button
                    type="button"
                    onClick={() => deleteCategory(c.slug)}
                    className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900">Ban / Unban User</h2>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <input
              value={banUserId}
              onChange={(e) => setBanUserId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="User ID"
            />
            <input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              placeholder="Ban reason"
            />
            <div className="flex gap-2">
              <button type="button" onClick={ban} className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">Ban</button>
              <button type="button" onClick={unban} className="px-3 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-semibold">Unban</button>
            </div>
          </div>

          <h3 className="mt-5 text-sm font-bold text-gray-900">Top contributors</h3>
          <div className="mt-2 space-y-2 max-h-60 overflow-auto">
            {contributors.map((c, idx) => (
              <div key={`${c.user?._id || idx}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <div className="font-semibold text-gray-900">{c.user?.name || c.user?._id || 'Unknown'}</div>
                <div className="text-xs text-gray-600">Threads: {c.threadCount} • Replies: {c.replyCount} • Score: {c.score}</div>
              </div>
            ))}
            {!loading && contributors.length === 0 ? <div className="text-sm text-gray-600">No contributor stats yet.</div> : null}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Thread Moderation</h2>
          <button type="button" onClick={load} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700">Refresh</button>
        </div>

        <div className="divide-y divide-gray-200">
          {threads.map((t) => (
            <div key={t.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{t.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.categorySlug} • by {t.createdBy?.name || 'Student'} • replies: {t.replyCount}</div>
                </div>
                <div className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</div>
              </div>

              <div className="mt-2 text-sm text-gray-700">{t.body}</div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                <select
                  value={threadActionById[t.id] || 'update'}
                  onChange={(e) => setThreadActionById((p) => ({ ...p, [t.id]: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                >
                  <option value="update">Update flags</option>
                  <option value="move">Move category</option>
                  <option value="remove">Remove thread</option>
                  <option value="restore">Restore thread</option>
                </select>
                <select
                  value={threadCategoryById[t.id] || t.categorySlug || ''}
                  onChange={(e) => setThreadCategoryById((p) => ({ ...p, [t.id]: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => updateThread(t.id)} className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold">
                  Apply
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {(t.replies || []).slice(0, 5).map((r) => (
                  <div key={r.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div className="text-sm text-gray-800">{r.body}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleReplyHelpful(r.id, !r.helpful)}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700"
                      >
                        {r.helpful ? 'Unmark Helpful' : 'Mark Helpful'}
                      </button>
                      {!r.removed ? (
                        <button
                          type="button"
                          onClick={() => removeReply(r.id)}
                          className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setThreadActionById((p) => ({ ...p, [t.id]: 'remove' }));
                    updateThread(t.id);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
                >
                  Remove Thread
                </button>
              </div>
            </div>
          ))}

          {!loading && threads.length === 0 ? <div className="p-6 text-sm text-gray-600">No threads found.</div> : null}
        </div>
      </div>
    </div>
  );
}
