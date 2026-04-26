import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import TabsBar from '../../components/design-system/TabsBar';
import TextImagePanel from '../../components/patterns/TextImagePanel';
import MainLayout from '../../layouts/MainLayout';

const TABS = [
	{
		id: 'teachers-teams',
		label: 'Педагогические отряды',
		text: 'Здесь будет текст про педагогические отряды.',
		img: '/images/teachers-teams.jpg',
	},
	{
		id: 'production-teams',
		label: 'Производственные отряды',
		text: 'Здесь будет текст про производственные отряды.',
		img: '/images/production-teams.jpg',
	},
	{
		id: 'service-teams',
		label: 'Сервисные отряды',
		text: 'Здесь будет текст про сервисные отряды.',
		img: '/images/service-teams.jpg',
	},
	{
		id: 'construction-teams',
		label: 'Строительные отряды',
		text: 'Здесь будет текст про строительные отряды.',
		img: '/images/construction-teams.jpg',
	},
	{
		id: 'ecological-teams',
		label: 'Экологические отряды',
		text: 'Здесь будет текст про экологические отряды.',
		img: '/images/ecological-teams.jpg',
	},
	{
		id: 'agricultural-teams',
		label: 'Сельскохозяйственные отряды',
		text: 'Здесь будет текст про сельскохозяйственные отряды.',
		img: '/images/agricultural-teams.jpg',
	},
];

export default function StudentsWorkTeams() {
	const [activeTab, setActiveTab] = useState(TABS[0].id);

	const current = TABS.find((t) => t.id === activeTab)!;

	return (
		<MainLayout title="Студенческие отряды">
			<TabsBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -16 }}
					transition={{ duration: 0.25, ease: 'easeOut' }}
					className="h-full"
				>
					<TextImagePanel
						title={current.label}
						text={current.text}
						imageSrc={current.img}
						imageAlt={current.label}
					/>
				</motion.div>
			</AnimatePresence>
		</MainLayout>
	);
}
