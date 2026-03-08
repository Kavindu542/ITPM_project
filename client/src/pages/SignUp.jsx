import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/AuthShell';

export default function SignUp({ onSignedIn }) {
  const navigate = useNavigate();
  const [step, setStep] = React.useState('form');
  const [studentId, setStudentId] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pendingEmail, setPendingEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [otpError, setOtpError] = React.useState('');
  const [otpInfo, setOtpInfo] = React.useState('');
  const [otpBusy, setOtpBusy] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState({ studentId: '', name: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = React.useState({ studentId: false, name: false, email: false, password: false, confirmPassword: false });
  const [busy, setBusy] = React.useState(false);

  const validate = React.useCallback(({ studentId: nextStudentId, name: nextName, email: nextEmail, password: nextPassword, confirmPassword: nextConfirmPassword }) => {
    const errors = { studentId: '', name: '', email: '', password: '', confirmPassword: '' };

    const trimmedStudentId = (nextStudentId || '').trim();
    if (!trimmedStudentId) {
      errors.studentId = 'Student ID is required.';
    } else if (trimmedStudentId.length < 3) {
      errors.studentId = 'Student ID must be at least 3 characters.';
    } else if (trimmedStudentId.length > 30) {
      errors.studentId = 'Student ID must be 30 characters or less.';
    }

    const trimmedName = (nextName || '').trim();
    if (!trimmedName) {
      errors.name = 'Name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const trimmedEmail = (nextEmail || '').trim();
    if (!trimmedEmail) {
      errors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address.';
    } else if (!trimmedEmail.toLowerCase().endsWith('@my.sliit.lk')) {
      errors.email = 'Use your campus email (@my.sliit.lk).';
    }

    if (!nextPassword) {
      errors.password = 'Password is required.';
    } else if (nextPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!nextConfirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
    } else if (String(nextConfirmPassword) !== String(nextPassword || '')) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  }, []);

  const hasErrors = (errs) => Boolean(errs.studentId || errs.name || errs.email || errs.password || errs.confirmPassword);

  React.useEffect(() => {
    if (!touched.studentId && !touched.name && !touched.email && !touched.password && !touched.confirmPassword) return;
    setFieldErrors(validate({ studentId, name, email, password, confirmPassword }));
  }, [studentId, name, email, password, confirmPassword, touched.studentId, touched.name, touched.email, touched.password, touched.confirmPassword, validate]);

  const onBlur = (key) => {
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const nextTouched = { studentId: true, name: true, email: true, password: true, confirmPassword: true };
    setTouched(nextTouched);
    const errs = validate({ studentId, name, email, password, confirmPassword });
    setFieldErrors(errs);
    if (hasErrors(errs)) return;

    setBusy(true);

    try {
      const data = await authService.register({
        studentId: studentId.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      setPendingEmail(data?.email || email.trim());
      setOtp('');
      setOtpError('');
      setOtpInfo('We sent a 6-digit OTP to your campus email.');
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || 'Sign up failed');
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpInfo('');

    const otpValue = String(otp || '').trim();
    if (!/^\d{6}$/.test(otpValue)) {
      setOtpError('Enter the 6-digit OTP.');
      return;
    }

    setOtpBusy(true);
    try {
      const data = await authService.verifyEmailOtp({
        email: pendingEmail,
        otp: otpValue,
      });
      onSignedIn?.(data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setOtpError(err?.response?.data?.message || 'OTP verification failed');
    } finally {
      setOtpBusy(false);
    }
  };

  const onResendOtp = async () => {
    setOtpError('');
    setOtpInfo('');
    setOtpBusy(true);
    try {
      await authService.resendEmailOtp({ email: pendingEmail });
      setOtpInfo('OTP resent. Check your inbox.');
    } catch (err) {
      setOtpError(err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpBusy(false);
    }
  };

  return (
    <AuthShell
      panelTitle={step === 'otp' ? 'Almost There!' : 'Welcome Back!'}
      panelDescription={
        step === 'otp'
          ? 'Confirm your campus email with the OTP code to complete registration.'
          : 'To keep connected with us please login with your personal info.'
      }
      panelButtonText={step === 'otp' ? 'SIGN IN' : 'SIGN IN'}
      panelButtonTo="/signin"
      panelSide="left"
    >
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/campuscore-logo.png"
            alt="CampusCore"
            className="h-20 w-auto object-contain"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          {step === 'otp' ? 'Verify Email' : 'Sign Up'}
        </h1>
        {step === 'form' ? (
          <p className="mt-4 text-sm text-slate-400">Create your account with your campus details below.</p>
        ) : (
          <p className="mt-4 text-sm text-slate-400">Enter the OTP sent to your campus email.</p>
        )}
      </div>

      {step === 'otp' ? (
        <form onSubmit={onVerifyOtp} noValidate className="mt-8 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            We sent a 6-digit OTP to <span className="font-semibold">{pendingEmail}</span>.
          </div>

          <div>
            <input
              id="otp"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                otpError
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-200 bg-slate-100 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100'
              }`}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              maxLength={6}
              aria-invalid={Boolean(otpError)}
            />
            {otpError ? <p className="mt-2 text-xs text-red-500">{otpError}</p> : null}
            {otpInfo ? <p className="mt-2 text-xs text-emerald-600">{otpInfo}</p> : null}
          </div>

          <button
            type="submit"
            disabled={otpBusy}
            className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            {otpBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'VERIFY OTP'
            )}
          </button>

          <button
            type="button"
            disabled={otpBusy}
            onClick={onResendOtp}
            className="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            RESEND OTP
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <input
                id="studentId"
                className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                  touched.studentId && fieldErrors.studentId
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 bg-slate-100 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100'
                }`}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onBlur={() => onBlur('studentId')}
                type="text"
                placeholder="Student ID"
                required
                autoComplete="off"
                aria-invalid={Boolean(touched.studentId && fieldErrors.studentId)}
              />
              {touched.studentId && fieldErrors.studentId ? <p className="mt-2 text-xs text-red-500">{fieldErrors.studentId}</p> : null}
            </div>

            <div>
              <input
                id="name"
                className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                  touched.name && fieldErrors.name
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 bg-slate-100 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100'
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => onBlur('name')}
                type="text"
                placeholder="Full Name"
                required
                autoComplete="name"
                aria-invalid={Boolean(touched.name && fieldErrors.name)}
              />
              {touched.name && fieldErrors.name ? <p className="mt-2 text-xs text-red-500">{fieldErrors.name}</p> : null}
            </div>
          </div>

          <div>
            <input
              id="email"
              className={`w-full rounded-lg border px-4 py-3 text-sm text-slate-900 outline-none transition ${
                touched.email && fieldErrors.email
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-200 bg-slate-100 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100'
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => onBlur('email')}
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              aria-invalid={Boolean(touched.email && fieldErrors.email)}
            />
            {touched.email && fieldErrors.email ? <p className="mt-2 text-xs text-red-500">{fieldErrors.email}</p> : null}
          </div>

          <div>
            <div className="relative">
              <input
                id="password"
                className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition ${
                  touched.password && fieldErrors.password
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 bg-slate-100 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => onBlur('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                minLength={6}
                autoComplete="new-password"
                aria-invalid={Boolean(touched.password && fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && fieldErrors.password ? <p className="mt-2 text-xs text-red-500">{fieldErrors.password}</p> : null}
          </div>

          <div>
            <div className="relative">
              <input
                id="confirmPassword"
                className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition ${
                  touched.confirmPassword && fieldErrors.confirmPassword
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-200 bg-slate-100 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100'
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => onBlur('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                required
                autoComplete="new-password"
                aria-invalid={Boolean(touched.confirmPassword && fieldErrors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:text-slate-700"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.confirmPassword && fieldErrors.confirmPassword ? <p className="mt-2 text-xs text-red-500">{fieldErrors.confirmPassword}</p> : null}
          </div>

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'SIGN UP'
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
