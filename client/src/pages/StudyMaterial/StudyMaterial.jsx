import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, FileText, FolderOpen, UploadCloud } from 'lucide-react';
import { authService } from '../../services/authService';
import UserMenu from '../../components/UserMenu';

export default function StudyMaterial({ user, onLoggedOut }) {
  const navigate = useNavigate();

  const recent = React.useMemo(
    () => [
      { id: 1, title: 'DSA – Week 03 Tutorial', type: 'PDF', updated: '2 days ago' },
      { id: 2, title: 'SE – Lecture Slides (Sprint Planning)', type: 'PPT', updated: '1 week ago' },
      { id: 3, title: 'DBMS – ER Modeling Summary', type: 'DOC', updated: '3 weeks ago' },
    ],
    []
  );

  const categories = React.useMemo(
    () => [
      { id: 'notes', label: 'Lecture Notes', count: 0 },
      { id: 'tutes', label: 'Tutorials', count: 0 },
      { id: 'papers', label: 'Past Papers', count: 0 },
      { id: 'links', label: 'Useful Links', count: 0 },
    ],
    []
  );

  const logout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-gray-200 hover:bg-white transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 text-gray-700" />
            <span className="font-medium text-gray-800">Back</span>
          </button>

          <UserMenu user={user} onProfile={() => navigate('/profile')} onLogout={logout} theme="light" idLabel="ID" />
        </div>

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm">
          <div className="p-6 sm:p-8 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Study Materials</h1>
              <p className="mt-1 text-sm text-gray-600">
                Browse module resources, notes, and tutorials — all in one place.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Organized by category
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  <Clock className="h-3.5 w-3.5" />
                  Quick access to recent items
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                disabled
                aria-disabled="true"
                title="Upload UI coming soon"
              >
                <UploadCloud className="h-4 w-4" />
                Upload (soon)
              </button>
              <p className="text-xs text-gray-500">UI preview only</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Empty State / Main */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your materials</h2>
                <p className="text-sm text-gray-500">Start by adding resources for each module/category.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <FileText className="h-4 w-4" />
                0 files
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">No materials yet</h3>
                <p className="mt-1 text-sm text-gray-600">
                  This is the updated UI shell. Connect your backend/API to populate real files.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    onClick={() => navigate('/profile')}
                  >
                    Go to profile
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                    disabled
                    aria-disabled="true"
                    title="Search UI coming soon"
                  >
                    Search (soon)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900">Categories</h2>
                <p className="text-sm text-gray-500">Quick jump sections</p>
              </div>
              <div className="p-4 space-y-2">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-gray-800">{c.label}</div>
                    <div className="text-xs font-semibold text-gray-500">{c.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900">Recent (sample)</h2>
                <p className="text-sm text-gray-500">Example list styling</p>
              </div>
              <div className="p-4 space-y-3">
                {recent.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{item.title}</div>
                        <div className="mt-1 text-xs text-gray-500">Updated {item.updated}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
