import React from 'react';
import { X, Send, Sparkles, Download, ExternalLink, Bot, User } from 'lucide-react';
import { libraryAiService } from '../services/libraryService';

export default function LibraryAIAssistant() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState([
        {
            role: 'ai',
            text: "Hi! 👋 I'm your **Library AI Assistant**. Ask me anything about books, digital resources, or use advanced features like file upload and voice commands!\n\nFor example:\n• *\"Find Python programming books\"*\n• *\"Upload a new eBook file\"*\n• *\"Search by voice for AI topics\"*",
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
        let formatted = text.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replaceAll(/\*(.+?)\*/g, '<em>$1</em>');
        formatted = formatted.replaceAll(/\n/g, '<br/>');
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
                className="fixed bottom-6 right-6 z-[9999] group transition-all duration-300"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(16, 185, 129, 0.5))' }}
            >
                <div
                    className={`relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${isOpen
                        ? 'bg-gradient-to-br from-red-500 to-pink-600 rotate-90'
                        : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 hover:scale-125 shadow-xl group-hover:shadow-2xl'
                        }`}
                >
                    {isOpen ? (
                        <X className="h-7 w-7 text-white transition-transform" />
                    ) : (
                        <>
                            <Bot className="h-8 w-8 text-white animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
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
                    className="flex flex-col rounded-3xl overflow-hidden border border-gray-300 bg-white shadow-2xl"
                    style={{ height: '600px', maxHeight: 'calc(100vh - 160px)' }}
                >
                    {/* Header */}
                    <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-700 px-5 py-6 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
                        <div className="relative flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center shadow-lg">
                                <Sparkles className="h-6 w-6 text-white animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-base tracking-tight">Library AI Assistant</h3>
                                <p className="text-white/80 text-[11px] uppercase font-semibold tracking-widest mt-0.5">✨ Active & Ready</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50 to-white" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(16, 185, 129, 0.3) rgba(255, 255, 255, 0)' }}>
                        {messages.map((msg, i) => (
                            <div key={msg.role + '-' + i + '-' + (msg.text?.slice(0,10)||'')} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-shrink-0 mt-1">
                                    {msg.role === 'ai' ? (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                                            <Bot size={18} />
                                        </div>
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg">
                                            <User size={18} />
                                        </div>
                                    )}
                                </div>
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <div
                                        className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed font-medium transition-all ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none shadow-lg hover:shadow-xl'
                                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-md hover:shadow-lg'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                                    />

                                    {/* Item Cards */}
                                    {msg.items && msg.items.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {msg.items.map((item) => (
                                                <div key={item.id} className="bg-white border border-slate-300 rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 group hover:border-emerald-300">
                                                    <div className="flex gap-3">
                                                        <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-slate-200 to-slate-300 border border-slate-300 shadow group-hover:shadow-lg transition-all">
                                                            <img
                                                                src={toAssetUrl(item.image) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200'}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                alt=""
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight leading-tight">{item.title}</h4>
                                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">By {item.author || 'Unknown'}</p>
                                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                <span className="text-[9px] font-bold px-2 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-md border border-emerald-200">
                                                                    {item.type}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-amber-600">⭐ {item.rating || '4.5'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                                                        <a
                                                            href={toAssetUrl(item.pdf)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-bold text-center hover:from-emerald-600 hover:to-teal-700 transition-all shadow group-hover:shadow-lg flex items-center justify-center gap-1"
                                                        >
                                                            <ExternalLink size={12} /> Preview
                                                        </a>
                                                        <a
                                                            href={toAssetUrl(item.pdf)}
                                                            download
                                                            className="px-3 py-2 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-emerald-400 transition-all flex items-center justify-center font-semibold"
                                                        >
                                                            <Download size={13} />
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
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-emerald-200 shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                </div>
                                <p className="text-slate-600 text-xs font-medium">Library AI Assistant is searching...</p>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer Input */}
                    <div className="p-4 border-t border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100">
                        <div className="flex items-center gap-2 bg-white rounded-2xl p-1.5 shadow-lg border-2 border-slate-300 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400 transition-all">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Find books, research, topics..."
                                className="flex-1 bg-transparent px-4 py-2.5 outline-none text-sm placeholder:text-slate-400 font-medium"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 text-white hover:from-emerald-600 hover:via-teal-600 hover:to-blue-700 disabled:opacity-50 disabled:grayscale transition-all shadow-lg hover:shadow-xl active:scale-95 font-semibold"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
