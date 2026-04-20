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
import { toast } from '../../lib/toast';
import { confirmDialog } from '../../lib/dialog';
import StudyMaterialSidebar from '../../components/StudyMaterialSidebar';

export default function ReviewsCenter({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);

  const [materials, setMaterials] = React.useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = React.useState('');

  const [reviewsByMaterialId, setReviewsByMaterialId] = React.useState({});
  const [reviewSort, setReviewSort] = React.useState('highest');
  const [reviewsTab, setReviewsTab] = React.useState('mine');

  const [reviewForm, setReviewForm] = React.useState({ rating: 5, reviewText: '' });
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);

  const getCategoryLabel = React.useCallback((categoryId) => {
    const key = String(categoryId || '').trim();
    if (!key) return '';
    if (key === 'notes') return 'Lecture Notes';
    if (key === 'tutes') return 'Tutorials';
    if (key === 'papers') return 'Past Papers';
    if (key === 'links') return 'Useful Links';
    if (key === 'other') return 'Other';
    return key;
  }, []);

  const loadMaterials = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await studyMaterialService.listHistory();
      const events = res?.items ?? [];

      const seen = new Set();
      const list = events
        .map((entry) => entry?.material)
        .filter((m) => m?.id)
        .filter((m) => {
          const id = String(m.id);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

      setMaterials(list);
      if (!list.some((m) => String(m.id) === String(selectedMaterialId))) {
        setSelectedMaterialId(list[0]?.id || '');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Failed to load downloaded materials');
    } finally {
      setLoading(false);
    }
  }, [selectedMaterialId]);

  const loadAllReviews = React.useCallback(
    async (materialList) => {
      const list = Array.isArray(materialList) ? materialList : materials;
      const ids = list.map((m) => String(m?.id || '')).filter(Boolean);
      if (!ids.length) {
        setReviewsByMaterialId({});
        return;
      }

      setLoading(true);

      try {
        const results = await Promise.allSettled(
          ids.map(async (id) => {
            const res = await studyMaterialService.listMaterialReviews(id, { sortBy: reviewSort });
            return [id, res?.items ?? []];
          }),
        );

        const next = {};
        for (const r of results) {
          if (r.status === 'fulfilled') {
            const [id, items] = r.value;
            next[id] = items;
          }
        }
        setReviewsByMaterialId(next);
      } catch (e) {
        toast.error(e?.response?.data?.message || e?.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    },
    [materials, reviewSort],
  );

  React.useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  React.useEffect(() => {
    if (!materials.length) return;
    loadAllReviews(materials);
  }, [materials, loadAllReviews]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!selectedMaterialId) return;
    setLoading(true);
    try {
      await studyMaterialService.createOrUpdateReview(selectedMaterialId, reviewForm);
      setReviewForm((p) => ({ ...p, reviewText: '' }));
      await loadMaterials();
      await loadAllReviews();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || e2?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const voteReview = async (reviewId, vote) => {
    try {
      await studyMaterialService.voteReview(reviewId, vote);
      await loadAllReviews();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Vote failed');
    }
  };

  const deleteReview = async (reviewId) => {
    const ok = await confirmDialog({
      title: 'Delete review',
      message: 'Delete your review?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await studyMaterialService.deleteOwnReview(reviewId);
      await loadMaterials();
      await loadAllReviews();
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Delete failed');
    }
  };

  const renderStars = (rating) => (
    <div className="inline-flex items-center gap-1 text-amber-600 text-sm">
      {Array.from({ length: Number(rating || 0) }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );

  const renderRatingSummary = (reviews) => {
    const list = Array.isArray(reviews) ? reviews : [];
    if (!list.length) return <div className="text-xs text-gray-500">No ratings yet</div>;
    const avg = list.reduce((sum, r) => sum + Number(r?.rating || 0), 0) / list.length;
    const shown = Number.isFinite(avg) ? avg.toFixed(1) : '0.0';
    const filled = Math.max(0, Math.min(5, Math.round(avg)));
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < filled ? 'text-yellow-600' : 'text-gray-300'}`}
              fill={i < filled ? 'currentColor' : 'none'}
            />
          ))}
        </div>
        <div className="text-xs text-gray-600">
          {shown} ({list.length})
        </div>
      </div>
    );
  };

  const selectedMyReview = React.useMemo(() => {
    const id = String(selectedMaterialId || '');
    if (!id) return null;
    const list = reviewsByMaterialId[id] || [];
    return list.find((r) => r.isMine) || null;
  }, [reviewsByMaterialId, selectedMaterialId]);

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
          <div className="mt-0 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:h-full lg:overflow-hidden lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]">
            <div className="lg:col-span-1 lg:h-full lg:min-h-0">
              <StudyMaterialSidebar user={user} />
            </div>

            <div className="lg:col-span-11 lg:h-full lg:min-h-0">
              <div className="lg:h-full lg:min-h-0 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-bold text-gray-900">Ratings & Reviews</div>
                    <div className="text-xs text-gray-500 mt-1">Rate materials you downloaded and vote helpful feedback.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:from-blue-700 hover:to-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                  >
                    Write a review
                  </button>
                </div>

                <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-1 p-1 rounded-2xl border border-gray-200 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setReviewsTab('mine')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        reviewsTab === 'mine'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                          : 'text-gray-700 hover:bg-white'
                      }`}
                    >
                      Your reviews
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewsTab('others')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        reviewsTab === 'others'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                          : 'text-gray-700 hover:bg-white'
                      }`}
                    >
                      Other reviews
                    </button>
                  </div>

                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    <option value="highest">Highest rating</option>
                    <option value="lowest">Lowest rating</option>
                    <option value="recent">Most recent</option>
                  </select>
                </div>

                <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
                  <div className="p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {materials.map((m) => {
                        const id = String(m?.id || '');
                        const allReviews = reviewsByMaterialId[id] || [];
                        const myReview = allReviews.find((r) => r.isMine);
                        const otherReviews = allReviews.filter((r) => !r.isMine);

                        return (
                          <div key={id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 text-sm truncate">{m.title || '—'}</div>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">
                                    {m.moduleCode || '—'}
                                  </span>
                                  {m.semester ? (
                                    <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">Sem {m.semester}</span>
                                  ) : null}
                                  {m.category ? (
                                    <span className="rounded-lg bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium">{getCategoryLabel(m.category)}</span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="shrink-0">{renderRatingSummary(allReviews)}</div>
                            </div>

                            {reviewsTab === 'mine' ? (
                              myReview ? (
                                <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-3">
                                  <div className="text-xs font-semibold text-gray-600 mb-2">Your review</div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-semibold text-gray-900">You</div>
                                      <div className="mt-1">{renderStars(myReview.rating)}</div>
                                    </div>
                                    <div className="text-xs text-gray-500">{new Date(myReview.createdAt).toLocaleString()}</div>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-700">{myReview.reviewText || 'No written review.'}</p>
                                  {myReview.adminResponse?.text ? (
                                    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                                      <span className="font-semibold">Admin response:</span> {myReview.adminResponse.text}
                                    </div>
                                  ) : null}
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => deleteReview(myReview.id)}
                                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">No review from you yet.</div>
                              )
                            ) : otherReviews.length ? (
                              <div className="space-y-3">
                                <div className="text-xs font-semibold text-gray-600">Other students</div>
                                {otherReviews.map((r) => (
                                  <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="font-semibold text-gray-900">{r.user?.name || 'Student'}</div>
                                        <div className="mt-1">{renderStars(r.rating)}</div>
                                      </div>
                                      <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-700">{r.reviewText || 'No written review.'}</p>
                                    {r.adminResponse?.text ? (
                                      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                                        <span className="font-semibold">Admin response:</span> {r.adminResponse.text}
                                      </div>
                                    ) : null}
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => voteReview(r.id, 'helpful')}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700"
                                      >
                                        Helpful ({r.helpfulCount || 0})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => voteReview(r.id, 'unhelpful')}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700"
                                      >
                                        Unhelpful ({r.unhelpfulCount || 0})
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">No reviews from other students yet.</div>
                            )}
                          </div>
                        );
                      })}

                      {!loading && materials.length === 0 ? (
                        <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-600">
                          No downloaded materials found. Download a material first to add a review.
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
      {reviewModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Write review">
          <div className="absolute inset-0" onClick={() => setReviewModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-gray-900">Write a review</div>
                <div className="text-xs text-gray-500 mt-1">Only downloaded materials are eligible.</div>
              </div>
              <button
                type="button"
                className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
                onClick={() => setReviewModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700">
                  Materials: Downloaded only
                </div>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm md:col-span-2"
                >
                  <option value="">Select material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}{m.moduleCode ? ` (${m.moduleCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {!loading && materials.length === 0 ? (
                <div className="mt-3 text-sm text-amber-700">No downloaded materials found. Download a material first to add a review.</div>
              ) : null}
              <form className="mt-4 space-y-3" onSubmit={(e) => { submitReview(e); setReviewModalOpen(false); }}>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Your rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                    className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={reviewForm.reviewText}
                  onChange={(e) => setReviewForm((p) => ({ ...p, reviewText: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm min-h-24"
                  placeholder="Write your review"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading || !selectedMaterialId}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:from-blue-700 hover:to-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 disabled:opacity-60"
                  >
                    Submit Review
                  </button>
                  {selectedMyReview ? (
                    <button
                      type="button"
                      onClick={() => {
                        deleteReview(selectedMyReview.id);
                        setReviewModalOpen(false);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm font-semibold"
                    >
                      Delete My Review
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
