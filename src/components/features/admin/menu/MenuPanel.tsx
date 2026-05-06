import { useEffect, useMemo, useState } from 'react';
import {
	createMenuItem,
	deleteMenuItem,
	fetchAllMenuItems,
	updateMenuItem,
	type MenuItem,
} from '../../../../api/menu';
import { ApiError } from '../../../../shared/api/client';
import AdminButton from '../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../ui/adminFormStyles';
import { useAdminToast } from '../ui/AdminToastContext';
import { ErrorBox } from '../ui/ErrorBox';

export default function MenuPanel() {
	const toast = useAdminToast();
	const [items, setItems] = useState<MenuItem[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [section, setSection] = useState('home');
	const [label, setLabel] = useState('');
	const [path, setPath] = useState('');

	const load = async () => {
		try {
			setError(null);
			setItems(await fetchAllMenuItems());
		} catch (error) {
			const msg = error instanceof ApiError ? error.message : 'Не удалось загрузить меню';
			setError(msg);
			toast.error(msg);
		}
	};

	useEffect(() => {
		void load();
	}, []);

	const grouped = useMemo(
		() =>
			Array.from(new Set(items.map((i) => i.section)))
				.sort((a, b) => a.localeCompare(b))
				.map((key) => ({
					section: key,
					items: items.filter((i) => i.section === key),
				})),
		[items],
	);

	const sectionHints = useMemo(() => {
		const defaultHints = ['home', 'history', 'sport', 'studentlife'];
		return Array.from(new Set([...defaultHints, ...items.map((i) => i.section)])).sort((a, b) =>
			a.localeCompare(b),
		);
	}, [items]);

	const add = async () => {
		const normalizedSection = section.trim();
		if (!normalizedSection) {
			const msg = 'Укажите секцию (slug), например: science';
			setError(msg);
			toast.error(msg);
			return;
		}
		try {
			await createMenuItem({ section: normalizedSection, label, path, is_active: true });
			setLabel('');
			setPath('');
			setSection(normalizedSection);
			await load();
			toast.success('Пункт меню добавлен');
		} catch (error) {
			const msg = error instanceof ApiError ? error.message : 'Не удалось создать пункт меню';
			setError(msg);
			toast.error(msg);
		}
	};

	const save = async (id: number, data: Partial<MenuItem>) => {
		try {
			await updateMenuItem(id, data);
			await load();
			toast.success('Сохранено');
		} catch (error) {
			const msg = error instanceof ApiError ? error.message : 'Не удалось сохранить пункт меню';
			setError(msg);
			toast.error(msg);
		}
	};

	const remove = async (id: number) => {
		try {
			await deleteMenuItem(id);
			await load();
			toast.success('Пункт удалён');
		} catch (error) {
			const msg = error instanceof ApiError ? error.message : 'Не удалось удалить пункт меню';
			setError(msg);
			toast.error(msg);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{error && <ErrorBox msg={error} />}
			<div className="bg-white border-2 border-blue-100 rounded-2xl p-4">
				<h3 className="text-blue-800 font-bold mb-2">Добавить пункт меню</h3>
				<div className="grid grid-cols-[140px_1fr_1fr_auto] gap-2 items-end">
					<label>
						<span className={adminLabelClass}>Секция (slug)</span>
						<input
							className={adminInputClass}
							list="menu-section-hints"
							value={section}
							onChange={(e) => setSection(e.target.value)}
							placeholder="например: science"
						/>
						<datalist id="menu-section-hints">
							{sectionHints.map((key) => (
								<option key={key} value={key} />
							))}
						</datalist>
					</label>
					<label>
						<span className={adminLabelClass}>Название</span>
						<input
							className={adminInputClass}
							value={label}
							onChange={(e) => setLabel(e.target.value)}
						/>
					</label>
					<label>
						<span className={adminLabelClass}>Путь</span>
						<input
							className={adminInputClass}
							value={path}
							onChange={(e) => setPath(e.target.value)}
						/>
					</label>
					<AdminButton onClick={() => void add()} variant="primary">
						Создать
					</AdminButton>
				</div>
			</div>

			{grouped.map((group) => (
				<div
					key={group.section}
					className="bg-white border-2 border-blue-100 rounded-2xl p-4"
				>
					<h4 className="text-blue-800 font-semibold mb-2">Секция: {group.section}</h4>
					<div className="flex flex-col gap-2">
						{group.items.map((item) => (
							<MenuItemRow
								key={item.id}
								item={item}
								onSave={save}
								onDelete={remove}
							/>
						))}
						{group.items.length === 0 && (
							<div className="text-sm text-gray-400">Пункты пока не добавлены</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

function MenuItemRow({
	item,
	onSave,
	onDelete,
}: {
	item: MenuItem;
	onSave: (id: number, data: Partial<MenuItem>) => void;
	onDelete: (id: number) => void;
}) {
	const [label, setLabel] = useState(item.label);
	const [path, setPath] = useState(item.path);
	const [position, setPosition] = useState(String(item.position));
	const [active, setActive] = useState(item.is_active);

	useEffect(() => {
		setLabel(item.label);
		setPath(item.path);
		setPosition(String(item.position));
		setActive(item.is_active);
	}, [item.is_active, item.label, item.path, item.position]);

	return (
		<div className="grid grid-cols-[1fr_1fr_100px_120px_auto_auto] gap-2 items-end border border-blue-100 rounded-xl p-2">
			<label>
				<span className={adminLabelClass}>Название</span>
				<input
					className={adminInputClass}
					value={label}
					onChange={(e) => setLabel(e.target.value)}
				/>
			</label>
			<label>
				<span className={adminLabelClass}>Путь</span>
				<input
					className={adminInputClass}
					value={path}
					onChange={(e) => setPath(e.target.value)}
				/>
			</label>
			<label>
				<span className={adminLabelClass}>Позиция</span>
				<input
					className={adminInputClass}
					type="number"
					min={1}
					value={position}
					onChange={(e) => setPosition(e.target.value)}
				/>
			</label>
			<label>
				<span className={adminLabelClass}>Видимость</span>
				<select
					className={adminInputClass}
					value={active ? '1' : '0'}
					onChange={(e) => setActive(e.target.value === '1')}
				>
					<option value="1">Активен</option>
					<option value="0">Скрыт</option>
				</select>
			</label>
			<AdminButton
				size="sm"
				onClick={() =>
					onSave(item.id, { label, path, position: Number(position), is_active: active })
				}
			>
				Сохранить
			</AdminButton>
			<AdminButton size="sm" variant="danger" onClick={() => onDelete(item.id)}>
				Удалить
			</AdminButton>
		</div>
	);
}
