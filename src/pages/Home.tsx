import { useNavigate } from 'react-router-dom';
import { AnimatedBlobsBackground } from '../components/ui/AnimatedBlobsBackground';
import { BLOB_PRESETS } from '../components/ui/animatedBlobsPresets';
import { useMenuSection } from '../hooks/cms/useMenuSection';

const BLOBS = BLOB_PRESETS.home;

export default function Home() {
	const navigate = useNavigate();
	const { items } = useMenuSection('home');
	const buttons = items.map((item) => ({ label: item.label, path: item.path }));

	return (
		<div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
			{/* ФОН */}
			<AnimatedBlobsBackground blobs={BLOBS} className="absolute inset-0 z-1" />

			<main className="flex-1 flex flex-col items-center justify-center gap-8">
				<header className="text-center">
					<p className="text-gray-500 text-2xl font-bold">
						Выберите раздел для ознакомления
					</p>
				</header>

				<div className="z-2 flex flex-wrap justify-center gap-6 max-w-[calc(4*320px+3*24px)]">
					{buttons.map((btn) => (
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
			onClick={() => {
				const target = btn.path.startsWith('/') ? btn.path : `/${btn.path}`;
				navigate(target);
			}}
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
