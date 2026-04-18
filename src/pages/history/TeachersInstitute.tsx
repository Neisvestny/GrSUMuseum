import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';

const TABS = [
	{
		id: '-gumnasium',
		label: 'Гродненская мариинская гимназия',
		text: 'Здесь будет текст про ??? гимназию.',
		img: '/images/teachers-institute.jpg',
	},
	{
		id: 'teachers-institute',
		label: 'Гродненский учительский институт',
		text: 'Здесь будет текст про Гродненский учительский институт.',
		img: '/images/teachers-institute.jpg',
	},
	{
		id: 'pedagogical-institute',
		label: 'Гродненский государственный педагогический институт',
		text: 'Здесь будет текст про Гродненский государственный педагогический институт.',
		img: '/images/pedagogical-institute.jpg',
	},
	{
		id: 'university',
		label: 'Гродненский государственный университет имени Янки Купалы',
		text: 'Здесь будет текст про ГрГУ имени Янки Купалы.',
		img: '/images/university.jpg',
	},
];

export default function HistoryDevelopment() {
	const [activeTab, setActiveTab] = useState(TABS[0].id);

	const current = TABS.find((t) => t.id === activeTab)!;

	return (
		<MainLayout title="История развития ГрГУ">
			<div className="relative z-10 flex items-center gap-3 mb-6">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`
							flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm text-center
							transition-all duration-200 active:scale-95
							${
								activeTab === tab.id
									? 'bg-blue-700 border-blue-700 text-white shadow-lg'
									: 'bg-white/80 border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-white'
							}
						`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -16 }}
					transition={{ duration: 0.25, ease: 'easeOut' }}
					className="h-full flex gap-8 bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-8 shadow-sm"
				>
					{/* ТЕКСТ */}
					<div className="flex-1 flex flex-col justify-center">
						<h2 className="text-blue-700 font-bold text-2xl mb-4">{current.label}</h2>
						<p className="text-gray-600 text-lg leading-relaxed">{current.text}</p>
					</div>

					{/* ФОТО */}
					<div className="w-96 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100">
						<img
							src={current.img}
							alt={current.label}
							className="w-full h-full object-cover"
						/>
					</div>
				</motion.div>
			</AnimatePresence>
		</MainLayout>
	);
}
