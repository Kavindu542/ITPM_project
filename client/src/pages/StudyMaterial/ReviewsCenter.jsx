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

export default function ReviewsCenter({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [materials, setMaterials] = React.useState([]);
  const [selectedMaterialId, setSelectedMaterialId] = React.useState('');

  const [reviews, setReviews] = React.useState([]);
  const [reviewSort, setReviewSort] = React.useState('highest');

  const [reviewForm, setReviewForm] = React.useState({ rating: 5, reviewText: '' });

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-[#25f194] shadow-lg flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-white" />
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
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-gray-900 border-gray-900"
                >
                  <Star className="h-4 w-4 text-white" />
                  <span className="text-white">Ratings & reviews</span>
                </button>
                <button
                  onClick={() => navigate('/materials/forum')}
                  className="w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border bg-white border-gray-200 hover:bg-gray-50"
                >
                  <MessagesSquare className="h-4 w-4 text-gray-700" />
                  <span className="text-gray-800">Academic support forum</span>
                </button>
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="lg:col-span-9">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
              <p className="text-sm text-gray-600 mt-1">Rate materials, write reviews, and vote helpful/unhelpful feedback.</p>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <form className="mt-4 space-y-3" onSubmit={submitReview}>
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
                    onClick={() => deleteReview(myReview.id)}
                    className="ml-2 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm font-semibold"
                  >
                    Delete My Review
                  </button>
                ) : null}
              </form>
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
  );
}
