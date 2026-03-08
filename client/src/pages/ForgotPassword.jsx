import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import AuthShell from '../components/AuthShell';

export default function ForgotPassword() {
  const navigate = useNavigate();

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
      navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send reset code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      panelTitle="Need Help?"
      panelDescription="Recover your account securely and continue with CampusCore in just a few steps."
      panelButtonText="SIGN IN"
      panelButtonTo="/signin"
      panelSide="right"
    >
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Forgot Password</h1>
        <p className="mt-4 text-sm text-slate-400">
          Enter your campus email and we will send a 6-digit reset code.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <input
            id="email"
            className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none transition ${
              error
                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-slate-200 bg-slate-100 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100'
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@my.sliit.lk"
            autoComplete="email"
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {info}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'SEND RESET CODE'
          )}
        </button>

        <p className="pt-2 text-center text-sm text-slate-500">
          Back to{' '}
          <Link to="/signin" className="font-semibold text-violet-600 transition hover:text-violet-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
