import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ComponentProps } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { TeacherMutation, TeacherSection } from '../../../../api/teachers';
import { reorderTeachers } from '../../../../api/teachers';
import { useTeachers } from '../../../../hooks/useTeachers';
import AdminButton from '../ui/AdminButton';
import { useAdminToast } from '../ui/AdminToastContext';
import { ErrorBox } from '../ui/ErrorBox';
import TeacherCard from './TeacherCard';
import TeacherForm from './TeacherForm';

type Props = { section: TeacherSection };

export default function TeachersPanel({ section }: Props) {
	const toast = useAdminToast();
	const { teachers, loading, error, add, reset, reload } = useTeachers(section);
	const [items, setItems] = useState(teachers);
	const [adding, setAdding] = useState(false);
	const [confirmReset, setConfirmReset] = useState(false);
	const [busy, setBusy] = useState(false);
	const [addErr, setAddErr] = useState<string | null>(null);

	useEffect(() => {
		setItems(teachers);
	}, [teachers]);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

	const handleAdd = async (data: TeacherMutation) => {
		setBusy(true);
		setAddErr(null);
		try {
			await add(data);
			setAdding(false);
			toast.success('Преподаватель добавлен');
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Ошибка';
			setAddErr(msg);
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	};

	const handleReset = async () => {
		setBusy(true);
		try {
			await reset();
			setConfirmReset(false);
			toast.success('Список сброшен к исходным данным');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Не удалось сбросить список');
		} finally {
			setBusy(false);
		}
	};

	useEffect(() => {
		if (error) toast.error(error);
	}, [error, toast]);

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
						add({})
							.then(() => toast.success('Добавлен пустой преподаватель'))
							.catch((err) =>
								toast.error(err instanceof Error ? err.message : 'Не удалось добавить'),
							)
							.finally(() => setBusy(false));
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
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={(evt) => {
							const activeId = evt.active.id as number;
							const overId = evt.over?.id as number | undefined;
							if (!overId || activeId === overId) return;
							const oldIndex = items.findIndex((t) => t.id === activeId);
							const newIndex = items.findIndex((t) => t.id === overId);
							if (oldIndex < 0 || newIndex < 0) return;
							const next = arrayMove(items, oldIndex, newIndex);
							setItems(next);
							void reorderTeachers(section, next.map((t) => t.id))
								.then(() => reload())
								.catch((e) =>
									toast.error(
										e instanceof Error ? e.message : 'Не удалось сохранить порядок',
									),
								);
						}}
					>
						<SortableContext
							items={items.map((t) => t.id)}
							strategy={verticalListSortingStrategy}
						>
							{items.map((t) => (
								<SortableTeacherCard
									key={t.id}
									teacher={t}
									section={section}
									maxId={teachers.length}
									onChanged={reload}
								/>
							))}
						</SortableContext>
					</DndContext>
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

function SortableTeacherCard(props: ComponentProps<typeof TeacherCard>) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: props.teacher.id,
	});
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};
	return (
		<div ref={setNodeRef} style={style} className={isDragging ? 'opacity-70' : ''}>
			<TeacherCard
				{...props}
				dragHandle={
					<button
						type="button"
						className="p-2 rounded-xl border-2 border-blue-100 text-blue-500 hover:bg-blue-50 active:scale-95 transition-all touch-none"
						{...attributes}
						{...listeners}
						aria-label="Перетащить"
					>
						<GripVertical className="w-4 h-4" />
					</button>
				}
			/>
		</div>
	);
}
