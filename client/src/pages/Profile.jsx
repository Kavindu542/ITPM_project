import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Save, Key, AlertTriangle, Trash2, ArrowLeft,
  User, Shield, Bell, CheckCircle2, Lock, Edit3
} from 'lucide-react';
import { authService } from '../services/authService';
import UserMenu from '../components/UserMenu';
import Navbar from '../components/Navbar';

/* ─── Tabs ─────────────────────────────────────────────── */
const TABS = [
  { id: 'profile', label: 'Profile Info', icon: User, color: 'from-blue-500 to-indigo-600' },
  { id: 'security', label: 'Security', icon: Key, color: 'from-amber-500 to-orange-500' },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
];

export default function Profile({ user, onUserUpdated, onLoggedOut }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState('profile');

  const [name, setName] = React.useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl || '');
  const [semester, setSemester] = React.useState(
    user?.semester === null || user?.semester === undefined ? '' : String(user.semester)
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
    setSemester(user?.semester === null || user?.semester === undefined ? '' : String(user.semester));
    setEnrolledModulesText(Array.isArray(user?.enrolledModules) ? user.enrolledModules.join(', ') : '');
  }, [user?.name, user?.avatarUrl, user?.semester, user?.enrolledModules]);

  const clearMsgs = () => { setMessage(''); setError(''); };
  const doLogout = async () => { await authService.logout(); onLoggedOut?.(); };

  const onSelectAvatar = async (file) => {
    if (!file) return;
    clearMsgs();
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Profile image is too large. Max 10MB.'); return; }
    const toDataUrl = (f) => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ''));
      r.onerror = () => rej(new Error('Failed to read file'));
      r.readAsDataURL(f);
    });
    try { setAvatarUrl(await toDataUrl(file)); } catch { setError('Failed to load image.'); }
  };

  const saveProfile = async () => {
    clearMsgs(); setBusy(true);
    try {
      const enrolledModules = String(enrolledModulesText || '').split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.toUpperCase());
      const res = await authService.updateProfile({ name, avatarUrl, semester: semester === '' ? null : Number(semester), enrolledModules: Array.from(new Set(enrolledModules)) });
      const updatedUser = res?.user;
      if (updatedUser) {
        onUserUpdated?.(updatedUser);
        setName(updatedUser.name || '');
        setAvatarUrl(updatedUser.avatarUrl || '');
        setSemester(updatedUser.semester === null || updatedUser.semester === undefined ? '' : String(updatedUser.semester));
        setEnrolledModulesText(Array.isArray(updatedUser.enrolledModules) ? updatedUser.enrolledModules.join(', ') : '');
      } else {
        onUserUpdated?.(user);
      }
      setMessage('Profile updated successfully!');
    } catch (e) { setError(e?.response?.data?.message || 'Failed to update profile.'); }
    finally { setBusy(false); }
  };

  const changePassword = async () => {
    clearMsgs(); setBusy(true);
    try {
      await authService.updatePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setMessage('Password updated successfully!');
    } catch (e) { setError(e?.response?.data?.message || 'Failed to update password.'); }
    finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    clearMsgs(); setBusy(true);
    try { await authService.deleteAccount({ password: deletePassword }); onLoggedOut?.(); navigate('/signin', { replace: true }); }
    catch (e) { setError(e?.response?.data?.message || 'Failed to delete account.'); }
    finally { setBusy(false); }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:bg-white transition-all duration-200 placeholder-gray-400';
  const readonlyCls = 'w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-100 text-gray-400 text-sm cursor-not-allowed select-none';
  const avatarInitial = String(user?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f0f4ff' }}>

      {/* ── STICKY HEADER ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-2xl border-b border-white/80 shadow-sm">
        <div className="w-full px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
          <img src="/campuscore-logo.png" alt="CampusCore" className="h-10 w-auto flex-shrink-0" />
          <Navbar />
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
              <Bell className="h-5 w-5 text-gray-500 group-hover:text-gray-800" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <UserMenu user={user} onProfile={() => navigate('/profile')} onLogout={doLogout} idLabel="ID" />
          </div>
        </div>
      </header>

      {/* ── PROFILE BANNER ────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: '220px' }}>
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ zIndex: 1, background: 'linear-gradient(135deg, rgba(17,24,80,0.90) 0%, rgba(37,99,235,0.85) 55%, rgba(5,150,105,0.65) 100%)' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ zIndex: 2, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        {/* Decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full" style={{ zIndex: 2, background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent)' }} />
        <div className="absolute -left-10 bottom-0 w-48 h-48 rounded-full" style={{ zIndex: 2, background: 'radial-gradient(circle, rgba(255,255,255,0.04), transparent)' }} />

        {/* Back to home button inside banner */}
        <div className="absolute top-5 right-6 lg:right-10" style={{ zIndex: 3 }}>
          <button onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 border border-white/25 text-white text-sm font-semibold hover:bg-white/25 transition-colors backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </div>
      </div>

      {/* ── HERO SECTION (summary + actions) ───────────── */}
      <div className="w-full px-6 lg:px-10">

        {/* ── AVATAR + NAME (overlap banner) ─────────────── */}
        <div className="relative -mt-16 mb-8 flex items-end gap-5 z-40">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="h-32 w-32 rounded-3xl border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center"
              style={{ background: avatarUrl ? undefined : 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                : <span className="text-white text-5xl font-extrabold">{avatarInitial}</span>}
            </div>
            <label className="absolute inset-0 bg-black/50 rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer gap-1">
              <Camera className="h-6 w-6 text-white" />
              <span className="text-white text-xs font-semibold">Change</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectAvatar(e.target.files?.[0])} />
            </label>
          </div>

          {/* Name + meta */}
          <div className="pb-1">
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{user?.name || 'Student'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold capitalize">
                {user?.role || 'student'}
              </span>
              {user?.studentId && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-semibold">
                  ID: {user.studentId}
                </span>
              )}
              {semester && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
                  Sem {semester}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STATUS MESSAGES ───────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
            {message}
          </div>
        )}

        {/* ── TABS ────────────────────────────────────────── */}
        <div className="flex gap-2 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); clearMsgs(); }}
              className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200
                                ${activeTab === t.id
                  ? 'text-white shadow-lg scale-105'
                  : 'text-gray-500 bg-white border border-gray-200 hover:text-gray-800 hover:border-gray-300 hover:shadow-sm'
                }`}
              style={activeTab === t.id ? { background: `linear-gradient(135deg, ${t.color.includes('blue') ? '#2563eb, #4f46e5' : t.color.includes('amber') ? '#f59e0b, #ea580c' : '#ef4444, #e11d48'})` } : {}}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE INFO TAB ────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">

            {/* Avatar Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="relative group mx-auto w-fit mb-5">
                <div className="h-28 w-28 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-lg flex items-center justify-center mx-auto"
                  style={{ background: avatarUrl ? undefined : 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    : <span className="text-white text-4xl font-extrabold">{avatarInitial}</span>}
                </div>
                <label className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-5 w-5 text-white mb-1" />
                  <span className="text-white text-xs font-semibold">Change Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectAvatar(e.target.files?.[0])} />
                </label>
              </div>
              <p className="font-bold text-gray-900 text-lg mb-0.5">{name || user?.name}</p>
              <p className="text-gray-400 text-sm mb-5">{user?.email}</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
                <Edit3 className="h-4 w-4" />
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onSelectAvatar(e.target.files?.[0])} />
              </label>
              <p className="text-xs text-gray-400 mt-3">JPG, PNG · Max 10 MB</p>
            </div>

            {/* Form Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(to right, #f8faff, #eff6ff)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                    <p className="text-xs text-gray-500">Update your details. Email is read-only.</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address (read-only)</label>
                  <input value={user?.email || ''} readOnly disabled className={readonlyCls} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Student ID</label>
                    <input value={user?.studentId || ''} readOnly disabled className={readonlyCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Role</label>
                    <input value={user?.module ? `Admin (${user.module})` : (user?.role || 'student')} readOnly disabled className={readonlyCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Semester</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className={inputCls}>
                      <option value="">Not set</option>
                      {['1.1', '1.2', '2.1', '2.2', '3.1', '3.2', '4.1', '4.2'].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Enrolled Modules</label>
                    <input value={enrolledModulesText} onChange={(e) => setEnrolledModulesText(e.target.value)} className={inputCls} placeholder="e.g. IT2020, SE3030" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="button" disabled={busy} onClick={saveProfile}
                    className="relative inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white text-sm shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 overflow-hidden group"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
                    <Save className="h-4 w-4" />
                    {busy ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="max-w-2xl pb-16">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100" style={{ background: 'linear-gradient(to right, #fffbeb, #fef3c7)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 rounded-xl">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                    <p className="text-xs text-gray-500">Requires your current password to confirm.</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={`${inputCls} pl-11`} placeholder="Your current password" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">New Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${inputCls} pl-11`} placeholder="At least 6 characters" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputCls} pl-11`} placeholder="Re-enter new password" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="button" disabled={busy} onClick={changePassword}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md">
                    <Key className="h-4 w-4" />
                    {busy ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DANGER ZONE TAB ─────────────────────────────── */}
        {activeTab === 'danger' && (
          <div className="max-w-2xl pb-16">
            <div className="bg-white rounded-3xl border-2 border-red-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-red-100" style={{ background: 'linear-gradient(to right, #fff1f2, #ffe4e6)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-100 rounded-xl">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Delete Account</h2>
                    <p className="text-xs text-red-500 font-semibold">This action is permanent and cannot be undone.</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <div className="rounded-2xl bg-red-50 border border-red-100 p-5 mb-6 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700 mb-1">You will lose everything</p>
                    <p className="text-xs text-red-500 leading-relaxed">All your uploaded study materials, library records, hostel applications, and club memberships will be permanently deleted. This cannot be reversed.</p>
                  </div>
                </div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Enter Password to Confirm</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                      className={`${inputCls} pl-11`} placeholder="Your current password" />
                  </div>
                  <button type="button" disabled={busy} onClick={deleteAccount}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap shadow-md shadow-red-200">
                    <Trash2 className="h-4 w-4" />
                    {busy ? 'Deleting…' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
