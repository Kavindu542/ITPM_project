import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail, Phone, MapPin, Clock, Send, CheckCircle, Bell, MessageSquare,
    ArrowRight, ExternalLink
} from 'lucide-react';
import UserMenu from '../components/UserMenu';
import { authService } from '../services/authService';
import Navbar from '../components/Navbar';

function LogoutModal({ busy, error, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
            <div className="bg-white rounded-3xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 p-6 flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 rounded-xl">🚪</div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
                        <p className="text-sm text-gray-500">You'll need to sign in again.</p>
                    </div>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-6">Are you sure you want to sign out from CampusCore?</p>
                    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>}
                    <div className="flex gap-3">
                        <button className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50" onClick={onCancel} disabled={busy}>Cancel</button>
                        <button className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all" onClick={onConfirm} disabled={busy}>
                            {busy ? 'Signing out…' : 'Yes, Sign Out'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const contactInfo = [
    { icon: Mail, title: 'Email Support', value: 'support@campuscore.edu', sub: 'Reply within 24 hours', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', linkType: 'mailto' },
    { icon: Phone, title: 'Phone', value: '+94 11 234 5678', sub: 'Mon–Fri, 8 AM – 5 PM', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', linkType: 'tel' },
    { icon: MapPin, title: 'Office', value: 'IT Building, Room 302', sub: 'Main Campus, Colombo', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', linkType: null },
    { icon: Clock, title: 'Working Hours', value: 'Mon – Fri', sub: '8:00 AM – 5:00 PM', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', linkType: null },
];

const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'study-materials', label: 'Study Materials' },
    { value: 'hostel', label: 'Hostel Support' },
    { value: 'library', label: 'Library Support' },
    { value: 'clubs', label: 'Clubs & Events' },
    { value: 'technical', label: 'Technical Issue' },
];

export default function ContactUs({ user, onLoggedOut }) {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);
    const [sending, setSending] = React.useState(false);
    const [charCount, setCharCount] = React.useState(0);

    const [form, setForm] = React.useState({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: 'general',
    });

    const handleLogout = async () => {
        setError(''); setBusy(true);
        try { await authService.logout(); onLoggedOut?.(); }
        catch (e) { setError(e?.response?.data?.message || 'Logout failed.'); }
        finally { setBusy(false); setShowLogoutConfirm(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        await new Promise((r) => setTimeout(r, 1200));
        setSending(false);
        setSubmitted(true);
    };

    const inputBase = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition-all duration-200';

    return (
        <div className="min-h-screen bg-[#f8faff] font-sans">

            {/* ── STICKY HEADER ─────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-white/80 shadow-sm">
                <div className="w-full px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
                    <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto flex-shrink-0" />
                    <Navbar />
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                        <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
                            <Bell className="h-5 w-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <UserMenu user={user} onProfile={() => navigate('/profile')} onLogout={() => setShowLogoutConfirm(true)} idLabel="ID" />
                    </div>
                </div>
            </header>

            {/* ── HERO ──────────────────────────────────────── */}
            <section className="relative overflow-hidden" style={{ minHeight: '40vh' }}>
                <img
                    src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80"
                    alt="Campus"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(91,33,182,0.92) 0%, rgba(124,58,237,0.88) 45%, rgba(219,39,119,0.80) 100%)' }} />
                <div className="absolute inset-0 opacity-[0.08]"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Floating blobs */}
                <div className="absolute top-10 right-20 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f9a8d4, transparent)' }} />
                <div className="absolute bottom-5 left-10 w-32 h-32 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 text-center text-white">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-sm font-semibold mb-6 backdrop-blur-sm">
                        <MessageSquare className="h-4 w-4" /> Contact Us
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">We're Here to Help</h1>
                    <p className="text-lg text-purple-100 max-w-xl mx-auto leading-relaxed">
                        Have a question, issue, or suggestion? Reach out and we'll get back to you as soon as possible.
                    </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" className="w-full">
                        <path d="M0 60L1440 60L1440 30C1200 60 900 0 720 20C540 40 240 10 0 30L0 60Z" fill="#f8faff" />
                    </svg>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">

                {/* ── CONTACT INFO CARDS ──────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
                    {contactInfo.map((item, i) => (
                        <div key={i} className={`group bg-white rounded-2xl border ${item.border} p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}>
                            <div className={`inline-flex p-3 rounded-xl mb-4 ${item.bg}`}>
                                <item.icon className={`h-6 w-6 ${item.color}`} />
                            </div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.title}</div>
                            <div className={`font-bold text-gray-900 mb-1 group-hover:${item.color} transition-colors`}>{item.value}</div>
                            <div className="text-sm text-gray-500">{item.sub}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* ── MAP PLACEHOLDER ─────────────────────── */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full min-h-[320px]">
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-52 relative flex items-center justify-center">
                                <div className="text-center">
                                    <div className="inline-flex p-4 bg-white rounded-2xl shadow-md mb-3">
                                        <MapPin className="h-8 w-8 text-violet-600" />
                                    </div>
                                    <p className="text-gray-600 font-semibold text-sm">SLIIT Main Campus</p>
                                    <p className="text-gray-400 text-xs mt-1">Malabe, Sri Lanka</p>
                                </div>
                                {/* Fake map grid */}
                                <div className="absolute inset-0 opacity-20"
                                    style={{ backgroundImage: 'linear-gradient(rgba(100,100,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,200,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-gray-900 mb-2">Find Our Office</h3>
                                <p className="text-gray-500 text-sm mb-4">IT Building, Room 302, SLIIT Main Campus, Malabe, Western Province, Sri Lanka.</p>
                                <a href="https://maps.google.com" target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-xl text-sm font-semibold border border-violet-100 hover:bg-violet-100 transition-colors">
                                    <ExternalLink className="h-4 w-4" /> Open in Google Maps
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ── CONTACT FORM ────────────────────────── */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-violet-600 to-purple-500 p-6 text-white">
                                <h2 className="text-2xl font-bold mb-1">Send a Message</h2>
                                <p className="text-purple-100 text-sm">Fill out the form and we'll respond within 24 hours.</p>
                            </div>

                            {submitted ? (
                                <div className="p-10 text-center">
                                    <div className="inline-flex p-5 bg-green-50 rounded-full mb-5">
                                        <CheckCircle className="h-12 w-12 text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Message Sent!</h3>
                                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                                    <button onClick={() => setSubmitted(false)}
                                        className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                                            <input type="text" required value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className={inputBase} placeholder="Your full name" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                                            <input type="email" required value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                className={inputBase} placeholder="your@email.com" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Category</label>
                                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className={inputBase}>
                                            {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Subject</label>
                                        <input type="text" required value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            className={inputBase} placeholder="Brief description of your issue" />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide">Message</label>
                                            <span className="text-xs text-gray-400">{charCount}/500</span>
                                        </div>
                                        <textarea required rows={5} value={form.message}
                                            onChange={(e) => { setForm({ ...form, message: e.target.value }); setCharCount(e.target.value.length); }}
                                            maxLength={500}
                                            className={`${inputBase} resize-none`}
                                            placeholder="Describe your issue or question in detail..." />
                                    </div>

                                    <button type="submit" disabled={sending}
                                        className="relative w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold rounded-xl hover:from-violet-700 hover:to-purple-600 disabled:opacity-60 transition-all shadow-lg shadow-violet-200 overflow-hidden group">
                                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
                                        {sending ? (
                                            <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
                                        ) : (
                                            <><Send className="h-4 w-4" />Send Message</>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showLogoutConfirm && <LogoutModal busy={busy} error={error} onCancel={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} />}
        </div>
    );
}
