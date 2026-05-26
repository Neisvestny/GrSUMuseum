import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Person, PersonMutation, TaxonomyBundle } from '../../../../api/people';
import { ConfirmDelete } from '../ui/ConfirmDelete';
import { useAdminToast } from '../ui/AdminToastContext';
import { ErrorBox } from '../ui/ErrorBox';
import PersonForm from './PersonForm';
import { personToForm } from './constants';

type Props = {
	person: Person;
	taxonomy: TaxonomyBundle;
	onUpdate: (id: number, data: PersonMutation) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
	defaultExpanded?: boolean;
};

function badgeClass(active: boolean) {
	return active
		? 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800'
		: 'px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600';
}

export default function PersonCard({
	person,
	taxonomy,
	onUpdate,
	onDelete,
	defaultExpanded = false,
}: Props) {
	const toast = useAdminToast();
	const [editing, setEditing] = useState(defaultExpanded);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		if (!defaultExpanded) {
			setEditing(false);
			setConfirmDelete(false);
			setErr(null);
		}
	}, [person.id, defaultExpanded]);

	const handleSave = async (data: PersonMutation) => {
		setBusy(true);
		try {
			await onUpdate(person.id, data);
			setEditing(false);
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
			await onDelete(person.id);
			toast.success('Удалено');
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Ошибка удаления';
			setErr(msg);
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	};

	const roleLabels = person.roleSlugs
		.map((s) => taxonomy.roles.find((r) => r.slug === s)?.label ?? s)
		.slice(0, 3);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden"
		>
			<div className="flex items-start gap-4 p-4">
				<div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
					{person.img ? (
						<img
							src={person.img}
							alt={person.displayName}
							className="w-full h-full object-cover"
							onError={(e) => {
								(e.target as HTMLImageElement).style.display = 'none';
							}}
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-blue-300 text-xl font-bold">
							{person.lastName.charAt(0) || '?'}
						</div>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-bold text-blue-900 truncate">{person.displayName}</h3>
					{person.subtitle && (
						<p className="text-sm text-blue-600 truncate">{person.subtitle}</p>
					)}
					<p className="text-xs text-gray-400 mt-0.5">{person.yearsLabel}</p>
					<div className="flex flex-wrap gap-1 mt-2">
						{roleLabels.map((l) => (
							<span key={l} className={badgeClass(true)}>
								{l}
							</span>
						))}
						{person.tagSlugs.slice(0, 2).map((s) => (
							<span key={s} className={badgeClass(false)}>
								{taxonomy.tags.find((t) => t.slug === s)?.label ?? s}
							</span>
						))}
					</div>
					{person.shortDescription && (
						<p className="text-sm text-gray-500 mt-2 line-clamp-2">{person.shortDescription}</p>
					)}
				</div>
				<div className="flex gap-2 shrink-0 items-start">
					<button
						type="button"
						onClick={() => {
							setEditing((v) => !v);
							setConfirmDelete(false);
							setErr(null);
						}}
						className="p-2 rounded-xl border-2 border-blue-100 text-blue-600 hover:bg-blue-50"
						aria-label="Редактировать"
					>
						<Pencil className="w-4 h-4" />
					</button>
					{!confirmDelete ? (
						<button
							type="button"
							onClick={() => setConfirmDelete(true)}
							className="p-2 rounded-xl border-2 border-red-100 text-red-500 hover:bg-red-50"
							aria-label="Удалить"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					) : (
						<ConfirmDelete
							onYes={() => void handleDelete()}
							onNo={() => setConfirmDelete(false)}
							busy={busy}
						/>
					)}
				</div>
			</div>

			{err && !editing && (
				<div className="px-4 pb-3">
					<ErrorBox msg={err} />
				</div>
			)}

			<AnimatePresence>
				{editing && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="border-t border-blue-100 bg-blue-50/50 p-4"
					>
						<PersonForm
							initial={personToForm(person)}
							taxonomy={taxonomy}
							onSave={handleSave}
							onCancel={() => setEditing(false)}
							busy={busy}
						/>
					</motion.div>
				)}
			</AnimatePresence>

		</motion.div>
	);
}
