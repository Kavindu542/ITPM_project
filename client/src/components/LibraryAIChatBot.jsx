import React from 'react';
import { MessageCircle, X, Send, Sparkles, BookOpen, Download, ExternalLink, Bot, User, Globe } from 'lucide-react';
import { libraryAiService } from '../services/libraryService';

export default function LibraryAIChatBot() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState([
        {
            role: 'ai',
            text: "Hi! 👋 I'm **Lumina**, your Smart Library Assistant. Ask me anything about books or digital resources!\n\nFor example:\n• *\"Find Python programming books\"*\n• *\"Are there any resources on algorithms?\"*\n• *\"Show me technology books with high ratings\"*",
            items: [],
        },
    ]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const sendingRef = React.useRef(false);
    const chatEndRef = React.useRef(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading || sendingRef.current) return;
        sendingRef.current = true;

        setInput('');
        setMessages((prev) => [...prev, { role: 'user', text }]);
        setLoading(true);

        try {
            const res = await libraryAiService.chat(text);
            const data = res.data;
            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text: data.data,
                    items: data.matchedItems || [],
                    totalSearched: data.totalSearched,
                },
            ]);
        } catch (err) {
            const apiMsg = err?.response?.data?.message || err?.message || '❌ Sorry, I encountered an error. Please try again.';
            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text: apiMsg,
                    items: [],
                },
            ]);
        } finally {
            setLoading(false);
            sendingRef.current = false;
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatText = (text) => {
        if (!text) return '';
        let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/\n/g, '<br/>');
        return formatted;
    };

    // Helper to format asset URLs from the backend
    const toAssetUrl = (p) => {
        if (!p) return '';
        if (String(p).startsWith('http')) return p;
        // In this project, images are usually in /uploads/...
        return `http://127.0.0.1:5000/${String(p).replace(/^\/+/, '')}`;
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9999] group"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(16, 185, 129, 0.4))' }}
            >
                <div
                    className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isOpen
                        ? 'bg-gray-800 rotate-0'
                        : 'bg-gradient-to-br from-emerald-500 to-blue-600 hover:scale-110 shadow-lg'
                        }`}
                >
                    {isOpen ? (
                        <X className="h-6 w-6 text-white" />
                    ) : (
                        <>
                            <Bot className="h-7 w-7 text-white animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
                        </>
                    )}
                </div>
            </button>

            {/* Chat Panel */}
            <div
                className={`fixed bottom-24 right-6 z-[9998] transition-all duration-300 ease-out ${isOpen
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                    }`}
                style={{ width: '420px', maxWidth: 'calc(100vw - 2rem)' }}
            >
                <div
                    className="flex flex-col rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-2xl"
                    style={{ height: '600px', maxHeight: 'calc(100vh - 160px)' }}
                >
                    {/* Header */}
                    <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-blue-700 px-5 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-sm">Lumina AI Librarian</h3>
                                <p className="text-emerald-100 text-[10px] uppercase font-bold tracking-widest">Active & Ready</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-shrink-0 mt-1">
                                    {msg.role === 'ai' ? (
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                            <Bot size={16} />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center text-white">
                                            <User size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <div
                                        className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                            : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                                    />

                                    {/* Item Cards */}
                                    {msg.items && msg.items.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {msg.items.map((item) => (
                                                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex gap-3">
                                                        <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-100">
                                                            <img
                                                                src={toAssetUrl(item.image) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200'}
                                                                className="w-full h-full object-cover"
                                                                alt=""
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{item.title}</h4>
                                                            <p className="text-[10px] text-slate-500 font-medium">By {item.author || 'Unknown'}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                                                    {item.type}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-400">⭐ {item.rating || '4.5'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                                                        <a
                                                            href={toAssetUrl(item.pdf)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold text-center hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <ExternalLink size={12} /> Preview
                                                        </a>
                                                        <a
                                                            href={toAssetUrl(item.pdf)}
                                                            download
                                                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                                                        >
                                                            <Download size={12} />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                </div>
                                Lumina is searching...
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2 bg-white rounded-2xl p-1 shadow-sm border border-slate-200">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Find books, categories, research..."
                                className="flex-1 bg-transparent px-3 py-2 outline-none text-sm placeholder:text-slate-400 font-medium"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:grayscale transition-all shadow-md active:scale-95"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
