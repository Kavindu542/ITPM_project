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
		<AuthShell
			panelTitle="Hello, Friend!"
			panelDescription="Register with your campus details to access all CampusCore features in one secure place."
			panelButtonText="SIGN UP"
			panelButtonTo="/signup"
			panelSide="right"
		>
			<div className="text-center">
				<div className="mb-6 flex justify-center">
					<img
						src="/campuscore-logo.png"
						alt="CampusCore"
						className="h-20 w-auto object-contain"
					/>
				</div>
				<h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Sign In</h1>
			</div>

			<form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
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
							autoComplete="current-password"
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

				{error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

				<div className="pt-2 text-center">
					<Link to="/forgot-password" className="text-sm font-medium text-slate-500 transition hover:text-violet-600 hover:underline">
						Forget Your Password?
					</Link>
				</div>

				<button
					type="submit"
					disabled={busy}
					className="mx-auto mt-2 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
				>
					{busy ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Signing In...
						</>
					) : (
						'SIGN IN'
					)}
				</button>
			</form>
		</AuthShell>
	);
}

