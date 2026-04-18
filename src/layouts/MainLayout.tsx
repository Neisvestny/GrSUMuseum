import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const BLOBS = [
	{ w: 300, h: 250, left: '5%', top: '10%', x: 80, y: 60, duration: 14 },
	{ w: 200, h: 200, left: '70%', top: '5%', x: -60, y: 80, duration: 18 },
	{ w: 350, h: 300, left: '60%', top: '60%', x: -80, y: -60, duration: 12 },
	{ w: 250, h: 200, left: '15%', top: '65%', x: 60, y: -80, duration: 16 },
	{ w: 180, h: 180, left: '40%', top: '30%', x: -50, y: 70, duration: 20 },
];

type PageTemplateProps = {
	title?: string;
	scrollRef?: React.RefObject<HTMLDivElement | null>;
	children: ReactNode;
};

export default function MainLayout({ title, scrollRef, children }: PageTemplateProps) {
	const navigate = useNavigate();

	return (
		<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col overflow-hidden">
			{/* ФОН */}
			<div className="absolute inset-0">
				{BLOBS.map((blob, i) => (
					<motion.div
						key={i}
						className="absolute rounded-full bg-blue-300/40"
						style={{
							width: blob.w,
							height: blob.h,
							left: blob.left,
							top: blob.top,
							filter: 'blur(60px)',
						}}
						animate={{ x: [0, blob.x, 0], y: [0, blob.y, 0] }}
						transition={{
							duration: blob.duration,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
					/>
				))}
			</div>

			{/* НАВБАР */}
			{title && (
				<nav className="relative z-10 flex items-center gap-4 px-8 py-4 bg-white/70 backdrop-blur-md border-b border-blue-100 shrink-0">
					<button
						onClick={() => {
							if (window.history.length > 1) {
								navigate(-1);
							} else {
								navigate('/');
							}
						}}
						className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-blue-200 bg-white/80 hover:bg-blue-700 hover:text-white hover:border-blue-700 text-blue-700 font-semibold transition-all duration-200 active:scale-95"
					>
						<svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
							<path
								d="M15 10H5M5 10l5-5M5 10l5 5"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
							/>
						</svg>
						Назад
					</button>
					<div className="h-6 w-px bg-blue-200" />
					<h1 className="text-blue-700 font-bold text-xl">{title}</h1>
				</nav>
			)}

			<main ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-8 pt-5 pb-10">
				{children}
			</main>
		</div>
	);
}
