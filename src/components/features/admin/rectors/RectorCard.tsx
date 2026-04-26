import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { Rector } from '../../../../api/rectors';
import RectorForm from './RectorForm';

type Props = {
	rector: Rector;
	onChanged?: () => void;
	onUpdate: (id: number, data: Partial<Rector>) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
};

export default function RectorCard({ rector, onChanged, onUpdate, onDelete }: Props) {
	const [editing, setEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const handleSave = async (data: Partial<Rector>) => {
		setBusy(true);
		try {
			await onUpdate(rector.id, data);
			setEditing(false);
			onChanged?.();
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		setBusy(true);
		try {
			await onDelete(rector.id);
			onChanged?.();
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка удаления');
			setBusy(false);
		}
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden"
		>
			<div className="flex items-center gap-4 p-4">
				<div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
					{rector.img ? (
						<img
							src={rector.img}
							alt={rector.name}
							className="w-full h-full object-cover"
							onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-blue-300 text-xl">
							👤
						</div>
					)}
				</div>
				<div className="w-8 h-8 shrink-0 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
					{rector.position}
				</div>
				<div className="flex-1 min-w-0">
					<div className="font-bold text-blue-800 text-sm truncate">
						{rector.name || '—'}
					</div>
					<div className="text-xs text-gray-500 truncate">{rector.years || '—'}</div>
				</div>
				<div className="flex gap-2 shrink-0">
					<button
						disabled={busy}
						onClick={() => {
							setEditing((v) => !v);
							setConfirmDelete(false);
							setErr(null);
						}}
						className="px-3 py-1.5 rounded-xl border-2 border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
					>
						{editing ? 'Свернуть' : 'Изменить'}
					</button>
					{!confirmDelete ? (
						<button
							disabled={busy}
							onClick={() => setConfirmDelete(true)}
							className="px-3 py-1.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 active:scale-95 transition-all disabled:opacity-40"
						>
							Удалить
						</button>
					) : (
						<div className="flex gap-1 items-center">
							<span className="text-red-500 text-xs font-semibold">Удалить?</span>
							<button
								onClick={handleDelete}
								disabled={busy}
								className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-40"
							>
								{busy ? '...' : 'Да'}
							</button>
							<button
								onClick={() => setConfirmDelete(false)}
								className="px-3 py-1.5 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all"
							>
								Нет
							</button>
						</div>
					)}
				</div>
			</div>
			{err && <div className="px-4 pb-2 text-red-500 text-xs font-semibold">{err}</div>}
			<AnimatePresence>
				{editing && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="px-4 pb-4 pt-4 border-t-2 border-blue-50">
							<RectorForm
								initial={rector}
								onSave={handleSave}
								onCancel={() => setEditing(false)}
								busy={busy}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
