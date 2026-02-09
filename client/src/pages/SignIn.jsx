import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

export default function SignIn({ onSignedIn }) {
	const navigate = useNavigate();
	const bgImageUrl =
		'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMCRQyVSlJQ6KJGV8swWe-NB9s5wwNp2_YcQ&s';

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
		<div
			className="min-h-screen font-sans flex items-center justify-center p-4"
			style={{
				backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('${bgImageUrl}')`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundAttachment: 'fixed',
			}}
		>
			<div className="w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden">
				<div className="grid grid-cols-1 md:grid-cols-2">
					{/* Left: Form */}
					<div className="p-8 md:p-10 bg-white/80 backdrop-blur-xl">
						<h1 className="text-3xl font-bold text-gray-900 text-center">Sign in</h1>
						<p className="mt-2 text-center text-sm text-gray-500">Sign in with your campus account</p>

						<form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
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
										placeholder="Your password"
										required
										autoComplete="current-password"
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

							<div className="flex items-center justify-between">
								<Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:underline">
									Forgot password?
								</Link>
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
										Signing in...
									</>
								) : (
									'Sign in'
								)}
							</button>

							<p className="text-center text-sm text-gray-500">
								Don’t have an account?{' '}
								<Link to="/signup" className="font-semibold text-blue-600 hover:underline">
									Sign up
								</Link>
							</p>
						</form>
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
	);
}

