import React from 'react';
import { MessageCircle, X, Send, Sparkles, BookOpen, Download, ExternalLink, Bot, User } from 'lucide-react';
import { studyMaterialService } from '../services/studyMaterialService';

export default function AIChatBot() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState([
        {
            role: 'ai',
            text: "Hi! 👋 I'm your **CampusCore Study Assistant**. Ask me anything about available study materials!\n\nFor example:\n• *\"I have an exam in PAF, show me documents\"*\n• *\"Find notes for semester 3\"*\n• *\"Show me all IT3060 materials\"*",
            materials: [],
        },
    ]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const sendingRef = React.useRef(false);
    const requestingRef = React.useRef(false);
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
            const data = await studyMaterialService.aiChat(text);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text: data.reply,
                    materials: data.matchedMaterials || [],
                    totalSearched: data.totalMaterialsSearched,
                    totalMatches: data.totalMatches,
                    noMatches: Boolean(data.noMatches),
                    requestSuggestion: data.requestSuggestion || null,
                    requestSent: false,
                    requestLoading: false,
                    requestError: '',
                },
            ]);
        } catch (err) {
            const status = err?.response?.status;
            const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
            const msg =
                status === 429
                    ? '⏳ The AI service is temporarily busy. Please wait a few seconds and try again.'
                    : apiMsg || err?.message || '❌ Sorry, I encountered an error. Please try again.';
            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text: msg,
                    materials: [],
                },
            ]);
        } finally {
            setLoading(false);
            sendingRef.current = false;
        }
    };

    const submitMissingResourceRequest = async (messageIndex) => {
        if (requestingRef.current) return;

        const msg = messages[messageIndex];
        const suggestion = msg?.requestSuggestion;
        if (!msg || !suggestion || msg.requestSent) return;

        requestingRef.current = true;
        setMessages((prev) =>
            prev.map((m, idx) =>
                idx === messageIndex
                    ? { ...m, requestLoading: true, requestError: '' }
                    : m,
            ),
        );

        try {
            await studyMaterialService.submitRequest({
                title: suggestion.title,
                description: suggestion.description,
                moduleCode: suggestion.moduleCode || '',
            });

            setMessages((prev) =>
                prev.map((m, idx) =>
                    idx === messageIndex
                        ? { ...m, requestSent: true, requestLoading: false }
                        : m,
                ),
            );
        } catch (err) {
            const apiMsg = err?.response?.data?.message || err?.response?.data?.error;
            setMessages((prev) =>
                prev.map((m, idx) =>
                    idx === messageIndex
                        ? {
                            ...m,
                            requestLoading: false,
                            requestError:
                                apiMsg || err?.message || 'Failed to submit request. Please try again.',
                        }
                        : m,
                ),
            );
        } finally {
            requestingRef.current = false;
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
        // Convert bold markdown
        let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Convert italic markdown
        formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Convert line breaks
        formatted = formatted.replace(/\n/g, '<br/>');
        // Convert bullet points
        formatted = formatted.replace(/• /g, '<span style="margin-left:8px">• </span>');
        return formatted;
    };

    const getCategoryColor = (cat) => {
        const colors = {
            notes: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            tutes: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
            papers: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            links: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
            other: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
        };
        return colors[cat] || colors.other;
    };

    const fileUrl = (matId) => studyMaterialService.fileUrl(matId, { disposition: 'inline' });

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9999] group"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(37, 99, 235, 0.4))' }}
            >
                <div
                    className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isOpen
                            ? 'bg-gray-800 rotate-0'
                            : 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:scale-110'
                        }`}
                >
                    {isOpen ? (
                        <X className="h-6 w-6 text-white" />
                    ) : (
                        <>
                            <MessageCircle className="h-6 w-6 text-white" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                        </>
                    )}
                </div>
                {!isOpen && (
                    <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        AI Study Assistant
                        <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                    </div>
                )}
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
                    className="flex flex-col rounded-2xl overflow-hidden border border-gray-200 bg-white"
                    style={{
                        height: '580px',
                        maxHeight: 'calc(100vh - 160px)',
                        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    {/* Header */}
                    <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-sm">CampusCore AI Assistant</h3>
                                <p className="text-blue-200 text-xs">Powered by Gemini • Always ready</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4 text-white/80" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {msg.role === 'ai' ? (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-sm">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <div
                                        className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                                    />

                                    {/* Material Cards */}
                                    {msg.materials && msg.materials.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <div className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                                                <BookOpen className="h-3 w-3" />
                                                {msg.materials.length} matching material{msg.materials.length > 1 ? 's' : ''} found
                                            </div>
                                            {msg.materials.map((mat) => {
                                                const catStyle = getCategoryColor(mat.category);
                                                return (
                                                    <div
                                                        key={mat.id}
                                                        className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                    📄 {mat.title}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                    {mat.moduleCode && (
                                                                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                                                                            {mat.moduleCode}
                                                                        </span>
                                                                    )}
                                                                    {mat.semester && (
                                                                        <span className="text-xs text-gray-500">
                                                                            Sem {mat.semester}
                                                                        </span>
                                                                    )}
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catStyle.bg} ${catStyle.text}`}>
                                                                        {mat.category}
                                                                    </span>
                                                                </div>
                                                                {mat.description && (
                                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mat.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                                            <a
                                                                href={fileUrl(mat.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                Preview
                                                            </a>
                                                            <a
                                                                href={studyMaterialService.fileUrl(mat.id, { disposition: 'attachment' })}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                            >
                                                                <Download className="h-3 w-3" />
                                                                Download
                                                            </a>
                                                            <span className="ml-auto text-xs text-gray-400">
                                                                {mat.downloadCount} downloads
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Missing resource request (only when no matches) */}
                                    {msg.role === 'ai' && msg.noMatches && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => submitMissingResourceRequest(i)}
                                                disabled={msg.requestLoading || msg.requestSent || !msg.requestSuggestion}
                                                className={`w-full text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${msg.requestSent
                                                    ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                                                    : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                                                    } ${msg.requestLoading ? 'opacity-60' : ''}`}
                                            >
                                                {msg.requestSent
                                                    ? '✅ Missing resource request sent'
                                                    : msg.requestLoading
                                                        ? 'Submitting request...'
                                                        : 'Request missing resource'}
                                            </button>
                                            {msg.requestError && (
                                                <div className="text-xs text-red-600 mt-1">{msg.requestError}</div>
                                            )}
                                        </div>
                                    )}

                                    {msg.totalSearched && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            Searched {msg.totalSearched} materials
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-gray-500 ml-1">Analyzing materials...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask about study materials..."
                                    className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    disabled={loading}
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                <Send className="h-4 w-4 text-white" />
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2">
                            Powered by Google Gemini AI
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
