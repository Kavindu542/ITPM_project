import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../../../services/authService';
import UserMenu from '../../../../components/UserMenu';
import { Shirt, Building2 } from 'lucide-react';

export default function HostelLaundryDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/hostel', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 px-3 py-2 border border-blue-100">
              <div className="flex items-center gap-2">
                <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto object-contain" />
                <div className="text-xs font-bold text-blue-800">Admin</div>
              </div>
            </div>
            <div className="text-gray-900">
              <div className="text-sm font-bold">Hostel (Laundry)</div>
              <div className="text-xs text-gray-500 font-medium">Dashboard</div>
            </div>
          </div>

          <UserMenu
            user={user}
            onProfile={() => navigate('/profile')}
            onLogout={logout}
            theme="light"
            idLabel="ID"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-blue-900 border-r border-blue-800 p-4 flex flex-col z-10 hidden md:flex shadow-inner">
          <div className="text-blue-300 text-xs font-bold tracking-wider uppercase mb-4 px-2 mt-2">Laundry Menu</div>
          <nav className="space-y-2">
            <Link
              to="/admin/hostel"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shadow-sm text-blue-100 hover:bg-blue-800 border border-transparent"
            >
              <Building2 size={18} />
              <span className="font-medium text-sm">Hostel services</span>
            </Link>
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 bg-gray-50">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Laundry Dashboard</h2>
              <p className="mt-2 text-sm text-gray-500">
                Signed in as <span className="font-medium text-blue-600">{user?.email}</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="rounded-xl bg-cyan-50 p-3 border border-cyan-100">
                  <Shirt className="h-8 w-8 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Laundry services and updates</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Manage laundry announcements and operations here.</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                You are logged in to the Laundry dashboard using the credentials created by the Warden.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
