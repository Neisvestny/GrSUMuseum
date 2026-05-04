import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Teacher, TeacherMutation, TeacherSection } from '../../../../api/teachers';
import { useTeachers } from '../../../../hooks/useTeachers';
import AdminButton from '../ui/AdminButton';
import { ConfirmDelete } from '../ui/ConfirmDelete';
import { ErrorBox } from '../ui/ErrorBox';
import TeacherForm from './TeacherForm';

type Props = {
	teacher: Teacher;
	section: TeacherSection;
	maxId: number;
	onChanged: () => void;
};

export default function TeacherCard({ teacher, section, maxId, onChanged }: Props) {
	const { update, remove } = useTeachers(section);
	const [editing, setEditing] = useState(false);
	const [confirmDel, setConfirmDel] = useState(false);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		setEditing(false);
		setConfirmDel(false);
		setBusy(false);
		setErr(null);
	}, [teacher.id, section]);

	const handleSave = async (data: TeacherMutation) => {
		setBusy(true);
		try {
			await update(teacher.id, data);
			setEditing(false);
			onChanged();
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	const handleDelete = async () => {
		setBusy(true);
		try {
			await remove(teacher.id);
			onChanged();
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка удаления');
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
				<div className="w-10 h-10 shrink-0 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
					{teacher.id}
				</div>
				<div className="flex-1 min-w-0">
					<div className="font-bold text-blue-800 text-sm truncate">
						{teacher.name || '—'}
					</div>
					<div className="text-xs text-gray-500 truncate">{teacher.role || '—'}</div>
				</div>
				<div className="flex gap-2 shrink-0">
					<AdminButton
						disabled={busy}
						onClick={() => {
							setEditing((v) => !v);
							setConfirmDel(false);
							setErr(null);
						}}
						variant="secondary"
						size="sm"
						className="text-xs"
					>
						{editing ? 'Свернуть' : 'Изменить'}
					</AdminButton>
					{!confirmDel ? (
						<AdminButton
							disabled={busy}
							onClick={() => setConfirmDel(true)}
							variant="danger"
							size="sm"
							className="bg-transparent !text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-200 text-xs shadow-none hover:shadow-none"
						>
							Удалить
						</AdminButton>
					) : (
						<ConfirmDelete
							onYes={handleDelete}
							onNo={() => setConfirmDel(false)}
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
							<TeacherForm
								initial={teacher}
								maxPos={maxId}
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
