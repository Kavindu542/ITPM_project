import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { toast } from '../lib/toast';
import AuthShell from '../components/AuthShell';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const onSubmit = async (e) => {
    e.preventDefault();

    const trimmed = String(email || '').trim();
    if (!trimmed) {
      toast.error('Email is required.');
      return;
    }

    setBusy(true);
    try {
      const res = await authService.forgotPassword({ email: trimmed });
      toast.success(res?.message || 'If an account exists, a reset code has been sent.');
      navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset code');
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
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@my.sliit.lk"
            autoComplete="email"
          />
        </div>

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
