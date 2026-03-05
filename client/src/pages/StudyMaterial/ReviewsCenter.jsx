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

export default function ReviewsCenter({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [materials, setMaterials] = React.useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = React.useState('');

  const [reviews, setReviews] = React.useState([]);
  const [reviewSort, setReviewSort] = React.useState('highest');

  const [reviewForm, setReviewForm] = React.useState({ rating: 5, reviewText: '' });
  const [reviewModalOpen, setReviewModalOpen] = React.useState(false);

  const loadMaterials = React.useCallback(async () => {
    setLoading(true);
    setError('');
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
      setError(e?.response?.data?.message || e?.message || 'Failed to load downloaded materials');
    } finally {
      setLoading(false);
    }
  }, [selectedMaterialId]);

  const loadReviews = React.useCallback(async () => {
    if (!selectedMaterialId) return;
    setLoading(true);
    setError('');
    try {
      const res = await studyMaterialService.listMaterialReviews(selectedMaterialId, { sortBy: reviewSort });
      setReviews(res?.items ?? []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [selectedMaterialId, reviewSort]);

  React.useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  React.useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!selectedMaterialId) return;
    setLoading(true);
    setError('');
    try {
      await studyMaterialService.createOrUpdateReview(selectedMaterialId, reviewForm);
      setReviewForm((p) => ({ ...p, reviewText: '' }));
      await Promise.all([loadReviews(), loadMaterials()]);
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const voteReview = async (reviewId, vote) => {
    setError('');
    try {
      await studyMaterialService.voteReview(reviewId, vote);
      await loadReviews();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Vote failed');
    }
  };

  const deleteReview = async (reviewId) => {
    const ok = window.confirm('Delete your review?');
    if (!ok) return;

    setError('');
    try {
      await studyMaterialService.deleteOwnReview(reviewId);
      await Promise.all([loadReviews(), loadMaterials()]);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed');
    }
  };

  const myReview = reviews.find((r) => r.isMine);

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
            <div className="lg:col-span-11 lg:h-full lg:min-h-0 lg:overflow-y-auto no-scrollbar">
              {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
                <p className="text-sm text-gray-600 mt-1">Rate materials, write reviews, and vote helpful/unhelpful feedback.</p>
                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm text-gray-600">Write a review for a material you downloaded.</div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold"
                  >
                    Write a review
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-6">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Reviews</h2>
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
                <div className="divide-y divide-gray-200">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900">{r.user?.name || 'Student'}</div>
                          <div className="mt-1 inline-flex items-center gap-1 text-amber-600 text-sm">
                            {Array.from({ length: r.rating || 0 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                          </div>
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
                  {!loading && reviews.length === 0 ? <div className="p-6 text-sm text-gray-600">No reviews yet.</div> : null}
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
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  >
                    Submit Review
                  </button>
                  {myReview ? (
                    <button
                      type="button"
                      onClick={() => { deleteReview(myReview.id); setReviewModalOpen(false); }}
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
