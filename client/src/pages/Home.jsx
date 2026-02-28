import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { clubService } from '../services/clubService';
import UserMenu from '../components/UserMenu';
import Navbar from '../components/Navbar';
import {
  LogOut, Bell, ChevronRight, BookText, Building2, GraduationCap,
  Users2, Calendar, ArrowUpRight, BookOpen, Zap, Star, ArrowRight,
  MapPin, Clock, TrendingUp, Award, Shield, Heart, Target
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────────────────────── */
function HeroSection({ user, navigate }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Student';

  return (
    <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>
      {/* Background photo */}
      <img
        src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80"
        alt="Campus"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(10,20,60,0.88) 0%, rgba(10,30,80,0.75) 55%, rgba(2,12,40,0.50) 100%)' }} />

      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 h-full flex items-center" style={{ minHeight: '92vh' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full py-24">

          {/* LEFT — Text */}
          <div className="space-y-8">
            {/* Greeting pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {greeting}, {firstName} 👋
            </div>

            <div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight">
                Your Campus,<br />
                <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  All in One Place
                </span>
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-lg leading-relaxed">
                CampusCore brings together study materials, hostel management, library, and clubs — one smart platform for every part of university life.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/materials')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-sm shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-blue-500/40"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                Explore Dashboard <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white/90 text-sm border border-white/25 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
              >
                About CampusCore
              </button>
            </div>

            {/* Mini stats row */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { icon: Users2, value: '5,000+', label: 'Students' },
                { icon: BookOpen, value: '200+', label: 'Materials' },
                { icon: Star, value: '50+', label: 'Clubs' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-blue-400" />
                  <span className="text-white font-bold">{s.value}</span>
                  <span className="text-white/50 text-sm">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Glassmorphism card */}
          <div className="hidden lg:flex justify-end">
            <div
              className="w-80 rounded-3xl overflow-hidden border border-white/15 shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)' }}
            >
              <div className="p-6 border-b border-white/10">
                <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-1">Quick Access</p>
                <h3 className="text-white font-bold text-lg">Campus Modules</h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { icon: BookText, label: 'Study Materials', sub: 'Notes & PDFs', color: 'bg-blue-500', path: '/materials' },
                  { icon: Building2, label: 'Hostel Portal', sub: 'Room & Facilities', color: 'bg-emerald-500', path: '/hostel?view=apply' },
                  { icon: GraduationCap, label: 'Library', sub: 'Books & Reserves', color: 'bg-violet-500', path: '/library' },
                  { icon: Users2, label: 'Clubs & Events', sub: 'Join & Participate', color: 'bg-pink-500', path: '/clubs' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10 transition-colors group text-left"
                  >
                    <div className={`${item.color} p-2 rounded-xl flex-shrink-0`}>
                      <item.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm">{item.label}</div>
                      <div className="text-white/40 text-xs">{item.sub}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2 px-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="text-white/50 text-xs">Dashboard is live and synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L1440 60L1440 30C1200 60 900 0 720 20C540 40 240 10 0 30L0 60Z" fill="#f8faff" />
        </svg>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { icon: Users2, value: '5,000+', label: 'Active Students', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BookText, value: '200+', label: 'Study Materials', color: 'text-violet-600', bg: 'bg-violet-50' },
    { icon: Star, value: '50+', label: 'Campus Clubs', color: 'text-pink-600', bg: 'bg-pink-50' },
    { icon: Building2, value: '3', label: 'Hostels Managed', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: TrendingUp, value: '98%', label: 'Student Satisfaction', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <section className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`${s.bg} p-2.5 rounded-xl flex-shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-gray-400 text-xs">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODULE CARD
───────────────────────────────────────────────────────────── */
function ModuleCard({ icon: Icon, image, label, description, color, accentColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-left w-full"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
            <ArrowUpRight className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-1.5 group-hover:text-blue-600 transition-colors">{label}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-semibold ${accentColor} group-hover:gap-2.5 transition-all duration-200`}>
          Open module <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   FEATURE HIGHLIGHT
───────────────────────────────────────────────────────────── */
function FeatureHighlight() {
  const features = [
    { icon: Target, title: 'Student-First Design', desc: 'Every feature is built around what students actually need, from exam prep to hostel comfort.', color: 'bg-blue-50 text-blue-600' },
    { icon: Zap, title: 'Real-Time Updates', desc: 'Live event feeds, instant notifications, and a dashboard that always shows fresh data.', color: 'bg-yellow-50 text-yellow-600' },
    { icon: Shield, title: 'Secure & Reliable', desc: 'Role-based access control keeps your data private and your session safe.', color: 'bg-green-50 text-green-600' },
    { icon: Heart, title: 'Community Driven', desc: 'Clubs, events, and shared resources foster real connections across campus.', color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <section className="py-20" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            <Award className="h-4 w-4" /> Why CampusCore
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4">Built for Real Campus Life</h2>
          <p className="text-gray-500 max-w-xl mx-auto">One platform. Everything you need. Designed by students, for students.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className={`inline-flex p-3 rounded-xl mb-4 ${f.color}`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function Home({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [publicEvents, setPublicEvents] = React.useState([]);
  const [feedLoading, setFeedLoading] = React.useState(false);

  const handleLogout = async () => {
    setError('');
    setBusy(true);
    try {
      await authService.logout();
      onLoggedOut?.();
    } catch (e) {
      setError(e?.response?.data?.message || 'Logout failed. Please try again.');
    } finally {
      setBusy(false);
      setShowLogoutConfirm(false);
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFeedLoading(true);
      try {
        const pe = await clubService.publicEvents();
        if (cancelled) return;
        setPublicEvents(pe?.events || []);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const quickModules = [
    {
      icon: BookText,
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      label: 'Study Materials',
      description: 'Access course notes, past papers & shared resources.',
      color: 'from-blue-500 to-indigo-600',
      accentColor: 'text-blue-600',
      path: '/materials',
    },
    {
      icon: Building2,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      label: 'Hostel Portal',
      description: 'Apply for rooms, raise complaints & manage facilities.',
      color: 'from-emerald-500 to-teal-600',
      accentColor: 'text-emerald-600',
      path: '/hostel?view=apply',
    },
    {
      icon: GraduationCap,
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      label: 'Library',
      description: 'Browse books, reserve titles & track due dates.',
      color: 'from-violet-500 to-purple-600',
      accentColor: 'text-violet-600',
      path: '/library',
    },
    {
      icon: Users2,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
      label: 'Clubs & Societies',
      description: 'Discover clubs, join events & meet fellow students.',
      color: 'from-pink-500 to-rose-600',
      accentColor: 'text-pink-600',
      path: '/clubs',
    },
  ];

  const studyMaterials = [
    { id: 1, title: 'Calculus II Notes', type: 'pdf', downloads: 245, subject: 'Mathematics', tag: 'Popular', tagColor: 'bg-orange-50 text-orange-600 border-orange-100' },
    { id: 2, title: 'Chemistry Lab Manual', type: 'doc', downloads: 189, subject: 'Chemistry', tag: 'New', tagColor: 'bg-green-50 text-green-600 border-green-100' },
    { id: 3, title: 'Data Structures Guide', type: 'pdf', downloads: 312, subject: 'Computer Sci', tag: 'Trending', tagColor: 'bg-blue-50 text-blue-600 border-blue-100' },
  ];

  const campusEvents = [
    { time: 'Tomorrow • 3 PM', title: 'Tech Symposium', place: 'CS Department', color: 'text-blue-600', dot: 'bg-blue-500' },
    { time: 'Mar 15 • 10 AM', title: 'Annual Sports Day', place: 'Main Ground', color: 'text-emerald-600', dot: 'bg-emerald-500' },
    { time: 'Mar 20 • 6 PM', title: 'Cultural Fest', place: 'Auditorium', color: 'text-purple-600', dot: 'bg-purple-500' },
  ];

  const hostelInfo = {
    room: 'B-204', block: 'Block B', warden: 'Dr. Sharma',
    contact: '+91 9876543210', facilities: ['WiFi', 'AC', 'Laundry', 'Gym'],
  };

  const libraryStats = [
    { value: '3', label: 'Borrowed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { value: '2', label: 'Due Soon', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { value: '1', label: 'Reserved', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { value: 'Rs.150', label: 'Fine', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  ];

  const clubs = [
    { id: 1, name: 'Tech Club', members: 150, category: 'Technology', emoji: '💻', color: 'bg-blue-50 text-blue-700' },
    { id: 2, name: 'Drama Society', members: 80, category: 'Arts', emoji: '🎭', color: 'bg-purple-50 text-purple-700' },
    { id: 3, name: 'Sports Club', members: 200, category: 'Sports', emoji: '⚽', color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div className="min-h-screen font-sans bg-[#f8faff]">

      {/* ── STICKY HEADER ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-white/80 shadow-sm shadow-gray-100/50">
        <div className="w-full px-6 lg:px-10 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto" />
            </div>
            <Navbar />
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
                <Bell className="h-5 w-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <UserMenu
                user={user}
                onProfile={() => navigate('/profile')}
                onLogout={() => setShowLogoutConfirm(true)}
                idLabel="ID"
              />
            </div>
          </div>
        </div>
      </header>


      {/* ── HERO ─────────────────────────────────────────────────── */}
      <HeroSection user={user} navigate={navigate} />

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <StatsBar />

      {/* ── QUICK ACCESS MODULES ────────────────────────────────── */}
      <section className="py-20 bg-[#f8faff]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Modules</span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mt-1">Quick Access</h2>
              <p className="text-gray-500 mt-2">Jump into any campus module instantly</p>
            </div>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickModules.map((mod, i) => (
              <ModuleCard key={i} {...mod} onClick={() => navigate(mod.path)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CAMPUSCORE ──────────────────────────────────────── */}
      <FeatureHighlight />

      {/* ── LIVE EVENTS + STUDY MATERIALS ───────────────────────── */}
      <section className="py-20 bg-[#f8faff]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Club Events */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pink-50 rounded-xl">
                    <Users2 className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Campus Club Events</h2>
                    <p className="text-xs text-gray-400">Live public events open to everyone</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />Live
                </span>
              </div>
              <div className="p-6">
                {feedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : publicEvents.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No public events yet.</p>
                    <p className="text-gray-300 text-sm mt-1">Check back soon for upcoming events.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {publicEvents.slice(0, 4).map((e) => (
                      <li key={e.id} className="group flex items-center gap-4 p-3.5 rounded-2xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/40 transition-all duration-200 cursor-pointer">
                        <div className="h-11 w-11 flex-shrink-0 flex items-center justify-center bg-pink-100 rounded-xl text-xl">🎉</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{e.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {e.venue && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.venue}</span>}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-pink-400 flex-shrink-0 transition-colors" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Study Materials */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <BookText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Study Materials</h2>
                    <p className="text-xs text-gray-400">Recent uploads</p>
                  </div>
                </div>
                <button onClick={() => navigate('/materials')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View all →
                </button>
              </div>
              <div className="p-4 space-y-2.5">
                {studyMaterials.map((m) => (
                  <div key={m.id} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer transition-all duration-200">
                    <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-lg text-base">
                      {m.type === 'pdf' ? '📄' : '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{m.title}</div>
                      <div className="text-xs text-gray-400">{m.subject} • {m.downloads} dls</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${m.tagColor}`}>{m.tag}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={() => navigate('/materials')}
                  className="w-full py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  Browse all materials
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOSTEL + LIBRARY + CLUBS ─────────────────────────────── */}
      <section className="pb-20 bg-[#f8faff]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Hostel */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Hostel" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <div className="text-2xl font-bold">{hostelInfo.room}</div>
                  <div className="text-xs text-white/70">{hostelInfo.block}</div>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="p-2 rounded-xl bg-emerald-500/90 backdrop-blur-sm">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-lg">Hostel</h2>
                  <button onClick={() => navigate('/hostel?view=apply')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Portal →</button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div><div className="text-xs text-gray-400">Warden</div><div className="font-medium text-gray-800 text-xs mt-0.5">{hostelInfo.warden}</div></div>
                  <div><div className="text-xs text-gray-400">Contact</div><div className="font-medium text-gray-800 text-xs mt-0.5">{hostelInfo.contact}</div></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hostelInfo.facilities.map((f, i) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100">{f}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Library */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-40 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Library" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-xs text-white/70">Library Access</div>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="p-2 rounded-xl bg-violet-500/90 backdrop-blur-sm">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-lg">Library</h2>
                  <button onClick={() => navigate('/library')} className="text-xs font-semibold text-violet-600 hover:text-violet-700">Visit →</button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {libraryStats.map((s, i) => (
                    <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className={`text-xs ${s.color} opacity-80 mt-0.5`}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Clubs */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-pink-50 rounded-xl">
                    <Users2 className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Clubs & Societies</h2>
                    <p className="text-xs text-gray-400">Get involved on campus</p>
                  </div>
                </div>
                <button onClick={() => navigate('/clubs')} className="text-xs font-semibold text-pink-600 hover:text-pink-700">Explore →</button>
              </div>
              <div className="p-4 space-y-2.5">
                {clubs.map((club) => (
                  <div key={club.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/40 cursor-pointer transition-all duration-200 group">
                    <div className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl text-xl ${club.color}`}>{club.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">{club.name}</div>
                      <div className="text-xs text-gray-400">{club.category}</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{club.members}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <button onClick={() => navigate('/clubs')} className="w-full py-2.5 text-sm font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors">
                  See all clubs
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAMPUS HIGHLIGHTS ────────────────────────────────────── */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div
            className="relative overflow-hidden rounded-3xl p-10"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%)' }}
          >
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="text-blue-200 font-semibold text-sm uppercase tracking-widest">What's On</span>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">Campus Highlights</h2>
                  <p className="text-blue-200 mt-1 text-sm">Upcoming events & announcements</p>
                </div>
                <button className="text-sm font-semibold text-white/70 hover:text-white inline-flex items-center gap-1 transition-colors">
                  View calendar <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {campusEvents.map((ev, i) => (
                  <div key={i} className="group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 hover:bg-white/20 hover:border-white/30 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-2 w-2 rounded-full bg-white/60" />
                      <span className="text-white/60 text-xs font-semibold">{ev.time}</span>
                    </div>
                    <div className="font-bold text-white text-lg mb-1">{ev.title}</div>
                    <div className="text-white/50 text-sm flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {ev.place}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/campuscore-logo.png" alt="CampusCore" className="h-8 w-auto" />
              <span className="text-xs text-gray-400">© {new Date().getFullYear()} CampusCore · SLIIT ITPM Project</span>
            </div>
            <nav className="flex items-center gap-1">
              {[
                { label: 'Home', path: '/' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact', path: '/contact' },
                { label: 'FAQ', path: '/faq' },
              ].map((link) => (
                <button key={link.path} onClick={() => navigate(link.path)}
                  className="px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  {link.label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #2563eb, #4f46e5, #0891b2, #059669)' }} />
      </footer>

      {/* ── LOGOUT MODAL ─────────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md mx-4 shadow-2xl shadow-black/20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 rounded-xl">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
                  <p className="text-sm text-gray-500">You'll need to sign in again.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">Are you sure you want to sign out from CampusCore?</p>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">{error}</div>}
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                  onClick={handleLogout}
                  disabled={busy}
                >
                  {busy ? 'Signing out…' : 'Yes, Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
