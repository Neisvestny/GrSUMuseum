import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTeachers } from '../../hooks/useTeachers';
import MainLayout from '../../layouts/MainLayout';

type TrainersTabId = 'trainers' | 'about';

const TABS: Array<{ id: TrainersTabId; label: string }> = [
	{ id: 'trainers', label: 'Тренеры ГрГУ' },
	{ id: 'about', label: 'Информация о тренерах' },
];

function TrainersDbTab() {
	const { teachers, loading, error } = useTeachers('trainer');
	const [active, setActive] = useState<number | null>(null);
	const current = teachers.find((t) => t.id === (active ?? teachers[0]?.id));

	if (loading) {
		return (
			<div className="flex-1 flex items-center justify-center text-blue-600">
				<div className="text-lg font-medium">Загрузка...</div>
			</div>
		);
	}

	if (error) {
		return <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>;
	}

	if (!teachers.length) {
		return (
			<div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
				Тренеры пока не добавлены
			</div>
		);
	}

	return (
		<div className="flex gap-6" style={{ height: 'calc(100vh - 220px)' }}>
			<div className="flex flex-col gap-3 w-64 shrink-0 overflow-y-auto pr-1">
				{teachers.map((t) => {
					const isActive = t.id === (active ?? teachers[0]?.id);
					return (
						<button
							key={t.id}
							onClick={() => setActive(t.id)}
							className={`
                text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 active:scale-95 shrink-0
                ${
									isActive
										? 'bg-blue-700 border-blue-700 text-white shadow-lg'
										: 'bg-white/80 border-blue-200 text-blue-800 hover:border-blue-400 hover:bg-white'
								}
              `}
						>
							<div className="font-semibold text-sm">{t.name}</div>
							<div className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
								{t.role}
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
							className="h-full flex gap-8 bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-8 shadow-sm"
						>
							<div className="w-56 h-64 shrink-0 self-start rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
								<img
									src={current.img}
									alt={current.name}
									className="w-full h-full object-cover"
									onError={(e) => {
										(e.target as HTMLImageElement).src =
											'https://placehold.co/224x256/dbeafe/1e40af?text=Фото';
									}}
								/>
							</div>
							<div className="flex flex-col overflow-y-auto">
								<h2 className="text-blue-700 font-bold text-2xl mb-1">{current.name}</h2>
								<p className="text-blue-500 font-medium text-sm mb-4">{current.role}</p>
								<p className="text-gray-600 text-lg leading-relaxed">{current.desc}</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

function AboutTrainersTab() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -16 }}
			transition={{ duration: 0.25, ease: 'easeOut' }}
			className="h-full flex gap-8 bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-8 shadow-sm"
		>
			<div className="flex-1 flex flex-col justify-center">
				<h2 className="text-blue-700 font-bold text-2xl mb-4">Тренеры и развитие спорта в ГрГУ</h2>
				<p className="text-gray-600 text-lg leading-relaxed">
					Здесь будет размещена информация о тренерском составе, спортивных школах и
					основных направлениях подготовки в университете.
				</p>
			</div>
			<div className="w-96 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100">
				<img src="/images/teachers-institute.jpg" alt="Тренеры ГрГУ" className="w-full h-full object-cover" />
			</div>
		</motion.div>
	);
}

export default function Trainers() {
	const [activeTab, setActiveTab] = useState<TrainersTabId>(TABS[0].id);

	return (
		<MainLayout title="Тренеры">
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
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -12 }}
					transition={{ duration: 0.2 }}
					className="flex-1 flex flex-col min-h-0"
				>
					{activeTab === 'trainers' ? <TrainersDbTab /> : <AboutTrainersTab />}
				</motion.div>
			</AnimatePresence>
		</MainLayout>
	);
}
