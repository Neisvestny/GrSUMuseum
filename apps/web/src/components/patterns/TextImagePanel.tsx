import { motion } from 'framer-motion';
import { SurfaceCard } from '../design-system/Card';

type Props = {
	title: string;
	text: string;
	imageSrc: string;
	imageAlt: string;
};

export default function TextImagePanel({ title, text, imageSrc, imageAlt }: Props) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25, ease: 'easeOut' }}
		>
			<SurfaceCard className="h-full flex flex-col md:flex-row gap-4 md:gap-8 p-4 md:p-8">
				<div className="flex-1 flex flex-col justify-center min-w-0">
					<h2 className="text-blue-700 font-bold text-2xl mb-4">{title}</h2>
					<p className="text-gray-600 text-lg leading-relaxed">{text}</p>
				</div>
				<div className="w-full md:w-80 lg:w-96 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100">
					<img src={imageSrc} alt={imageAlt} className="w-full h-full object-cover" />
				</div>
			</SurfaceCard>
		</motion.div>
	);
}
