import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../../services/authService';
import UserMenu from '../../../../components/UserMenu';
import { hostelService } from '../../../../services/hostelService';
import { LayoutDashboard, AlertCircle, RefreshCw, Store, Upload, CheckCircle, Building2 } from 'lucide-react';

export default function HostelWardenDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [applications, setApplications] = React.useState([]);
  const [complaints, setComplaints] = React.useState([]);
  const [reconsiderationRequests, setReconsiderationRequests] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('applications');

  const [mealShopForm, setMealShopForm] = React.useState({
    email: '',
    password: '',
    name: '',
    contactNumber: '',
    description: '',
  });
  const [shopLogo, setShopLogo] = React.useState(null);
  const [mealShopSubmitting, setMealShopSubmitting] = React.useState(false);
  const [mealShopSuccess, setMealShopSuccess] = React.useState('');
  const [createdMealShopEmail, setCreatedMealShopEmail] = React.useState('');
  const [laundryForm, setLaundryForm] = React.useState({
    email: '',
    password: '',
    name: '',
    contactNumber: '',
    description: '',
  });
  const [laundryLogo, setLaundryLogo] = React.useState(null);
  const [laundrySubmitting, setLaundrySubmitting] = React.useState(false);
  const [laundrySuccess, setLaundrySuccess] = React.useState('');
  const [createdLaundryEmail, setCreatedLaundryEmail] = React.useState('');

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

  const loadReconsiderationRequests = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hostelService.getAllReconsiderationRequests();
      setReconsiderationRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load reconsideration requests');
    } finally {
      if (activeTab === 'requests') setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    } else if (activeTab === 'complaints') {
      loadComplaints();
    } else if (activeTab === 'requests') {
      loadReconsiderationRequests();
    }
  }, [activeTab, loadApplications, loadComplaints, loadReconsiderationRequests]);

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

  const updateReconsiderationStatus = async (requestId, status) => {
    try {
      const message = status === 'rejected' ? 'Sorry, your request was rejected.' : 'Your request was approved.';
      await hostelService.updateReconsiderationRequestStatus(requestId, status, message);
      setReconsiderationRequests((prev) =>
        prev.map((r) => ((r._id === requestId || r.id === requestId)
          ? { ...r, status, adminMessage: message }
          : r))
      );
      setTimeout(() => loadReconsiderationRequests(), 400);
    } catch (e) {
      setError(e?.message || 'Failed to update request status');
    }
  };

  const handleMealShopSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMealShopSuccess('');
    setCreatedMealShopEmail('');
    setMealShopSubmitting(true);

    try {
      await hostelService.createMealShopAccount({
        email: mealShopForm.email,
        password: mealShopForm.password,
        name: mealShopForm.name,
        contactNumber: mealShopForm.contactNumber,
        description: mealShopForm.description,
      });

      setMealShopSuccess('Meal shop account created successfully. You can now sign in to Meals Shop.');
      const createdEmail = String(mealShopForm.email || '').trim().toLowerCase();
      setCreatedMealShopEmail(createdEmail);
      try {
        localStorage.setItem('cc_last_meal_shop_email', createdEmail);
      } catch {
        // Ignore storage errors
      }
      setMealShopForm({ email: '', password: '', name: '', contactNumber: '', description: '' });
      setShopLogo(null);
      navigate(`/admin/hostel/meals-shop/signin?email=${encodeURIComponent(createdEmail)}`);

      setTimeout(() => setMealShopSuccess(''), 4000);
    } catch (e) {
      setError(e?.message || 'Failed to create meal shop');
    } finally {
      setMealShopSubmitting(false);
    }
  };

  const handleMealShopChange = (e) => {
    const { name, value } = e.target;
    setMealShopForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLaundrySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLaundrySuccess('');
    setCreatedLaundryEmail('');
    setLaundrySubmitting(true);

    try {
      await hostelService.createLaundryShopAccount({
        email: laundryForm.email,
        password: laundryForm.password,
        name: laundryForm.name,
        contactNumber: laundryForm.contactNumber,
        description: laundryForm.description,
      });

      setLaundrySuccess('Laundry shop account created successfully. You can now sign in to Laundry.');
      setCreatedLaundryEmail(laundryForm.email);
      setLaundryForm({ email: '', password: '', name: '', contactNumber: '', description: '' });
      setLaundryLogo(null);
      setTimeout(() => setLaundrySuccess(''), 4000);
    } catch (e) {
      setError(e?.message || 'Failed to create laundry shop');
    } finally {
      setLaundrySubmitting(false);
    }
  };

  const handleLaundryChange = (e) => {
    const { name, value } = e.target;
    setLaundryForm((prev) => ({ ...prev, [name]: value }));
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
              onClick={() => setActiveTab('requests')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm ${activeTab === 'requests'
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'text-blue-100 hover:bg-blue-800 border border-transparent'
                }`}
            >
              <LayoutDashboard size={18} />
              <span className="font-medium text-sm">Request</span>
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
            <button
              onClick={() => setActiveTab('add-meal-shop')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm ${activeTab === 'add-meal-shop'
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'text-blue-100 hover:bg-blue-800 border border-transparent'
                }`}
            >
              <Store size={18} />
              <span className="font-medium text-sm">Add Meal Shop</span>
            </button>
            <button
              onClick={() => setActiveTab('add-laundry-shop')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm ${activeTab === 'add-laundry-shop'
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'text-blue-100 hover:bg-blue-800 border border-transparent'
                }`}
            >
              <Store size={18} />
              <span className="font-medium text-sm">Add Laundry Shop</span>
            </button>
            <Link
              to="/admin/hostel"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm text-blue-100 hover:bg-blue-800 border border-transparent"
            >
              <Building2 size={18} />
              <span className="font-medium text-sm">Hostel services</span>
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 bg-gray-50">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  {activeTab === 'applications'
                    ? 'Hostel Applications'
                    : activeTab === 'requests'
                      ? 'Reconsideration Requests'
                    : activeTab === 'complaints'
                      ? 'Hostel Complaints'
                      : activeTab === 'add-meal-shop'
                        ? 'Add Meal Shop'
                        : 'Add Laundry Shop'}
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

            {activeTab === 'requests' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Student reconsideration requests</div>
                    <div className="text-xs text-gray-500">Requests submitted by rejected students.</div>
                  </div>
                  <button
                    onClick={loadReconsiderationRequests}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                  >
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>

                {error && (
                  <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
                )}

                {loading ? (
                  <div className="text-sm text-gray-600">Loading requests...</div>
                ) : reconsiderationRequests.length === 0 ? (
                  <div className="text-sm text-gray-600">No reconsideration requests found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b border-gray-200">
                          <th className="px-3 py-3 font-semibold">Student ID</th>
                          <th className="px-3 py-3 font-semibold">Name</th>
                          <th className="px-3 py-3 font-semibold">District</th>
                          <th className="px-3 py-3 font-semibold">Reason</th>
                          <th className="px-3 py-3 font-semibold">Contact</th>
                          <th className="px-3 py-3 font-semibold">Submitted</th>
                          <th className="px-3 py-3 font-semibold">Status</th>
                          <th className="px-3 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reconsiderationRequests.map((request) => (
                          <tr key={request._id || request.id} className="text-gray-800 hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 font-mono">{request.studentId || '-'}</td>
                            <td className="px-3 py-3">{request.studentName || '-'}</td>
                            <td className="px-3 py-3">{request.district || '-'}</td>
                            <td className="px-3 py-3 max-w-md">{request.reason || '-'}</td>
                            <td className="px-3 py-3">{request.preferredContact || '-'}</td>
                            <td className="px-3 py-3 text-gray-600">{request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                request.status === 'approved'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : request.status === 'rejected'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : request.status === 'reviewed'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                              }`}>
                                {request.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-3 py-3 space-x-2">
                              <button
                                type="button"
                                onClick={() => updateReconsiderationStatus(request._id || request.id, 'approved')}
                                disabled={request.status === 'approved'}
                                className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 transition-colors shadow-sm"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => updateReconsiderationStatus(request._id || request.id, 'rejected')}
                                disabled={request.status === 'rejected'}
                                className="px-3 py-1.5 rounded-lg text-xs bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 transition-colors shadow-sm"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'add-meal-shop' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Meal Shop</h3>
                  <p className="text-sm text-gray-500 mt-1">Add a new meal provider to the hostel ecosystem.</p>
                </div>

                {error && (
                  <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {mealShopSuccess && (
                  <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-green-800 text-sm">
                      <p>{mealShopSuccess}</p>
                      {createdMealShopEmail ? (
                        <Link
                          to={`/admin/hostel/meals-shop/signin?email=${encodeURIComponent(createdMealShopEmail)}`}
                          className="inline-flex mt-2 font-semibold text-green-700 hover:text-green-800 underline"
                        >
                          Open Meals Shop sign-in
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )}

                <form onSubmit={handleMealShopSubmit} className="space-y-6 max-w-2xl">
                  {/* Account Information */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Account Information</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={mealShopForm.email}
                          onChange={handleMealShopChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="shop@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={mealShopForm.password}
                          onChange={handleMealShopChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shop Details */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Shop Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meal Shop Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={mealShopForm.name}
                          onChange={handleMealShopChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Fresh Bites"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={mealShopForm.contactNumber}
                          onChange={handleMealShopChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="077 123 4567"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shop Description</label>
                        <textarea
                          name="description"
                          value={mealShopForm.description}
                          onChange={handleMealShopChange}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          placeholder="Describe the type of food and services offered..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shop Logo</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 justify-center">
                              <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                <span>Upload a file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setShopLogo(e.target.files[0])} accept="image/*" />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            {shopLogo && (
                              <p className="text-sm text-green-600 break-all mt-2 max-w-[200px] mx-auto truncate font-medium">Selected: {shopLogo.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={mealShopSubmitting}
                      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-400 transition-all shadow-sm"
                    >
                      {mealShopSubmitting ? 'Creating Shop...' : 'Create Meal Shop'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'add-laundry-shop' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Laundry Shop</h3>
                  <p className="text-sm text-gray-500 mt-1">Add a new laundry provider to the hostel ecosystem.</p>
                </div>

                {error && (
                  <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {laundrySuccess && (
                  <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-green-800 text-sm">
                      <p>{laundrySuccess}</p>
                      {createdLaundryEmail ? (
                        <Link
                          to={`/admin/hostel/laundry/signin?email=${encodeURIComponent(createdLaundryEmail)}`}
                          className="inline-flex mt-2 font-semibold text-green-700 hover:text-green-800 underline"
                        >
                          Open Laundry sign-in
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )}

                <form onSubmit={handleLaundrySubmit} className="space-y-6 max-w-2xl">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Account Information</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={laundryForm.email}
                          onChange={handleLaundryChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="laundry@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          name="password"
                          value={laundryForm.password}
                          onChange={handleLaundryChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Shop Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Laundry Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={laundryForm.name}
                          onChange={handleLaundryChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Quick Wash"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={laundryForm.contactNumber}
                          onChange={handleLaundryChange}
                          required
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="077 123 4567"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shop Description</label>
                        <textarea
                          name="description"
                          value={laundryForm.description}
                          onChange={handleLaundryChange}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          placeholder="Describe the laundry services offered..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shop Logo</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 justify-center">
                              <label htmlFor="laundry-file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                <span>Upload a file</span>
                                <input
                                  id="laundry-file-upload"
                                  name="laundry-file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={(e) => setLaundryLogo(e.target.files[0])}
                                  accept="image/*"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            {laundryLogo && (
                              <p className="text-sm text-green-600 break-all mt-2 max-w-[200px] mx-auto truncate font-medium">
                                Selected: {laundryLogo.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={laundrySubmitting}
                      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-400 transition-all shadow-sm"
                    >
                      {laundrySubmitting ? 'Creating Laundry Shop...' : 'Create Laundry Shop'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
