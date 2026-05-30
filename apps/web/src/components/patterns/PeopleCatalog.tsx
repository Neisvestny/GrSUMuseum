import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Person } from '../../api/people';
import { useCmsPreview } from '../cms/CmsPreviewContext';
import { ErrorState, LoadingState } from '../design-system/States';
import { usePeopleByRole } from '../../hooks/usePeople';
import { resolvePublicAssetUrl } from '../../lib/public-asset-url';

type Props = {
	role: string;
	searchPlaceholder?: string;
	emptyText?: string;
};

function PersonDetail({ person }: { person: Person }) {
	return (
		<motion.div
			key={person.id}
			initial={{ opacity: 0, x: 16 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -8 }}
			transition={{ duration: 0.25, ease: 'easeOut' }}
			className="h-full overflow-y-auto pr-2"
		>
			<div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-blue-100 shadow-sm p-6 md:p-8 flex flex-col gap-6 md:gap-8">
				<div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
					<div className="w-40 h-52 md:w-48 md:h-60 shrink-0 rounded-2xl overflow-hidden border-2 border-blue-100 bg-blue-50 shadow-inner">
						{person.img ? (
							<img
								src={resolvePublicAssetUrl(person.img)}
								alt={person.displayName}
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = 'none';
								}}
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-blue-200 text-6xl">
								👤
							</div>
						)}
					</div>
					<div className="flex flex-col gap-2 min-w-0">
						<h2 className="text-2xl md:text-3xl font-bold text-blue-800 leading-tight">
							{person.displayName}
						</h2>
						{person.yearsLabel && (
							<p className="text-blue-500 font-semibold text-lg">{person.yearsLabel}</p>
						)}
						{person.subtitle && (
							<p className="text-blue-400 text-base font-medium">{person.subtitle}</p>
						)}
						{person.shortDescription && (
							<p className="text-gray-600 italic text-base leading-relaxed mt-2">
								{person.shortDescription}
							</p>
						)}
					</div>
				</div>

				{person.fullDescription && (
					<div className="border-t border-blue-100 pt-6">
						<h3 className="text-xl font-bold text-blue-700 mb-3">Биография и достижения</h3>
						<div className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
							{person.fullDescription}
						</div>
					</div>
				)}

				{person.images.length > 0 && (
					<div className="border-t border-blue-100 pt-6">
						<h3 className="text-xl font-bold text-blue-700 mb-4">Фотогалерея</h3>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{person.images.map((url, i) => (
								<div
									key={i}
									className="rounded-xl overflow-hidden border-2 border-blue-100 aspect-video bg-blue-50"
								>
									<img
										src={resolvePublicAssetUrl(url)}
										alt={`Фото ${i + 1}`}
										className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
									/>
								</div>
							))}
						</div>
					</div>
				)}

				{person.files.length > 0 && (
					<div className="border-t border-blue-100 pt-6">
						<h3 className="text-xl font-bold text-blue-700 mb-4">Документы и материалы</h3>
						<div className="flex flex-col gap-3">
							{person.files.map((file, i) => (
								<a
									key={i}
									href={file.src}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-3 bg-blue-50/80 p-4 rounded-xl border-2 border-blue-100 hover:border-blue-400 hover:shadow-md transition-all"
								>
									<span className="text-2xl">📄</span>
									<span className="font-semibold text-blue-700">
										{file.title || file.src}
									</span>
									<span className="ml-auto text-blue-400 text-sm">↗</span>
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}

export default function PeopleCatalog({
	role,
	searchPlaceholder = 'Поиск по ФИО…',
	emptyText = 'Записи не найдены',
}: Props) {
	const embedded = useCmsPreview();
	const { people, loading, error } = usePeopleByRole(role);
	const [query, setQuery] = useState('');
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return people;
		return people.filter((p) => {
			const fio = [p.displayName, p.lastName, p.firstName, p.patronymic]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			return fio.includes(q);
		});
	}, [people, query]);

	const activeId = useMemo(() => {
		if (filtered.some((p) => p.id === selectedId)) return selectedId;
		return filtered[0]?.id ?? null;
	}, [filtered, selectedId]);

	const current = filtered.find((p) => p.id === activeId) ?? null;
	const isEmpty = !loading && !error && people.length === 0;

	if (loading) return <LoadingState />;
	if (error) return <ErrorState text={error} />;

	const rootClass = embedded
		? 'flex rounded-xl border-2 border-blue-100 bg-white overflow-hidden h-[28rem]'
		: '-mx-8 -mt-5 flex border-t border-blue-100 bg-white/40 backdrop-blur-sm';

	const rootStyle = embedded ? undefined : { minHeight: 'calc(100vh - 5.5rem)' };

	return (
		<div className={rootClass} style={rootStyle}>
			<aside
				className={`${embedded ? 'w-56' : 'w-72'} shrink-0 flex flex-col border-r border-blue-100 bg-white/70 backdrop-blur-md`}
			>
				<div className="p-3 md:p-4 shrink-0">
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={searchPlaceholder}
						disabled={isEmpty}
						className="w-full rounded-xl border-2 border-blue-200 bg-white px-3 py-2.5 text-sm text-blue-900 placeholder:text-blue-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
					/>
				</div>
				<div className="mx-3 md:mx-4 border-t border-blue-100 shrink-0" />
				<nav className="flex-1 overflow-y-auto p-2 md:p-3 flex flex-col gap-1 min-h-0">
					{isEmpty ? (
						<p className="text-sm text-gray-500 text-center py-8 px-2 leading-relaxed">
							{emptyText}
						</p>
					) : filtered.length === 0 ? (
						<p className="text-sm text-gray-400 text-center py-8 px-2">Ничего не найдено</p>
					) : (
						filtered.map((person) => {
							const isActive = person.id === activeId;
							return (
								<button
									key={person.id}
									type="button"
									onClick={() => setSelectedId(person.id)}
									className={`text-left px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
										isActive
											? 'bg-blue-700 text-white shadow-md'
											: 'text-blue-800 hover:bg-blue-50 hover:text-blue-900'
									}`}
								>
									<div className="font-semibold text-sm leading-snug">
										{person.displayName}
									</div>
									{person.yearsLabel && (
										<div
											className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}
										>
											{person.yearsLabel}
										</div>
									)}
								</button>
							);
						})
					)}
				</nav>
			</aside>

			<div className="flex-1 min-w-0 p-4 md:p-6 overflow-hidden">
				<AnimatePresence mode="wait">
					{current ? (
						<PersonDetail person={current} />
					) : (
						<motion.div
							key="placeholder"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="h-full flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-100 bg-blue-50/30 px-6 text-center"
						>
							<p className="text-gray-500 text-sm md:text-base leading-relaxed">
								{isEmpty ? emptyText : 'Выберите человека из списка слева'}
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
