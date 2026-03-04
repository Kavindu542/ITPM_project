import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { clubService } from '../services/clubService';
import {
  LogOut,
  BookOpen,
  Bell,
  ChevronRight,
  BookText,
  Building2,
  GraduationCap,
  Users2
} from 'lucide-react';

export default function Home({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

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

  // Study Material Section Images
  const studyMaterialImages = [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Hostel Section Images
  const hostelImages = [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Library Section Images
  const libraryImages = [
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1524578271613-d550eacf6090?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Clubs Section Images
  const clubImages = [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  // Quick Actions with images
  const quickActions = [
    {
      icon: BookText,
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Study Materials',
      color: 'from-blue-500 to-blue-600',
      path: '/materials',
      description: 'Access course materials, notes, and resources'
    },
    {
      icon: Building2,
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Hostel Portal',
      color: 'from-emerald-500 to-emerald-600',
      path: '/hostel?view=apply',
      description: 'Manage accommodation, complaints, and facilities'
    },
    {
      icon: GraduationCap,
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Library',
      color: 'from-[#25f194] to-[#25f194]',
      path: '/library',
      description: 'Browse books, reserve, and check due dates'
    },
    {
      icon: Users2,
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      label: 'Clubs',
      color: 'from-pink-500 to-pink-600',
      path: '/clubs',
      description: 'Join campus clubs and societies'
    },
  ];

  // Sample data for each section
  const studyMaterials = [
    { id: 1, title: 'Calculus II Notes', type: 'pdf', downloads: 245, subject: 'Mathematics' },
    { id: 2, title: 'Chemistry Lab Manual', type: 'doc', downloads: 189, subject: 'Chemistry' },
    { id: 3, title: 'Data Structures Guide', type: 'pdf', downloads: 312, subject: 'Computer Science' },
  ];

  const hostelInfo = {
    room: 'B-204',
    block: 'Block B',
    warden: 'Dr. Sharma',
    contact: '+91 9876543210',
    facilities: ['WiFi', 'AC', 'Laundry', 'Gym'],
  };

  const libraryStats = {
    borrowed: 3,
    due: 2,
    reserved: 1,
    fine: '₹150'
  };

  const clubs = [
    { id: 1, name: 'Tech Club', members: 150, category: 'Technology' },
    { id: 2, name: 'Drama Society', members: 80, category: 'Arts' },
    { id: 3, name: 'Sports Club', members: 200, category: 'Sports' },
  ];

  const now = new Date();
  const currentHour = now.getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now);
  const totalClubMembers = clubs.reduce((sum, club) => sum + club.members, 0);

  const [allEvents, setAllEvents] = React.useState([]);
  const [feedLoading, setFeedLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFeedLoading(true);
      try {
        const fetchPromises = [clubService.publicEvents()];
        if (user) {
          fetchPromises.push(clubService.myEvents());
        }

        const results = await Promise.allSettled(fetchPromises);
        if (cancelled) return;

        let combinedEvents = [];
        const publicRes = results[0];
        if (publicRes.status === 'fulfilled') {
          combinedEvents = [...(publicRes.value?.events || [])];
        }

        if (user && results[1]?.status === 'fulfilled') {
          const myEvents = results[1].value?.events || [];
          // Merge and avoid duplicates
          myEvents.forEach(me => {
            if (!combinedEvents.find(ce => ce.id === me.id)) {
              combinedEvents.push(me);
            }
          });
        }

        // Sort by date soonest first
        combinedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setAllEvents(combinedEvents);
      } catch (e) {
        if (cancelled) return;
        setAllEvents([]);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative z-10">
        {/* 1. HERO SECTION (Cinematic & Personalized - FULL SCREEN WIDTH) */}
        <section className="relative overflow-hidden min-h-[75vh] flex items-center bg-slate-900 text-white shadow-2xl shadow-blue-500/20">
          {/* Pro Background */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80"
              alt="Campus"
              className="w-full h-full object-cover opacity-50 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent"></div>
          </div>

          <div className="container mx-auto px-8 lg:px-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
              <div className="text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-bold backdrop-blur-md animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                  Smart Campus Hub v2.0
                </div>
                <h1 className="text-5xl lg:text-8xl font-black leading-[1.05] tracking-tight">
                  Welcome back,<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400">
                    {user?.name || 'Student'}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 max-w-xl leading-relaxed font-medium">
                  Your all-in-one portal for a smarter, more connected university experience.
                  Manage studies, accommodation, and campus life in one place.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                  <button
                    onClick={() => navigate('/materials')}
                    className="group px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-blue-50 transition-all flex items-center gap-3 shadow-xl"
                  >
                    Access Modules
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={() => navigate('/faq')}
                    className="px-10 py-5 bg-slate-800/40 border-2 border-slate-700/50 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all backdrop-blur-md"
                  >
                    Quick Help
                  </button>
                </div>
              </div>

              <div className="hidden lg:block relative h-[500px]">
                <div className="absolute top-0 right-0 w-64 p-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl animate-float">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                      <BookText className="text-white" size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Next Study</p>
                      <p className="font-bold text-sm">Calculus II</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-blue-500"></div>
                  </div>
                </div>

                <div className="absolute bottom-10 -left-10 w-72 p-6 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl animate-float-delayed">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                      <Building2 className="text-white" size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Room Status</p>
                      <p className="font-bold text-lg">{hostelInfo.room}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] text-emerald-300 font-bold uppercase">All Safe</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-2 border-dashed border-white/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-600/20 blur-[80px]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN CONTENT AREA (Centered Container) */}
        <div className="container mx-auto px-4 relative z-10 pb-24">
          {/* 2. STATS BAR (Social Proof & Impact) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-24 -mt-16 relative z-20 px-4 md:px-0">
            {[
              { icon: Users2, label: 'Active Students', value: '12,400+', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: BookOpen, label: 'Study Resources', value: '45,000+', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Bell, label: 'Daily Events', value: '85+', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: GraduationCap, label: 'Average GPA', value: '3.8', color: 'text-pink-600', bg: 'bg-pink-50' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all">
                <div className={`h-16 w-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={32} />
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-slate-500 font-bold text-sm uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 3. CORE MODULES (Feature Showcase) */}
          <div className="space-y-12 mb-28">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">Your Campus, <span className="text-blue-600">Unified</span></h2>
              <p className="text-slate-500 text-lg font-medium">Explore the key pillars of CampusCore designed to streamline your university experience.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="group relative bg-white rounded-[2.5rem] p-4 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden"
                  onClick={() => navigate(action.path)}
                >
                  <div className="relative h-64 rounded-3xl overflow-hidden mb-6">
                    <img
                      src={action.image}
                      alt={action.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${action.color} text-white shadow-lg mb-3`}>
                        <action.icon size={24} />
                      </div>
                      <h3 className="text-xl font-black text-white">{action.label}</h3>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-black text-sm uppercase tracking-wider">Explore Module</span>
                      <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. LIVE ACTIVITY & NEWS (Two-Column Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-28">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">Upcoming Events</h2>
                  <p className="text-slate-500 font-medium">Don't miss out on campus activities</p>
                </div>
                <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                  Full Calendar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedLoading ? (
                  <div className="p-12 text-center col-span-2">Loading events...</div>
                ) : allEvents.length === 0 ? (
                  <div className="p-12 text-center col-span-2 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
                    No upcoming events scheduled.
                  </div>
                ) : (
                  allEvents.slice(0, 4).map((e) => (
                    <div key={e.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-6 flex flex-col hover:shadow-xl transition-all">
                      <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                        <img
                          src={e.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80"}
                          alt={e.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-4 left-4 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 font-black text-xs uppercase shadow-sm">
                          {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">{e.name}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-4">
                        <Building2 size={16} />
                        <span>{e.venue || 'Main Auditorium'}</span>
                      </div>
                      <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">{e.club?.name || 'Academic'}</span>
                        <button className="text-blue-600 font-bold text-sm">Join Event →</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl font-black text-slate-900">Campus Alerts</h2>
              <div className="space-y-4">
                {[
                  { title: 'Library Maintenance', time: '2 hours ago', type: 'System', color: 'bg-amber-500' },
                  { title: 'New Materials: Math 101', time: '5 hours ago', type: 'Academic', color: 'bg-blue-500' },
                  { title: 'Hostel WiFi Upgrade', time: '1 day ago', type: 'Facility', color: 'bg-emerald-500' },
                ].map((alert, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex gap-4 hover:shadow-lg transition-all">
                    <div className={`h-3 w-3 rounded-full ${alert.color} mt-1.5 flex-shrink-0 animate-pulse`}></div>
                    <div>
                      <h4 className="font-bold text-slate-900">{alert.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{alert.time}</span>
                        <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest">•</span>
                        <span className="text-[10px] uppercase font-black text-blue-600">{alert.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="relative group p-8 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-xl font-black mb-2">Study break?</h4>
                    <p className="text-blue-100 text-sm mb-6">Check out the latest campus club activities.</p>
                    <button
                      onClick={() => navigate('/clubs')}
                      className="px-6 py-3 bg-white text-blue-600 font-black rounded-xl text-sm shadow-xl"
                    >
                      Browse Clubs
                    </button>
                  </div>
                  <Users2 size={120} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* 5. USER TESTIMONIALS (Social Proof) */}
          <div className="bg-white rounded-[4rem] p-12 lg:p-24 border border-slate-100 mb-28 text-center space-y-16">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900">Voices of <span className="text-blue-600">CampusCore</span></h2>
              <p className="text-slate-500 text-lg font-medium">Join thousands of students who have transformed their university journey.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
              {[
                { name: 'Sarah J.', role: 'Engineering Student', text: "CampusCore made managing my hostel life so much easier. I can finally focus on my grades!" },
                { name: 'David M.', role: 'Club President', text: "The clubs module is a game changer. We've seen a 50% increase in event attendance." },
                { name: 'Elena R.', role: 'Postgrad Student', text: "Seamless library reservations and easy access to digital notes. It's the companion every student needs." },
              ].map((t, idx) => (
                <div key={idx} className="space-y-6">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                  </div>
                  <p className="text-xl font-medium text-slate-700 leading-relaxed italic">"{t.text}"</p>
                  <div>
                    <div className="font-black text-slate-900">{t.name}</div>
                    <div className="text-sm text-slate-400 font-bold uppercase tracking-wider">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. FINAL CTA (Conversion) */}
          <div className="relative overflow-hidden bg-blue-600 rounded-[4rem] p-12 lg:p-24 text-center text-white shadow-2xl shadow-blue-500/40">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -ml-48 -mt-48"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px] -mr-48 -mb-48"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
              <h2 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter">Ready to own your <br /> campus day?</h2>
              <p className="text-blue-100 text-xl md:text-2xl font-medium">Download the mobile app or continue exploring the web dashboard.</p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <button className="px-10 py-5 bg-white text-blue-600 font-black rounded-[2rem] hover:bg-white/90 transition-all shadow-xl">
                  Get Started (Free)
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="px-10 py-5 bg-transparent border-2 border-white/30 font-black rounded-[2rem] hover:bg-white/10 transition-all"
                >
                  Contact Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md mx-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
              </div>

              <p className="text-gray-600 mb-6">Are you sure you want to logout from your account? You'll need to sign in again to access your dashboard.</p>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                  onClick={handleLogout}
                  disabled={busy}
                >
                  {busy ? 'Logging out...' : 'Yes, Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
