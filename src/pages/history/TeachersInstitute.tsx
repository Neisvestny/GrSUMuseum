import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import TabsBar from '../../components/design-system/TabsBar';
import TextImagePanel from '../../components/patterns/TextImagePanel';
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
