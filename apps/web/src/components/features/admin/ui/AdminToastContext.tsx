import { AnimatePresence, motion } from 'framer-motion';
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';

export type AdminToastVariant = 'success' | 'error' | 'info';

type ToastItem = {
	id: number;
	message: string;
	variant: AdminToastVariant;
};

type ToastApi = {
	success: (message: string, durationMs?: number) => void;
	error: (message: string, durationMs?: number) => void;
	info: (message: string, durationMs?: number) => void;
};

const AdminToastContext = createContext<ToastApi | null>(null);

const VARIANT_STYLES: Record<AdminToastVariant, { border: string; bg: string; title: string }> = {
	success: {
		border: 'border-emerald-200',
		bg: 'bg-emerald-50',
		title: 'text-emerald-800',
	},
	error: {
		border: 'border-red-200',
		bg: 'bg-red-50',
		title: 'text-red-800',
	},
	info: {
		border: 'border-blue-200',
		bg: 'bg-white',
		title: 'text-blue-800',
	},
};

export function AdminToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const idRef = useRef(0);
	const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

	const dismiss = useCallback((id: number) => {
		const t = timers.current.get(id);
		if (t) {
			clearTimeout(t);
			timers.current.delete(id);
		}
		setToasts((list) => list.filter((x) => x.id !== id));
	}, []);

	const push = useCallback(
		(message: string, variant: AdminToastVariant, durationMs: number) => {
			const id = ++idRef.current;
			setToasts((list) => [...list, { id, message, variant }]);
			const timer = setTimeout(() => dismiss(id), durationMs);
			timers.current.set(id, timer);
		},
		[dismiss],
	);

	const value = useMemo<ToastApi>(
		() => ({
			success: (message, durationMs = 3800) => push(message, 'success', durationMs),
			error: (message, durationMs = 6500) => push(message, 'error', durationMs),
			info: (message, durationMs = 4200) => push(message, 'info', durationMs),
		}),
		[push],
	);

	return (
		<AdminToastContext.Provider value={value}>
			{children}
			<div
				className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 w-[min(100vw-2rem,22rem)] pointer-events-none"
				aria-live="polite"
				aria-atomic="true"
			>
				<AnimatePresence mode="popLayout">
					{toasts.map((t) => {
						const s = VARIANT_STYLES[t.variant];
						return (
							<motion.div
								key={t.id}
								layout
								initial={{ opacity: 0, y: 16, scale: 0.96 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, x: 24, scale: 0.96 }}
								transition={{ type: 'spring', stiffness: 420, damping: 28 }}
								className={`pointer-events-auto rounded-xl border-2 ${s.border} ${s.bg} shadow-lg px-4 py-3 flex gap-3 items-start`}
								role="status"
							>
								<span
									className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
										t.variant === 'success'
											? 'bg-emerald-600 text-white'
											: t.variant === 'error'
												? 'bg-red-600 text-white'
												: 'bg-blue-600 text-white'
									}`}
								>
									{t.variant === 'success' ? '✓' : t.variant === 'error' ? '!' : 'ⓘ'}
								</span>
								<p className={`text-sm font-medium leading-snug flex-1 min-w-0 ${s.title}`}>
									{t.message}
								</p>
								<button
									type="button"
									onClick={() => dismiss(t.id)}
									className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none -mr-1 -mt-0.5 px-1"
									aria-label="Закрыть"
								>
									×
								</button>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</AdminToastContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components -- hook exported with provider
export function useAdminToast(): ToastApi {
	const ctx = useContext(AdminToastContext);
	if (!ctx) {
		return {
			success: () => {},
			error: () => {},
			info: () => {},
		};
	}
	return ctx;
}
