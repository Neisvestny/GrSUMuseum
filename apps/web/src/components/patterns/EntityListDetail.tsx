import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { SurfaceCard } from '../design-system/Card';
import { EmptyState, ErrorState, LoadingState } from '../design-system/States';

export type EntityItem = {
	id: number;
	name: string;
	role: string;
	desc: string;
	img: string;
};

type Props = {
	items: EntityItem[];
	loading: boolean;
	error: string | null;
	emptyText: string;
};

const PLACEHOLDER = 'https://placehold.co/224x256/dbeafe/1e40af?text=Фото';

export default function EntityListDetail({ items, loading, error, emptyText }: Props) {
	const [first] = items;
	const [active, setActive] = useState<number | null>(null);
	const current = items.find((t) => t.id === (active ?? first?.id));

	if (loading) return <LoadingState />;
	if (error) return <ErrorState text={error} />;
	if (!items.length) return <EmptyState text={emptyText} />;

	return (
		<div className="flex gap-6" style={{ height: 'calc(100vh - 220px)' }}>
			<div className="flex flex-col gap-3 w-64 shrink-0 overflow-y-auto pr-1">
				{items.map((item) => {
					const isActive = item.id === (active ?? first.id);
					return (
						<button
							key={item.id}
							onClick={() => setActive(item.id)}
							className={`text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 active:scale-95 shrink-0 ${
								isActive
									? 'bg-blue-700 border-blue-700 text-white shadow-lg'
									: 'bg-white/80 border-blue-200 text-blue-800 hover:border-blue-400 hover:bg-white'
							}`}
						>
							<div className="font-semibold text-sm">{item.name}</div>
							<div
								className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}
							>
								{item.role}
							</div>
						</button>
					);
				})}
			</div>

			<div className="flex-1 overflow-hidden">
				<AnimatePresence mode="wait">
					{current && (
						<motion.div
							key={current.id}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.25, ease: 'easeOut' }}
						>
							<SurfaceCard className="h-full flex gap-8 p-8">
								<div className="w-56 h-64 shrink-0 self-start rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
									<img
										src={current.img}
										alt={current.name}
										className="w-full h-full object-cover"
										onError={(e) => {
											(e.target as HTMLImageElement).src = PLACEHOLDER;
										}}
									/>
								</div>
								<div className="flex flex-col overflow-y-auto">
									<h2 className="text-blue-700 font-bold text-2xl mb-1">
										{current.name}
									</h2>
									<p className="text-blue-500 font-medium text-sm mb-4">
										{current.role}
									</p>
									<p className="text-gray-600 text-lg leading-relaxed">
										{current.desc}
									</p>
								</div>
							</SurfaceCard>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
