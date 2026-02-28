import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Building2, GraduationCap, Users2, Target, Eye, Heart,
    Award, Zap, Shield, ArrowRight, Bell, MapPin, Calendar, Star,
    Linkedin, Twitter, Github
} from 'lucide-react';
import UserMenu from '../components/UserMenu';
import { authService } from '../services/authService';
import Navbar from '../components/Navbar';

/* ─── Shared logout modal ──────────────────────────────── */
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

/* ─── Data ─────────────────────────────────────────────── */
const stats = [
    { value: '5,000+', label: 'Active Students' },
    { value: '200+', label: 'Study Materials' },
    { value: '50+', label: 'Campus Clubs' },
    { value: '3', label: 'Hostels Managed' },
];

const values = [
    { icon: Target, title: 'Student-Centric', description: 'Every feature is built with student needs at the forefront, simplifying daily campus life.', color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { icon: Zap, title: 'Fast & Efficient', description: 'Instant access to resources, real-time notifications, and seamless module navigation.', color: 'bg-yellow-50 text-yellow-600', iconBg: 'bg-yellow-100' },
    { icon: Shield, title: 'Secure & Reliable', description: 'Your data is protected with robust authentication and role-based access control.', color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
    { icon: Heart, title: 'Community Driven', description: 'Fostering connections between students, clubs, and academic resources on campus.', color: 'bg-pink-50 text-pink-600', iconBg: 'bg-pink-100' },
];

const modules = [
    { icon: BookOpen, title: 'Study Materials', description: 'Access, upload, and share course notes, PDFs, and academic resources across all departments.', color: 'from-blue-500 to-indigo-600', path: '/materials' },
    { icon: Building2, title: 'Hostel Management', description: 'Apply for accommodation, raise complaints, and manage hostel services digitally.', color: 'from-emerald-500 to-teal-600', path: '/hostel?view=apply' },
    { icon: GraduationCap, title: 'Library System', description: 'Browse the catalogue, borrow books, reserve titles, and track your reading history.', color: 'from-violet-500 to-purple-600', path: '/library' },
    { icon: Users2, title: 'Clubs & Societies', description: 'Discover, join, and participate in campus clubs and events throughout the year.', color: 'from-pink-500 to-rose-600', path: '/clubs' },
];

const team = [
    { name: 'Dr. Ravi Kumar', role: 'Platform Architect', dept: 'Computer Science', initial: 'RK', color: 'from-blue-600 to-indigo-600' },
    { name: 'Priya Nair', role: 'UX Lead', dept: 'Information Technology', initial: 'PN', color: 'from-pink-500 to-rose-500' },
    { name: 'Ashan Silva', role: 'Backend Engineer', dept: 'Software Engineering', initial: 'AS', color: 'from-emerald-500 to-teal-500' },
    { name: 'Kavya Perera', role: 'Frontend Dev', dept: 'Computer Science', initial: 'KP', color: 'from-violet-500 to-purple-500' },
];

const milestones = [
    { year: '2022', title: 'Project Inception', desc: 'ITPM project kickoff with a small team of 4 computer science students.', color: 'bg-blue-500' },
    { year: '2023', title: 'Core Modules Built', desc: 'Study Materials, Hostel Portal, and Library modules launched in beta.', color: 'bg-violet-500' },
    { year: '2024', title: 'Clubs & Events', desc: 'Club management, event feeds, and real-time notifications rolled out.', color: 'bg-pink-500' },
    { year: '2025', title: 'Full Launch', desc: '5,000+ students onboarded. System running at full production scale.', color: 'bg-emerald-500' },
];

export default function AboutUs({ user, onLoggedOut }) {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleLogout = async () => {
        setError('');
        setBusy(true);
        try {
            await authService.logout();
            onLoggedOut?.();
        } catch (e) {
            setError(e?.response?.data?.message || 'Logout failed.');
        } finally {
            setBusy(false);
            setShowLogoutConfirm(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8faff] font-sans">

            {/* ── STICKY HEADER ─────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-white/80 shadow-sm">
                <div className="w-full px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto" />
                    </div>
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
            <section className="relative overflow-hidden" style={{ minHeight: '52vh' }}>
                <img src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80"
                    alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,20,80,0.92) 0%, rgba(20,60,180,0.80) 55%, rgba(0,100,80,0.50) 100%)' }} />
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-24 text-center text-white">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-sm font-semibold mb-6 backdrop-blur-sm">
                        <Award className="h-4 w-4 text-yellow-300" />
                        About CampusCore
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                        Empowering Campus Life,<br />
                        <span style={{ background: 'linear-gradient(90deg,#60a5fa,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Digitally
                        </span>
                    </h1>
                    <p className="text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed">
                        CampusCore is an all-in-one student management platform designed to unify every aspect of university life — from academics to accommodation.
                    </p>
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                        {stats.map((s, i) => (
                            <div key={i} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-5 text-center hover:bg-white/15 transition-all duration-300 hover:-translate-y-1">
                                <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                                <div className="text-white/60 text-sm">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" className="w-full">
                        <path d="M0 60L1440 60L1440 30C1200 60 900 0 720 20C540 40 240 10 0 30L0 60Z" fill="#f8faff" />
                    </svg>
                </div>
            </section>

            {/* ── MISSION & VISION ──────────────────────────── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[{
                            icon: Target, color: 'from-blue-500 to-indigo-600', iconBg: 'bg-blue-50 text-blue-600',
                            title: 'Our Mission', accent: 'border-l-4 border-blue-500',
                            text: 'To streamline and digitize university operations by providing students, faculty, and administrators with a single, intuitive platform that simplifies daily campus tasks — saving time and reducing friction for everyone involved.'
                        }, {
                            icon: Eye, color: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-50 text-violet-600',
                            title: 'Our Vision', accent: 'border-l-4 border-violet-500',
                            text: 'A future where every university runs on intelligent, connected systems that adapt to student needs — fostering academic excellence, community engagement, and institutional efficiency through technology.'
                        }].map((card, i) => (
                            <div key={i} className={`bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${card.accent}`}>
                                <div className={`inline-flex p-3 rounded-2xl mb-5 ${card.iconBg}`}>
                                    <card.icon className="h-7 w-7" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">{card.title}</h2>
                                <p className="text-gray-600 leading-relaxed">{card.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CORE VALUES ───────────────────────────────── */}
            <section className="py-16" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)' }}>
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-100 text-blue-700 text-sm font-semibold mb-4 shadow-sm">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Core Values
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">What We Stand For</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">The principles that guide every decision we make in building CampusCore.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((v, i) => (
                            <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className={`inline-flex p-3 rounded-xl mb-4 ${v.color}`}>
                                    <v.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{v.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{v.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MODULES ───────────────────────────────────── */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-4">
                            <BookOpen className="h-4 w-4" /> What We Offer
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">Four Powerful Modules</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">One unified platform — everything a student needs, in one place.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {modules.map((m, i) => (
                            <div key={i} className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${m.color}`} />
                                <div className="p-6 flex items-start gap-5">
                                    <div className={`flex-shrink-0 p-3.5 rounded-2xl bg-gradient-to-br ${m.color} shadow-lg`}>
                                        <m.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{m.title}</h3>
                                        <p className="text-gray-500 leading-relaxed text-sm">{m.description}</p>
                                        <button onClick={() => navigate(m.path)}
                                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:gap-3 transition-all group-hover:text-blue-700">
                                            Explore <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TIMELINE ──────────────────────────────────── */}
            <section className="py-16" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%)' }}>
                <div className="max-w-5xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold mb-4 backdrop-blur-sm">
                            <Calendar className="h-4 w-4" /> Our Journey
                        </span>
                        <h2 className="text-3xl font-extrabold text-white mb-3">Milestones</h2>
                    </div>
                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-white/20" />
                        <div className="space-y-8">
                            {milestones.map((m, i) => (
                                <div key={i} className="relative flex items-start gap-6 pl-16">
                                    <div className={`absolute left-5 h-6 w-6 rounded-full ${m.color} border-4 border-white/20 shadow-lg -translate-x-1/2 flex items-center justify-center`} style={{ top: '4px' }} />
                                    <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5 flex-1 hover:bg-white/15 transition-colors">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2.5 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">{m.year}</span>
                                            <h3 className="text-white font-bold text-lg">{m.title}</h3>
                                        </div>
                                        <p className="text-white/60 text-sm leading-relaxed">{m.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── TEAM ──────────────────────────────────────── */}
            <section className="py-20 bg-[#f8faff]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="text-center mb-14">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-4">
                            <Users2 className="h-4 w-4" /> The Team
                        </span>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">Who Built CampusCore</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">A passionate group of students and faculty dedicated to improving campus life.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {team.map((t, i) => (
                            <div key={i} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden text-center">
                                <div className={`h-24 bg-gradient-to-br ${t.color} flex items-end justify-center pb-0`} />
                                <div className="-mt-10 px-6 pb-6">
                                    <div className={`mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-2xl font-extrabold border-4 border-white shadow-lg mb-4`}>
                                        {t.initial}
                                    </div>
                                    <h3 className="text-gray-900 font-bold text-lg">{t.name}</h3>
                                    <p className="text-blue-600 text-sm font-semibold mt-0.5">{t.role}</p>
                                    <p className="text-gray-400 text-xs mt-1">{t.dept}</p>
                                    <div className="flex justify-center gap-2 mt-4">
                                        {[Linkedin, Twitter, Github].map((Icon, j) => (
                                            <button key={j} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────── */}
            <section className="pb-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="relative overflow-hidden rounded-3xl p-12 text-center text-white shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #0891b2 100%)' }}>
                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5" />
                        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5" />
                        <div className="relative">
                            <h2 className="text-3xl font-extrabold mb-4">Ready to Explore?</h2>
                            <p className="text-white/70 mb-8 max-w-lg mx-auto">
                                Head back to your dashboard and start using all the features CampusCore has to offer.
                            </p>
                            <button onClick={() => navigate('/')}
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                                Go to Dashboard <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {showLogoutConfirm && (
                <LogoutModal busy={busy} error={error} onCancel={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} />
            )}
        </div>
    );
}
