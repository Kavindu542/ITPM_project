import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  MessagesSquare,
  Download,
  FileUp,
  Layers,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';

import UserMenu from '../../../components/UserMenu';
import { authService } from '../../../services/authService';

const navItems = [
  { to: '/admin/study-material/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/study-material/upload-documents', label: 'Upload documents', icon: FileUp },
  { to: '/admin/study-material/student-uploads', label: 'Student uploads', icon: Users },
  { to: '/admin/study-material/central-upload', label: 'Central upload & materials', icon: Layers },
  { to: '/admin/study-material/moderation-queue', label: 'Moderation Queue', icon: ShieldCheck },
  { to: '/admin/study-material/downloads-history', label: 'Downloads history', icon: Download },
  { to: '/admin/study-material/requests', label: 'Request management', icon: MessageSquare },
  { to: '/admin/study-material/reviews', label: 'Review management', icon: Star },
  { to: '/admin/study-material/forum', label: 'Forum management', icon: MessagesSquare },
];

export default function StudyMaterialAdminLayout({ user, onLoggedOut }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 font-sans">
      <div className="fixed inset-0 opacity-[0.06]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-[#25f194] rounded-xl">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Study Material</h1>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
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

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <aside
              className={`shrink-0 transition-[width] duration-200 ${
                collapsed ? 'lg:w-20' : 'lg:w-80'
              }`}
            >
              <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden">
                <div
                  className={`p-4 border-b border-gray-200 flex items-center ${
                    collapsed ? 'lg:justify-center' : 'justify-between'
                  }`}
                >
                  <div className={`text-sm font-semibold text-gray-900 ${collapsed ? 'lg:hidden' : ''}`}>
                    Navigation
                  </div>

                  <button
                    type="button"
                    onClick={() => setCollapsed((v) => !v)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!collapsed}
                    className="hidden lg:inline-flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 bg-white/70 hover:bg-white transition-colors"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4 text-gray-700" />
                    ) : (
                      <ChevronLeft className="h-4 w-4 text-gray-700" />
                    )}
                  </button>
                </div>

                <div className={`p-2 ${collapsed ? 'lg:px-1' : ''}`}>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`
                        }
                      >
                        <div
                          className={`h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center ${
                            collapsed ? 'lg:h-10 lg:w-10' : ''
                          }`}
                        >
                          <Icon className="h-4 w-4 text-gray-700" />
                        </div>
                        <span className={`text-sm font-medium ${collapsed ? 'lg:hidden' : ''}`}>
                          {item.label}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </aside>

            <main className="min-w-0 flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
