import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { clubService } from '../../../services/clubService';
import UserMenu from '../../../components/UserMenu';


export default function ClubAndSocietyDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();

  // Dashboard state
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalStudents: 0,
    totalLeaders: 0,
    vacantClubs: 0,
    upcomingEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'clubs'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: '',
    logoUrl: '',
  });

  // Leader Management states
  const [showAssignLeaderForm, setShowAssignLeaderForm] = useState(false);
  const [showRemoveLeaderModal, setShowRemoveLeaderModal] = useState(false);
  const [leaderToRemove, setLeaderToRemove] = useState(null);
  const [leaderFormData, setLeaderFormData] = useState({
    clubId: '',
    studentId: '',
  });
  const [confirmReplaceLeader, setConfirmReplaceLeader] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [assigningClub, setAssigningClub] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await clubService.adminListClubs();
        if (!mounted) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        const normalized = items.map((c) => ({
          id: String(c.id || c._id || ''),
          name: c.name,
          description: c.description || '',
          rules: c.rules || '',
          logoUrl: c.logoUrl || '',
          leader: c.leader ? { id: String(c.leader.id || ''), name: c.leader.name, email: c.leader.email } : null,
          members: Number(c.members || 0),
          events: Number(c.events || 0),
          status: c.status || 'Active',
        }));
        setClubs(normalized);
        setStats((prev) => ({
          ...prev,
          totalClubs: normalized.length,
          totalLeaders: normalized.filter((c) => !!c.leader).length,
          vacantClubs: normalized.filter((c) => !c.leader).length,
        }));
      } catch {
        setClubs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openAssignLeaderModal = async (club) => {
    setLeaderFormData({ clubId: String(club.id), studentId: '' });
    setAssigningClub(club);
    setConfirmReplaceLeader(false);
    setShowAssignLeaderForm(true);
    setStudentsLoading(true);
    try {
      const data = await clubService.listEligibleStudents();
      const list = Array.isArray(data?.students) ? data.students : [];
      setStudents(list);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/signin', { replace: true });
  };

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create Club
  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Club name is required');
      return;
    }

    try {
      const created = await clubService.adminCreateClub({
        name: formData.name,
        description: formData.description,
        rules: formData.rules,
        logoUrl: formData.logoUrl,
      });
      const clubItem = {
        id: String(created.id || created._id || ''),
        name: created.name,
        description: created.description || '',
        rules: created.rules || '',
        logoUrl: created.logoUrl || '',
        leader: null,
        members: Number(created.members || 0),
        events: Number(created.events || 0),
        status: created.status || 'Active',
      };
      setClubs([...clubs, clubItem]);
      setStats(prev => ({ ...prev, totalClubs: prev.totalClubs + 1, vacantClubs: prev.vacantClubs + 1 }));
      setFormData({ name: '', description: '', rules: '', logoUrl: '' });
      setShowCreateForm(false);
      alert('Club created successfully!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to create club');
    }
  };

  // Edit Club
  const handleEditClub = (club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description,
      rules: club.rules || '',
      logoUrl: club.logoUrl || '',
    });
    setShowEditForm(true);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Club name is required');
      return;
    }

    try {
      await clubService.adminUpdateClub(editingClub.id, {
        name: formData.name,
        description: formData.description,
        rules: formData.rules,
        logoUrl: formData.logoUrl,
      });
      const updatedClubs = clubs.map(club =>
        String(club.id) === String(editingClub.id) ? { ...club, ...formData } : club
      );
      setClubs(updatedClubs);
      setEditingClub(null);
      setShowEditForm(false);
      setFormData({ name: '', description: '', rules: '', logoUrl: '' });
      alert('Club updated successfully!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update club');
    }
  };

  // Delete Club
  const handleDeleteClub = (club) => {
    setClubToDelete(club);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await clubService.adminDeleteClub(clubToDelete.id);
      setClubs(clubs.filter(club => String(club.id) !== String(clubToDelete.id)));
      setStats(prev => ({
        ...prev,
        totalClubs: prev.totalClubs - 1,
        vacantClubs: clubToDelete.leader ? prev.vacantClubs : Math.max(prev.vacantClubs - 1, 0),
      }));
      setShowDeleteModal(false);
      setClubToDelete(null);
      alert('Club deleted successfully!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete club');
    }
  };

  // Leader Management Handlers
  const handleAssignLeaderChange = (e) => {
    const { name, value } = e.target;
    setLeaderFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignLeader = async (e) => {
    e.preventDefault();
    if (!leaderFormData.clubId || !leaderFormData.studentId) {
      alert('Please select both a club and a student');
      return;
    }

    const selectedClub = clubs.find(c => String(c.id) === String(leaderFormData.clubId));
    const selectedStudent = students.find(s => String(s.id) === String(leaderFormData.studentId));

    if (!selectedClub) {
      alert('Selected club was not found. Please refresh and try again.');
      return;
    }

    if (!selectedStudent) {
      alert('Selected student was not found. Please refresh and try again.');
      return;
    }

    // If the UI thinks the club is vacant, do a quick refresh to avoid stale state
    // causing a backend 409 "already has a leader".
    let clubToUse = selectedClub;
    if (!clubToUse.leader) {
      try {
        const data = await clubService.adminListClubs();
        const items = Array.isArray(data?.items) ? data.items : [];
        const normalized = items.map((c) => ({
          id: String(c.id || c._id || ''),
          name: c.name,
          description: c.description || '',
          rules: c.rules || '',
          logoUrl: c.logoUrl || '',
          leader: c.leader
            ? { id: String(c.leader.id || c.leader._id || ''), name: c.leader.name, email: c.leader.email }
            : null,
          members: Number(c.members || 0),
          events: Number(c.events || 0),
          status: c.status || 'Active',
        }));

        setClubs(normalized);
        setStats((prev) => ({
          ...prev,
          totalClubs: normalized.length,
          totalLeaders: normalized.filter((c) => !!c.leader).length,
          vacantClubs: normalized.filter((c) => !c.leader).length,
        }));

        const refreshedClub = normalized.find(
          (c) => String(c.id) === String(leaderFormData.clubId),
        );
        if (refreshedClub) clubToUse = refreshedClub;
      } catch {
        // ignore refresh errors; we'll fall back to current state
      }
    }

    // If club already has a leader, require confirmation
    if (clubToUse.leader && !confirmReplaceLeader) {
      return; // Show warning
    }

    try {
      const res = await clubService.assignLeader({
        clubId: leaderFormData.clubId,
        studentId: leaderFormData.studentId,
        replaceExisting: !!clubToUse.leader,
      });
      const updatedClubs = clubs.map((club) =>
        String(club.id) === String(leaderFormData.clubId)
          ? { ...club, leader: { id: selectedStudent.id, name: selectedStudent.name, email: selectedStudent.email } }
          : club
      );
      setClubs(updatedClubs);
      const msg = res?.message || `${selectedStudent.name} is now the leader of ${selectedClub.name}`;
      alert(msg);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || 'Failed to assign leader';

      // If backend says the club already has a leader, the UI state is likely stale.
      // Refresh clubs so the replace-leader warning/checkbox is shown correctly.
      if (status === 409 && /already has a leader/i.test(String(message))) {
        try {
          const data = await clubService.adminListClubs();
          const items = Array.isArray(data?.items) ? data.items : [];
          const normalized = items.map((c) => ({
            id: String(c.id || c._id || ''),
            name: c.name,
            description: c.description || '',
            rules: c.rules || '',
            logoUrl: c.logoUrl || '',
            leader: c.leader
              ? { id: String(c.leader.id || c.leader._id || ''), name: c.leader.name, email: c.leader.email }
              : null,
            members: Number(c.members || 0),
            events: Number(c.events || 0),
            status: c.status || 'Active',
          }));

          setClubs(normalized);
          setStats((prev) => ({
            ...prev,
            totalClubs: normalized.length,
            totalLeaders: normalized.filter((c) => !!c.leader).length,
            vacantClubs: normalized.filter((c) => !c.leader).length,
          }));
        } catch {
          // ignore refresh errors and still show the server message
        }
      }

      alert(message);
      return;
    }

    // Update stats if assigning to a vacant club
    if (!clubToUse.leader) {
      setStats(prev => ({
        ...prev,
        totalLeaders: prev.totalLeaders + 1,
        vacantClubs: prev.vacantClubs - 1,
      }));
    }

    setLeaderFormData({ clubId: '', studentId: '' });
    setConfirmReplaceLeader(false);
    setShowAssignLeaderForm(false);
    setStudentSearch('');
    setAssigningClub(null);
  };

  const handleRemoveLeader = (club) => {
    setLeaderToRemove(club);
    setShowRemoveLeaderModal(true);
  };

  const confirmRemoveLeader = async () => {
    try {
      await clubService.removeLeader(leaderToRemove.id);
      const updatedClubs = clubs.map(club =>
        String(club.id) === String(leaderToRemove.id)
          ? { ...club, leader: null }
          : club
      );
      setClubs(updatedClubs);
      setStats(prev => ({
        ...prev,
        totalLeaders: Math.max(prev.totalLeaders - 1, 0),
        vacantClubs: prev.vacantClubs + 1,
      }));
      setShowRemoveLeaderModal(false);
      setLeaderToRemove(null);
      alert('Leader removed successfully!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to remove leader');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-[#25f194] font-sans">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className="text-sm font-bold text-gray-900">CampusCore</div>
                  <div className="text-xs font-medium text-gray-500">Admin</div>
                </div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm font-semibold">Club and Society</div>
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
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Club & Society Management</h2>
            <p className="mt-1 text-sm text-white/80">Signed in as {user?.email}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-4 text-sm font-medium transition ${
                activeTab === 'overview'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('clubs')}
              className={`pb-3 px-4 text-sm font-medium transition ${
                activeTab === 'clubs'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Club Management
            </button>
            <button
              onClick={() => setActiveTab('leaders')}
              className={`pb-3 px-4 text-sm font-medium transition ${
                activeTab === 'leaders'
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Leader Management
            </button>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <DashboardCard title="Total Clubs" value={loading ? '...' : stats.totalClubs} color="indigo" />
                <DashboardCard title="Total Students" value={loading ? '...' : stats.totalStudents} color="emerald" />
                <DashboardCard title="Club Leaders" value={loading ? '...' : stats.totalLeaders} color="blue" />
                <DashboardCard title="Vacant Clubs" value={loading ? '...' : stats.vacantClubs} color="red" />
                <DashboardCard title="Upcoming Events" value={loading ? '...' : stats.upcomingEvents.length} color="yellow" />
              </div>

              {/* Upcoming Events List */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events (Next 7 Days)</h3>
                {loading ? (
                  <div className="text-gray-500">Loading...</div>
                ) : stats.upcomingEvents.length === 0 ? (
                  <div className="text-gray-500">No upcoming events.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {stats.upcomingEvents.map((event, idx) => (
                      <li key={idx} className="py-2 flex items-center justify-between">
                        <span className="font-medium text-gray-800">{event.name}</span>
                        <span className="text-sm text-gray-500">{event.club}</span>
                        <span className="text-sm text-gray-600">{event.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* CLUBS MANAGEMENT TAB */}
          {activeTab === 'clubs' && (
            <div>
              {/* Create Club Button */}
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-2 px-4 rounded-lg transition"
                >
                  + Create New Club
                </button>
              </div>

              {/* Create Club Form Modal */}
              {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Club</h2>
                    <form onSubmit={handleCreateClub} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          placeholder="Enter club name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          placeholder="Enter club description"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rules/Guidelines</label>
                        <textarea
                          name="rules"
                          value={formData.rules}
                          onChange={handleFormChange}
                          placeholder="Enter club rules"
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                        <input
                          type="text"
                          name="logoUrl"
                          value={formData.logoUrl}
                          onChange={handleFormChange}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setFormData({ name: '', description: '', rules: '', logoUrl: '' });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Create Club
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Edit Club Form Modal */}
              {showEditForm && editingClub && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Club</h2>
                    <form onSubmit={handleSaveEdit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Club Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          placeholder="Enter club name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          placeholder="Enter club description"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rules/Guidelines</label>
                        <textarea
                          name="rules"
                          value={formData.rules}
                          onChange={handleFormChange}
                          placeholder="Enter club rules"
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                        <input
                          type="text"
                          name="logoUrl"
                          value={formData.logoUrl}
                          onChange={handleFormChange}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditForm(false);
                            setEditingClub(null);
                            setFormData({ name: '', description: '', rules: '', logoUrl: '' });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {showDeleteModal && clubToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Delete Club</h2>
                    <p className="text-gray-600 mb-2">
                      Are you sure you want to delete <strong>{clubToDelete.name}</strong>?
                    </p>
                    <p className="text-sm text-red-600 mb-6">
                      This will remove all associated members, events, and data. This action cannot be undone.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowDeleteModal(false);
                          setClubToDelete(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Delete Club
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Clubs Table */}
              {loading ? (
                <div className="text-center py-8 text-white">Loading clubs...</div>
              ) : clubs.length === 0 ? (
                <div className="text-center py-8 text-white/80">No clubs found. Create your first club!</div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Club Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Leader</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Members</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Events</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clubs.map((club) => (
                        <tr key={club.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{club.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {club.leader ? (
                              <span className="text-gray-900">{typeof club.leader === 'string' ? club.leader : club.leader?.name}</span>
                            ) : (
                              <span className="text-red-600 font-semibold">VACANT</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{club.members}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{club.events}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${club.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {club.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm flex gap-2">
                            <button
                              onClick={() => handleEditClub(club)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClub(club)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                            <button onClick={() => openAssignLeaderModal(club)} className="text-blue-600 hover:text-blue-800 font-medium">
                              {club.leader ? 'Change Leader' : 'Assign Leader'}
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

          {/* LEADER MANAGEMENT TAB */}
          {activeTab === 'leaders' && (
            <div>
              {/* Clubs Without Leaders Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Clubs Without Leaders (Vacant)</h3>
                {clubs.filter(c => !c.leader).length === 0 ? (
                  <div className="bg-white rounded-lg p-6 text-gray-600">All clubs have leaders assigned!</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clubs.filter(c => !c.leader).map((club) => (
                      <div key={club.id} className="bg-white rounded-lg p-5 shadow flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{club.name}</h4>
                          <p className="text-sm text-gray-600">{club.members} members</p>
                        </div>
                        <button
                          onClick={() => openAssignLeaderModal(club)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                        >
                          Assign Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign Leader Form Modal */}
              {showAssignLeaderForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Assign Leader to {assigningClub ? assigningClub.name : 'Club'}</h2>
                    {assigningClub?.leader && (
                      <div className="text-sm text-gray-700 mb-3">
                        Current Leader: <span className="font-semibold">{typeof assigningClub.leader === 'string' ? assigningClub.leader : assigningClub.leader?.name}</span> (will be replaced)
                      </div>
                    )}
                    <form onSubmit={handleAssignLeader} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Club *</label>
                        <select
                          name="clubId"
                          value={leaderFormData.clubId}
                          onChange={handleAssignLeaderChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Select a club --</option>
                          {clubs.map((club) => (
                            <option key={club.id} value={club.id}>
                              {club.name} {club.leader ? `(Leader: ${typeof club.leader === 'string' ? club.leader : club.leader?.name})` : '(No leader)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Student as Leader</label>
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {studentsLoading ? 'Loading...' : `${students.length} students available`}
                          </span>
                        </div>
                        <select
                          name="studentId"
                          value={leaderFormData.studentId}
                          onChange={handleAssignLeaderChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">
                            {studentsLoading ? 'Loading students...' : students.length ? '-- Select a student --' : 'No students available'}
                          </option>
                          {students
                            .filter((s) => {
                              const q = studentSearch.trim().toLowerCase();
                              if (!q) return true;
                              const label = `${s.name} ${s.email} ${s.department || ''} ${s.year || ''}`.toLowerCase();
                              return label.includes(q);
                            })
                            .map((s) => {
                              const meta = [s.email, [s.department, s.year].filter(Boolean).join(' ')].filter(Boolean).join(' - ');
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.name}{meta ? ` (${meta})` : ''}
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      {/* Warning if replacing leader */}
                      {leaderFormData.clubId && clubs.find(c => String(c.id) === String(leaderFormData.clubId))?.leader && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 mb-3">
                            <strong>⚠️ Warning:</strong> This club already has <strong>
                              {(() => {
                                const c = clubs.find(c => String(c.id) === String(leaderFormData.clubId));
                                if (!c) return '';
                                return typeof c.leader === 'string' ? c.leader : c.leader?.name || '';
                              })()}
                            </strong> as leader. Assigning a new leader will automatically remove them and make them a regular member.
                          </p>
                          <label className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={confirmReplaceLeader}
                              onChange={(e) => setConfirmReplaceLeader(e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-gray-700">I understand this will replace the current leader</span>
                          </label>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAssignLeaderForm(false);
                            setLeaderFormData({ clubId: '', studentId: '' });
                            setConfirmReplaceLeader(false);
                            setStudentSearch('');
                            setAssigningClub(null);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            !leaderFormData.studentId ||
                            (leaderFormData.clubId &&
                              clubs.find(c => String(c.id) === String(leaderFormData.clubId))?.leader &&
                              !confirmReplaceLeader)
                          }
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Assign as Leader
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Remove Leader Confirmation Modal */}
              {showRemoveLeaderModal && leaderToRemove && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Remove Leader</h2>
                    <p className="text-gray-600 mb-6">Are you sure you want to remove <strong>{typeof leaderToRemove.leader === 'string' ? leaderToRemove.leader : leaderToRemove.leader?.name}</strong> as the leader of <strong>{leaderToRemove.name}</strong>?</p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowRemoveLeaderModal(false);
                          setLeaderToRemove(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmRemoveLeader}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Remove Leader
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* All Leaders List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">All Club Leaders</h3>
                </div>
                {clubs.filter(c => c.leader).length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">No leaders assigned yet.</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Leader Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Club</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Members</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {clubs.filter(c => c.leader).map((club) => (
                        <tr key={club.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{typeof club.leader === 'string' ? club.leader : club.leader?.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{club.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{club.members}</td>
                          <td className="px-6 py-4 text-sm flex gap-2">
                            <button onClick={() => openAssignLeaderModal(club)} className="text-blue-600 hover:text-blue-800 font-medium">Change Leader</button>
                            <button
                              onClick={() => handleRemoveLeader(club)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// DashboardCard component
function DashboardCard({ title, value, color }) {
  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-400',
    emerald: 'from-emerald-500 to-emerald-400',
    blue: 'from-blue-500 to-blue-400',
    red: 'from-red-500 to-red-400',
    yellow: 'from-yellow-400 to-yellow-300',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorMap[color] || 'from-gray-200 to-gray-100'} p-5 shadow text-white`}>
      <div className="text-xs font-medium opacity-80 mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
