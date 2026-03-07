import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Download, Heart, Star, Clock, Search, X, Eye, Trash2, Share2, Edit, Plus, ChevronRight, Zap, Brain, Sparkles, BookMarked, FileText, Headphones, Play } from 'lucide-react';
import { toBackendAssetUrl } from '../../utils/backendUrl';

const styles = `
  .premium-card {
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }
  .premium-card:hover {
    transform: translateY(-15px);
    border: 1px solid #25f194;
    box-shadow: 0 30px 60px -15px rgba(37, 241, 148, 0.2);
  }
  .image-container {
    clip-path: polygon(0 0, 100% 0, 100% 92%, 0% 100%);
    transition: clip-path 0.4s ease;
  }
  .premium-card:hover .image-container {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);
  }
  .bg-god-glass {
    background: linear-gradient(135deg, rgba(37, 241, 148, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
    background-attachment: fixed;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .ai-pulse {
    animation: pulse 2s infinite;
  }
  .progress-bar {
    transition: width 0.3s ease;
  }
  .side-drawer {
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    width: 100%;
  }
  @media (min-width: 768px) {
    .side-drawer { width: 450px; }
  }
`;

const Button = ({ children, className = '', variant = 'default', size = 'md', ...props }) => {
  const baseStyles = 'font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2';

  const variants = {
    default: 'bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-lg',
    primary: 'bg-[#25f194] text-slate-900 hover:bg-emerald-400 hover:shadow-xl hover:scale-105',
    secondary: 'bg-white/70 text-slate-700 hover:bg-white border border-white/50 backdrop-blur-md',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function MyLibrary() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recent');

  useEffect(() => {
    fetchMyLibrary();
  }, []);

  const fetchMyLibrary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/library/my-library');
      if (res.data.success) {
        setLibraryItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch library', err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromLibrary = async (id) => {
    try {
      await api.delete(`/library/my-library/${id}`);
      fetchMyLibrary();
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const filteredItems = libraryItems.filter(item => {
    if (activeTab === 'favorites' && item.status === 'Favorite') return true;
    if (activeTab === 'downloaded' && item.status === 'Downloaded') return true;
    return false;
  }).filter(item => {
    if (!searchQuery) return true;
    const title = item.bookId?.title || '';
    const author = item.bookId?.author || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || author.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    if (sortBy === 'Title') {
      return (a.bookId?.title || '').localeCompare(b.bookId?.title || '');
    }
    if (sortBy === 'Author') {
      return (a.bookId?.author || '').localeCompare(b.bookId?.author || '');
    }
    // Default: Recent (by date added/updated)
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });

  const favoritesCount = libraryItems.filter(i => i.status === 'Favorite').length;
  const downloadedCount = libraryItems.filter(i => i.status === 'Downloaded').length;

  const tabs = [
    { id: 'favorites', label: 'Favorites', icon: Heart, count: favoritesCount },
    { id: 'downloaded', label: 'Downloaded', icon: Download, count: downloadedCount }
  ];

  return (
    <div className="min-h-screen bg-god-glass p-4 md:p-10 font-sans">
      <style>{styles}</style>

      {/* HERO HEADER */}
      <header className="max-w-7xl mx-auto mb-16 text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#25f194]/20 to-blue-500/20 text-emerald-700 px-8 py-3 rounded-full text-sm font-black tracking-widest uppercase mb-8">
          <Brain size={18} className="ai-pulse" />
          Personal Library
          <Sparkles size={16} />
        </div>

        <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight mb-6">
          Your Digital <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Collection</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Organize, track, and manage your learning journey with intelligent insights and progress tracking.
        </p>

        {/* LIBRARY STATS */}
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-emerald-500 mb-2">{favoritesCount}</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Favorites</div>
          </div>
          <div className="premium-card p-6 text-center">
            <div className="text-3xl font-black text-blue-500 mb-2">{downloadedCount}</div>
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Downloaded</div>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="premium-card rounded-3xl p-2 inline-flex gap-2 mx-auto">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all relative ${activeTab === tab.id
                  ? 'bg-[#25f194] text-slate-900 shadow-lg'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <IconComponent size={20} />
                <span className="hidden md:block">{tab.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-black ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-6 flex items-center">
              <Search className="text-slate-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-xl px-16 py-4 rounded-2xl border border-white/50 outline-none text-slate-800 placeholder-slate-400 shadow-lg focus:border-[#25f194] focus:shadow-xl transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-6 flex items-center hover:bg-slate-100 rounded-lg p-1 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 outline-none font-medium text-slate-700 shadow-lg min-w-[160px]"
          >
            <option>Recent</option>
            <option>Title</option>
            <option>Author</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 && !loading && (
        <div className="max-w-7xl mx-auto mb-20 text-center py-20">
          <BookOpen className="mx-auto mb-6 text-slate-300" size={80} />
          <h3 className="text-3xl font-black text-slate-900 mb-4">No {activeTab} yet</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            You don't have any items in this category. Browse the library to add some!
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map((item, idx) => (
            <div key={item._id} className="premium-card group rounded-3xl overflow-hidden" style={{ animation: `fadeInUp 0.6s ease-out forwards ${idx * 0.1}s`, opacity: 0 }}>
              <div className="image-container relative h-48 overflow-hidden bg-gradient-to-br from-emerald-400 to-blue-500">
                {item.bookId?.coverImage && (
                  <img src={toBackendAssetUrl(item.bookId.coverImage)} alt="cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                )}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold text-white ${item.status === 'Favorite' ? 'bg-rose-500/90' : 'bg-blue-500/90'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">{item.bookId?.title || 'Unknown Title'}</h3>
                <p className="text-sm text-slate-600 mb-4">By {item.bookId?.author || 'Unknown Author'}</p>
                <div className="flex gap-2">
                  <Button variant="primary" className="flex-1 text-xs font-black uppercase tracking-wider" size="sm" onClick={() => setSelectedItem(item)}>
                    Details
                  </Button>
                  <Button variant="danger" size="sm" className="p-3" onClick={(e) => { e.stopPropagation(); removeFromLibrary(item._id); }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL DRAWER */}
      <div className={`fixed inset-y-0 right-0 side-drawer z-50 bg-white shadow-2xl flex flex-col ${selectedItem ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedItem && (
          <>
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSelectedItem(null)}>
                  <X size={24} />
                </button>
              </div>

              <div className="h-48 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-emerald-400 to-blue-500">
                {selectedItem.bookId?.coverImage && (
                  <img src={toBackendAssetUrl(selectedItem.bookId.coverImage)} alt="cover" className="w-full h-full object-cover" />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">{selectedItem.bookId?.title}</h2>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">{selectedItem.bookId?.author}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 space-y-3">
              {selectedItem.bookId?.fileUrl && (
                <a href={toBackendAssetUrl(selectedItem.bookId.fileUrl)} target="_blank" rel="noreferrer" className="block w-full">
                  <Button variant="primary" className="w-full py-4 text-sm font-black uppercase tracking-widest">
                    Read / Download
                    <ChevronRight size={20} />
                  </Button>
                </a>
              )}
              <div className="flex gap-3">
                <Button variant="danger" size="md" className="p-3 w-full" onClick={() => { removeFromLibrary(selectedItem._id); setSelectedItem(null); }}>
                  <Trash2 size={18} /> Remove from Library
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
