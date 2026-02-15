import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { authService } from '../../services/authService';
import UserMenu from '../../components/UserMenu';

export default function Clubs({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 text-gray-700" />
              <span className="font-medium text-gray-800">Back</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'club_leader' ? (
              <button
                type="button"
                onClick={() => navigate('/leader/dashboard')}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Leader Dashboard
                <span aria-hidden="true">→</span>
              </button>
            ) : null}
            <UserMenu
              user={user}
              onProfile={() => navigate('/profile')}
              onLogout={logout}
              theme="light"
              idLabel="ID"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Users className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clubs & Societies</h1>
              <p className="text-sm text-gray-500">Module page</p>
            </div>
          </div>
          <div className="p-6 text-gray-700">This page is ready. Add your Clubs UI here.</div>
        </div>
      </div>
    </div>
  );
}
