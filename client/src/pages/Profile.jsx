import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  Download,
  Book,
  Users,
  Lock,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

import { authService } from '../services/authService';
import UserMenu from '../components/UserMenu';

const NAV_ITEMS = [
  { key: 'profile', label: 'Profile Settings', icon: null },
  { key: 'clubs', label: 'Register Clubs', icon: Users },
  { key: 'upload', label: 'Upload Files', icon: Upload },
  { key: 'downloads', label: 'Download Files', icon: Download },
  { key: 'books', label: 'Download Books', icon: Book },
];

export default function Profile({ user, onUserUpdated, onLoggedOut }) {
  const navigate = useNavigate();
  const [active, setActive] = React.useState('profile');

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
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">CampusCore</div>
              <div className="text-xs text-gray-500">Profile</div>
            </div>
          </div>

          <UserMenu
            user={user}
            onProfile={() => setActive('profile')}
            onLogout={doLogout}
            theme="light"
            idLabel="ID"
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="mb-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 font-semibold hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="text-sm font-semibold text-gray-900">Menu</div>
              </div>
              <div className="p-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const activeClass =
                    active === item.key
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50';

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActive(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${activeClass}`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        {Icon ? <Icon className="h-4 w-4 text-gray-700" /> : <span className="text-xs font-bold text-gray-700">PS</span>}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-9">
            {error ? (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            ) : null}
            {message ? (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{message}</div>
            ) : null}

            {active === 'profile' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-sm text-gray-500">Update your profile details. Email cannot be changed.</p>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-xl font-bold text-gray-700">{String(user?.name || 'U').charAt(0).toUpperCase()}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-gray-900">Profile picture</div>
                        <div className="text-xs text-gray-500">Upload a new image</div>
                        <label className="mt-2 inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 cursor-pointer">
                          Choose image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onSelectAvatar(e.target.files?.[0])}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (read-only)</label>
                        <input
                          value={user?.email || ''}
                          readOnly
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                          <input
                            value={user?.studentId || ''}
                            readOnly
                            disabled
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <input
                            value={user?.module ? `Admin (${user.module})` : (user?.role || 'student')}
                            readOnly
                            disabled
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                          <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Not set</option>
                            {Array.from({ length: 12 }).map((_, idx) => {
                              const v = String(idx + 1);
                              return (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              );
                            })}
                          </select>
                          <div className="mt-1 text-xs text-gray-500">
                            Used to unlock semester-restricted study materials.
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Enrolled modules</label>
                          <input
                            value={enrolledModulesText}
                            onChange={(e) => setEnrolledModulesText(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. IT2020, SE3030"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            Comma-separated module codes (used for module-restricted materials).
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={saveProfile}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50"
                      >
                        {busy ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Lock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Change password</h2>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={changePassword}
                      className="px-4 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
                    >
                      {busy ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
                  <div className="p-6 border-b border-red-200 flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Delete account</h2>
                      <p className="text-sm text-gray-500">This action cannot be undone</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter your password to confirm</label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
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
            ) : null}

            {active !== 'profile' ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h1 className="text-xl font-bold text-gray-900">
                    {NAV_ITEMS.find((i) => i.key === active)?.label}
                  </h1>
                  <p className="text-sm text-gray-500">This section is ready. Add module functionality here.</p>
                </div>
                <div className="p-6 text-gray-700">
                  {active === 'clubs' ? 'Register for clubs and societies here.' : null}
                  {active === 'upload' ? 'Upload files here.' : null}
                  {active === 'downloads' ? 'Your downloadable files will appear here.' : null}
                  {active === 'books' ? 'Download books here.' : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
