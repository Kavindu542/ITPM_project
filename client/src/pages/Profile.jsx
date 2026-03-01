import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Lock,
  Trash2,
  ArrowLeft,
  Moon,
  Sun,
} from 'lucide-react';

import { authService } from '../services/authService';
import UserMenu from '../components/UserMenu';

export default function Profile({ user, onUserUpdated, onLoggedOut }) {
  const navigate = useNavigate();

  const [name, setName] = React.useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || '');

  const [semester, setSemester] = React.useState(
    user?.semester === null || user?.semester === undefined
      ? ''
      : String(user.semester)
  );
  const [enrolledModulesText, setEnrolledModulesText] = React.useState(
    Array.isArray(user?.enrolledModules) ? user.enrolledModules.join(', ') : ''
  );

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  const [deletePassword, setDeletePassword] = React.useState('');

  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setName(user?.name || '');
    setAvatarUrl(user?.avatarUrl || '');
    setSemester(
      user?.semester === null || user?.semester === undefined
        ? ''
        : String(user.semester)
    );
    setEnrolledModulesText(
      Array.isArray(user?.enrolledModules)
        ? user.enrolledModules.join(', ')
        : ''
    );
  }, [user?.name, user?.avatarUrl]);

  const doLogout = async () => {
    await authService.logout();
    onLoggedOut?.();
    navigate('/signin', { replace: true });
  };

  const onSelectAvatar = async (file) => {
    if (!file) return;

    setError('');
    setMessage('');

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('Profile image is too large. Max size is 10MB.');
      return;
    }

    const toDataUrl = (f) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(f);
      });

    try {
      const dataUrl = await toDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch {
      setError('Failed to load image.');
    }
  };

  const saveProfile = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const enrolledModules = String(enrolledModulesText || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.toUpperCase());

      const uniqueModules = Array.from(new Set(enrolledModules));

      const res = await authService.updateProfile({
        name,
        avatarUrl,
        semester: semester === '' ? null : Number(semester),
        enrolledModules: uniqueModules,
      });
      onUserUpdated?.(res?.user ?? user);
      setMessage('Profile updated.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await authService.updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await authService.deleteAccount({ password: deletePassword });
      onLoggedOut?.();
      navigate('/signin', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 font-sans">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto object-contain" />
            <div className="text-xs text-gray-500">Profile</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Removed dark mode toggle button */}

            <UserMenu
              user={user}
              onProfile={() => navigate('/profile')}
              onLogout={doLogout}
              idLabel="ID"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
          </div>

          <section>
            {error ? (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>
            ) : null}
            {message ? (
              <div className="mb-4 p-3 bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-800 rounded-xl text-green-700 dark:text-emerald-300 text-sm">{message}</div>
            ) : null}

              <div className="space-y-6">
                <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur rounded-3xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 md:p-7 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-white to-indigo-50/60 dark:from-slate-900 dark:to-slate-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Profile Settings</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your profile details. Email cannot be changed.</p>
                  </div>

                  <div className="p-6 md:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4">
                      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-800/70 p-5">
                        <div className="flex flex-col items-center text-center">
                          <div className="h-40 w-40 rounded-full overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <div className="text-3xl font-bold text-gray-700 dark:text-gray-200">{String(user?.name || 'U').charAt(0).toUpperCase()}</div>
                            )}
                          </div>

                          <div className="mt-4 min-w-0">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upload a new image</div>
                            <label className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-slate-700 text-white text-sm font-semibold hover:bg-gray-800 dark:hover:bg-slate-600 cursor-pointer transition-colors">
                              Choose image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => onSelectAvatar(e.target.files?.[0])}
                              />
                            </label>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">JPG, PNG • Max 10MB</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-8 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email (read-only)</label>
                        <input
                          value={user?.email || ''}
                          readOnly
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Student ID</label>
                          <input
                            value={user?.studentId || ''}
                            readOnly
                            disabled
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                          <input
                            value={user?.module ? `Admin (${user.module})` : (user?.role || 'student')}
                            readOnly
                            disabled
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Semester</label>
                          <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Not set</option>
                            {['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'].map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Used to unlock semester-restricted study materials.
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Enrolled modules</label>
                          <input
                            value={enrolledModulesText}
                            onChange={(e) => setEnrolledModulesText(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. IT2020, SE3030"
                          />
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Comma-separated module codes (used for module-restricted materials).
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={saveProfile}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-[#25f194] text-white font-semibold shadow-sm hover:from-blue-500 hover:to-[#25f194] transition-all disabled:opacity-50"
                      >
                        {busy ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                      <Lock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Change password</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Update your account password</p>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={changePassword}
                      className="px-4 py-3 rounded-xl bg-gray-900 dark:bg-slate-700 text-white font-semibold hover:bg-gray-800 dark:hover:bg-slate-600 disabled:opacity-50"
                    >
                      {busy ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/70 overflow-hidden">
                  <div className="p-6 border-b border-red-200 dark:border-red-900/70 flex items-center gap-3">
                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete account</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter your password to confirm</label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={deleteAccount}
                        className="px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                      >
                        {busy ? 'Deleting...' : 'Delete account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          </section>
        </div>
      </main>
    </div>
  );
}
