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

  const [threadFiles, setThreadFiles] = React.useState([]);

  const [replyBodyByThread, setReplyBodyByThread] = React.useState({});
  const [replyFilesByThread, setReplyFilesByThread] = React.useState({});

  const [editingReplyId, setEditingReplyId] = React.useState(null);
  const [editingReplyBody, setEditingReplyBody] = React.useState('');

  const [showThreadModal, setShowThreadModal] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState('mine');

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
      if (threadFiles.length) {
        const formData = new FormData();
        Object.entries(threadForm).forEach(([k, v]) => {
          if (v !== undefined && v !== null) formData.append(k, String(v));
        });
        threadFiles.forEach((f) => formData.append('attachments', f));
        await studyMaterialService.createForumThread(formData);
      } else {
        await studyMaterialService.createForumThread(threadForm);
      }
      setThreadForm((p) => ({ ...p, title: '', body: '', tags: '', moduleCode: '', topic: '' }));
      setThreadFiles([]);
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to post thread');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (threadId) => {
    const body = String(replyBodyByThread[threadId] || '').trim();
    const files = Array.isArray(replyFilesByThread[threadId]) ? replyFilesByThread[threadId] : [];
    if (!body && !files.length) return;

    setLoading(true);
    setError('');
    try {
      if (files.length) {
        const formData = new FormData();
        formData.append('body', body);
        files.forEach((f) => formData.append('attachments', f));
        await studyMaterialService.createForumReply(threadId, formData);
      } else {
        await studyMaterialService.createForumReply(threadId, body);
      }
      setReplyBodyByThread((p) => ({ ...p, [threadId]: '' }));
      setReplyFilesByThread((p) => ({ ...p, [threadId]: [] }));
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    const b = Number(bytes || 0);
    if (!Number.isFinite(b) || b <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    const idx = Math.min(units.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
    const val = b / Math.pow(1024, idx);
    return `${val.toFixed(val >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
  };

  const isImageAttachment = (a) => String(a?.mimeType || '').toLowerCase().startsWith('image/');

  const isPdfAttachment = (a) => {
    const mt = String(a?.mimeType || '').toLowerCase();
    if (mt === 'application/pdf') return true;
    return String(a?.originalName || '').toLowerCase().endsWith('.pdf');
  };

  const attachmentTypeLabel = (a) => {
    if (isPdfAttachment(a)) return 'PDF';
    if (isImageAttachment(a)) return 'Image';
    const name = String(a?.originalName || '');
    const ext = name.includes('.') ? name.split('.').pop() : '';
    return ext ? ext.toUpperCase().slice(0, 10) : 'File';
  };

  const AttachmentView = ({ attachment, tone = 'light' }) => {
    const a = attachment;
    const url = studyMaterialService.apiUrl(a.url);
    const openUrl = studyMaterialService.apiUrl(`${a.url}?disposition=inline`);

    if (isPdfAttachment(a)) {
      const metaParts = [];
      if (a.pageCount) metaParts.push(`${a.pageCount} pages`);
      metaParts.push('PDF');
      if (a.sizeBytes) metaParts.push(formatBytes(a.sizeBytes));
      const meta = metaParts.join(' • ');

      return (
        <div className={`rounded-xl border ${tone === 'dark' ? 'border-blue-500/40 bg-blue-500/20' : 'border-gray-200 bg-white'} overflow-hidden`}>
          <div className="h-28 bg-gray-50">
            <iframe
              title={a.originalName}
              src={`${openUrl}#page=1&view=FitH`}
              className="w-full h-full"
            />
          </div>
          <div className="px-3 py-2">
            <div className={`text-sm font-semibold ${tone === 'dark' ? 'text-white' : 'text-gray-900'}`}>{a.originalName}</div>
            {meta ? (
              <div className={`mt-0.5 text-xs ${tone === 'dark' ? 'text-blue-50/90' : 'text-gray-600'}`}>{meta}</div>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <a
                href={openUrl}
                target="_blank"
                rel="noreferrer"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${tone === 'dark' ? 'border-blue-500/40 bg-blue-500/20 text-white' : 'border-gray-200 bg-white text-gray-800'}`}
              >
                Open
              </a>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${tone === 'dark' ? 'border-blue-500/40 bg-blue-500/20 text-white' : 'border-gray-200 bg-white text-gray-800'}`}
              >
                Save as...
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (isImageAttachment(a)) {
      return (
        <a href={url} target="_blank" rel="noreferrer" className="inline-block">
          <img
            src={openUrl}
            alt={a.originalName}
            className={`max-h-40 w-auto rounded-xl border ${tone === 'dark' ? 'border-blue-500/40 bg-blue-500/20' : 'border-gray-200 bg-white'}`}
            loading="lazy"
          />
        </a>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`text-sm ${tone === 'dark' ? 'text-blue-50 underline' : 'text-blue-700 hover:underline'}`}
      >
        {a.originalName}{a.sizeBytes ? ` (${attachmentTypeLabel(a)} • ${formatBytes(a.sizeBytes)})` : ''}
      </a>
    );
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

  const startEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditingReplyBody(String(reply.body || ''));
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyBody('');
  };

  const saveEditedReply = async () => {
    if (!editingReplyId) return;
    setError('');
    setLoading(true);
    try {
      await studyMaterialService.updateOwnForumReply(editingReplyId, editingReplyBody);
      cancelEditReply();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to update reply');
    } finally {
      setLoading(false);
    }
  };

  const deleteOwnReply = async (replyId) => {
    setError('');
    setLoading(true);
    try {
      await studyMaterialService.deleteOwnForumReply(replyId);
      if (editingReplyId === replyId) cancelEditReply();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to delete reply');
    } finally {
      setLoading(false);
    }
  };

  const myThreads = React.useMemo(() => threads.filter((t) => !!t.isMine), [threads]);
  const otherThreads = React.useMemo(() => threads.filter((t) => !t.isMine), [threads]);

  const renderThreadList = (list) => {
    return list.map((t) => (
      <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">{t.title}</h3>
              {t.sticky ? (
                <span className="px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-semibold">Sticky</span>
              ) : null}
              {t.announcement ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">Announcement</span>
              ) : null}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t.categorySlug} • {t.moduleCode || '—'} • {new Date(t.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => upvoteThread(t.id)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700"
            >
              Upvote ({t.upvoteCount || 0})
            </button>
            <button
              type="button"
              onClick={() => subscribe(t.id)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700"
            >
              {t.subscribed ? 'Subscribed' : 'Subscribe'}
            </button>
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

        {(t.attachments || []).length ? (
          <div className="mt-3">
            <div className="text-xs font-semibold text-gray-700">Attachments</div>
            <div className="mt-1 flex flex-col gap-1">
              {(t.attachments || []).map((a) => (
                <div key={a.id} className="flex flex-col gap-2">
                  <AttachmentView attachment={a} tone="light" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

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
                  <div
                    className={`rounded-2xl px-3 py-2 border text-sm ${
                      isMine ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-800 border-gray-200'
                    }`}
                  >
                    {editingReplyId === r.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingReplyBody}
                          onChange={(e) => setEditingReplyBody(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-sm min-h-20 ${
                            isMine
                              ? 'border-blue-500/40 bg-blue-500/20 text-white placeholder-blue-100'
                              : 'border-gray-200 bg-white text-gray-800'
                          }`}
                          placeholder="Edit your reply"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditReply}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                              isMine ? 'border-blue-500/40 bg-blue-500/20 text-white' : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={loading}
                            onClick={saveEditedReply}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold disabled:opacity-60 ${
                              isMine ? 'border-blue-500/40 bg-blue-500/20 text-white' : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : r.body ? (
                      <div>{r.body}</div>
                    ) : null}

                    {(r.attachments || []).length ? (
                      <div className="mt-2 flex flex-col gap-1">
                        {(r.attachments || []).map((a) => (
                          <div key={a.id} className="flex flex-col gap-2">
                            <AttachmentView attachment={a} tone={isMine ? 'dark' : 'light'} />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className={`mt-1 text-[11px] ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                      {r.accepted ? 'Accepted • ' : ''}
                      {r.createdBy?.name || 'Student'} • {new Date(r.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {isMine ? (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditReply(r)}
                            disabled={loading || editingReplyId === r.id}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold disabled:opacity-60 ${
                              isMine
                                ? 'border-blue-500/40 bg-blue-500/20 text-white'
                                : 'border-gray-200 bg-white text-gray-700'
                            }`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this reply?')) deleteOwnReply(r.id);
                            }}
                            disabled={loading}
                            className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => upvoteReply(r.id)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                          isMine ? 'border-blue-500/40 bg-blue-500/20 text-white' : 'border-gray-200 bg-white text-gray-700'
                        }`}
                      >
                        Upvote ({r.upvoteCount || 0})
                      </button>
                      {t.isMine && !r.accepted ? (
                        <button
                          type="button"
                          onClick={() => acceptReply(r.id)}
                          className="px-2.5 py-1 rounded-lg border border-green-200 bg-green-50 text-xs font-semibold text-green-700"
                        >
                          Accept
                        </button>
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
            <input
              type="file"
              multiple
              onChange={(e) =>
                setReplyFilesByThread((p) => ({
                  ...p,
                  [t.id]: Array.from(e.target.files || []),
                }))
              }
              className="max-w-[220px] px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
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
    ));
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
                  Post Your Question?
                </button>
              </div>
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
                    <form
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      onSubmit={async (e) => {
                        await submitThread(e);
                        setShowThreadModal(false);
                      }}
                    >
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
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setThreadFiles(Array.from(e.target.files || []))}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                        />
                        {threadFiles.length ? (
                          <div className="mt-1 text-xs text-gray-600">
                            {threadFiles.length} file(s) selected
                          </div>
                        ) : null}
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                        >
                          Post Your Question?
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <div className="inline-flex rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab('mine')}
                  className={`px-4 py-2 text-sm font-semibold ${
                    activeTab === 'mine' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  My Questions ({myThreads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('others')}
                  className={`px-4 py-2 text-sm font-semibold border-l border-gray-200 ${
                    activeTab === 'others' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Other Questions ({otherThreads.length})
                </button>
              </div>

              <div className="space-y-4 mt-4">
                {activeTab === 'mine' ? (
                  !loading && myThreads.length === 0 ? (
                    <div className="text-sm text-gray-600">You haven’t posted any questions yet.</div>
                  ) : (
                    renderThreadList(myThreads)
                  )
                ) : !loading && otherThreads.length === 0 ? (
                  <div className="text-sm text-gray-600">No threads found.</div>
                ) : (
                  renderThreadList(otherThreads)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
