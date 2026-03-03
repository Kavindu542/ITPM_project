import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import UserMenu from '../../../components/UserMenu';
import {
  LayoutDashboard,
  BookOpen,
  Monitor,
  DoorOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Library,
  LogOut,
  Shield,
} from 'lucide-react';

const navItems = [
  {
    to: '/admin/library/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Overview & stats',
  },
  {
    to: '/admin/library/books',
    icon: BookOpen,
    label: 'Books',
    description: 'Manage books',
  },
  {
    to: '/admin/library/digital-resources',
    icon: Monitor,
    label: 'Digital Resources',
    description: 'Manage resources',
  },
  {
    to: '/admin/library/study-rooms',
    icon: DoorOpen,
    label: 'Study Rooms',
    description: 'Manage rooms',
  },
  {
    to: '/admin/library/reservations',
    icon: CalendarCheck,
    label: 'Reservations',
    description: 'View all bookings',
  },
];

export default function LibraryAdminLayout({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative flex h-screen overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } flex-shrink-0 transition-all duration-300 ease-in-out`}
        >
          <div className="flex h-full flex-col border-r border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm">

            {/* ── Logo ── */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-5">
              <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-indigo-600 to-[#25f194] rounded-xl shadow-md">
                  <Library className="h-5 w-5 text-white" />
                </div>
                {!collapsed && (
                  <div>
                    <div className="text-sm font-bold text-gray-900">CampusCore</div>
                    <div className="text-xs text-gray-500">Library Admin</div>
                  </div>
                )}
              </div>
              {!collapsed && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Expand button when collapsed */}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* ── Nav Items ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {!collapsed && (
                <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Menu
                </p>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 to-emerald-50 text-indigo-700 border border-indigo-100 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                    title={collapsed ? item.label : ''}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`flex-shrink-0 h-5 w-5 ${
                            isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                          }`}
                        />
                        {!collapsed && (
                          <div className="min-w-0 flex-1">
                            <div className={isActive ? 'text-indigo-700' : ''}>{item.label}</div>
                            <div className="text-[11px] text-gray-400 font-normal truncate">
                              {item.description}
                            </div>
                          </div>
                        )}
                        {!collapsed && isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* ── BOTTOM USER SECTION ── */}
            {!collapsed ? (
              <div className="border-t border-gray-100 p-4 space-y-3">

                {/* Role Badge */}
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Shield className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Librarian
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
                  </div>
                </div>

                {/* User Card */}
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-[#25f194] flex items-center justify-center text-white text-base font-black shadow-md">
                      {user?.name?.charAt(0)?.toUpperCase() || 'L'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  {/* Name & Email */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {user?.name || 'Librarian'}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {user?.email || 'librarian@lib.com'}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    title="Logout"
                    className="flex-shrink-0 p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-all duration-200 hover:scale-110"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Collapsed state */
              <div className="border-t border-gray-100 p-3 flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-[#25f194] flex items-center justify-center text-white text-base font-black shadow-md cursor-pointer hover:scale-105 transition-transform">
                    {user?.name?.charAt(0)?.toUpperCase() || 'L'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* TOP HEADER */}
          <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Library Management</h1>
                  <p className="text-xs text-gray-500">Manage books, rooms & resources</p>
                </div>
                <div className="flex items-center gap-3">
                  <UserMenu
                    user={user}
                    onProfile={() => navigate('/profile')}
                    onLogout={logout}
                    theme="light"
                    idLabel="ID"
                  />
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}