import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { TeacherMutation, TeacherSection } from '../../../../api/teachers';
import { useTeachers } from '../../../../hooks/useTeachers';
import AdminButton from '../ui/AdminButton';
import { ErrorBox } from '../ui/ErrorBox';
import TeacherCard from './TeacherCard';
import TeacherForm from './TeacherForm';

type Props = { section: TeacherSection };

export default function TeachersPanel({ section }: Props) {
	const { teachers, loading, error, add, reset, reload } = useTeachers(section);
	const [adding, setAdding] = useState(false);
	const [confirmReset, setConfirmReset] = useState(false);
	const [busy, setBusy] = useState(false);
	const [addErr, setAddErr] = useState<string | null>(null);

	const handleAdd = async (data: TeacherMutation) => {
		setBusy(true);
		setAddErr(null);
		try {
			await add(data);
			setAdding(false);
		} catch (error) {
			setAddErr(error instanceof Error ? error.message : 'Ошибка');
		} finally {
			setBusy(false);
		}
	};

	const handleReset = async () => {
		setBusy(true);
		await reset();
		setConfirmReset(false);
		setBusy(false);
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-2 flex-wrap">
				<AdminButton
					onClick={() => {
						setAdding((v) => !v);
						setAddErr(null);
					}}
					disabled={busy}
					variant="primary"
					size="md"
					className="shadow-md hover:shadow-lg"
				>
					{adding ? '✕ Отмена' : '+ Добавить (с данными)'}
				</AdminButton>
				<AdminButton
					onClick={() => {
						setBusy(true);
						add({}).finally(() => setBusy(false));
					}}
					disabled={busy}
					variant="secondary"
					size="md"
				>
					+ Быстрое добавление
				</AdminButton>
				<div className="flex-1" />
				{!confirmReset ? (
					<AdminButton
						onClick={() => setConfirmReset(true)}
						variant="danger"
						size="md"
						className="bg-transparent !text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-200 shadow-none hover:shadow-none"
					>
						Сбросить к исходным
					</AdminButton>
				) : (
					<div className="flex gap-2 items-center">
						<span className="text-red-500 text-sm font-semibold">Вы уверены?</span>
						<AdminButton onClick={handleReset} variant="danger" size="sm">
							Да
						</AdminButton>
						<AdminButton
							onClick={() => setConfirmReset(false)}
							variant="secondary"
							size="sm"
							className="border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-200"
						>
							Нет
						</AdminButton>
					</div>
				)}
			</div>

			<AnimatePresence>
				{adding && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
					>
						<p className="text-blue-700 font-bold text-sm mb-3">Новый преподаватель</p>
						{addErr && (
							<div className="mb-3">
								<ErrorBox msg={addErr} />
							</div>
						)}
						<TeacherForm
							initial={{}}
							maxPos={teachers.length + 1}
							onSave={handleAdd}
							onCancel={() => {
								setAdding(false);
								setAddErr(null);
							}}
							busy={busy}
						/>
					</motion.div>
				)}
			</AnimatePresence>

			{loading && <div className="text-center text-blue-600 py-8">Загрузка...</div>}
			{error && <div className="text-center text-red-500 py-8">{error}</div>}

			<div className="flex flex-col gap-3">
				<AnimatePresence>
					{teachers.map((t) => (
						<TeacherCard
							// В этой модели `id` фактически = позиция и может "съезжать" после удаления.
							// Поэтому key должен быть стабильным по "идентичности" записи, а не по позиции.
							// Не включаем `t.id`, иначе при удалении соседние карточки будут перемонтироваться
							// и из-за initial-анимации может быть визуальный "рывок".
							key={`${section}:${t.name}:${t.role}:${t.img}:${t.desc}`}
							teacher={t}
							section={section}
							maxId={teachers.length}
							onChanged={reload}
						/>
					))}
				</AnimatePresence>
				{!loading && teachers.length === 0 && (
					<div className="text-center text-gray-400 py-12 text-sm">
						Список пуст. Добавьте первого преподавателя.
					</div>
				)}
			</div>
		</div>
	);
}
