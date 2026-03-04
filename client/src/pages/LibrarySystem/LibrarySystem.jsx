import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Home, BookOpen, Search, Users, Globe, BookMarked
} from 'lucide-react';
import SearchBooks from './SearchBooks';
import StudyRooms from './StudyRooms';
import DigitalResources from './DigitalResources';
import MyLibrary from './MyLibrary';

export default function LibrarySystem({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState(() => {
    try {
      return localStorage.getItem('cc_library_active_nav') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const handleNavChange = (navId) => {
    setActiveNav(navId);
    try {
      localStorage.setItem('cc_library_active_nav', navId);
    } catch { }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'rooms', label: 'Study Rooms', icon: Users },
    { id: 'digital', label: 'Digital Resources', icon: Globe },
    { id: 'mylibrary', label: 'My Library', icon: BookMarked }
  ];

  const activeItem = navItems.find((item) => item.id === activeNav) || navItems[0];

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      {/* Background Pattern (match Study Materials) */}
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
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-800">Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm">
          <div className="p-6 sm:p-8 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-[#25f194] shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Library System</h1>
              <p className="mt-1 text-sm text-gray-600">
                Search books, reserve study rooms, access digital resources, and manage your activity.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <Search className="h-3.5 w-3.5" />
                  Smart search & filters
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <Users className="h-3.5 w-3.5" />
                  Reserve study rooms
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <Globe className="h-3.5 w-3.5" />
                  Digital resources
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="text-xs text-gray-500">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}.
              </div>
              <div className="text-xs text-gray-400">Use the menu to switch sections.</div>
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
                <div className="text-xs text-gray-500 mt-1">Navigate library features</div>
              </div>
              <div className="p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavChange(item.id)}
                      className={`w-full inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold border transition-colors ${isActive
                        ? 'bg-gradient-to-r from-[#25f194] to-blue-600 border-transparent text-white shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                      <span className={isActive ? 'text-white' : 'text-gray-800'}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">{activeItem?.label}</h2>
                <p className="text-xs text-gray-500 mt-1">Welcome back!</p>
              </div>
              <div>
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
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
