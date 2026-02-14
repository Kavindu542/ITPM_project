import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import UserMenu from '../../../components/UserMenu';

export default function ClubAndSocietyDashboard({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/admin/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-[#25f194] font-sans">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <div className="text-sm font-bold text-gray-900">CampusCore</div>
                  <div className="text-xs font-medium text-gray-500">Admin</div>
                </div>
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm font-semibold">Club and Society</div>
              <div className="text-xs text-white/80">Dashboard</div>
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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Welcome</h2>
            <p className="mt-1 text-sm text-white/80">Signed in as {user?.email}</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Module</div>
              <div className="mt-1 text-sm text-gray-600">You are logged into the Club and Society module.</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
