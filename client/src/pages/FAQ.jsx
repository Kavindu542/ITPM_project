import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronDown, Search, BookOpen, Building2, GraduationCap, Users2,
    HelpCircle, Bell, User, ArrowRight, MessageSquare
} from 'lucide-react';
import UserMenu from '../components/UserMenu';
import { authService } from '../services/authService';
import Navbar from '../components/Navbar';

const ALL_FAQS = [
    { category: 'account', question: 'How do I reset my password?', answer: 'Go to the Sign In page and click "Forgot Password". Enter your registered email address and we will send you a reset link. The link expires in 30 minutes.' },
    { category: 'account', question: "Why can't I log in to my account?", answer: 'Make sure you are using the correct credentials. If you still have issues, try resetting your password. If the problem persists, contact the IT support desk at support@campuscore.edu.' },
    { category: 'account', question: 'How do I update my profile information?', answer: 'Click on your avatar in the top-right corner and select "Profile". From there, you can update your name, student ID, profile picture, and other personal details.' },
    { category: 'study-materials', question: 'How do I upload study materials?', answer: 'Navigate to the Study Materials module from your dashboard. Click "Upload" and select your file (PDF, DOCX, etc.). Add a title and subject category, then submit. Materials are reviewed before being published.' },
    { category: 'study-materials', question: 'What file formats are accepted for study materials?', answer: 'CampusCore supports PDF, DOCX, PPTX, XLSX, and common image formats (PNG, JPG). Maximum file size is 50 MB per upload.' },
    { category: 'study-materials', question: 'Why is my uploaded material not visible yet?', answer: 'All uploads go through a moderation review by administrators to ensure quality and relevance. This typically takes 24-48 hours. You will be notified once your material is approved or if changes are required.' },
    { category: 'study-materials', question: 'Can I request specific study materials?', answer: "Yes! In the Study Materials section, go to \"Requests Center\" to submit a request for specific course notes, past papers, or any other academic resource that isn't yet available." },
    { category: 'hostel', question: 'How do I apply for hostel accommodation?', answer: 'Go to the Hostel Portal from your dashboard. Click "Apply for Accommodation", fill in the application form, read and accept the terms and conditions, and submit. You will receive a confirmation email.' },
    { category: 'hostel', question: 'How do I raise a hostel complaint?', answer: 'In the Hostel Portal, go to the "Complaints" section. Fill in the complaint form with details about the issue, select the relevant category (maintenance, facilities, etc.), and submit. The warden will review your complaint.' },
    { category: 'hostel', question: 'What facilities are available in the hostel?', answer: 'Current hostel facilities include high-speed Wi-Fi, air conditioning, laundry services, a gym, a common room, and a canteen. Specific facilities may vary by block.' },
    { category: 'library', question: 'How do I borrow a book?', answer: 'Search for the book in the Library system and click "Borrow". If the book is available, it will be reserved for you. Visit the library counter with your student ID to collect the book within 48 hours.' },
    { category: 'library', question: 'How long can I keep a borrowed book?', answer: 'The standard borrowing period is 14 days. You can renew a book online up to 2 times if no other student has reserved it. Renewals are available in the Library module under "My Books".' },
    { category: 'library', question: 'What is the fine for overdue books?', answer: 'Overdue books incur a fine of ₹10 per day per book. Fines must be cleared before borrowing additional books. You can view and pay your fines in the Library module.' },
    { category: 'clubs', question: 'How do I join a campus club?', answer: "Visit the Clubs & Societies module from your dashboard. Browse available clubs, click on the one you're interested in, and click \"Join Club\". Some clubs may require approval from the club leader." },
    { category: 'clubs', question: 'How can I start a new club?', answer: 'To start a new club, submit a proposal to the Student Affairs department. You will need a minimum of 10 interested students, a proposed faculty advisor, and a club constitution. Contact the club administrators via the Contact Us page.' },
    { category: 'clubs', question: 'How do I view upcoming club events?', answer: 'Public club events are displayed on your Home dashboard under "Campus Club Events". You can also visit the Clubs module to see events specific to clubs you have joined.' },
];

const CATEGORIES = [
    { key: 'all', label: 'All Topics', icon: HelpCircle },
    { key: 'account', label: 'Account', icon: User },
    { key: 'study-materials', label: 'Study Materials', icon: BookOpen },
    { key: 'hostel', label: 'Hostel', icon: Building2 },
    { key: 'library', label: 'Library', icon: GraduationCap },
    { key: 'clubs', label: 'Clubs', icon: Users2 },
];

function AccordionItem({ faq, isOpen, onToggle }) {
    return (
        <div className={`rounded-2xl transition-all duration-200 ${isOpen ? 'border-2 border-blue-300 shadow-lg shadow-blue-50' : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
            <button
                className="w-full flex items-center justify-between gap-4 p-5 text-left bg-white hover:bg-gray-50 transition-colors rounded-2xl"
                onClick={onToggle}
            >
                <span className={`font-semibold text-base leading-snug ${isOpen ? 'text-blue-700' : 'text-gray-900'}`}>
                    {faq.question}
                </span>
                <div className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-300 ${isOpen ? 'bg-blue-100 rotate-180' : 'bg-gray-100'}`}>
                    <ChevronDown className={`h-4 w-4 transition-colors ${isOpen ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
            </button>
            <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isOpen ? '800px' : '0px' }}>
                <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 bg-white rounded-b-2xl">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5 w-1 rounded-full bg-blue-200" style={{ minHeight: '40px', alignSelf: 'stretch' }} />
                        <p className="text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LogoutModal({ busy, error, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
            <div className="bg-white rounded-3xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 p-6 flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 rounded-xl">🚪</div>
                    <div><h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3><p className="text-sm text-gray-500">You'll need to sign in again.</p></div>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-6">Are you sure you want to sign out from CampusCore?</p>
                    {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>}
                    <div className="flex gap-3">
                        <button className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors" onClick={onCancel} disabled={busy}>Cancel</button>
                        <button className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all" onClick={onConfirm} disabled={busy}>
                            {busy ? 'Signing out…' : 'Yes, Sign Out'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FAQ({ user, onLoggedOut }) {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');
    const [activeCategory, setActiveCategory] = React.useState('all');
    const [search, setSearch] = React.useState('');
    const [openIndex, setOpenIndex] = React.useState(null);

    const handleLogout = async () => {
        setError(''); setBusy(true);
        try { await authService.logout(); onLoggedOut?.(); }
        catch (e) { setError(e?.response?.data?.message || 'Logout failed.'); }
        finally { setBusy(false); setShowLogoutConfirm(false); }
    };

    const filtered = ALL_FAQS.filter((faq) => {
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        const q = search.toLowerCase();
        const matchesSearch = !q || faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
    });

    const handleToggle = (index) => setOpenIndex(openIndex === index ? null : index);

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

            {/* ── HERO + SEARCH ─────────────────────────────── */}
            <section className="relative overflow-hidden" style={{ minHeight: '380px' }}>
                {/* Layer 0 — background image */}
                <img
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80"
                    alt="Campus"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ zIndex: 0 }}
                />
                {/* Layer 1 — gradient overlay */}
                <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(135deg, rgba(29,78,216,0.93) 0%, rgba(37,99,235,0.90) 45%, rgba(8,145,178,0.87) 100%)' }} />
                {/* Layer 2 — grid pattern */}
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{ zIndex: 2, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                {/* Layer 3 — hero content */}
                <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 text-center text-white" style={{ zIndex: 3 }}>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-sm font-semibold mb-6 backdrop-blur-sm">
                        <HelpCircle className="h-4 w-4" /> Help Center
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Frequently Asked Questions</h1>
                    <p className="text-lg text-blue-100 max-w-xl mx-auto mb-10 leading-relaxed">
                        Find answers to the most common questions about CampusCore's modules and services.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-lg mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" style={{ zIndex: 5 }} />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-xl"
                        />
                    </div>
                </div>
                {/* Layer 4 — wave */}
                <div className="absolute bottom-0 left-0 right-0" style={{ zIndex: 4 }}>
                    <svg viewBox="0 0 1440 60" fill="none" className="w-full">
                        <path d="M0 60L1440 60L1440 30C1200 60 900 0 720 20C540 40 240 10 0 30L0 60Z" fill="#f8faff" />
                    </svg>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
                {/* ── CATEGORY PILLS ──────────────────────────── */}
                <div className="flex flex-wrap gap-2.5 justify-center mb-12">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => { setActiveCategory(cat.key); setOpenIndex(null); }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200
                                ${activeCategory === cat.key
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 scale-105'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                                }`}
                        >
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                            {activeCategory === cat.key && (
                                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-white/60" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ── FAQ LIST ────────────────────────────────── */}
                <div className="max-w-3xl mx-auto">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="inline-flex p-5 bg-gray-100 rounded-full mb-5">
                                <HelpCircle className="h-12 w-12 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-semibold text-lg">No matching questions found.</p>
                            <p className="text-gray-400 text-sm mt-2">Try a different search term or select a different category.</p>
                            <button onClick={() => { setSearch(''); setActiveCategory('all'); }}
                                className="mt-6 px-5 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-semibold text-sm hover:bg-blue-100 transition-colors">
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((faq, i) => (
                                <AccordionItem key={i} faq={faq} isOpen={openIndex === i} onToggle={() => handleToggle(i)} />
                            ))}
                        </div>
                    )}

                    {/* ── STILL NEED HELP ─────────────────────── */}
                    <div className="mt-16 relative overflow-hidden rounded-3xl p-10 text-center"
                        style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)' }}>
                        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-100/50" />
                        <div className="absolute -left-5 -bottom-5 w-28 h-28 rounded-full bg-cyan-100/50" />
                        <div className="relative">
                            <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm border border-blue-100 mb-5">
                                <MessageSquare className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Still Need Help?</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">Can't find what you're looking for? Contact our support team and we'll assist you directly.</p>
                            <button onClick={() => navigate('/contact')}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5">
                                Contact Support <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showLogoutConfirm && <LogoutModal busy={busy} error={error} onCancel={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} />}
        </div>
    );
}
