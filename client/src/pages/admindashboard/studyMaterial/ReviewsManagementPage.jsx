import React from 'react';

import { studyMaterialService } from '../../../services/studyMaterialService';

export default function ReviewsManagementPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const [statusFilter, setStatusFilter] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [analytics, setAnalytics] = React.useState({ byMaterial: [], trends: [] });
  const [responseById, setResponseById] = React.useState({});
  const [reasonById, setReasonById] = React.useState({});

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, aRes] = await Promise.all([
        studyMaterialService.adminListReviews({ status: statusFilter || undefined }),
        studyMaterialService.adminReviewAnalytics(),
      ]);
      setItems(rRes?.items ?? []);
      setAnalytics(aRes ?? { byMaterial: [], trends: [] });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    load();
  }, [load]);

  const moderate = async (reviewId, action) => {
    setError('');
    try {
      await studyMaterialService.adminModerateReview(reviewId, {
        action,
        reason: reasonById[reviewId] || '',
      });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Moderation failed');
    }
  };

  const respond = async (reviewId) => {
    const text = String(responseById[reviewId] || '').trim();
    if (!text) {
      setError('Response text is required');
      return;
    }

    setError('');
    try {
      await studyMaterialService.adminRespondReview(reviewId, text);
      setResponseById((p) => ({ ...p, [reviewId]: '' }));
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Response failed');
    }
  };

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Most reviewed material</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">{analytics.byMaterial?.[0]?.title || '—'}</div>
          <div className="text-xs text-gray-600 mt-1">{analytics.byMaterial?.[0]?.reviewCount || 0} reviews</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Best avg rating</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">{analytics.byMaterial?.[0]?.avgRating || 0} / 5</div>
          <div className="text-xs text-gray-600 mt-1">Top-rated item</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Trend points</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">{analytics.trends?.length || 0}</div>
          <div className="text-xs text-gray-600 mt-1">Monthly review trend records</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Review Moderation</h2>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
            >
              <option value="">All</option>
              <option value="visible">Visible</option>
              <option value="flagged">Flagged</option>
              <option value="removed">Removed</option>
            </select>
            <button type="button" onClick={load} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700">Refresh</button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {items.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{r.material?.title || 'Material'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">By {r.user?.name || 'Student'} • Rating: {r.rating}/5</div>
                </div>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-700">
                  {r.moderation?.status || 'visible'}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-700">{r.reviewText || 'No review text.'}</p>
              {r.adminResponse?.text ? <div className="mt-2 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"><span className="font-semibold">Response:</span> {r.adminResponse.text}</div> : null}

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  value={reasonById[r.id] || ''}
                  onChange={(e) => setReasonById((p) => ({ ...p, [r.id]: e.target.value }))}
                  placeholder="Moderation reason"
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                />
                <input
                  value={responseById[r.id] || ''}
                  onChange={(e) => setResponseById((p) => ({ ...p, [r.id]: e.target.value }))}
                  placeholder="Official response"
                  className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => moderate(r.id, 'flag')} className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700">Flag</button>
                <button type="button" onClick={() => moderate(r.id, 'remove')} className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700">Remove</button>
                <button type="button" onClick={() => moderate(r.id, 'restore')} className="px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-xs font-semibold text-green-700">Restore</button>
                <button type="button" onClick={() => respond(r.id)} className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700">Respond</button>
              </div>
            </div>
          ))}

          {!loading && items.length === 0 ? <div className="p-6 text-sm text-gray-600">No reviews found.</div> : null}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Rating Analytics</h2>
        </div>
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">Average ratings by material</div>
            <div className="divide-y divide-gray-200">
              {(analytics.byMaterial || []).slice(0, 8).map((m) => (
                <div key={m.materialId} className="px-4 py-3 text-sm">
                  <div className="font-semibold text-gray-900">{m.title}</div>
                  <div className="text-xs text-gray-600">{m.moduleCode || '—'} • {m.avgRating}/5 • {m.reviewCount} reviews</div>
                </div>
              ))}
              {(analytics.byMaterial || []).length === 0 ? <div className="px-4 py-4 text-sm text-gray-600">No analytics yet.</div> : null}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold text-gray-900">Trends over time</div>
            <div className="divide-y divide-gray-200">
              {(analytics.trends || []).slice(-8).map((t) => (
                <div key={`${t.year}-${t.month}`} className="px-4 py-3 text-sm">
                  <div className="font-semibold text-gray-900">{t.year}-{String(t.month).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-600">Avg: {t.avgRating}/5 • Reviews: {t.totalReviews}</div>
                </div>
              ))}
              {(analytics.trends || []).length === 0 ? <div className="px-4 py-4 text-sm text-gray-600">No trend data.</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
