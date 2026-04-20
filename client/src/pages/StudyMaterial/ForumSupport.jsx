import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Heart,
  MessageSquare,
  MessagesSquare,
  Paperclip,
  Search,
  Star,
  UploadCloud,
} from 'lucide-react';
import { studyMaterialService } from '../../services/studyMaterialService';
import { toast } from '../../lib/toast';
import { confirmDialog } from '../../lib/dialog';
import StudyMaterialSidebar from '../../components/StudyMaterialSidebar';


export default function ForumSupport({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);

  const [categories, setCategories] = React.useState([]);
  const [threads, setThreads] = React.useState([]);

  const [threadForm, setThreadForm] = React.useState({
    title: '',
    body: '',
    tags: '',
    moduleCode: '',
    topic: '',
    categorySlug: 'general-queries',
    attachments: [],
  });

  const [replyBodyByThread, setReplyBodyByThread] = React.useState({});
  const [replyAttachmentsByThread, setReplyAttachmentsByThread] = React.useState({});

  const [threadView, setThreadView] = React.useState('mine');

  const [showThreadModal, setShowThreadModal] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        studyMaterialService.listForumCategories(),
        studyMaterialService.listForumThreads(),
      ]);
      const c = cRes?.items ?? [];
      setCategories(c);
      setThreads(tRes?.items ?? []);

      if (!threadForm.categorySlug && c.length) {
        setThreadForm((p) => ({ ...p, categorySlug: c[0].slug }));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to load forum');
    } finally {
      setLoading(false);
    }
  }, [threadForm.categorySlug]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submitThread = async (e) => {
    e.preventDefault();
    if (!threadForm.title.trim() || !threadForm.body.trim()) {
      toast.error('Title and question are required');
      return;
    }

    setLoading(true);
    try {
      await studyMaterialService.createForumThread(threadForm);
      setThreadForm((p) => ({ ...p, title: '', body: '', tags: '', moduleCode: '', topic: '', attachments: [] }));
      await load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || e2?.message || 'Failed to post thread');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (threadId) => {
    const body = String(replyBodyByThread[threadId] || '').trim();
    if (!body) return;
    const attachments = Array.isArray(replyAttachmentsByThread[threadId])
      ? replyAttachmentsByThread[threadId]
      : [];

    setLoading(true);
    try {
      await studyMaterialService.createForumReply(threadId, { body, attachments });
      setReplyBodyByThread((p) => ({ ...p, [threadId]: '' }));
      setReplyAttachmentsByThread((p) => ({ ...p, [threadId]: [] }));
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (value) => {
    const bytes = Number(value || 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return '';

    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let v = bytes;
    while (v >= 1024 && unitIndex < units.length - 1) {
      v /= 1024;
      unitIndex += 1;
    }
    const digits = unitIndex === 0 ? 0 : v >= 10 ? 0 : 1;
    return `${v.toFixed(digits)} ${units[unitIndex]}`;
  };

  const renderAttachments = (attachments = [], { tone = 'other' } = {}) => {
    const items = Array.isArray(attachments) ? attachments : [];
    if (!items.length) return null;

    const isMineTone = tone === 'mine';
    const imageItems = items.filter((a) => /^image\//i.test(String(a?.mimeType || '')));
    const fileItems = items.filter((a) => !/^image\//i.test(String(a?.mimeType || '')));

    const thumbBorder = isMineTone ? 'border-white/20' : 'border-gray-200';
    const fileCard = isMineTone
      ? 'border-white/20 bg-white/10 text-white'
      : 'border-gray-200 bg-white text-gray-800';
    const fileMeta = isMineTone ? 'text-blue-100' : 'text-gray-500';

    return (
      <div className="mt-2 space-y-2">
        {imageItems.length ? (
          <div className={`grid ${imageItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            {imageItems.map((a, idx) => {
              const url = studyMaterialService.uploadsUrl(a?.url);
              const label = String(a?.originalName || '').trim() || `Image ${idx + 1}`;

              return (
                <a
                  key={`${url}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`block rounded-2xl overflow-hidden border ${thumbBorder}`}
                  title={label}
                >
                  <img src={url} alt={label} className="w-full h-44 object-cover" loading="lazy" />
                </a>
              );
            })}
          </div>
        ) : null}

        {fileItems.map((a, idx) => {
          const url = studyMaterialService.uploadsUrl(a?.url);
          const label = String(a?.originalName || '').trim() || `Attachment ${idx + 1}`;
          const mime = String(a?.mimeType || '');
          const isPdf = mime === 'application/pdf' || label.toLowerCase().endsWith('.pdf');
          const size = formatBytes(a?.sizeBytes);

          return (
            <a
              key={`${url}-${idx}`}
              href={url}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${fileCard}`}
              title={label}
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                  isMineTone ? 'border-white/20 bg-white/10' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {isPdf ? (
                  <FileText className={`w-5 h-5 ${isMineTone ? 'text-white' : 'text-gray-700'}`} />
                ) : (
                  <Paperclip className={`w-5 h-5 ${isMineTone ? 'text-white' : 'text-gray-700'}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`truncate font-semibold ${isMineTone ? 'text-white' : 'text-gray-900'}`}>{label}</div>
                <div className={`text-xs ${fileMeta}`}>{size || 'File'}</div>
              </div>
              <div className={`text-xs font-semibold ${fileMeta}`}>Open</div>
            </a>
          );
        })}
      </div>
    );
  };

  const myThreads = threads.filter((t) => !!t.isMine);
  const otherThreads = threads.filter((t) => !t.isMine);

  React.useEffect(() => {
    if (threadView === 'mine' && myThreads.length === 0 && otherThreads.length > 0) {
      setThreadView('others');
    }
  }, [threadView, myThreads.length, otherThreads.length]);

  const visibleThreads = threadView === 'mine' ? myThreads : otherThreads;

  const deleteOwnThread = async (threadId) => {
    try {
      await studyMaterialService.deleteOwnForumThread(threadId);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to delete thread');
    }
  };

  const upvoteThread = async (threadId) => {
    try {
      await studyMaterialService.upvoteForumThread(threadId);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to vote');
    }
  };

  const upvoteReply = async (replyId) => {
    try {
      await studyMaterialService.upvoteForumReply(replyId);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to vote');
    }
  };

  const acceptReply = async (replyId) => {
    try {
      await studyMaterialService.acceptForumReply(replyId);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to accept');
    }
  };

  const subscribe = async (threadId) => {
    try {
      await studyMaterialService.subscribeForumThread(threadId);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to subscribe');
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:from-blue-700 hover:to-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                  onClick={() => setShowThreadModal(true)}
                >
                  Post Thread
                </button>
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
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Attachments (images or documents)</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                          className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white file:px-3 file:py-2 file:text-xs file:font-semibold"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setThreadForm((p) => ({ ...p, attachments: files }));
                          }}
                        />
                        {Array.isArray(threadForm.attachments) && threadForm.attachments.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {threadForm.attachments.map((f, idx) => (
                              <span
                                key={`${f.name}-${idx}`}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                              >
                                <span className="max-w-[240px] truncate">{f.name}</span>
                                <button
                                  type="button"
                                  className="text-gray-500 hover:text-gray-700 font-bold"
                                  onClick={() => {
                                    setThreadForm((p) => ({
                                      ...p,
                                      attachments: p.attachments.filter((_, i) => i !== idx),
                                    }));
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:from-blue-700 hover:to-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 disabled:opacity-60"
                        >
                          Post Thread
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-start gap-3 flex-wrap">
                      <div className="inline-flex items-center gap-1 p-1 rounded-2xl border border-gray-200 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => setThreadView('mine')}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${threadView === 'mine' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600' : 'text-gray-700 hover:bg-white'}`}
                        >
                          My posts ({myThreads.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setThreadView('others')}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${threadView === 'others' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600' : 'text-gray-700 hover:bg-white'}`}
                        >
                          Other posts ({otherThreads.length})
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {visibleThreads.map((t) => (
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
                          onClick={async () => {
                            const ok = await confirmDialog({
                              title: 'Delete thread',
                              message: 'Delete this thread? This cannot be undone.',
                              confirmText: 'Delete',
                              cancelText: 'Cancel',
                              variant: 'danger',
                            });
                            if (ok) deleteOwnThread(t.id);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{t.body}</p>
                  {renderAttachments(t.attachments, { tone: 'other' })}
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-3">
                    <div className="space-y-3">
                      {(t.replies || []).filter((r) => !r.removed).map((r) => {
                        const isMine = !!r.isMine;
                        const avatar =
                          r.createdBy?.avatarUrl && String(r.createdBy.avatarUrl).trim() !== ''
                            ? r.createdBy.avatarUrl
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.createdBy?.name || 'Student')}&background=random`;

                        return (
                          <div key={r.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-end gap-2 max-w-[90%] ${isMine ? 'flex-row-reverse' : ''}`}>
                              <img
                                src={avatar}
                                alt={r.createdBy?.name || 'Student'}
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.createdBy?.name || 'Student')}&background=random`;
                                }}
                              />

                              <div
                                className={`rounded-2xl px-4 py-3 border text-sm shadow-sm ${
                                  isMine
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-transparent'
                                    : 'bg-white text-gray-900 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className={`text-[11px] font-semibold ${isMine ? 'text-white/90' : 'text-gray-700'}`}>
                                    {isMine ? 'You' : r.createdBy?.name || 'Student'}
                                  </div>
                                  <div className={`text-[11px] ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                                    {new Date(r.createdAt).toLocaleString()}
                                  </div>
                                </div>

                                <div className="mt-1 whitespace-pre-wrap break-words">{r.body}</div>

                                {Array.isArray(r.attachments) && r.attachments.length ? (
                                  <div className="mt-2">{renderAttachments(r.attachments, { tone: isMine ? 'mine' : 'other' })}</div>
                                ) : null}

                                <div className="mt-2 flex items-center justify-between gap-3">
                                  {r.accepted ? (
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                                        isMine
                                          ? 'border-white/20 bg-white/10 text-white'
                                          : 'border-green-200 bg-green-50 text-green-700'
                                      }`}
                                    >
                                      Accepted
                                    </span>
                                  ) : (
                                    <span className={`text-[11px] ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                                      Reply
                                    </span>
                                  )}

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => upvoteReply(r.id)}
                                      className={`px-2.5 py-1 rounded-xl border text-xs font-semibold ${
                                        isMine
                                          ? 'border-white/20 bg-white/10 text-white'
                                          : 'border-gray-200 bg-white text-gray-700'
                                      }`}
                                    >
                                      Upvote ({r.upvoteCount || 0})
                                    </button>
                                    {t.isMine && !r.accepted ? (
                                      <button
                                        type="button"
                                        onClick={() => acceptReply(r.id)}
                                        className="px-2.5 py-1 rounded-xl border border-green-200 bg-green-50 text-xs font-semibold text-green-700"
                                      >
                                        Accept
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {!t.locked ? (
                    <div className="mt-3">
                      {Array.isArray(replyAttachmentsByThread[t.id]) && replyAttachmentsByThread[t.id].length ? (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {replyAttachmentsByThread[t.id].map((f, idx) => (
                            <span
                              key={`${f.name}-${idx}`}
                              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700"
                            >
                              <span className="max-w-[240px] truncate">{f.name}</span>
                              <button
                                type="button"
                                className="text-gray-500 hover:text-gray-700 font-bold"
                                onClick={() => {
                                  setReplyAttachmentsByThread((p) => ({
                                    ...p,
                                    [t.id]: (p[t.id] || []).filter((_, i) => i !== idx),
                                  }));
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center gap-2 flex-wrap rounded-2xl border border-gray-200 bg-white p-2">
                        <input
                          value={replyBodyByThread[t.id] || ''}
                          onChange={(e) => setReplyBodyByThread((p) => ({ ...p, [t.id]: e.target.value }))}
                          placeholder="Write a reply"
                          className="flex-1 px-3 py-2 rounded-xl border border-transparent bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <label
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-700 cursor-pointer hover:bg-gray-50"
                          title="Attach files"
                        >
                          <Paperclip className="w-5 h-5" />
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setReplyAttachmentsByThread((p) => ({ ...p, [t.id]: files }));
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => submitReply(t.id)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold transition hover:from-blue-700 hover:to-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-500">Thread is locked.</div>
                  )}
                        </div>
                      ))}

                      {!loading && visibleThreads.length === 0 ? (
                        <div className="text-sm text-gray-600">No posts yet.</div>
                      ) : null}
                    </div>
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
