import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const bgImageUrl =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMCRQyVSlJQ6KJGV8swWe-NB9s5wwNp2_YcQ&s';

  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const trimmed = String(email || '').trim();
    if (!trimmed) {
      setError('Email is required.');
      return;
    }

    setBusy(true);
    try {
      const res = await authService.forgotPassword({ email: trimmed });
      setInfo(res?.message || 'If an account exists, a reset code has been sent.');

      // Move user to the next step (enter OTP + new password)
      navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send reset code');
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
            <h1 className="text-3xl font-bold text-gray-900 text-center">Forgot password</h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email and we’ll send a 6-digit reset code (OTP).
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
                    Sending...
                  </>
                ) : (
                  'Send reset code'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Back to{' '}
                <Link to="/signin" className="font-semibold text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
