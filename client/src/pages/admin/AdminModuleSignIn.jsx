import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthShell from '../../components/AuthShell';

export default function AdminModuleSignIn({ title, moduleKey, onSignedIn, initialEmail }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryEmail = React.useMemo(() => {
    const value = new URLSearchParams(location.search).get('email');
    return value ? value.trim() : '';
  }, [location.search]);
  const [email, setEmail] = React.useState(queryEmail || initialEmail || '');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [fieldErrors, setFieldErrors] = React.useState({ email: '', password: '' });
  const [touched, setTouched] = React.useState({ email: false, password: false });
  const [busy, setBusy] = React.useState(false);

  const validate = React.useCallback(({ email: nextEmail, password: nextPassword }) => {
    const errors = { email: '', password: '' };

    const trimmedEmail = (nextEmail || '').trim();
    if (!trimmedEmail) {
      errors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!nextPassword) {
      errors.password = 'Password is required.';
    } else if (nextPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    return errors;
  }, []);

  const hasErrors = (errs) => Boolean(errs.email || errs.password);

  React.useEffect(() => {
    if (!touched.email && !touched.password) return;
    setFieldErrors(validate({ email, password }));
  }, [email, password, touched.email, touched.password, validate]);

  React.useEffect(() => {
    if (initialEmail || queryEmail) {
      setEmail(queryEmail || initialEmail);
    }
  }, [initialEmail, queryEmail]);

  const onBlur = (key) => {
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!moduleKey) {
      setError('Module is missing. Please go back and try again.');
      return;
    }

    const nextTouched = { email: true, password: true };
    setTouched(nextTouched);
    const errs = validate({ email, password });
    setFieldErrors(errs);
    if (hasErrors(errs)) return;

    setBusy(true);

    try {
      const data = await authService.moduleLogin({ module: moduleKey, email: email.trim(), password });
      onSignedIn?.(data.user);
      const dashboards = {
        'study-material': '/admin/study-material/dashboard',
        library: '/admin/library/dashboard',
        'club-and-society': '/admin/club-and-society/dashboard',
        'hostel-warden': '/admin/hostel/warden/dashboard',
        'hostel-laundry': '/admin/hostel/laundry/dashboard',
        'hostel-meals-shop': '/admin/hostel/meals-shop/dashboard',
      };
      navigate(dashboards[moduleKey] || '/admin/signin', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500">
              <span className="rounded-full bg-gray-100 px-3 py-1">Module access</span>
              {initialEmail || queryEmail ? (
                <Link to="/admin/hostel" className="font-semibold text-slate-700 hover:text-slate-600 hover:underline">
                  Back to hostel services
                </Link>
              ) : (
                <Link to="/admin/signin" className="font-semibold text-slate-700 hover:text-slate-600 hover:underline">
                  Back to modules
                </Link>
              )}
            </div>

            <h1 className="mt-4 text-3xl font-bold text-gray-900 text-center">{title} admin</h1>
            <p className="mt-2 text-center text-sm text-gray-500">Sign in with your module admin credentials</p>

            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500" htmlFor="email">
                  Admin Email
                </label>
                <input
                  id="email"
                  className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors ${
                    touched.email && fieldErrors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 focus:border-slate-600 focus:ring-2 focus:ring-slate-200'
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => onBlur('email')}
                  type="email"
                  placeholder="admin@example.com"
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
                    className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition-colors ${
                      touched.password && fieldErrors.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-gray-200 focus:border-slate-600 focus:ring-2 focus:ring-slate-200'
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => onBlur('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    required
                    autoComplete="current-password"
                    aria-invalid={Boolean(touched.password && fieldErrors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 hover:text-gray-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && fieldErrors.password ? (
                  <p className="mt-2 text-xs text-red-600">{fieldErrors.password}</p>
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
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-slate-500 hover:via-gray-500 hover:to-slate-600 disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
      </div>
    </AuthShell>
  );
}
