import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../../lib/toast';

export default function ClubManagement() {
  const navigate = useNavigate();

  // States
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Mock data - Replace with API calls
  useEffect(() => {
    setTimeout(() => {
      setClubs([
        { id: 1, name: 'Robotics Club', description: 'Building robots', leader: 'John Doe', members: 45, events: 3, status: 'Active' },
        { id: 2, name: 'Art Club', description: 'Visual arts', leader: null, members: 32, events: 2, status: 'Active' },
        { id: 3, name: 'Chess Club', description: 'Strategic gaming', leader: 'Jane Smith', members: 28, events: 5, status: 'Active' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create Club
  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Club name is required');
      return;
    }

    // TODO: Replace with API call
    const newClub = {
      id: clubs.length + 1,
      ...formData,
      leader: null,
      members: 0,
      events: 0,
      status: 'Active',
    };

    setClubs([...clubs, newClub]);
    setFormData({ name: '', description: '', rules: '', logoUrl: '' });
    setShowCreateForm(false);
    toast.success('Club created successfully!');
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
      toast.error('Club name is required');
      return;
    }

    // TODO: Replace with API call
    const updatedClubs = clubs.map(club =>
      club.id === editingClub.id ? { ...club, ...formData } : club
    );

    setClubs(updatedClubs);
    setEditingClub(null);
    setShowEditForm(false);
    setFormData({ name: '', description: '', rules: '', logoUrl: '' });
    toast.success('Club updated successfully!');
  };

  // Delete Club
  const handleDeleteClub = (club) => {
    setClubToDelete(club);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    // TODO: Replace with API call
    setClubs(clubs.filter(club => club.id !== clubToDelete.id));
    setShowDeleteModal(false);
    setClubToDelete(null);
    toast.success('Club deleted successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Club Management</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
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
          <div className="text-center py-8">Loading clubs...</div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No clubs found. Create your first club!</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Club Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Leader</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Members</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Events</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clubs.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{club.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {club.leader ? (
                        <span className="text-gray-900">{club.leader}</span>
                      ) : (
                        <span className="text-red-600 font-semibold">VACANT</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{club.members}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{club.events}</td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
