import { motion } from 'framer-motion';
import MainLayout from '../../layouts/MainLayout';

export default function StudentSport() {
	return (
		<MainLayout title="Студенческий спорт">
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25, ease: 'easeOut' }}
				className="h-full flex gap-8 bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-8 shadow-sm"
			>
				<div className="flex-1 flex flex-col justify-center">
					<h2 className="text-blue-700 font-bold text-2xl mb-4">Студенческий спорт в ГрГУ</h2>
					<p className="text-gray-600 text-lg leading-relaxed">
						Здесь будет размещена типовая информация о спортивных секциях, соревнованиях,
						университетских командах и достижениях студентов.
					</p>
				</div>

				<div className="w-96 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100">
					<img
						src="/images/teachers-institute.jpg"
						alt="Студенческий спорт"
						className="w-full h-full object-cover"
					/>
				</div>
			</motion.div>
		</MainLayout>
	);
}
