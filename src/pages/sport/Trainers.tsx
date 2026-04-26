import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import TabsBar from '../../components/design-system/TabsBar';
import EntityListDetail from '../../components/patterns/EntityListDetail';
import TextImagePanel from '../../components/patterns/TextImagePanel';
import { useTeachers } from '../../hooks/useTeachers';
import MainLayout from '../../layouts/MainLayout';

type TrainersTabId = 'trainers' | 'about';

const TABS: Array<{ id: TrainersTabId; label: string }> = [
	{ id: 'trainers', label: 'Тренеры ГрГУ' },
	{ id: 'about', label: 'Информация о тренерах' },
];

function TrainersDbTab() {
	const { teachers, loading, error } = useTeachers('trainer');
	return (
		<EntityListDetail
			items={teachers}
			loading={loading}
			error={error}
			emptyText="Тренеры пока не добавлены"
		/>
	);
}

function AboutTrainersTab() {
	return (
		<TextImagePanel
			title="Тренеры и развитие спорта в ГрГУ"
			text="Здесь будет размещена информация о тренерском составе, спортивных школах и основных направлениях подготовки в университете."
			imageSrc="/images/teachers-institute.jpg"
			imageAlt="Тренеры ГрГУ"
		/>
	);
}

export default function Trainers() {
	const [activeTab, setActiveTab] = useState<TrainersTabId>(TABS[0].id);

	return (
		<MainLayout title="Тренеры">
			<TabsBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

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
