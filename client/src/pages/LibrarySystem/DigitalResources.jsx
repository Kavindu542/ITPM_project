import React, { useState, useMemo, useEffect } from 'react';
import { Globe, Search, Download, Star, FileText, Headphones, BookOpen, BookMarked, Heart, Filter, Zap, Brain, Sparkles, TrendingUp, Clock, Eye, X, Play, Volume2 } from 'lucide-react';
import { digitalResourceService } from '../../services/libraryService';
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
  .search-glow {
    box-shadow: 0 0 50px rgba(37, 241, 148, 0.3);
  }
  .suggestion-item {
    transition: all 0.2s ease;
  }
  .suggestion-item:hover {
    background: rgba(37, 241, 148, 0.1);
    transform: translateX(8px);
  }
  .side-drawer {
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    width: 100%;
  }
  @media (min-width: 768px) {
    .side-drawer { width: 420px; }
  }
`;

const Button = ({ children, className = '', variant = 'default', size = 'md', ...props }) => {
  const baseStyles = 'font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2';

  const variants = {
    default: 'bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-lg',
    primary: 'bg-[#25f194] text-slate-900 hover:bg-emerald-400 hover:shadow-xl hover:scale-105',
    secondary: 'bg-white/70 text-slate-700 hover:bg-white border border-white/50 backdrop-blur-md',
    ghost: 'text-slate-600 hover:bg-slate-100'
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

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-cyan-100 text-cyan-700',
    purple: 'bg-purple-100 text-purple-700',
    premium: 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
  };
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${variants[variant]}`}>{children}</span>;
};

const RESOURCES_FALLBACK = [
  // AI & Tech
  {
    id: 'attention-paper',
    title: 'Attention Is All You Need',
    author: 'Vaswani et al.',
    type: 'Research Paper',
    rating: 4.9,
    size: '3.2 MB',
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    url: 'https://arxiv.org/pdf/1706.03762.pdf',
    tags: ['AI', 'Transformer', 'NLP', 'Deep Learning'],
    description: 'Revolutionary paper introducing the Transformer architecture that changed AI forever.',
    downloads: 125000,
    publishedYear: 2017,
    difficulty: 'Advanced'
  },
  {
    id: 'neural-networks',
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio',
    type: 'eBook',
    rating: 4.8,
    size: '15.4 MB',
    cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800',
    url: 'https://www.deeplearningbook.org/contents/TOC.html',
    tags: ['Deep Learning', 'AI', 'Mathematics', 'Neural Networks'],
    description: 'Comprehensive textbook on deep learning by leading researchers in the field.',
    downloads: 89340,
    publishedYear: 2016,
    difficulty: 'Expert'
  },
  {
    id: 'mit-algorithms',
    title: 'Introduction to Algorithms',
    author: 'MIT OpenCourseWare',
    type: 'Course Material',
    rating: 4.7,
    size: '8.9 MB',
    cover: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=800',
    url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
    tags: ['Algorithms', 'Computer Science', 'Data Structures'],
    description: 'MIT\'s comprehensive algorithms course covering fundamental data structures and algorithms.',
    downloads: 67890,
    publishedYear: 2020,
    difficulty: 'Intermediate'
  },

  // Classic Literature
  {
    id: 'pride-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    type: 'eBook',
    rating: 4.6,
    size: '480 KB',
    cover: 'https://images.unsplash.com/photo-1507842717343-583bb7270b66?auto=format&fit=crop&q=80&w=800',
    url: 'https://www.gutenberg.org/files/1342/1342-0.txt',
    tags: ['Classic', 'Novel', 'Romance', 'Literature'],
    description: 'Jane Austen\'s masterpiece exploring themes of love, reputation, and class in 19th century England.',
    downloads: 234560,
    publishedYear: 1813,
    difficulty: 'Beginner'
  },
  {
    id: 'great-gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    type: 'eBook',
    rating: 4.5,
    size: '420 KB',
    cover: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800',
    url: 'https://www.gutenberg.org/files/64317/64317-h/64317-h.htm',
    tags: ['Classic', 'American Literature', 'Jazz Age'],
    description: 'F. Scott Fitzgerald\'s iconic novel capturing the excess of the Jazz Age.',
    downloads: 189420,
    publishedYear: 1925,
    difficulty: 'Intermediate'
  },

  // Science & Research
  {
    id: 'quantum-computing',
    title: 'Quantum Computing: An Applied Approach',
    author: 'Hidary & IBM Quantum',
    type: 'Research Paper',
    rating: 4.8,
    size: '6.7 MB',
    cover: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
    url: 'https://qiskit.org/textbook/what-is-quantum-computing.html',
    tags: ['Quantum', 'Physics', 'Computing', 'IBM'],
    description: 'Comprehensive guide to quantum computing principles and practical applications.',
    downloads: 45320,
    publishedYear: 2023,
    difficulty: 'Expert'
  },
  {
    id: 'climate-science',
    title: 'Climate Change: The Science',
    author: 'IPCC',
    type: 'Report',
    rating: 4.7,
    size: '12.3 MB',
    cover: 'https://images.unsplash.com/photo-1569163139394-de44cb2c9222?auto=format&fit=crop&q=80&w=800',
    url: 'https://www.ipcc.ch/report/ar6/wg1/',
    tags: ['Climate', 'Environment', 'Science', 'Policy'],
    description: 'Latest IPCC report on climate change science and environmental impacts.',
    downloads: 78650,
    publishedYear: 2023,
    difficulty: 'Advanced'
  },

  // Programming & Web Dev
  {
    id: 'js-guide',
    title: 'You Don\'t Know JS',
    author: 'Kyle Simpson',
    type: 'eBook Series',
    rating: 4.9,
    size: '4.2 MB',
    cover: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=800',
    url: 'https://github.com/getify/You-Dont-Know-JS',
    tags: ['JavaScript', 'Programming', 'Web Dev'],
    description: 'Deep dive into JavaScript mechanics and advanced programming concepts.',
    downloads: 156780,
    publishedYear: 2022,
    difficulty: 'Intermediate'
  },
  {
    id: 'react-docs',
    title: 'React Documentation',
    author: 'Meta/Facebook',
    type: 'Documentation',
    rating: 4.8,
    size: '2.1 MB',
    cover: 'https://images.unsplash.com/photo-1633356122544-f134ef2944f7?auto=format&fit=crop&q=80&w=800',
    url: 'https://react.dev/learn',
    tags: ['React', 'Frontend', 'JavaScript', 'UI'],
    description: 'Official React documentation with interactive examples and best practices.',
    downloads: 298450,
    publishedYear: 2024,
    difficulty: 'Intermediate'
  },

  // Audio Resources
  {
    id: 'podcast-ai',
    title: 'AI Explained Podcast Series',
    author: 'Tech Experts',
    type: 'Audio',
    rating: 4.6,
    size: '45 MB',
    cover: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800',
    url: 'https://example-podcast.com/ai-series',
    tags: ['AI', 'Podcast', 'Technology', 'Education'],
    description: '10-part podcast series explaining AI concepts in simple terms.',
    downloads: 23450,
    publishedYear: 2024,
    difficulty: 'Beginner'
  },

  // Video Content
  {
    id: 'video-lecture',
    title: 'Machine Learning Course',
    author: 'Andrew Ng (Stanford)',
    type: 'Video',
    rating: 4.9,
    size: '250 MB',
    cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
    url: 'https://www.coursera.org/learn/machine-learning',
    tags: ['Machine Learning', 'Video', 'Stanford', 'Course'],
    description: 'Complete machine learning course by Andrew Ng from Stanford University.',
    downloads: 189650,
    publishedYear: 2023,
    difficulty: 'Intermediate'
  }
];

function safeFileName(name) {
  return String(name || 'resource').replace(/[^a-z0-9]+/gi, '_');
}

const toAssetUrl = (p) => {
  if (!p) return '';
  return toBackendAssetUrl(p);
};

export default function DigitalResources() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Popular');
  const [selectedResource, setSelectedResource] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [resources, setResources] = useState(RESOURCES_FALLBACK);
  const [usingDummy, setUsingDummy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await digitalResourceService.getAll();
        const raw = res?.data?.data || res?.data || [];
        const mapped = raw.map((r) => {
          const cover = r.thumbnailImage || r.cover || r.thumbnail || r.imageUrl || null;
          const fileUrl = r.url || r.fileUrl || r.file || '';
          return {
            id: r._id || r.id,
            title: r.title || 'Resource',
            author: r.author || 'Unknown',
            type: r.type || 'PDF',
            rating: Number(r.rating ?? 4.8),
            size: r.size || r.fileSize || '',
            cover: toAssetUrl(cover) || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
            url: toAssetUrl(fileUrl),
            tags: Array.isArray(r.tags) ? r.tags : [],
            description: r.description || '',
            downloads: Number(r.downloads || 0),
            publishedYear: r.publishedYear || '',
            difficulty: r.difficulty || 'Intermediate'
          };
        });
        if (!mounted) return;
        setResources(mapped.length ? mapped : RESOURCES_FALLBACK);
        setUsingDummy(mapped.length === 0);
      } catch {
        if (!mounted) return;
        setResources(RESOURCES_FALLBACK);
        setUsingDummy(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = resources.filter(r => {
      const matchesQ = !q ||
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q));
      const matchesType = typeFilter === 'All' || r.type === typeFilter;
      return matchesQ && matchesType;
    });

    if (sortBy === 'Popular') list = [...list].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    if (sortBy === 'Rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'Recent') list = [...list].sort((a, b) => (b.publishedYear || 0) - (a.publishedYear || 0));

    return list;
  }, [query, typeFilter, sortBy, resources]);

  const tryDownload = async (res) => {
    const filename = `${safeFileName(res.title)}.pdf`;
    try {
      const response = await fetch(res.url, { credentials: 'include' });
      if (!response.ok) throw new Error('network');
      const blob = await response.blob();

      if (window.showSaveFilePicker) {
        const fh = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        });
        const writable = await fh.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      }

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
    } catch (error) {
      try {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener,noreferrer';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const toggleFavorite = (res) => {
    const id = String(res.id || res.title);
    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(fId => fId !== id)
        : [...prev, id]
    );
  };

  const types = [
    { id: 'All', label: 'All Resources', icon: Globe },
    { id: 'eBook', label: 'eBooks', icon: BookOpen },
    { id: 'Research Paper', label: 'Research Papers', icon: FileText },
    { id: 'Course Material', label: 'Course Material', icon: BookMarked },
    { id: 'Audio', label: 'Audio', icon: Headphones },
    { id: 'Video', label: 'Video', icon: Play },
    { id: 'Documentation', label: 'Documentation', icon: FileText }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Audio': return Headphones;
      case 'Video': return Play;
      case 'Research Paper': return FileText;
      case 'eBook': return BookOpen;
      case 'Course Material': return BookMarked;
      case 'Documentation': return FileText;
      default: return Globe;
    }
  };

  return (
    <div className="min-h-screen bg-god-glass p-4 md:p-10 font-sans">
      <style>{styles}</style>

      {/* HERO HEADER */}
      <header className="max-w-7xl mx-auto mb-20 text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#25f194]/20 to-blue-500/20 text-emerald-700 px-8 py-3 rounded-full text-sm font-black tracking-widest uppercase mb-8">
          <Brain size={18} className="ai-pulse" />
          Digital Knowledge Hub
          <Sparkles size={16} />
        </div>

        <h1 className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter mb-6">
          Infinite <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Resources</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          Access premium digital content including eBooks, research papers, audio lectures, and video courses instantly.
        </p>

        {/* ADVANCED SEARCH */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r from-[#25f194]/30 to-blue-500/30 blur-3xl rounded-full transition-all ${query ? 'search-glow' : ''}`} />
            <div className="relative flex items-center bg-white/80 backdrop-blur-2xl rounded-[40px] p-3 shadow-2xl border border-white/60">
              <div className="flex items-center gap-4 ml-6">
                <Search className="text-slate-400" size={28} />
              </div>
              <input
                type="text"
                placeholder="Search eBooks, research papers, audio, video content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-transparent px-6 py-5 outline-none text-xl font-medium text-slate-800 placeholder-slate-400"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="mr-6 p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 outline-none font-medium text-slate-700 shadow-lg"
            >
              {types.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 outline-none font-medium text-slate-700 shadow-lg"
            >
              <option>Popular</option>
              <option>Rating</option>
              <option>Recent</option>
            </select>

            <div className="bg-white/70 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/50 shadow-lg flex items-center justify-center">
              <span className="text-emerald-600 font-bold">{filtered.length}</span>
              <span className="text-slate-600 font-medium ml-1">resources found</span>
            </div>
          </div>
        </div>
      </header>

      {/* RESOURCE CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filtered.map((resource, index) => {
          const TypeIcon = getTypeIcon(resource.type);

          return (
            <div
              key={resource.id}
              className="premium-card group rounded-3xl overflow-hidden"
              style={{ animation: `fadeInUp 0.6s ease-out forwards ${index * 0.05}s`, opacity: 0 }}
            >
              <div className="image-container relative h-48 overflow-hidden">
                <img src={resource.cover} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={resource.title} />

                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="premium" className="flex items-center gap-1">
                    <TypeIcon size={12} />
                    {resource.type}
                  </Badge>
                </div>

                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    {resource.rating}
                  </div>
                </div>

                <button
                  onClick={() => toggleFavorite(resource)}
                  className={`absolute bottom-4 right-4 p-3 rounded-xl backdrop-blur-md transition-all ${favorites.includes(resource.id)
                    ? 'bg-[#25f194] text-slate-900'
                    : 'bg-black/20 text-white hover:bg-[#25f194] hover:text-slate-900'
                    }`}
                >
                  <Heart size={18} fill={favorites.includes(resource.id) ? "currentColor" : "none"} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{resource.difficulty}</span>
                  <span className="text-xs text-slate-500">{resource.size}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2">{resource.title}</h3>
                <p className="text-sm text-slate-600 mb-4">By {resource.author}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-100 text-xs font-medium text-slate-600 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-5">
                  <span>{resource.downloads?.toLocaleString()} downloads</span>
                  <span>{resource.publishedYear}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedResource(resource)}
                    variant="default"
                    className="flex-1 text-xs font-black uppercase tracking-wider"
                    size="sm"
                  >
                    Preview
                  </Button>
                  <Button
                    onClick={() => tryDownload(resource)}
                    variant="primary"
                    size="sm"
                    className="p-3"
                  >
                    <Download size={16} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NO RESULTS */}
      {filtered.length === 0 && (
        <div className="max-w-7xl mx-auto text-center py-20">
          <Search className="mx-auto mb-6 text-slate-300" size={80} />
          <h3 className="text-3xl font-black text-slate-900 mb-4">No resources found</h3>
          <p className="text-slate-500 mb-8">Try adjusting your search terms or filters</p>
        </div>
      )}

      {/* DETAIL DRAWER */}
      <div className={`fixed inset-y-0 right-0 side-drawer z-50 bg-white shadow-2xl flex flex-col ${selectedResource ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedResource && (
          <>
            <div className="p-8 flex-1 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSelectedResource(null)}>
                  <X size={24} />
                </button>
                <div className="flex gap-2">
                  <Eye size={20} className="text-slate-300" />
                  <Globe size={20} className="text-emerald-500" />
                </div>
              </div>

              <div className="h-48 rounded-2xl overflow-hidden shadow-lg">
                <img src={selectedResource.cover} className="w-full h-full object-cover" alt="" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">{selectedResource.title}</h2>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">{selectedResource.author}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black">{selectedResource.rating}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Rating</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black">{selectedResource.size}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Size</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className="block text-lg font-black">{selectedResource.publishedYear}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Year</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Description</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{selectedResource.description}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedResource.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Downloads</div>
                <div className="text-2xl font-black text-slate-900">{selectedResource.downloads?.toLocaleString()}</div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 space-y-3">
              <Button
                onClick={() => tryDownload(selectedResource)}
                variant="primary"
                className="w-full py-4 text-sm font-black uppercase tracking-widest"
              >
                Download Resource <Download size={20} />
              </Button>
              <Button
                onClick={() => window.open(selectedResource.url, '_blank')}
                variant="secondary"
                className="w-full py-3 text-sm font-bold"
              >
                Open Online <Globe size={18} />
              </Button>
            </div>
          </>
        )}
      </div>

      {selectedResource && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setSelectedResource(null)} />
      )}
    </div>
  );
}
