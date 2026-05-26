import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ErrorState } from '../components/design-system/States';
import { signIn, useSession } from '../lib/auth-client';

export default function AdminLogin() {
	const navigate = useNavigate();
	const location = useLocation();
	const { data: session, isPending } = useSession();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const from =
		typeof location.state === 'object' &&
		location.state !== null &&
		'from' in location.state &&
		typeof (location.state as { from?: unknown }).from === 'string'
			? (location.state as { from: string }).from
			: '/admin';

	if (!isPending && session) {
		return <Navigate to={from} replace />;
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		try {
			const result = await signIn.email({
				email: email.trim(),
				password,
				rememberMe: true,
			});

			if (result.error) {
				setError(result.error.message ?? 'Неверный email или пароль');
				return;
			}

			navigate(from, { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ошибка входа');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-6">
			<div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-blue-100 rounded-2xl shadow-xl p-8">
				<h1 className="text-blue-800 font-bold text-2xl mb-1">Вход в админ-панель</h1>
				<p className="text-blue-400 text-sm mb-6">ГрГУ имени Янки Купалы</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<label className="flex flex-col gap-1">
						<span className="text-sm font-medium text-blue-800">Email</span>
						<input
							type="email"
							autoComplete="username"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="rounded-lg border border-blue-200 px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</label>

					<label className="flex flex-col gap-1">
						<span className="text-sm font-medium text-blue-800">Пароль</span>
						<input
							type="password"
							autoComplete="current-password"
							required
							minLength={12}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="rounded-lg border border-blue-200 px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</label>

					{error && <ErrorState text={error} />}

					<button
						type="submit"
						disabled={submitting}
						className="mt-2 w-full rounded-xl bg-blue-700 text-white font-semibold py-3 hover:bg-blue-800 disabled:opacity-60 transition-colors"
					>
						{submitting ? 'Вход…' : 'Войти'}
					</button>
				</form>
			</div>
		</div>
	);
}
