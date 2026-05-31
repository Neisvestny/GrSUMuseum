import { AnimatePresence, motion } from 'framer-motion';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import AdminButton from './AdminButton';

export type AdminConfirmVariant = 'primary' | 'danger' | 'warning';

export type AdminConfirmOptions = {
	title?: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: AdminConfirmVariant;
};

type ConfirmState = AdminConfirmOptions & {
	resolve: (value: boolean) => void;
};

type ConfirmApi = {
	confirm: (options: AdminConfirmOptions) => Promise<boolean>;
};

const AdminConfirmContext = createContext<ConfirmApi | null>(null);

const VARIANT_ICON: Record<AdminConfirmVariant, string> = {
	primary: 'ⓘ',
	danger: '!',
	warning: '⚠',
};

const VARIANT_BORDER: Record<AdminConfirmVariant, string> = {
	primary: 'border-blue-200',
	danger: 'border-red-200',
	warning: 'border-amber-200',
};

const VARIANT_BG: Record<AdminConfirmVariant, string> = {
	primary: 'bg-white',
	danger: 'bg-red-50',
	warning: 'bg-amber-50',
};

const VARIANT_ICON_BG: Record<AdminConfirmVariant, string> = {
	primary: 'bg-blue-600 text-white',
	danger: 'bg-red-600 text-white',
	warning: 'bg-amber-500 text-white',
};

export function AdminConfirmProvider({ children }: { children: ReactNode }) {
	const [dialog, setDialog] = useState<ConfirmState | null>(null);
	const dialogRef = useRef<ConfirmState | null>(null);

	const close = useCallback((result: boolean) => {
		const current = dialogRef.current;
		if (!current) return;
		dialogRef.current = null;
		setDialog(null);
		current.resolve(result);
	}, []);

	const confirm = useCallback((options: AdminConfirmOptions): Promise<boolean> => {
		return new Promise((resolve) => {
			const state: ConfirmState = { ...options, resolve };
			dialogRef.current = state;
			setDialog(state);
		});
	}, []);

	useEffect(() => {
		if (!dialog) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close(false);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [dialog, close]);

	const value = useMemo<ConfirmApi>(() => ({ confirm }), [confirm]);

	const variant = dialog?.variant ?? 'primary';

	return (
		<AdminConfirmContext.Provider value={value}>
			{children}
			<AnimatePresence>
				{dialog && (
					<motion.div
						key="admin-confirm"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.18 }}
						className="fixed inset-0 z-[300] flex items-center justify-center p-4"
						onClick={() => close(false)}
					>
						<div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
						<motion.div
							initial={{ scale: 0.95, opacity: 0, y: 12 }}
							animate={{ scale: 1, opacity: 1, y: 0 }}
							exit={{ scale: 0.98, opacity: 0, y: 8 }}
							transition={{ type: 'spring', stiffness: 420, damping: 28 }}
							className={`relative z-10 w-full max-w-md rounded-2xl border-2 ${VARIANT_BORDER[variant]} ${VARIANT_BG[variant]} shadow-2xl p-5`}
							onClick={(e) => e.stopPropagation()}
							role="alertdialog"
							aria-modal="true"
							aria-labelledby="admin-confirm-title"
							aria-describedby="admin-confirm-message"
						>
							<div className="flex gap-3 items-start mb-4">
								<span
									className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${VARIANT_ICON_BG[variant]}`}
								>
									{VARIANT_ICON[variant]}
								</span>
								<div className="min-w-0 flex-1">
									{dialog.title && (
										<h3
											id="admin-confirm-title"
											className="text-base font-bold text-stone-900 leading-snug"
										>
											{dialog.title}
										</h3>
									)}
									<p
										id="admin-confirm-message"
										className={`text-sm text-stone-600 whitespace-pre-line leading-relaxed ${dialog.title ? 'mt-1' : ''}`}
									>
										{dialog.message}
									</p>
								</div>
							</div>
							<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
								<AdminButton
									type="button"
									variant="secondary"
									size="md"
									className="w-full sm:w-auto"
									onClick={() => close(false)}
								>
									{dialog.cancelLabel ?? 'Отмена'}
								</AdminButton>
								<AdminButton
									type="button"
									variant={variant === 'danger' ? 'danger' : 'primary'}
									size="md"
									className="w-full sm:w-auto"
									onClick={() => close(true)}
								>
									{dialog.confirmLabel ?? 'Подтвердить'}
								</AdminButton>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</AdminConfirmContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components -- hook exported with provider
export function useAdminConfirm(): ConfirmApi {
	const ctx = useContext(AdminConfirmContext);
	if (!ctx) {
		return {
			confirm: async () => false,
		};
	}
	return ctx;
}
