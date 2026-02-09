import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function SignUp({ onSignedIn }) {
  const navigate = useNavigate();
  const bgImageUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMCRQyVSlJQ6KJGV8swWe-NB9s5wwNp2_YcQ&s";
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
        <div className="w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Form */}
            <div className="p-8 md:p-10 bg-white/80 backdrop-blur-xl">
              <h1 className="text-3xl font-bold text-gray-900 text-center">
                {step === 'otp' ? 'Verify Email' : 'Sign up'}
              </h1>

              {step === 'otp' ? (
                <form onSubmit={onVerifyOtp} noValidate className="mt-8 space-y-5">
                  <div className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3">
                    <p className="text-sm text-gray-700">
                      We sent a 6-digit OTP to <span className="font-semibold">{pendingEmail}</span>.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Enter it below to confirm your registration.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500" htmlFor="otp">
                      OTP Code
                    </label>
                    <input
                      id="otp"
                      className={`mt-2 w-full bg-transparent border-b px-1 py-2 text-sm text-gray-900 outline-none transition-colors ${
                        otpError ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-600'
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
                    {otpError ? <p className="mt-2 text-xs text-red-600">{otpError}</p> : null}
                    {otpInfo ? <p className="mt-2 text-xs text-green-700">{otpInfo}</p> : null}
                  </div>

                  <button
                    type="submit"
                    disabled={otpBusy}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-purple-500 hover:to-blue-500 disabled:opacity-60"
                  >
                    {otpBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={otpBusy}
                    onClick={onResendOtp}
                    className="w-full inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-white disabled:opacity-60"
                  >
                    Resend OTP
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Want to sign in instead?{' '}
                    <Link to="/signin" className="font-semibold text-blue-600 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500" htmlFor="studentId">
                      Student ID
                    </label>
                    <input
                      id="studentId"
                      className={`mt-2 w-full bg-transparent border-b px-1 py-2 text-sm text-gray-900 outline-none transition-colors ${
                        touched.studentId && fieldErrors.studentId
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-600'
                      }`}
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      onBlur={() => onBlur('studentId')}
                      type="text"
                      placeholder="e.g. IT123456"
                      required
                      autoComplete="off"
                      aria-invalid={Boolean(touched.studentId && fieldErrors.studentId)}
                    />
                    {touched.studentId && fieldErrors.studentId ? (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.studentId}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500" htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      className={`mt-2 w-full bg-transparent border-b px-1 py-2 text-sm text-gray-900 outline-none transition-colors ${
                        touched.name && fieldErrors.name
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-600'
                      }`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => onBlur('name')}
                      type="text"
                      placeholder="Your full name"
                      required
                      autoComplete="name"
                      aria-invalid={Boolean(touched.name && fieldErrors.name)}
                    />
                    {touched.name && fieldErrors.name ? (
                      <p className="mt-2 text-xs text-red-600">{fieldErrors.name}</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    className={`mt-2 w-full bg-transparent border-b px-1 py-2 text-sm text-gray-900 outline-none transition-colors ${
                      touched.email && fieldErrors.email
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-600'
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => onBlur('email')}
                    type="email"
                    placeholder="you@my.sliit.lk"
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(touched.email && fieldErrors.email)}
                  />
                  {touched.email && fieldErrors.email ? (
                    <p className="mt-2 text-xs text-red-600">{fieldErrors.email}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      className={`mt-2 w-full bg-transparent border-b px-1 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors ${
                        touched.password && fieldErrors.password
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-600'
                      }`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => onBlur('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      aria-invalid={Boolean(touched.password && fieldErrors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password ? (
                    <p className="mt-2 text-xs text-red-600">{fieldErrors.password}</p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      className={`mt-2 w-full bg-transparent border-b px-1 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors ${
                        touched.confirmPassword && fieldErrors.confirmPassword
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-600'
                      }`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => onBlur('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      required
                      autoComplete="new-password"
                      aria-invalid={Boolean(touched.confirmPassword && fieldErrors.confirmPassword)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-700"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {touched.confirmPassword && fieldErrors.confirmPassword ? (
                    <p className="mt-2 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                  ) : null}
                </div>

                {error ? (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {error}
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
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already a member?{' '}
                  <Link to="/signin" className="font-semibold text-blue-600 hover:underline">
                    Sign in
                  </Link>
                </p>
                </form>
              )}
            </div>

            {/* Right: Gradient Panel */}
            <div className="hidden md:block relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600" />
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/30" />
                <div className="absolute top-1/3 left-10 h-20 w-20 rounded-full bg-white/25" />
                <div className="absolute bottom-12 left-1/4 h-28 w-28 rounded-full bg-white/20" />
                <div className="absolute bottom-10 right-12 h-24 w-24 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
