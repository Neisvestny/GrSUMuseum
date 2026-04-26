import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BLOBS = [
	{ w: 300, h: 250, left: '5%', top: '10%', x: 80, y: 60, duration: 14 },
	{ w: 200, h: 200, left: '70%', top: '5%', x: -60, y: 80, duration: 18 },
	{ w: 350, h: 300, left: '60%', top: '60%', x: -80, y: -60, duration: 12 },
	{ w: 250, h: 200, left: '15%', top: '65%', x: 60, y: -80, duration: 16 },
	{ w: 180, h: 180, left: '40%', top: '30%', x: -50, y: 70, duration: 20 },
	{ w: 220, h: 280, left: '85%', top: '35%', x: -70, y: -50, duration: 15 },
	{ w: 160, h: 160, left: '30%', top: '80%', x: 90, y: -40, duration: 11 },
];

const BUTTONS = [
	{ label: 'История ГрГУ', path: '/history' },
	{ label: 'Спорт', path: '/sport' },
	{ label: 'Наука', path: '/science' },
	{ label: 'Студенческая жизнь', path: '/studentlife' },
	{ label: 'Фотогалерея', path: '/gallery' },
	{ label: 'Именные аудитории', path: '/named-rooms' },
	{ label: 'Видеогалерея', path: '/video-gallery' },
];

export default function Home() {
	const navigate = useNavigate();

	return (
		<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
			{/* ФОН */}
			<div className="absolute inset-0 z-1">
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
						animate={{
							x: [0, blob.x, 0],
							y: [0, blob.y, 0],
						}}
						transition={{
							duration: blob.duration,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
					/>
				))}
			</div>

			<main className="flex-1 flex flex-col items-center justify-center gap-8">
				<header className="text-center">
					<p className="text-gray-500 text-2xl font-bold">
						Выберите раздел для ознакомления
					</p>
				</header>

				<div className="z-2 flex flex-wrap justify-center gap-6 max-w-[calc(4*320px+3*24px)]">
					{BUTTONS.map((btn) => (
						<NavButton key={btn.path} btn={btn} navigate={navigate} />
					))}
				</div>
			</main>
		</div>
	);
}

function NavButton({
	btn,
	navigate,
}: {
	btn: { label: string; path: string };
	navigate: (path: string) => void;
}) {
	return (
		<button
			onClick={() => navigate(btn.path)}
			className="
				w-80 h-36
				rounded-2xl border-2 border-blue-200
				bg-white/80 backdrop-blur-sm hover:bg-blue-700 active:scale-95
				transition-all duration-200
				flex items-center justify-center
				text-blue-700 hover:text-white font-semibold text-lg text-center px-4
				shadow-md hover:shadow-xl hover:border-blue-700
			"
		>
			{btn.label}
		</button>
	);
}
