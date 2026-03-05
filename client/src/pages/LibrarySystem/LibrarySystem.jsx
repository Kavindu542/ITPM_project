import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, Globe, Home, Search, Users, BookMarked
} from 'lucide-react';
import SearchBooks from './SearchBooks';
import LibraryBooks from './LibraryBooks';
import StudyRooms from './StudyRooms';
import DigitalResources from './DigitalResources';
import MyLibrary from './MyLibrary';
import LibraryAIChatBot from '../../components/LibraryAIChatBot';
import LibrarySidebar from '../../components/LibrarySidebar';

export default function LibrarySystem({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/library' },
      { id: 'books', label: 'Books', icon: BookOpen, path: '/library/books' },
      { id: 'search', label: 'Search', icon: Search, path: '/library/search' },
      { id: 'rooms', label: 'Study Rooms', icon: Users, path: '/library/study-rooms' },
      { id: 'digital', label: 'Digital Resources', icon: Globe, path: '/library/digital-resources' },
      { id: 'mylibrary', label: 'My Library', icon: BookMarked, path: '/library/my-library' },
    ],
    []
  );

  const navIdFromPath = React.useCallback((pathname) => {
    const p = String(pathname || '').replace(/\/+$/, '') || '/';
    if (p === '/library') return 'dashboard';
    if (p.startsWith('/library/books')) return 'books';
    if (p.startsWith('/library/search')) return 'search';
    if (p.startsWith('/library/study-rooms')) return 'rooms';
    if (p.startsWith('/library/digital-resources')) return 'digital';
    if (p.startsWith('/library/my-library')) return 'mylibrary';
    return 'dashboard';
  }, []);

  const [activeNav, setActiveNav] = useState(() => {
    try {
      return localStorage.getItem('cc_library_active_nav') || navIdFromPath(window.location.pathname);
    } catch {
      return navIdFromPath(window.location.pathname);
    }
  });

  const handleNavChange = (navId) => {
    setActiveNav(navId);
    try {
      localStorage.setItem('cc_library_active_nav', navId);
    } catch { }

    const target = navItems.find((n) => n.id === navId)?.path;
    if (target) navigate(target);
  };

  useEffect(() => {
    const next = navIdFromPath(location.pathname);
    if (next !== activeNav) setActiveNav(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navIdFromPath]);

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
      case 'books':
        return <LibraryBooks user={user} onLoggedOut={onLoggedOut} />;
      case 'rooms':
        return <StudyRooms user={user} onLoggedOut={onLoggedOut} />;
      case 'digital':
        return <DigitalResources user={user} onLoggedOut={onLoggedOut} />;
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
    <div className="h-[calc(100vh-6rem)] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans overflow-auto no-scrollbar lg:overflow-hidden">
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

      <div className="relative w-full h-full p-6 lg:pt-0 lg:pb-0 flex flex-col">
        <div className="mt-0 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:h-full lg:overflow-hidden lg:min-h-0 lg:grid-rows-[minmax(0,1fr)]">
          <div className="lg:col-span-1 lg:h-full lg:min-h-0">
            <LibrarySidebar />
          </div>

          <div className="lg:col-span-11 lg:h-full lg:min-h-0 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm lg:overflow-y-auto no-scrollbar">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">{activeItem?.label}</div>
                <div className="text-xs text-gray-500 mt-1">Use the sidebar to switch sections.</div>
              </div>
            </div>

            <div>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      <LibraryAIChatBot />
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
