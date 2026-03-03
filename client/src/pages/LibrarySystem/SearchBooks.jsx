import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Heart, X, Star, Filter, Eye, BookOpen, Layers, FileText, Globe, Zap, Brain, Sparkles, TrendingUp, Clock, Tag } from 'lucide-react';
import { bookService } from '../../services/libraryService';

const toAssetUrl = (p) => {
  if (!p) return '';
  if (String(p).startsWith('http')) return p;
  return `http://localhost:5000/${String(p).replace(/^\/+/, '')}`;
};

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
  .side-drawer { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); width: 100%; }
  @media (min-width: 768px) { .side-drawer { width: 420px; } }
  .bg-god-glass {
    background: linear-gradient(135deg, rgba(37, 241, 148, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
    background-attachment: fixed;
  }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .ai-pulse { animation: pulse 2s infinite; }
  .search-glow { box-shadow: 0 0 50px rgba(37, 241, 148, 0.3); }
  .suggestion-item { transition: all 0.2s ease; }
  .suggestion-item:hover { background: rgba(37, 241, 148, 0.1); transform: translateX(8px); }
`;

export default function SearchBooks() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("Relevance");
  const [searchMode, setSearchMode] = useState("smart");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState(["Python Programming", "Data Science", "Machine Learning"]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Hardcoded fallback books
  const FALLBACK_BOOKS = [
    {
      id: 1, title: "Python Crash Course", author: "Eric Matthes", rating: 4.9, category: "Programming", pages: 544, size: "8.5 MB",
      tags: ["python", "programming", "beginner", "hands-on", "projects"], difficulty: "Beginner",
      image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=800",
      pdf: "https://github.com/ehmatthes/pcc_2e/raw/master/online_resources/python_crash_course_2e.pdf",
      description: "A hands-on, project-based introduction to programming.", downloads: 45230, publishedYear: 2023
    },
    {
      id: 2, title: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest", rating: 4.8, category: "Computer Science", pages: 1312, size: "24.7 MB",
      tags: ["algorithms", "data structures", "computer science", "analysis", "advanced"], difficulty: "Advanced",
      image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800",
      pdf: "", description: "The comprehensive guide to algorithms.", downloads: 78540, publishedYear: 2022
    },
    {
      id: 3, title: "Clean Code", author: "Robert C. Martin", rating: 4.7, category: "Software Engineering", pages: 464, size: "12.3 MB",
      tags: ["clean code", "software craft", "refactoring", "best practices"], difficulty: "Intermediate",
      image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80&w=800",
      pdf: "", description: "A handbook of agile software craftsmanship.", downloads: 62150, publishedYear: 2023
    },
    {
      id: 4, title: "Hands-On Machine Learning", author: "Aurélien Géron", rating: 4.9, category: "AI & Machine Learning", pages: 851, size: "18.9 MB",
      tags: ["machine learning", "neural networks", "tensorflow", "scikit-learn"], difficulty: "Intermediate",
      image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=800",
      pdf: "", description: "Learn machine learning concepts, tools, and techniques.", downloads: 89420, publishedYear: 2024
    },
  ];

  const [books, setBooks] = useState(FALLBACK_BOOKS);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await bookService.getAll();
        const raw = res?.data?.data || res?.data || [];
        const mapped = raw.map((b) => {
          const cover = b.coverImage || b.coverUrl || b.cover || b.imageUrl || null;
          const pdfPath = b.pdfUrl || b.fileUrl || b.file || b.pdf || null;
          return {
            id: b._id || b.id,
            title: b.title || 'Untitled',
            author: b.author || 'Unknown',
            rating: Number(b.rating ?? 4.5),
            category: b.category || 'General',
            pages: Number(b.pages || 0),
            size: b.size || 'N/A',
            tags: Array.isArray(b.tags) ? b.tags : (b.category ? [b.category.toLowerCase()] : []),
            difficulty: 'Intermediate',
            image: toAssetUrl(cover) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
            pdf: toAssetUrl(pdfPath) || '',
            description: b.description || 'A resource from the Smart Campus Library.',
            downloads: Number(b.downloads || 0),
            publishedYear: b.publishedYear || ''
          };
        });
        if (!mounted) return;
        setBooks(mapped.length ? mapped : FALLBACK_BOOKS);
        setUsingDummy(mapped.length === 0);
      } catch {
        if (!mounted) return;
        setUsingDummy(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const categories = ["All Categories", ...new Set(books.map(b => b.category).filter(Boolean))];
  const difficultyLevels = ["All Levels", "Beginner", "Intermediate", "Advanced", "Expert"];

  // Smart search suggestions
  const generateSuggestions = (query) => {
    if (query.length < 2) return [];

    const allTerms = [
      ...books.flatMap(book => book.tags),
      ...books.map(book => book.title.toLowerCase()),
      ...books.map(book => book.author.toLowerCase()),
      ...books.map(book => book.category.toLowerCase()),
      "python programming", "machine learning", "web development", "javascript fundamentals",
      "system design patterns", "data structures", "clean code practices", "software architecture"
    ];

    return allTerms
      .filter(term => term.includes(query.toLowerCase()))
      .slice(0, 6);
  };

  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setSuggestions(generateSuggestions(searchQuery));
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleDownload = async (book) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/library/my-library', {
        bookId: book.id,
        status: 'Downloaded'
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Failed to log download', err);
    }
    const filename = `${String(book.title || 'resource').replace(/[^a-z0-9_\-\.]/gi, '_')}.pdf`;
    try {
      const response = await fetch(book.pdf);
      if (!response.ok) throw new Error('network');
      const blob = await response.blob();
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      a.rel = 'noopener,noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      try {
        const a = document.createElement('a');
        a.href = book.pdf;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener,noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(book.pdf, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const toggleFavorite = async (book, e) => {
    e.stopPropagation();
    const isFav = favorites.includes(book.id);
    setFavorites(f => isFav ? f.filter(id => id !== book.id) : [...f, book.id]);

    if (!isFav) {
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/library/my-library', {
          bookId: book.id,
          status: 'Favorite'
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.error('Failed to favorite', err);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    if (query && !recentSearches.includes(query)) {
      setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
    }
  };

  const filteredBooks = books.filter(book => {
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const bookText = `${book.title} ${book.author} ${book.category} ${book.tags.join(' ')} ${book.description}`.toLowerCase();

    const matchesSearch = searchTerms.every(term => bookText.includes(term));
    const matchesCategory = selectedCategory === "All Categories" || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "Rating": return b.rating - a.rating;
      case "Downloads": return b.downloads - a.downloads;
      case "Recent": return b.publishedYear - a.publishedYear;
      case "Pages": return b.pages - a.pages;
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen bg-god-glass p-4 md:p-10 font-sans">
      <style>{styles}</style>

      {/* ADVANCED HEADER */}
      <header className="max-w-7xl mx-auto mb-20 text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#25f194]/20 to-blue-500/20 text-emerald-700 px-8 py-3 rounded-full text-sm font-black tracking-widest uppercase mb-8">
          <Brain size={18} className="ai-pulse" />
          Premium Tech Library
          <Sparkles size={16} />
        </div>

        <h1 className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter mb-6">
          Smart <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Discovery</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Access the world's best programming and technology books with intelligent search and instant downloads.
        </p>

        {/* COMPLEX SEARCH INTERFACE */}
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Search Mode Selector */}
          <div className="flex justify-center gap-4 mb-8">
            {[
              { id: 'smart', label: 'Smart Search', icon: Brain },
              { id: 'advanced', label: 'Advanced', icon: Filter },
              { id: 'semantic', label: 'Semantic', icon: Zap }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setSearchMode(mode.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${searchMode === mode.id
                  ? 'bg-[#25f194] text-slate-900 shadow-lg'
                  : 'bg-white/50 text-slate-600 hover:bg-white/80'
                  }`}
              >
                <mode.icon size={18} />
                {mode.label}
              </button>
            ))}
          </div>

          {/* Main Search Bar */}
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r from-[#25f194]/30 to-blue-500/30 blur-3xl rounded-full transition-all ${searchQuery ? 'search-glow' : ''}`} />
            <div className="relative flex items-center bg-white/80 backdrop-blur-2xl rounded-[40px] p-3 shadow-2xl border border-white/60">
              <div className="flex items-center gap-4 ml-6">
                <Search className="text-slate-400" size={28} />
                {isSearching && <div className="w-2 h-2 bg-[#25f194] rounded-full ai-pulse" />}
              </div>
              <input
                type="text"
                placeholder="Search for 'Python programming', 'Machine Learning', 'JavaScript'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-transparent px-6 py-5 outline-none text-xl font-medium text-slate-800 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-6 p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Smart Suggestions Dropdown */}
            {showSuggestions && (searchQuery || recentSearches.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden z-10">
                {searchQuery && suggestions.length > 0 && (
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={16} className="text-emerald-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Smart Suggestions</span>
                    </div>
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(suggestion)}
                        className="suggestion-item w-full text-left px-4 py-3 rounded-xl text-slate-700 font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Recent Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(search)}
                          className="px-4 py-2 bg-slate-50 hover:bg-[#25f194]/20 rounded-xl text-sm font-medium text-slate-600 transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 outline-none font-medium text-slate-700 shadow-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 outline-none font-medium text-slate-700 shadow-lg"
            >
              <option>Relevance</option>
              <option>Rating</option>
              <option>Downloads</option>
              <option>Recent</option>
              <option>Pages</option>
            </select>

            <select className="bg-white/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 outline-none font-medium text-slate-700 shadow-lg">
              {difficultyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            <button className="bg-gradient-to-r from-[#25f194] to-emerald-400 text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:shadow-lg hover:scale-105 transition-all">
              Apply Filters
            </button>
          </div>

          {/* Search Stats */}
          <div className="flex justify-center items-center gap-8 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span><span className="text-emerald-600 font-bold">{sortedBooks.length}</span> quality resources found</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span>Search completed in <span className="text-slate-700 font-bold">0.18s</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {sortedBooks.map((book, i) => (
          <div
            key={book.id}
            className="premium-card group rounded-3xl overflow-hidden"
            style={{ animation: `fadeInUp 0.5s ease-out forwards ${i * 0.05}s`, opacity: 0 }}
          >
            <div className="image-container relative h-56 overflow-hidden">
              <img src={book.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold">
                {book.difficulty}
              </div>
              <button
                onClick={(e) => toggleFavorite(book, e)}
                className={`absolute top-4 right-4 p-3 rounded-xl backdrop-blur-md transition-all ${favorites.includes(book.id) ? 'bg-[#25f194] text-slate-900' : 'bg-black/20 text-white hover:bg-[#25f194]'}`}
              >
                <Heart size={18} fill={favorites.includes(book.id) ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="p-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-2">{book.category}</span>
              <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-3">{book.title}</h3>
              <p className="text-sm text-slate-600 mb-4">By {book.author}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {book.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-slate-100 text-xs font-medium text-slate-600 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-5">
                <div className="flex items-center gap-1.5"><Star size={14} className="text-amber-400 fill-amber-400" /> {book.rating}</div>
                <div className="flex items-center gap-1.5"><FileText size={14} /> {book.size}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBook(book)}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => handleDownload(book)}
                  className="bg-[#25f194] text-slate-900 p-3 rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {sortedBooks.length === 0 && (
        <div className="max-w-7xl mx-auto text-center py-20">
          <Brain className="mx-auto mb-6 text-slate-300" size={80} />
          <h3 className="text-3xl font-black text-slate-900 mb-4">No matches found</h3>
          <p className="text-slate-500 mb-8">Try searching for these popular topics:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["Python Programming", "Machine Learning", "JavaScript", "Clean Code"].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleSearch(suggestion)}
                className="px-6 py-3 bg-white/70 backdrop-blur-xl rounded-2xl font-medium text-slate-700 hover:bg-[#25f194]/20 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <div className={`fixed inset-y-0 right-0 side-drawer z-50 bg-white shadow-2xl flex flex-col ${selectedBook ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedBook && (
          <>
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSelectedBook(null)}>
                  <X size={24} />
                </button>
                <div className="flex gap-2">
                  <Eye size={20} className="text-slate-300" />
                  <Globe size={20} className="text-emerald-500" />
                </div>
              </div>

              <div className="h-48 rounded-2xl overflow-hidden shadow-lg">
                <img src={selectedBook.image} className="w-full h-full object-cover" alt="" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">{selectedBook.title}</h2>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">{selectedBook.author}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black">{selectedBook.pages}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Pages</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black">{selectedBook.rating}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Rating</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black">{selectedBook.difficulty}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Level</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Description</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{selectedBook.description}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBook.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Download Stats</div>
                <div className="text-2xl font-black text-slate-900">{selectedBook.downloads?.toLocaleString()}</div>
              </div>
            </div>

            <div className="p-6 bg-slate-50">
              <button
                onClick={() => handleDownload(selectedBook)}
                className="w-full py-4 rounded-xl bg-[#25f194] text-slate-900 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-lg"
              >
                Download Resource <Download size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setSelectedBook(null)} />
      )}
    </div>
  );
}
