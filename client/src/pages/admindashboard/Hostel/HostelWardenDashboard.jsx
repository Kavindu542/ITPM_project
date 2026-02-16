import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import UserMenu from '../../../components/UserMenu';
import { hostelService } from '../../../services/hostelService';

export default function HostelWardenDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [applications, setApplications] = React.useState([]);

  const loadApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hostelService.getAllApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const updateStatus = async (appId, status) => {
    try {
      await hostelService.updateApplicationStatus(appId, status);
      // Update local state and reload to get fresh data
      setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
      // Also reload all applications to ensure consistency
      setTimeout(() => loadApplications(), 500);
    } catch (e) {
      setError(e?.message || 'Failed to update status');
    }
  };

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/hostel', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-[#25f194] font-sans">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto object-contain" />
                <div className="text-xs font-medium text-gray-500">Admin</div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm font-semibold">Hostel (Warden)</div>
              <div className="text-xs text-white/80">Dashboard</div>
            </div>
          </div>

          <UserMenu
            user={user}
            onProfile={() => navigate('/profile')}
            onLogout={logout}
            theme="light"
            idLabel="ID"
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Hostel Applications</h2>
            <p className="mt-1 text-sm text-white/80">Signed in as {user?.email}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Pending approvals</div>
                <div className="text-xs text-gray-500">Approve or reject student hostel applications</div>
              </div>
              <button onClick={loadApplications} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">Refresh</button>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            {loading ? (
              <div className="text-sm text-gray-600">Loading applications…</div>
            ) : applications.length === 0 ? (
              <div className="text-sm text-gray-600">No applications found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="px-3 py-2">Student ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">District</th>
                      <th className="px-3 py-2">Room Type</th>
                      <th className="px-3 py-2">Floor</th>
                      <th className="px-3 py-2">Submitted</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.map((a) => (
                      <tr key={a.id} className="text-gray-800">
                        <td className="px-3 py-2 font-mono">{a.studentId}</td>
                        <td className="px-3 py-2">{a.studentName}</td>
                        <td className="px-3 py-2">{a.district}</td>
                        <td className="px-3 py-2">{a.roomType || '-'}</td>
                        <td className="px-3 py-2">{a.preferredFloor}</td>
                        <td className="px-3 py-2 text-gray-600">{new Date(a.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${a.status === 'approved' ? 'bg-green-50 text-green-700' : a.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{a.status}</span>
                        </td>
                        <td className="px-3 py-2 space-x-2">
                          <button
                            onClick={() => updateStatus(a.id, 'approved')}
                            disabled={a.status === 'approved'}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300"
                          >Approve</button>
                          <button
                            onClick={() => updateStatus(a.id, 'rejected')}
                            disabled={a.status === 'rejected'}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300"
                          >Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
