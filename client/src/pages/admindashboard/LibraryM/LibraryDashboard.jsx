import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Monitor,
  DoorOpen,
  CalendarCheck,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Star,
  Download,
  Eye,
} from 'lucide-react';

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, gradient, trend, trendValue }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${gradient}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

// ── Activity Item ──────────────────────────────────────────
function ActivityItem({ icon: Icon, color, title, subtitle, time, badge, badgeColor }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
        <div className="text-xs text-gray-500 truncate">{subtitle}</div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  );
}

// ── Mini Bar Chart ─────────────────────────────────────────
function MiniBarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-sm ${color} opacity-80 hover:opacity-100 transition-opacity`}
            style={{ height: `${(d.value / max) * 100}%`, minHeight: '4px' }}
            title={`${d.label}: ${d.value}`}
          />
        </div>
      ))}
    </div>
  );
}

// ── Room Status Badge ──────────────────────────────────────
function RoomBadge({ status }) {
  const styles = {
    Available: 'bg-emerald-100 text-emerald-700',
    Busy: 'bg-red-100 text-red-600',
    Maintenance: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${styles[status] || styles.Available}`}>
      {status}
    </span>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────
export default function LibraryDashboard({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const heroImage =
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1800&q=80';

  // Mock stats — replace with real API calls later
  const [stats] = useState({
    totalBooks: 1248,
    totalDigitalResources: 356,
    totalStudyRooms: 6,
    todayReservations: 24,
    activeReservations: 8,
    cancelledToday: 2,
    totalDownloads: 5820,
    avgRating: 4.8,
  });

  const weeklyBookings = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 19 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 22 },
    { label: 'Fri', value: 28 },
    { label: 'Sat', value: 18 },
    { label: 'Sun', value: 9 },
  ];

  const recentReservations = [
    { name: 'Dineth Perera', room: 'Focus Pod Alpha', time: '9:00 AM', status: 'Confirmed', purpose: 'Study' },
    { name: 'Sarah Fernando', room: 'Collaboration Hub', time: '10:00 AM', status: 'Confirmed', purpose: 'Group Work' },
    { name: 'Kasun Silva', room: 'Tech Lab Prime', time: '11:00 AM', status: 'Cancelled', purpose: 'Coding' },
    { name: 'Amali Jayawardena', room: 'Creative Studio', time: '1:00 PM', status: 'Confirmed', purpose: 'Design' },
    { name: 'Nuwan Bandara', room: 'Zen Sanctuary', time: '2:00 PM', status: 'Confirmed', purpose: 'Study' },
  ];

  const studyRooms = [
    { name: 'Focus Pod Alpha', capacity: 2, status: 'Available', bookings: 245 },
    { name: 'Collaboration Hub', capacity: 8, status: 'Busy', bookings: 189 },
    { name: 'Creative Studio', capacity: 4, status: 'Busy', bookings: 167 },
    { name: 'Tech Lab Prime', capacity: 6, status: 'Available', bookings: 298 },
    { name: 'Zen Sanctuary', capacity: 1, status: 'Available', bookings: 134 },
    { name: 'Innovation Space', capacity: 10, status: 'Available', bookings: 87 },
  ];

  const popularBooks = [
    { title: 'Clean Code', author: 'Robert Martin', downloads: 342, rating: 4.9 },
    { title: 'System Design', author: 'Alex Xu', downloads: 289, rating: 4.8 },
    { title: 'Data Structures', author: 'Cormen', downloads: 256, rating: 4.7 },
    { title: 'React in Action', author: 'Mark Tielens', downloads: 198, rating: 4.6 },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Librarian'} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening in the library today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* TOP HERO IMAGE - place here */}
      <section className="relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
        <img
          src={heroImage}
          alt="Library Operations Center"
          className="w-full h-52 sm:h-60 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 className="text-white text-3xl font-black">Library Operations Center</h3>
          <p className="text-white/90 text-base">Manage books, rooms, resources, and bookings in one place</p>
        </div>
      </section>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Books"
          value={stats.totalBooks.toLocaleString()}
          subtitle="In collection"
          icon={BookOpen}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Digital Resources"
          value={stats.totalDigitalResources}
          subtitle="Available online"
          icon={Monitor}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="up"
          trendValue="+8%"
        />
        <StatCard
          title="Study Rooms"
          value={stats.totalStudyRooms}
          subtitle={`${studyRooms.filter(r => r.status === 'Available').length} available now`}
          icon={DoorOpen}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Today's Bookings"
          value={stats.todayReservations}
          subtitle={`${stats.activeReservations} active now`}
          icon={CalendarCheck}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          trend="up"
          trendValue="+5%"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Download className="h-5 w-5 text-purple-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Downloads</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.totalDownloads.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">All time</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmed</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.activeReservations}</div>
          <div className="text-xs text-gray-400 mt-1">Active today</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cancelled</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.cancelledToday}</div>
          <div className="text-xs text-gray-400 mt-1">Today</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-5 w-5 text-amber-400" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Rating</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{stats.avgRating}</div>
          <div className="text-xs text-gray-400 mt-1">Library rating</div>
        </div>
      </div>

      {/* Charts + Rooms Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly Bookings Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Weekly Bookings</h3>
              <p className="text-xs text-gray-400">Study room reservations this week</p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600">This Week</span>
            </div>
          </div>
          <MiniBarChart data={weeklyBookings} color="bg-indigo-500" />
          <div className="flex justify-between mt-2">
            {weeklyBookings.map((d, i) => (
              <div key={i} className="flex-1 text-center text-[10px] text-gray-400 font-medium">
                {d.label}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold text-gray-900">{weeklyBookings.reduce((a, b) => a + b.value, 0)} bookings</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              +18% vs last week
            </div>
          </div>
        </div>

        {/* Study Rooms Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Room Status</h3>
              <p className="text-xs text-gray-400">Live availability</p>
            </div>
            <button
              onClick={() => navigate('/admin/library/study-rooms')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Manage →
            </button>
          </div>
          <div className="space-y-3">
            {studyRooms.map((room, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{room.name}</div>
                  <div className="text-xs text-gray-400">{room.capacity} {room.capacity === 1 ? 'person' : 'people'}</div>
                </div>
                <RoomBadge status={room.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Reservations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Today's Reservations</h3>
              <p className="text-xs text-gray-400">Latest study room bookings</p>
            </div>
            <button
              onClick={() => navigate('/admin/library/reservations')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </button>
          </div>
          <div className="space-y-1">
            {recentReservations.map((res, i) => (
              <ActivityItem
                key={i}
                icon={res.status === 'Confirmed' ? CheckCircle : XCircle}
                color={res.status === 'Confirmed' ? 'bg-emerald-500' : 'bg-red-400'}
                title={res.name}
                subtitle={`${res.room} • ${res.purpose}`}
                time={res.time}
                badge={res.status}
                badgeColor={
                  res.status === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }
              />
            ))}
          </div>
        </div>

        {/* Popular Books */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Popular Books</h3>
              <p className="text-xs text-gray-400">Most downloaded this month</p>
            </div>
            <button
              onClick={() => navigate('/admin/library/books')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {popularBooks.map((book, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{book.title}</div>
                  <div className="text-xs text-gray-400">{book.author}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Download className="h-3 w-3" />
                    {book.downloads}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {book.rating}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-xl font-black text-gray-900">Quick Access</h3>
          <p className="text-sm text-gray-500">Common librarian tasks</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Add Book', to: '/admin/library/books', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80', icon: BookOpen },
            { label: 'Add Resource', to: '/admin/library/digital-resources', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', icon: Monitor },
            { label: 'Add Room', to: '/admin/library/study-rooms', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', icon: DoorOpen },
            { label: 'View Bookings', to: '/admin/library/reservations', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80', icon: CalendarCheck },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(item.to)}
                className="relative h-36 rounded-2xl overflow-hidden group text-left"
              >
                <img src={item.image} alt={item.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-white font-bold text-base">{item.label}</h4>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
