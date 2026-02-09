import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import UserMenu from '../components/UserMenu';
import { 
  LogOut,
  BookOpen,
  Home as HomeIcon,
  Library,
  Users,
  Bell,
  Settings,
  ChevronRight,
  BookText,
  Building2,
  GraduationCap,
  Users2
} from 'lucide-react';

export default function Home({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const handleLogout = async () => {
    setError('');
    setBusy(true);
    try {
      await authService.logout();
      onLoggedOut?.();
    } catch (e) {
      setError(e?.response?.data?.message || 'Logout failed. Please try again.');
    } finally {
      setBusy(false);
      setShowLogoutConfirm(false);
    }
  };

  // Study Material Section Images
  const studyMaterialImages = [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Hostel Section Images
  const hostelImages = [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Library Section Images
  const libraryImages = [
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1524578271613-d550eacf6090?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Clubs Section Images
  const clubImages = [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Quick Actions with images
  const quickActions = [
    { 
      icon: BookText, 
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Study Materials', 
      color: 'from-blue-500 to-blue-600', 
      path: '/materials',
      description: 'Access course materials, notes, and resources'
    },
    { 
      icon: Building2, 
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Hostel Portal', 
      color: 'from-emerald-500 to-emerald-600', 
      path: '/hostel',
      description: 'Manage accommodation, complaints, and facilities'
    },
    { 
      icon: GraduationCap, 
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Library', 
      color: 'from-purple-500 to-purple-600', 
      path: '/library',
      description: 'Browse books, reserve, and check due dates'
    },
    { 
      icon: Users2, 
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Clubs', 
      color: 'from-pink-500 to-pink-600', 
      path: '/clubs',
      description: 'Join campus clubs and societies'
    },
  ];

  // Sample data for each section
  const studyMaterials = [
    { id: 1, title: 'Calculus II Notes', type: 'pdf', downloads: 245, subject: 'Mathematics' },
    { id: 2, title: 'Chemistry Lab Manual', type: 'doc', downloads: 189, subject: 'Chemistry' },
    { id: 3, title: 'Data Structures Guide', type: 'pdf', downloads: 312, subject: 'Computer Science' },
  ];

  const hostelInfo = {
    room: 'B-204',
    block: 'Block B',
    warden: 'Dr. Sharma',
    contact: '+91 9876543210',
    facilities: ['WiFi', 'AC', 'Laundry', 'Gym'],
  };

  const libraryStats = {
    borrowed: 3,
    due: 2,
    reserved: 1,
    fine: '₹150'
  };

  const clubs = [
    { id: 1, name: 'Tech Club', members: 150, category: 'Technology' },
    { id: 2, name: 'Drama Society', members: 80, category: 'Arts' },
    { id: 3, name: 'Sports Club', members: 200, category: 'Sports' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Main Layout */}
      <div className="relative">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Brand */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">CampusCore</h1>
                    <p className="text-xs text-gray-500">Student Dashboard</p>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="hidden lg:flex items-center gap-1 ml-8">
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    Dashboard
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'academics' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setActiveTab('academics')}
                  >
                    Academics
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'campus' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    onClick={() => setActiveTab('campus')}
                  >
                    Campus Life
                  </button>
                </div>
              </div>

              {/* Right: User & Actions */}
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <UserMenu
                  user={user}
                  onProfile={() => navigate('/profile')}
                  onLogout={() => setShowLogoutConfirm(true)}
                  theme="light"
                  idLabel="ID"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          {/* Welcome & Stats Banner */}
          <div className="mb-8">
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <div className="absolute right-0 top-0 bottom-0 w-1/3">
                <div className="absolute inset-0 bg-gradient-to-l from-blue-600/50 to-transparent"></div>
                <img 
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Campus"
                  className="w-full h-full object-cover opacity-20"
                />
              </div>
              <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Student'}! 👋</h1>
                  <p className="text-blue-100">Manage your campus life in one place</p>
                </div>
                <div className="mt-4 lg:mt-0 flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">92%</div>
                    <div className="text-sm text-blue-200">Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-sm text-blue-200">Due Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm text-blue-200">Active Courses</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 text-left"
                  onClick={() => navigate(action.path)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={action.image}
                      alt={action.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-lg`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{action.label}</h3>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    <div className="flex items-center text-blue-600 font-medium text-sm">
                      <span>Access Portal</span>
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Study Materials Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BookText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Study Materials</h2>
                      <p className="text-sm text-gray-500">Access your course resources</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    View All →
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Image Gallery */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {studyMaterialImages.map((img, index) => (
                    <div key={index} className="relative h-24 rounded-lg overflow-hidden group cursor-pointer">
                      <img
                        src={img}
                        alt={`Study Material ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                    </div>
                  ))}
                </div>

                {/* Recent Materials */}
                <div className="space-y-3">
                  {studyMaterials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">
                          {material.type === 'pdf' ? '📄' : '📝'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{material.title}</div>
                          <div className="text-sm text-gray-500">{material.subject}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {material.downloads} downloads
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hostel Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Hostel</h2>
                      <p className="text-sm text-gray-500">Your accommodation details</p>
                    </div>
                  </div>
                  <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">
                    Portal →
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Main Hostel Image */}
                <div className="relative h-48 rounded-xl overflow-hidden mb-6">
                  <img
                    src={hostelImages[0]}
                    alt="Hostel"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-2xl font-bold">{hostelInfo.room}</div>
                    <div className="text-sm">{hostelInfo.block}</div>
                  </div>
                </div>

                {/* Hostel Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">Warden</div>
                      <div className="font-medium text-gray-900">{hostelInfo.warden}</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-gray-600">Contact</div>
                      <div className="font-medium text-gray-900">{hostelInfo.contact}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Facilities</div>
                    <div className="flex flex-wrap gap-2">
                      {hostelInfo.facilities.map((facility, index) => (
                        <span key={index} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Library Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Library</h2>
                      <p className="text-sm text-gray-500">Books & Resources</p>
                    </div>
                  </div>
                  <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                    Visit Library →
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Library Image */}
                <div className="relative h-48 rounded-xl overflow-hidden mb-6">
                  <img
                    src={libraryImages[0]}
                    alt="Library"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="text-2xl font-bold">24/7 Access</div>
                    <div className="text-sm">Digital & Physical Resources</div>
                  </div>
                </div>

                {/* Library Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{libraryStats.borrowed}</div>
                    <div className="text-sm text-gray-600">Books Borrowed</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600">{libraryStats.due}</div>
                    <div className="text-sm text-amber-600">Due Soon</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{libraryStats.reserved}</div>
                    <div className="text-sm text-green-600">Reserved</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{libraryStats.fine}</div>
                    <div className="text-sm text-red-600">Pending Fine</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clubs Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 rounded-lg">
                      <Users2 className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Clubs & Societies</h2>
                      <p className="text-sm text-gray-500">Get involved on campus</p>
                    </div>
                  </div>
                  <button className="text-pink-600 hover:text-pink-700 font-medium text-sm">
                    Explore All →
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Club Images Carousel */}
                <div className="relative h-48 rounded-xl overflow-hidden mb-6">
                  <div className="absolute inset-0 flex">
                    {clubImages.map((img, index) => (
                      <div
                        key={index}
                        className="relative w-1/3 h-full overflow-hidden group"
                        style={{ transform: `translateX(${index * -33.33}%)` }}
                      >
                        <img
                          src={img}
                          alt={`Club ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clubs List */}
                <div className="space-y-3">
                  {clubs.map((club) => (
                    <div key={club.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">
                          {club.category === 'Technology' ? '💻' : 
                           club.category === 'Arts' ? '🎭' : '⚽'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{club.name}</div>
                          <div className="text-sm text-gray-500">{club.category}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {club.members} members
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Campus Highlights</h2>
                  <p className="text-gray-600">Latest updates and upcoming events</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View Calendar →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-blue-600 font-medium mb-2">Tomorrow • 3 PM</div>
                  <div className="font-bold text-gray-900 mb-2">Tech Symposium</div>
                  <div className="text-sm text-gray-600">Computer Science Department</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-green-600 font-medium mb-2">Oct 15 • 10 AM</div>
                  <div className="font-bold text-gray-900 mb-2">Sports Day</div>
                  <div className="text-sm text-gray-600">Main Ground</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-purple-600 font-medium mb-2">Oct 20 • 6 PM</div>
                  <div className="font-bold text-gray-900 mb-2">Cultural Fest</div>
                  <div className="text-sm text-gray-600">Auditorium</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md mx-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
              </div>
              
              <p className="text-gray-600 mb-6">Are you sure you want to logout from your account? You'll need to sign in again to access your dashboard.</p>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                  onClick={handleLogout}
                  disabled={busy}
                >
                  {busy ? 'Logging out...' : 'Yes, Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}