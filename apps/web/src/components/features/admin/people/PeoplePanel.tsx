import { AnimatePresence, motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	createPerson,
	deletePerson,
	fetchPeople,
	fetchTaxonomy,
	updatePerson,
	type PeopleListFilters,
	type Person,
	type PersonMutation,
	type TaxonomyBundle,
} from '../../../../api/people';
import AdminButton from '../ui/AdminButton';
import { useAdminToast } from '../ui/AdminToastContext';
import { adminInputClass } from '../ui/adminFormStyles';
import { ErrorBox } from '../ui/ErrorBox';
import PersonCard from './PersonCard';
import PersonForm from './PersonForm';
import { EMPTY_PERSON_FORM } from './constants';

const EMPTY_TAXONOMY: TaxonomyBundle = { roles: [], tags: [], categories: [] };

export default function PeoplePanel() {
	const toast = useAdminToast();
	const [people, setPeople] = useState<Person[]>([]);
	const [taxonomy, setTaxonomy] = useState<TaxonomyBundle>(EMPTY_TAXONOMY);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [adding, setAdding] = useState(false);
	const [busy, setBusy] = useState(false);
	const [addErr, setAddErr] = useState<string | null>(null);

	const [searchInput, setSearchInput] = useState('');
	const [debouncedQ, setDebouncedQ] = useState('');
	const [roleFilter, setRoleFilter] = useState('');
	const [tagFilter, setTagFilter] = useState('');
	const [categoryFilter, setCategoryFilter] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [highlightId, setHighlightId] = useState<number | null>(null);

	useEffect(() => {
		const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
		return () => window.clearTimeout(t);
	}, [searchInput]);

	const filters = useMemo<PeopleListFilters>(
		() => ({
			q: debouncedQ || undefined,
			role: roleFilter || undefined,
			tag: tagFilter || undefined,
			category: categoryFilter || undefined,
		}),
		[debouncedQ, roleFilter, tagFilter, categoryFilter],
	);

	const hasActiveFilters = Boolean(roleFilter || tagFilter || categoryFilter);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const [list, tax] = await Promise.all([fetchPeople(filters), fetchTaxonomy()]);
			setPeople(list);
			setTaxonomy(tax);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Не удалось загрузить людей';
			setError(msg);
			toast.error(msg);
		} finally {
			setLoading(false);
		}
	}, [filters, toast]);

	useEffect(() => {
		void load();
	}, [load]);

	const clearFilters = () => {
		setRoleFilter('');
		setTagFilter('');
		setCategoryFilter('');
	};

	const handleAdd = async (data: PersonMutation) => {
		setBusy(true);
		setAddErr(null);
		try {
			const created = await createPerson(data);
			setAdding(false);
			setHighlightId(created.id);
			toast.success('Человек добавлен');
			await load();
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Ошибка';
			setAddErr(msg);
			toast.error(msg);
		} finally {
			setBusy(false);
		}
	};

	const handleUpdate = async (id: number, data: PersonMutation) => {
		await updatePerson(id, data);
		await load();
	};

	const handleDelete = async (id: number) => {
		await deletePerson(id);
		if (highlightId === id) setHighlightId(null);
		await load();
	};

	return (
		<div className="flex flex-col gap-5 max-w-4xl">
			<div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-gradient-to-b from-white via-white/95 to-transparent">
				<div className="bg-white/90 backdrop-blur-md rounded-2xl border-2 border-blue-100 shadow-sm p-4 flex flex-col gap-3">
					<div className="flex gap-2 flex-wrap items-center">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
							<input
								className={`${adminInputClass} pl-9`}
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder="Поиск по ФИО, должности, описанию…"
							/>
							{searchInput && (
								<button
									type="button"
									onClick={() => setSearchInput('')}
									className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-700"
									aria-label="Очистить поиск"
								>
									<X className="w-4 h-4" />
								</button>
							)}
						</div>
						<button
							type="button"
							onClick={() => setShowFilters((v) => !v)}
							className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
								showFilters || hasActiveFilters
									? 'border-blue-700 bg-blue-700 text-white'
									: 'border-blue-200 text-blue-700 hover:bg-blue-50'
							}`}
						>
							<SlidersHorizontal className="w-4 h-4" />
							Фильтры
							{hasActiveFilters && (
								<span className="w-2 h-2 rounded-full bg-white/90" />
							)}
						</button>
						<AdminButton
							onClick={() => {
								setAdding((v) => !v);
								setAddErr(null);
							}}
							disabled={busy}
							variant="primary"
							size="md"
						>
							{adding ? '✕ Отмена' : '+ Добавить человека'}
						</AdminButton>
					</div>

					<AnimatePresence>
						{showFilters && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: 'auto', opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								className="overflow-hidden"
							>
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-blue-50">
									<label className="flex flex-col gap-1">
										<span className="text-xs font-semibold text-blue-700">Роль</span>
										<select
											className={adminInputClass}
											value={roleFilter}
											onChange={(e) => setRoleFilter(e.target.value)}
										>
											<option value="">Все роли</option>
											{taxonomy.roles.map((r) => (
												<option key={r.id} value={r.slug}>
													{r.label}
												</option>
											))}
										</select>
									</label>
									<label className="flex flex-col gap-1">
										<span className="text-xs font-semibold text-blue-700">Тег</span>
										<select
											className={adminInputClass}
											value={tagFilter}
											onChange={(e) => setTagFilter(e.target.value)}
										>
											<option value="">Все теги</option>
											{taxonomy.tags.map((t) => (
												<option key={t.id} value={t.slug}>
													{t.label}
												</option>
											))}
										</select>
									</label>
									<label className="flex flex-col gap-1">
										<span className="text-xs font-semibold text-blue-700">
											Категория
										</span>
										<select
											className={adminInputClass}
											value={categoryFilter}
											onChange={(e) => setCategoryFilter(e.target.value)}
										>
											<option value="">Все категории</option>
											{taxonomy.categories.map((c) => (
												<option key={c.id} value={c.slug}>
													{c.label}
												</option>
											))}
										</select>
									</label>
								</div>
								{hasActiveFilters && (
									<button
										type="button"
										onClick={clearFilters}
										className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-900"
									>
										Сбросить фильтры
									</button>
								)}
							</motion.div>
						)}
					</AnimatePresence>

					<p className="text-xs text-gray-400">
						{loading ? 'Загрузка…' : `Найдено: ${people.length}`}
						{debouncedQ ? ` · поиск «${debouncedQ}»` : ''}
					</p>
				</div>
			</div>

			<AnimatePresence>
				{adding && (
					<motion.div
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
					>
						<p className="text-blue-700 font-bold text-sm mb-3">Новый человек</p>
						{addErr && (
							<div className="mb-3">
								<ErrorBox msg={addErr} />
							</div>
						)}
						<PersonForm
							taxonomy={taxonomy}
							initial={EMPTY_PERSON_FORM}
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

			{error && <ErrorBox msg={error} />}

			{!loading && people.length === 0 && (
				<div className="text-center text-gray-400 py-16 rounded-2xl border-2 border-dashed border-blue-100">
					<p className="font-semibold text-blue-800">Никого не найдено</p>
					<p className="text-sm mt-1">Измените поиск или добавьте человека</p>
				</div>
			)}

			<div className="flex flex-col gap-3">
				{people.map((p) => (
					<PersonCard
						key={p.id}
						person={p}
						taxonomy={taxonomy}
						onUpdate={handleUpdate}
						onDelete={handleDelete}
						defaultExpanded={highlightId === p.id}
					/>
				))}
			</div>
		</div>
	);
}
