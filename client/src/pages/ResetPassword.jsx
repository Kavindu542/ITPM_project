import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bgImageUrl =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMCRQyVSlJQ6KJGV8swWe-NB9s5wwNp2_YcQ&s';

  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = React.useState(initialEmail);
  const [otp, setOtp] = React.useState('');

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const trimmedEmail = String(email || '').trim();
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    const otpValue = String(otp || '').trim();
    if (!/^\d{6}$/.test(otpValue)) {
      setError('OTP must be 6 digits.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (String(newPassword) !== String(confirmPassword)) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await authService.resetPassword({
        email: trimmedEmail,
        otp: otpValue,
        newPassword,
        confirmPassword,
      });
      setInfo(res?.message || 'Password reset successful.');
      setTimeout(() => navigate('/signin', { replace: true }), 800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen font-sans relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('${bgImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8 md:p-10 bg-white/80 backdrop-blur-xl">
            <h1 className="text-3xl font-bold text-gray-900 text-center">Reset password</h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the reset code (OTP) sent to your email, then choose a new password.
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label className="block text-xs font-medium text-gray-500" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className={`mt-2 w-full bg-transparent border-b px-1 py-2 text-sm text-gray-900 outline-none transition-colors ${
                    error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@my.sliit.lk"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500" htmlFor="otp">
                  Reset code (OTP)
                </label>
                <input
                  id="otp"
                  className={`mt-2 w-full bg-transparent border-b px-1 py-2 text-sm text-gray-900 outline-none transition-colors ${
                    error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                  }`}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  placeholder="6-digit code"
                  autoComplete="one-time-code"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500" htmlFor="newPassword">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    className={`mt-2 w-full bg-transparent border-b px-1 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors ${
                      error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                    }`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type={showNew ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    className={`mt-2 w-full bg-transparent border-b px-1 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors ${
                      error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {info ? (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
                  {info}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-purple-500 hover:to-blue-500 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset password'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Back to{' '}
                <Link to="/signin" className="font-semibold text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>

              <p className="text-center text-xs text-gray-500">
                Didn’t get a code?{' '}
                <Link to="/forgot-password" className="font-semibold text-blue-600 hover:underline">
                  Request a new code
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
