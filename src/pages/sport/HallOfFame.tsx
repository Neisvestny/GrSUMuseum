import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { TeacherSection } from '../../api/teachers';
import TabsBar from '../../components/design-system/TabsBar';
import EntityListDetail from '../../components/patterns/EntityListDetail';
import TextImagePanel from '../../components/patterns/TextImagePanel';
import { useTeachers } from '../../hooks/useTeachers';
import MainLayout from '../../layouts/MainLayout';

type HallOfFameTabId = 'coaches' | 'students' | 'about';

const TABS: Array<{ id: HallOfFameTabId; label: string }> = [
	{ id: 'coaches', label: 'Тренера Олимпийцы' },
	{ id: 'students', label: 'Студенты Олимпийцы' },
	{ id: 'about', label: 'Олимпийские игры и ГрГУ' },
];

function TeachersTab({ section }: { section: TeacherSection }) {
	const { teachers, loading, error } = useTeachers(section);
	return (
		<EntityListDetail
			items={teachers}
			loading={loading}
			error={error}
			emptyText="Данные пока не добавлены"
		/>
	);
}

function AboutTab() {
	return (
		<TextImagePanel
			title="Олимпийские игры и ГрГУ"
			text="Здесь будет текст про участие спортсменов ГрГУ в Олимпийских играх, вклад университета в развитие олимпийского движения и достижения тренеров и студентов."
			imageSrc="/images/teachers-institute.jpg"
			imageAlt="Олимпийские игры и ГрГУ"
		/>
	);
}

export default function HallOfFame() {
	const [activeTab, setActiveTab] = useState<HallOfFameTabId>(TABS[0].id);

	return (
		<MainLayout title="Зал славы">
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
					{activeTab === 'coaches' && <TeachersTab section="olympcoch" />}
					{activeTab === 'students' && <TeachersTab section="olympstud" />}
					{activeTab === 'about' && <AboutTab />}
				</motion.div>
			</AnimatePresence>
		</MainLayout>
	);
}
