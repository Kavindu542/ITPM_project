import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../../services/authService';
import UserMenu from '../../../../components/UserMenu';
import { hostelService } from '../../../../services/hostelService';
import { LayoutDashboard, AlertCircle, RefreshCw } from 'lucide-react';

export default function HostelWardenDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [applications, setApplications] = React.useState([]);
  const [complaints, setComplaints] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('applications');

  const loadApplications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hostelService.getAllApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load applications');
    } finally {
      if (activeTab === 'applications') setLoading(false);
    }
  }, [activeTab]);

  const loadComplaints = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hostelService.getAllComplaints();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load complaints');
    } finally {
      if (activeTab === 'complaints') setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    } else {
      loadComplaints();
    }
  }, [activeTab, loadApplications, loadComplaints]);

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

  const updateComplaintStatusHandler = async (complaintId, status) => {
    try {
      await hostelService.updateComplaintStatus(complaintId, status);
      setComplaints((prev) => prev.map((c) => (c._id === complaintId || c.id === complaintId ? { ...c, status } : c)));
      setTimeout(() => loadComplaints(), 500);
    } catch (e) {
      setError(e?.message || 'Failed to update complaint status');
    }
  };

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/hostel', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 px-3 py-2 border border-blue-100">
              <div className="flex items-center gap-2">
                <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto object-contain" />
                <div className="text-xs font-bold text-blue-800">Admin</div>
              </div>
            </div>
            <div className="text-gray-900">
              <div className="text-sm font-bold">Hostel (Warden)</div>
              <div className="text-xs text-gray-500 font-medium">Dashboard</div>
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-blue-900 border-r border-blue-800 p-4 flex flex-col z-10 hidden md:flex shadow-inner">
          <div className="text-blue-300 text-xs font-bold tracking-wider uppercase mb-4 px-2 mt-2">Warden Menu</div>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('applications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm ${activeTab === 'applications'
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'text-blue-100 hover:bg-blue-800 border border-transparent'
                }`}
            >
              <LayoutDashboard size={18} />
              <span className="font-medium text-sm">Applications</span>
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm ${activeTab === 'complaints'
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'text-blue-100 hover:bg-blue-800 border border-transparent'
                }`}
            >
              <AlertCircle size={18} />
              <span className="font-medium text-sm">Complaints</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 bg-gray-50">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {activeTab === 'applications' ? 'Hostel Applications' : 'Hostel Complaints'}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Signed in as <span className="font-medium text-blue-600">{user?.email}</span>
                </p>
              </div>
            </div>

            {activeTab === 'applications' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Pending approvals</div>
                    <div className="text-xs text-gray-500">Approve or reject student hostel applications</div>
                  </div>
                  <button onClick={loadApplications} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700">
                    <RefreshCw size={14} /> Refresh
                  </button>
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
                        <tr className="text-left text-gray-600 border-b border-gray-200">
                          <th className="px-3 py-3 font-semibold">Student ID</th>
                          <th className="px-3 py-3 font-semibold">Name</th>
                          <th className="px-3 py-3 font-semibold">District</th>
                          <th className="px-3 py-3 font-semibold">Room Type</th>
                          <th className="px-3 py-3 font-semibold">Floor</th>
                          <th className="px-3 py-3 font-semibold">Submitted</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {applications.map((a) => (
                          <tr key={a.id} className="text-gray-800 hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 font-mono">{a.studentId}</td>
                            <td className="px-3 py-3">{a.studentName}</td>
                            <td className="px-3 py-3">{a.district}</td>
                            <td className="px-3 py-3">{a.roomType || '-'}</td>
                            <td className="px-3 py-3">{a.preferredFloor}</td>
                            <td className="px-3 py-3 text-gray-600">{new Date(a.createdAt).toLocaleString()}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${a.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' : a.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>{a.status}</span>
                            </td>
                            <td className="px-3 py-3 space-x-2">
                              <button
                                onClick={() => updateStatus(a.id, 'approved')}
                                disabled={a.status === 'approved'}
                                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 transition-colors shadow-sm"
                              >Approve</button>
                              <button
                                onClick={() => updateStatus(a.id, 'rejected')}
                                disabled={a.status === 'rejected'}
                                className="px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 transition-colors shadow-sm"
                              >Reject</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'complaints' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Student Complaints</div>
                    <div className="text-xs text-gray-500">View and manage issues reported by students</div>
                  </div>
                  <button onClick={loadComplaints} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700">
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>

                {error && (
                  <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
                )}

                {loading ? (
                  <div className="text-sm text-gray-600">Loading complaints…</div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-gray-100 mt-6">
                    <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-gray-900 font-medium">No complaints yet</h3>
                    <p className="text-gray-500 text-sm mt-1">There are currently no complaints submitted.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-6">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b border-gray-200">
                          <th className="px-3 py-3 font-semibold">Student ID</th>
                          <th className="px-3 py-3 font-semibold">Name</th>
                          <th className="px-3 py-3 font-semibold">Category</th>
                          <th className="px-3 py-3 font-semibold">Subject</th>
                          <th className="px-3 py-3 font-semibold">Urgency</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {complaints.map((c) => {
                          const id = c._id || c.id;
                          return (
                            <tr key={id} className="text-gray-800 hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-3 font-mono">{c.studentId || '-'}</td>
                              <td className="px-3 py-3">{c.studentName || '-'}</td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {c.category}
                                </span>
                              </td>
                              <td className="px-3 py-3 max-w-xs truncate" title={c.description}>{c.subject}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${c.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                                  c.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                                    c.urgency === 'medium' ? 'bg-blue-100 text-blue-800' :
                                      'bg-green-100 text-green-800'
                                  }`}>
                                  {c.urgency}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                                  c.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    c.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right space-x-2">
                                <select
                                  value={c.status}
                                  onChange={(e) => updateComplaintStatusHandler(id, e.target.value)}
                                  className="text-xs border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-2 pr-6"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
