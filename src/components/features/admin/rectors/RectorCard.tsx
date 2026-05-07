import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import type { Rector } from '../../../../api/rectors';
import AdminButton from '../ui/AdminButton';
import { ConfirmDelete } from '../ui/ConfirmDelete';
import { useAdminToast } from '../ui/AdminToastContext';
import { ErrorBox } from '../ui/ErrorBox';
import RectorForm from './RectorForm';

type Props = {
	rector: Rector;
	onChanged?: () => void;
	onUpdate: (id: number, data: Partial<Rector>) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
	dragHandle?: ReactNode;
};

export default function RectorCard({ rector, onChanged, onUpdate, onDelete, dragHandle }: Props) {
	const toast = useAdminToast();
	const [editing, setEditing] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		setEditing(false);
		setConfirmDelete(false);
		setBusy(false);
		setErr(null);
	}, [rector.id]);

	const handleSave = async (data: Partial<Rector>) => {
		setBusy(true);
		try {
			await onUpdate(rector.id, data);
			setEditing(false);
			onChanged?.();
			toast.success('Сохранено');
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Ошибка';
			setErr(msg);
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		setBusy(true);
		try {
			await onDelete(rector.id);
			onChanged?.();
			toast.success('Удалено');
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Ошибка удаления';
			setErr(msg);
			toast.error(msg);
		} finally {
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
				{dragHandle && <div className="shrink-0">{dragHandle}</div>}
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
					<AdminButton
						disabled={busy}
						onClick={() => {
							setEditing((v) => !v);
							setConfirmDelete(false);
							setErr(null);
						}}
						variant="secondary"
						size="sm"
						className="text-xs"
					>
						{editing ? 'Свернуть' : 'Изменить'}
					</AdminButton>
					{!confirmDelete ? (
						<AdminButton
							disabled={busy}
							onClick={() => setConfirmDelete(true)}
							variant="danger"
							size="sm"
							className="bg-transparent !text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-200 text-xs shadow-none hover:shadow-none"
						>
							Удалить
						</AdminButton>
					) : (
						<ConfirmDelete
							onYes={handleDelete}
							onNo={() => setConfirmDelete(false)}
							busy={busy}
						/>
					)}
				</div>
			</div>
			{err && (
				<div className="px-4 pb-2">
					<ErrorBox msg={err} />
				</div>
			)}
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
