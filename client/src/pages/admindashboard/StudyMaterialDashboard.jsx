import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import UserMenu from '../../components/UserMenu';
import { 
  LogOut, BookOpen, FileText, Video, Download, 
  Upload, Users, BarChart3, Bell, Search, 
  Filter, ChevronDown, Eye, Edit, Trash2,
  FolderOpen, Clock, Star, TrendingUp
} from 'lucide-react';

export default function StudyMaterialDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();

  // Mock data for study materials
  const studyMaterials = [
    { id: 1, title: 'Advanced Calculus Notes', type: 'pdf', subject: 'Mathematics', uploaded: '2 hours ago', downloads: 245, size: '4.2 MB', status: 'Published' },
    { id: 2, title: 'Organic Chemistry Lab Manual', type: 'doc', subject: 'Chemistry', uploaded: '1 day ago', downloads: 189, size: '3.1 MB', status: 'Published' },
    { id: 3, title: 'Data Structures Slides', type: 'ppt', subject: 'Computer Science', uploaded: '2 days ago', downloads: 312, size: '7.8 MB', status: 'Draft' },
    { id: 4, title: 'Physics Lab Video Tutorial', type: 'video', subject: 'Physics', uploaded: '3 days ago', downloads: 456, size: '128 MB', status: 'Published' },
    { id: 5, title: 'Literature Review Samples', type: 'pdf', subject: 'English', uploaded: '1 week ago', downloads: 134, size: '2.5 MB', status: 'Published' },
    { id: 6, title: 'Microeconomics Case Studies', type: 'pdf', subject: 'Economics', uploaded: '1 week ago', downloads: 278, size: '5.6 MB', status: 'Archived' },
  ];

  const stats = {
    totalMaterials: 245,
    totalDownloads: 12458,
    activeSubjects: 18,
    storageUsed: '4.2 GB'
  };

  const recentActivity = [
    { id: 1, user: 'Sarah Chen', action: 'uploaded', material: 'Physics Lab Manual', time: '10 min ago' },
    { id: 2, user: 'Admin', action: 'updated', material: 'Math Syllabus', time: '1 hour ago' },
    { id: 3, user: 'Mike Johnson', action: 'downloaded', material: 'Chemistry Notes', time: '2 hours ago' },
    { id: 4, user: 'Emily Davis', action: 'commented', material: 'History Textbook', time: '4 hours ago' },
  ];

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/signin', { replace: true });
  };

  const getTypeIcon = (type) => {
    const icons = {
      pdf: '📄',
      doc: '📝',
      ppt: '📊',
      video: '🎥'
    };
    return icons[type] || '📁';
  };

  const getStatusColor = (status) => {
    const colors = {
      Published: 'bg-green-100 text-green-700',
      Draft: 'bg-yellow-100 text-yellow-700',
      Archived: 'bg-gray-100 text-gray-700',
      Pending: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.06]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Main Layout */}
      <div className="relative">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Brand & Search */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Study Material</h1>
                    <p className="text-xs text-gray-500">Dashboard v2.1</p>
                  </div>
                </div>

                <div className="hidden lg:flex items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search materials..."
                      className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Right: User & Actions */}
              <div className="flex items-center gap-4">
                <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors relative">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <UserMenu
                  user={user}
                  onProfile={() => navigate('/profile')}
                  onLogout={logout}
                  theme="light"
                  idLabel="ID"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Materials</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMaterials}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <BookOpen className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
                <TrendingUp className="h-4 w-4" />
                <span>+12% from last month</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Downloads</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDownloads.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Avg. 420/day</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Subjects</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeSubjects}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>Across 6 departments</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Storage Used</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.storageUsed}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <span>65% of 6.5 GB limit</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Materials Table */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Study Materials</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage and organize educational content</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                        <Filter className="h-4 w-4 text-gray-700" />
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all">
                        <Upload className="h-4 w-4" />
                        Upload New
                      </button>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Material</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Subject</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Downloads</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studyMaterials.map((material) => (
                        <tr key={material.id} className="border-b border-gray-200 hover:bg-gray-100/60 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{getTypeIcon(material.type)}</div>
                              <div>
                                <p className="font-medium text-gray-900">{material.title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500">{material.size}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-gray-500" />
                                    {material.uploaded}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                              {material.subject}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Download className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-900 font-medium">{material.downloads}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                              {material.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-yellow-100 text-gray-700 hover:text-yellow-700 transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing 6 of {studyMaterials.length} materials
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      1
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      2
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Activity & Quick Stats */}
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500 mt-1">Latest updates in the system</p>
                </div>
                <div className="p-6 space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.action}{' '}
                          <span className="font-medium">{activity.material}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-700 hover:text-blue-800 transition-colors">
                    View all activity →
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Most Popular</span>
                      <span className="text-sm text-gray-900 font-medium">Physics Lab Video</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Download Rate</span>
                      <span className="text-sm text-gray-900 font-medium">78/day</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-blue-500" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Active Users</span>
                      <span className="text-sm text-gray-900 font-medium">124</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">System Status</h2>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Storage Health</span>
                    <span className="text-sm text-green-700">Good</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Server Uptime</span>
                    <span className="text-sm text-green-700">99.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Active Sessions</span>
                    <span className="text-sm text-blue-700">42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Backup</span>
                    <span className="text-sm text-gray-500">2 hours ago</span>
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