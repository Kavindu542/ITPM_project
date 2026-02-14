import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import AuthShell from '../components/AuthShell';

export default function SignIn({ onSignedIn }) {
	const navigate = useNavigate();

	const [email, setEmail] = React.useState('');
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
		} else if (!trimmedEmail.toLowerCase().endsWith('@my.sliit.lk')) {
			errors.email = 'Use your campus email (@my.sliit.lk).';
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

	const onBlur = (key) => {
		setTouched((t) => ({ ...t, [key]: true }));
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		setError('');

		const nextTouched = { email: true, password: true };
		setTouched(nextTouched);
		const errs = validate({ email, password });
		setFieldErrors(errs);
		if (hasErrors(errs)) return;

		setBusy(true);
		try {
			const data = await authService.login({ email: email.trim(), password });
			onSignedIn?.(data.user);
			navigate('/', { replace: true });
		} catch (err) {
			setError(err?.response?.data?.message || 'Sign in failed');
		} finally {
			setBusy(false);
		}
	};

	return (
		<AuthShell>
			<p className="text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase">Campus Access</p>
			<h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">Sign in</h1>
			<p className="mt-2 text-sm text-gray-600">Continue with your campus email to access the portal.</p>

			<form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
				<div>
					<label className="block text-xs font-semibold tracking-wide text-gray-600 uppercase" htmlFor="email">
						Email
					</label>
					<input
						id="email"
						className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors ${
							touched.email && fieldErrors.email
								? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
								: 'border-gray-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
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
					{touched.email && fieldErrors.email ? <p className="mt-2 text-xs text-red-600">{fieldErrors.email}</p> : null}
				</div>

				<div>
					<label className="block text-xs font-semibold tracking-wide text-gray-600 uppercase" htmlFor="password">
						Password
					</label>
					<div className="relative">
						<input
							id="password"
							className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition-colors ${
								touched.password && fieldErrors.password
									? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
									: 'border-gray-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
							}`}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							onBlur={() => onBlur('password')}
							type={showPassword ? 'text' : 'password'}
							placeholder="Your password"
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
					{touched.password && fieldErrors.password ? <p className="mt-2 text-xs text-red-600">{fieldErrors.password}</p> : null}
				</div>

				<div className="flex items-center justify-between">
					<Link to="/forgot-password" className="text-sm font-semibold text-slate-700 hover:text-slate-600 hover:underline">
						Forgot password?
					</Link>
				</div>

				{error ? <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div> : null}

				<button
					type="submit"
					disabled={busy}
					className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-[#25f194] px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-blue-500 hover:via-indigo-500 hover:to-[#25f194] disabled:opacity-60"
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

				<p className="text-center text-sm text-gray-500">
					Don’t have an account?{' '}
					<Link to="/signup" className="font-semibold text-slate-700 hover:text-slate-600 hover:underline">
						Sign up
					</Link>
				</p>
			</form>
		</AuthShell>
	);
}

