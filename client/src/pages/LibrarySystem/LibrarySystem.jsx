import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, Search, Users, Globe, BookMarked, Menu, User, LogOut
} from 'lucide-react';
import { authService } from '../../services/authService';
import LibraryBooks from './LibraryBooks';

import SearchBooks from './SearchBooks';
import StudyRooms from './StudyRooms';
import DigitalResources from './DigitalResources';
import MyLibrary from './MyLibrary';

// Add styles inline with UserMenu fixes
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(20px, -50px) scale(1.1); }
    50% { transform: translate(-20px, 20px) scale(0.9); }
    75% { transform: translate(50px, 50px) scale(1.05); }
  }
  
  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  .animate-slide-down {
    animation: slideDown 0.6s ease-out forwards;
  }
  
  .animate-scale-in {
    animation: scaleIn 0.5s ease-out forwards;
  }
  
  .animate-blob {
    animation: blob 7s infinite;
  }
  
  .animate-slide-in-left {
    animation: slideInFromLeft 0.5s ease-out forwards;
  }
  
  .animate-pulse-soft {
    animation: pulse 3s ease-in-out infinite;
  }
  
  .animation-delay-100 { animation-delay: 100ms; }
  .animation-delay-200 { animation-delay: 200ms; }
  .animation-delay-300 { animation-delay: 300ms; }
  .animation-delay-400 { animation-delay: 400ms; }
  .animation-delay-500 { animation-delay: 500ms; }
  .animation-delay-2000 { animation-delay: 2s; }
  .animation-delay-4000 { animation-delay: 4s; }
  
  .group:hover img {
    transform: scale(1.1) !important;
    transition: transform 0.5s ease-out;
  }
  
  .hover-lift:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.3s ease-out;
  }
  
  .hover-scale:hover {
    transform: scale(1.05);
    transition: all 0.3s ease-out;
  }

  /* Fix UserMenu dropdown positioning and visibility */
  .user-menu-container {
    position: relative;
    z-index: 9999 !important;
  }
  
  .user-menu-dropdown {
    position: absolute !important;
    top: 100% !important;
    right: 0 !important;
    margin-top: 8px !important;
    z-index: 9999 !important;
    min-width: 200px !important;
    background: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 12px !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    backdrop-filter: blur(20px) !important;
  }
  
  .user-menu-item {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    width: 100% !important;
    padding: 12px 16px !important;
    text-align: left !important;
    color: #374151 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    border: none !important;
    background: none !important;
    cursor: pointer !important;
  }
  
  .user-menu-item:hover {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
  }
  
  .user-menu-item:first-child {
    border-radius: 12px 12px 0 0 !important;
  }
  
  .user-menu-item:last-child {
    border-radius: 0 0 12px 12px !important;
    color: #ef4444 !important;
  }
  
  .user-menu-item:last-child:hover {
    background-color: #fef2f2 !important;
    color: #dc2626 !important;
  }
`;

// Custom UserMenu component with settings removed
function CustomUserMenu({ user, onProfile, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleProfileClick = () => {
    setIsOpen(false);
    onProfile();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  // Get first letter of name
  const getInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.name) return user.name[0].toUpperCase();
    return 'D'; // Default to 'D' for Dineth
  };

  // Get display name
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.name) return user.name;
    return 'Dineth'; // Default name
  };

  // Get student ID
  const getStudentId = () => {
    if (user?.studentId) return user.studentId;
    if (user?.id) return user.id;
    return 'IT23165120'; // Default ID as shown in image
  };

  return (
    <div className="user-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#25f194] focus:ring-opacity-50"
      >
        {/* Circular Avatar - Exact format from image */}
        <div className="w-10 h-10 bg-[#1DB584] rounded-full flex items-center justify-center font-bold text-white text-lg shadow-md">
          {getInitial()}
        </div>

        {/* User Info */}
        <div className="text-left hidden md:block">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {getDisplayName()}
          </p>
          <p className="text-xs text-gray-500 leading-tight">
            ID: {getStudentId()}
          </p>
        </div>

        {/* Dropdown Arrow */}
        <div className="hidden md:block">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="user-menu-dropdown">
            {/* User Info Header in Dropdown */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1DB584] rounded-full flex items-center justify-center font-bold text-white">
                  {getInitial()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {getStudentId()}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-1">
              <button
                onClick={handleProfileClick}
                className="user-menu-item"
              >
                <User size={16} />
                <span>View Profile</span>
              </button>

              <button
                onClick={handleLogoutClick}
                className="user-menu-item text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function LibrarySystem({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(() => {
    try {
      return localStorage.getItem('cc_library_active_nav') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const v = localStorage.getItem('cc_library_sidebar_open');
      return v ? v === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleNavChange = (navId) => {
    setActiveNav(navId);
    try {
      localStorage.setItem('cc_library_active_nav', navId);
    } catch { }
  };

  const logout = async () => {
    try {
      await authService.logout();
      onLoggedOut?.();
      navigate('/signin', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API fails
      onLoggedOut?.();
      navigate('/signin', { replace: true });
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'rooms', label: 'Study Rooms', icon: Users },
    { id: 'digital', label: 'Digital Resources', icon: Globe },
    { id: 'mylibrary', label: 'My Library', icon: BookMarked }
  ];

  // Render different content based on activeNav
  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <DashboardContent
            user={user}
            onBrowseLibrary={() => handleNavChange('digital')}
            onBrowseDigital={() => handleNavChange('digital')}
          />
        );
      case 'search':
        return <SearchBooks user={user} onLoggedOut={onLoggedOut} />;
      case 'rooms':
        return <StudyRooms user={user} onLoggedOut={onLoggedOut} />;
      case 'digital':
        return <DigitalResources user={user} onLoggedOut={onLoggedOut} />;
      case 'books':
        return <DigitalResources user={user} onLoggedOut={onLoggedOut} />; // Redirect Books to Digital too
      case 'mylibrary':
        return <MyLibrary user={user} onLoggedOut={onLoggedOut} />;
      default:
        return (
          <DashboardContent
            user={user}
            onBrowseLibrary={() => handleNavChange('digital')}
            onBrowseDigital={() => handleNavChange('digital')}
          />
        );
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="flex h-screen bg-gray-50">
        {/* SIDEBAR */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-screen left-0 top-0 z-40 shadow-lg animate-slide-in-left`}>
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#25f194] rounded-lg transform hover:scale-110 transition-transform duration-300 animate-scale-in">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              {sidebarOpen && (
                <div className="animate-fade-in">
                  <h1 className="font-bold text-gray-900">Library</h1>
                  <p className="text-xs text-gray-500">Module page</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => handleNavChange(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-3 hover:translate-x-1 animate-fade-in-up ${activeNav === item.id
                  ? 'bg-[#25f194] text-gray-900 shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
                title={!sidebarOpen ? item.label : ''}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Sidebar Toggle */}
          <div className="p-4 border-t border-gray-200 animate-fade-in">
            <button
              onClick={() => {
                const v = !sidebarOpen;
                setSidebarOpen(v);
                try { localStorage.setItem('cc_library_sidebar_open', String(v)); } catch { }
              }}
              className="w-full px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              title={sidebarOpen ? 'Collapse' : 'Expand'}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className={`flex-1 flex flex-col overflow-hidden ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          {/* Top Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm animate-slide-down relative z-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navItems.find(item => item.id === activeNav)?.label}
              </h2>
              <p className="text-sm text-gray-500">Welcome back!</p>
            </div>

            {/* Replace UserMenu with CustomUserMenu */}
            <CustomUserMenu
              user={user}
              onProfile={handleProfile}
              onLogout={logout}
            />
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}

// LibraryBooks Wrapper
function LibraryBooksWrapper({ user, onLoggedOut }) {
  return (
    <div className="p-6">
      <LibraryBooks user={user} onLoggedOut={onLoggedOut} showBackButton={false} />
    </div>
  );
}

// DASHBOARD CONTENT
function DashboardContent({ user, onBrowseLibrary, onBrowseDigital }) {
  const [featuredBooks, setFeaturedBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { bookService } = await import('../../services/libraryService');
        const res = await bookService.getAll();
        const data = res?.data?.data || res?.data || [];
        setFeaturedBooks(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (err) {
        console.error("Failed to fetch featured books", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const Button = ({ children, className = '', variant = 'default', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1';
    const variants = {
      default: 'bg-[#25f194] text-gray-900 hover:bg-emerald-500 shadow-lg hover:shadow-xl',
      outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-[#25f194]',
    };
    return (
      <button className={`${baseStyles} px-6 py-3 ${variants[variant]} ${className}`} {...props}>
        {children}
      </button>
    );
  };

  const Card = ({ children, className = '', delay = 0 }) => (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover-lift animate-scale-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );

  const Badge = ({ children, variant = 'success' }) => {
    const variants = {
      success: 'bg-emerald-100 text-emerald-700',
      warning: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${variants[variant]} animate-fade-in`}>
        {children}
      </span>
    );
  };

  return (
    <div
      className="p-6 space-y-6 min-h-full relative overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(37, 241, 148, 0.2) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(139, 92, 246, 0.2) 100%), url(https://images.unsplash.com/photo-1507842696857-b8b9f6a1b400?auto=format&fit=crop&w=2000&q=90)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <Card className="lg:col-span-2 bg-white/95 backdrop-blur" delay={0}>
            <div className="p-8 flex flex-col gap-4 animate-fade-in-up">
              <p className="text-sm font-semibold text-emerald-600 tracking-wide">
                Smart Campus Library
              </p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Discover books, reserve study spaces, and access digital resources in one place
              </h2>
              <p className="text-sm md:text-base text-gray-600 max-w-xl">
                Browse the physical collection, explore curated digital content, and manage your
                library activity from your personalized dashboard.
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <Button onClick={onBrowseLibrary}>
                  Browse Library
                </Button>
                <Button variant="outline" className="bg-white/70" onClick={onBrowseDigital}>
                  Browse Digital Resources
                </Button>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-900/90 text-white backdrop-blur" delay={100}>
            <div className="p-6 space-y-4 animate-fade-in-up">
              <p className="text-sm text-emerald-300 font-semibold uppercase tracking-wide">
                Your Snapshot
              </p>
              <h3 className="text-2xl font-bold">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
              </h3>
              <p className="text-sm text-gray-300">
                Continue where you left off, discover new titles, or jump into digital resources.
              </p>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg bg-gray-800/80 p-3 hover:bg-emerald-600/50 transition-all duration-300 transform hover:scale-110 hover-scale">
                  <p className="text-gray-400 uppercase tracking-wide">Books</p>
                  <p className="text-lg font-bold text-white">12</p>
                </div>
                <div className="rounded-lg bg-gray-800/80 p-3 hover:bg-emerald-600/50 transition-all duration-300 transform hover:scale-110 hover-scale">
                  <p className="text-gray-400 uppercase tracking-wide">Study</p>
                  <p className="text-lg font-bold text-white">48h</p>
                </div>
                <div className="rounded-lg bg-gray-800/80 p-3 hover:bg-emerald-600/50 transition-all duration-300 transform hover:scale-110 hover-scale">
                  <p className="text-gray-400 uppercase tracking-wide">Digital</p>
                  <p className="text-lg font-bold text-white">280</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/95 backdrop-blur" delay={0}>
            <div className="p-6 animate-fade-in-up">
              <p className="text-xs text-gray-500 font-bold uppercase mb-2">Books Issued</p>
              <h3 className="text-3xl font-bold text-gray-900">12</h3>
              <p className="text-xs text-gray-400 mt-2">📚 Active Borrowings</p>
            </div>
          </Card>

          <Card className="bg-white/95 backdrop-blur" delay={100}>
            <div className="p-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <p className="text-xs text-gray-500 font-bold uppercase mb-2">Study Hours</p>
              <h3 className="text-3xl font-bold text-gray-900">48h</h3>
              <p className="text-xs text-gray-400 mt-2">⏱️ This Month</p>
            </div>
          </Card>

          <Card className="bg-white/95 backdrop-blur" delay={200}>
            <div className="p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <p className="text-xs text-gray-500 font-bold uppercase mb-2">Digital Access</p>
              <h3 className="text-3xl font-bold text-gray-900">280</h3>
              <p className="text-xs text-gray-400 mt-2">🌐 Resources</p>
            </div>
          </Card>

          <Card className="bg-white/95 backdrop-blur" delay={300}>
            <div className="p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <p className="text-xs text-gray-500 font-bold uppercase mb-2">Points Earned</p>
              <h3 className="text-3xl font-bold text-gray-900">850</h3>
              <p className="text-xs text-gray-400 mt-2">⭐ Rewards</p>
            </div>
          </Card>
        </div>

        {/* Featured Books */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4 animate-fade-in">Featured Books</h3>
          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div></div>
          ) : featuredBooks.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-10 text-center border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">No featured books available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book, idx) => (
                <Card key={idx} className="overflow-hidden bg-white/95 backdrop-blur group" delay={idx * 100}>
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={book.thumbnailImage || book.cover || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'}
                      alt={book.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    <Badge variant={book.status === 'Available' ? 'success' : 'warning'}>
                      {book.status || 'Available'}
                    </Badge>
                    <h4 className="font-bold text-gray-900 mt-2 line-clamp-2">{book.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span>⭐ {book.rating || '4.8'}</span>
                      <Button onClick={onBrowseDigital}>Borrow</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
