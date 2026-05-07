import { useState } from 'react';
import type { Teacher, TeacherMutation } from '../../../../api/teachers';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import { ErrorBox } from '../ui/ErrorBox';
import ImagePathInput from '../ui/ImagePathInput';

type Props = {
	initial: Partial<Teacher> & { id?: number; position?: number };
	maxPos: number;
	onSave: (data: TeacherMutation) => Promise<void>;
	onCancel: () => void;
	busy: boolean;
};

export default function TeacherForm({ initial, maxPos, onSave, onCancel, busy }: Props) {
	const [form, setForm] = useState({
		position: String(initial.position ?? initial.id ?? ''),
		name: initial.name ?? '',
		role: initial.role ?? '',
		desc: initial.desc ?? '',
		img: initial.img ?? '',
	});
	const [saving, setSaving] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const set =
		(k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm((f) => ({ ...f, [k]: e.target.value }));

	const handleSave = async () => {
		setSaving(true);
		setErr(null);
		try {
			await onSave({
				name: form.name,
				role: form.role,
				desc: form.desc,
				img: form.img,
				position: form.position !== '' ? Number(form.position) : undefined,
			});
		} catch (error) {
			setErr(error instanceof Error ? error.message : 'Ошибка сохранения');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			{err && <ErrorBox msg={err} />}
			<label>
				<span className={adminLabelClass}>Позиция (1–{maxPos})</span>
				<input
					className={adminInputClass}
					value={form.position}
					onChange={set('position')}
					type="number"
					min={1}
					max={maxPos}
					placeholder="авто"
				/>
			</label>
			<label>
				<span className={adminLabelClass}>Имя</span>
				<input
					className={adminInputClass}
					value={form.name}
					onChange={set('name')}
					placeholder="Иванов Иван Иванович"
				/>
			</label>
			<label>
				<span className={adminLabelClass}>Должность</span>
				<input
					className={adminInputClass}
					value={form.role}
					onChange={set('role')}
					placeholder="Профессор кафедры математики"
				/>
			</label>
			<label>
				<span className={adminLabelClass}>Описание</span>
				<textarea
					className={adminInputClass + ' resize-none h-20'}
					value={form.desc}
					onChange={set('desc')}
					placeholder="Краткая биография..."
				/>
			</label>
			<ImagePathInput
				label="Фото"
				value={form.img}
				onChange={(next) => setForm((f) => ({ ...f, img: next }))}
				placeholder="например: teachers/teacher.jpg"
			/>
			<div className="flex gap-2 mt-1">
				<button
					onClick={handleSave}
					disabled={saving || busy}
					className="flex-1 py-2 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-40"
				>
					{saving ? 'Сохранение...' : 'Сохранить'}
				</button>
				<button
					onClick={onCancel}
					disabled={saving || busy}
					className="flex-1 py-2 rounded-xl border-2 border-blue-200 text-blue-700 font-semibold text-sm hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-40"
				>
					Отмена
				</button>
			</div>
		</div>
	);
}
