import { motion } from 'framer-motion';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Person } from '../../api/people';
import { EmptyState, ErrorState, LoadingState } from '../../components/design-system/States';
import { usePeopleByRole } from '../../hooks/usePeople';
import { PEOPLE_ROLES } from '../../lib/people-roles';
import { resolvePublicAssetUrl } from '../../lib/public-asset-url';
import MainLayout from '../../layouts/MainLayout';

const cardClassName =
	'bg-white/80 backdrop-blur-sm border-2 border-blue-200 rounded-2xl shadow-md hover:shadow-xl hover:border-blue-500 hover:bg-white active:scale-95 transition-all duration-200 text-left';

function RectorTimelineCard({
	person,
	onClick,
	className = '',
	compact = false,
}: {
	person: Person;
	onClick: () => void;
	className?: string;
	compact?: boolean;
}) {
	return (
		<button
			onClick={onClick}
			className={`${cardClassName} flex items-center ${compact ? 'gap-4 p-4' : 'gap-6 p-7'} ${className}`}
		>
			<div
				className={`${compact ? 'w-20 h-20' : 'w-32 h-32'} shrink-0 rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50`}
			>
				{person.img ? (
					<img
						src={resolvePublicAssetUrl(person.img)}
						alt={person.displayName}
						className="w-full h-full object-cover"
						onError={(e) => {
							(e.target as HTMLImageElement).style.display = 'none';
						}}
					/>
				) : null}
			</div>
			<div className="flex flex-col gap-1 min-w-0">
				<span
					className={`text-blue-700 font-bold leading-tight ${compact ? 'text-lg' : 'text-xl'}`}
				>
					{person.displayName}
				</span>
				<span className={`text-blue-400 font-semibold ${compact ? 'text-sm' : 'text-base'}`}>
					{person.yearsLabel}
				</span>
				{person.shortDescription ? (
					<span
						className={`text-gray-500 leading-relaxed ${compact ? 'text-sm line-clamp-3' : 'text-base'}`}
					>
						{person.shortDescription}
					</span>
				) : null}
			</div>
		</button>
	);
}

function TimelineDot({ className = '' }: { className?: string }) {
	return (
		<div
			className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-700 border-4 border-white shadow-md shrink-0 ${className}`}
		/>
	);
}

export default function Rectors() {
	const { people, loading, error } = usePeopleByRole(PEOPLE_ROLES.rector);
	const navigate = useNavigate();
	const scrollRef = useRef<HTMLDivElement>(null);
	const [atBottom, setAtBottom] = useState(false);

	const openRector = (id: number) => navigate(`/history/rectors/${id}`);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		const updateAtBottom = () => {
			const { scrollTop, scrollHeight, clientHeight } = el;
			const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
			setAtBottom(distanceFromBottom < 40);
		};

		updateAtBottom();

		el.addEventListener('scroll', updateAtBottom, { passive: true });
		window.addEventListener('resize', updateAtBottom);

		const resizeObserver = new ResizeObserver(updateAtBottom);
		resizeObserver.observe(el);

		return () => {
			el.removeEventListener('scroll', updateAtBottom);
			window.removeEventListener('resize', updateAtBottom);
			resizeObserver.disconnect();
		};
	}, [people.length]);

	if (loading) {
		return (
			<MainLayout title="Ректоры ГрГУ">
				<LoadingState />
			</MainLayout>
		);
	}

	if (error) {
		return (
			<MainLayout title="Ректоры ГрГУ">
				<ErrorState text={error} />
			</MainLayout>
		);
	}

	if (people.length === 0) {
		return (
			<MainLayout title="Ректоры ГрГУ">
				<EmptyState text="Ректоры не добавлены" />
			</MainLayout>
		);
	}

	return (
		<MainLayout title="Ректоры ГрГУ" scrollRef={scrollRef}>
			{/* Mobile: grid row per rector — dot and card share row height; line in rail column */}
			<div className="mx-auto max-w-6xl px-3 pb-6 md:hidden">
				<div className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-8">
					<div
						aria-hidden
						className="pointer-events-none absolute bottom-6 left-0 top-0 w-10"
					>
						<div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-blue-200" />
					</div>

					{people.map((person) => (
						<Fragment key={person.id}>
							<div className="relative z-10 flex justify-center self-start pt-8">
								<TimelineDot />
							</div>
							<motion.div
								className="min-w-0 self-start"
								initial={{ opacity: 0, x: 30 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true, margin: '-40px' }}
								transition={{ duration: 0.4, ease: 'easeOut' }}
							>
								<RectorTimelineCard
									person={person}
									onClick={() => openRector(person.id)}
									className="w-full"
									compact
								/>
							</motion.div>
						</Fragment>
					))}

					<div className="relative z-10 flex justify-center self-start">
						<div className="h-4 w-4 rounded-full border-4 border-white bg-blue-300 shadow-md" />
					</div>
					<div aria-hidden className="min-h-0" />
				</div>
			</div>

			{/* Desktop: alternating cards around center line */}
			<div className="relative max-w-6xl mx-auto hidden md:block">
				<div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-blue-200" />

				<div className="flex flex-col gap-16">
					{people.map((person, i) => {
						const isLeft = i % 2 === 0;
						return (
							<motion.div
								key={person.id}
								initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true, margin: '-60px' }}
								transition={{ duration: 0.4, ease: 'easeOut' }}
								className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
							>
								<RectorTimelineCard
									person={person}
									onClick={() => openRector(person.id)}
									className="w-[calc(50%-2.5rem)]"
								/>
								<TimelineDot className="absolute left-1/2 -translate-x-1/2" />
								<div className="w-[calc(50%-2.5rem)]" />
							</motion.div>
						);
					})}
				</div>

				<div className="relative flex justify-center mt-6">
					<div className="w-5 h-5 rounded-full bg-blue-300 border-4 border-white shadow-md" />
				</div>
			</div>

			{!atBottom && (
				<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
					<motion.div
						animate={{ y: [0, 8, 0] }}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
						className="flex flex-col items-center gap-2"
					>
						<span className="text-blue-400 text-sm font-medium">листайте</span>
						<div className="w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center">
							<motion.div
								animate={{ y: [0, 12, 0] }}
								transition={{
									duration: 1.5,
									repeat: Infinity,
									ease: 'easeInOut',
								}}
								className="w-1.5 h-3 bg-blue-400 rounded-full mt-1.5"
							/>
						</div>
					</motion.div>
				</div>
			)}
		</MainLayout>
	);
}
