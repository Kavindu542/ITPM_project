import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Search, Download, Heart, X, Star, Zap,
  ArrowRight, Filter, Bookmark, Layers,
  FileText, Globe, ShieldCheck
} from 'lucide-react';
import { bookService } from '../../services/libraryService';

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
  .side-drawer {
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    width: 100%;
  }
  @media (min-width: 768px) {
    .side-drawer { width: 420px; }
  }
  .bg-god-glass {
    background: linear-gradient(135deg, rgba(37, 241, 148, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
    background-attachment: fixed;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const toAssetUrl = (p) => {
  if (!p) return '';
  if (String(p).startsWith('http')) return p;
  const base = String(api?.defaults?.baseURL || '').replace(/\/+api\/?$/, '');
  if (base) return `${base}/${String(p).replace(/^\/+/, '')}`;
  return `/${String(p).replace(/^\/+/, '')}`;
};

export default function LibraryBooks() {
  const [selectedBook, setSelectedBook] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDownload = async (book) => {
    try {
      await api.post('/library/my-library', {
        bookId: book.id,
        status: 'Downloaded'
      });
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
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = book.pdf;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }
    }
  };

  const [books, setBooks] = useState([
    {
      id: 1,
      title: "Mastering Strategy",
      author: "Sun Tzu",
      rating: 4.9,
      category: "Strategy",
      pages: 120,
      size: "2.5 MB",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800", // High contrast
      pdf: "https://files.libertyfund.org/files/2070/SunTzu_1399_LFeBk.pdf"
    },
    {
      id: 2,
      title: "Architectural Wonders",
      author: "Frank Wright",
      rating: 4.7,
      category: "Design",
      pages: 310,
      size: "15.4 MB",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800", // High contrast
      pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: 3,
      title: "Cosmos & Stars",
      author: "Carl Sagan",
      rating: 5.0,
      category: "Science",
      pages: 450,
      size: "8.9 MB",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
      pdf: "https://sedl.org/afterschool/toolkits/science/pdf/astronomy_star_power.pdf"
    },
    {
      id: 4,
      title: "Legal Foundations",
      author: "Justice Marshall",
      rating: 4.6,
      category: "Law",
      pages: 1200,
      size: "22.1 MB",
      image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800",
      pdf: "https://unstats.un.org/unsd/snaama/Introduction.pdf"
    },
    {
      id: 5,
      title: "Digital Innovation",
      author: "Steve Jobs",
      rating: 4.8,
      category: "Technology",
      pages: 280,
      size: "10.5 MB",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
      pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    {
      id: 6,
      title: "Ancient Wisdom",
      author: "Aristotle",
      rating: 4.5,
      category: "Philosophy",
      pages: 500,
      size: "5.2 MB",
      image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800",
      pdf: "https://www.ucl.ac.uk/~uccanev/booklet.pdf"
    },
    {
      id: 7,
      title: "Cyber Security",
      author: "Kevin Mitnick",
      rating: 4.9,
      category: "IT Security",
      pages: 420,
      size: "12.0 MB",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
      pdf: "https://www.antennahouse.com/hubfs/xsl-fo-sample/pdf/basic-link-1.pdf"
    },
    {
      id: 8,
      title: "The Creative Mind",
      author: "Ken Robinson",
      rating: 4.8,
      category: "Education",
      pages: 190,
      size: "6.7 MB",
      image: "https://images.unsplash.com/photo-1543004218-ee141104638e?auto=format&fit=crop&q=80&w=800",
      pdf: "https://www.nrel.gov/docs/fy15osti/64013.pdf"
    }
  ]);
  const [usingDummy, setUsingDummy] = useState(false);

  const toggleFavorite = async (book, e) => {
    e.stopPropagation();
    const isFav = favorites.includes(book.id);
    setFavorites(p => isFav ? p.filter(id => id !== book.id) : [...p, book.id]);

    if (!isFav) {
      try {
        await api.post('/library/my-library', {
          bookId: book.id,
          status: 'Favorite'
        });
      } catch (err) {
        console.error('Failed to favorite', err);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await bookService.getAll();
        const raw = res?.data?.data || res?.data || [];
        const mapped = raw.map((b) => {
          const cover =
            b.coverImage || b.coverUrl || b.cover || b.imageUrl || null;
          const pdfPath =
            b.pdfUrl || b.fileUrl || b.file || b.pdf || null;
          return {
            id: b._id || b.id,
            title: b.title || 'Untitled',
            author: b.author || b.authorName || 'Unknown',
            rating: Number(b.rating ?? 4.5),
            category: b.category || b.genre || 'General',
            pages: Number(b.pages || 0),
            size: b.size || 'N/A',
            image: toAssetUrl(cover) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
            pdf: toAssetUrl(pdfPath) || '',
          };
        });
        if (!mounted) return;
        setBooks(mapped.length ? mapped : books);
        setUsingDummy(mapped.length === 0);
      } catch {
        if (!mounted) return;
        setUsingDummy(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-god-glass p-4 md:p-10 font-sans">
      <style>{styles}</style>

      {/* COMPACT HEADER */}
      <header className="max-w-6xl mx-auto mb-12 text-center">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-6">
          Digital <span className="text-emerald-500">Archive</span>
        </h1>
        <div className="max-w-xl mx-auto relative">
          <div className="relative flex items-center bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-100">
            <Search className="ml-5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Filter resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-4 outline-none text-slate-700 font-medium"
            />
          </div>
        </div>
      </header>

      {/* GRID */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredBooks.map((book, i) => (
          <div
            key={book.id}
            className="premium-card group rounded-3xl overflow-hidden"
            style={{ animation: `fadeInUp 0.5s ease-out forwards ${i * 0.05}s`, opacity: 0 }}
          >
            <div className="image-container relative h-48 overflow-hidden">
              <img src={book.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
              <button
                onClick={(e) => toggleFavorite(book, e)}
                className={`absolute top-4 right-4 p-2.5 rounded-xl backdrop-blur-md transition-all ${favorites.includes(book.id) ? 'bg-[#25f194] text-slate-900' : 'bg-black/20 text-white hover:bg-[#25f194]'}`}
              >
                <Heart size={18} fill={favorites.includes(book.id) ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="p-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-2">{book.category}</span>
              <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-4">{book.title}</h3>

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
                  onClick={(e) => { e.stopPropagation(); handleDownload(book); }}
                  className="bg-[#25f194] text-slate-900 p-3 rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* COMPACT DRAWER */}
      <div className={`fixed inset-y-0 right-0 side-drawer z-50 bg-white shadow-2xl flex flex-col ${selectedBook ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedBook && (
          <>
            <div className="p-8 flex-1 overflow-y-auto space-y-8">
              <div className="flex justify-between items-center">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setSelectedBook(null)}>
                  <X size={24} />
                </button>
                <div className="flex gap-2">
                  <Bookmark size={20} className="text-slate-300" />
                  <ShieldCheck size={20} className="text-emerald-500" />
                </div>
              </div>

              <div className="h-60 rounded-3xl overflow-hidden shadow-lg">
                <img src={selectedBook.image} className="w-full h-full object-cover" alt="" />
              </div>

              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-slate-900">{selectedBook.title}</h2>
                <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">{selectedBook.author}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <span className="block text-lg font-black">{selectedBook.pages}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Pages</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <span className="block text-lg font-black">{selectedBook.rating}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <span className="block text-lg font-black">{selectedBook.size}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Size</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Summary</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  A high-resource academic document verified for digital distribution within the Smart Campus Library network.
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 mt-auto">
              <button
                onClick={() => handleDownload(selectedBook)}
                className="w-full py-5 rounded-2xl bg-[#25f194] text-slate-900 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-lg"
              >
                Instant Download <Download size={20} />
              </button>
            </div>
          </>
        )}
      </div>

      {selectedBook && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setSelectedBook(null)} />}
    </div>
  );
}
