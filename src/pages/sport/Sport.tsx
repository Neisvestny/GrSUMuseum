import { useNavigate } from 'react-router-dom';

const BUTTONS = [
	{ label: 'Зал славы', path: '/sport/hall-of-fame' },
	{ label: 'Студенческий спорт', path: '/sport/student-sport' },
	{ label: 'Тренеры', path: '/sport/trainers' },
	{ label: 'Фотогалерея', path: '' },
];

export default function History() {
	const navigate = useNavigate();

	return (
		<div className="w-screen h-screen bg-white flex flex-col">
			<main className="flex-1 flex flex-col items-center justify-center gap-8 px-16">
				<header className="text-center">
					<p className="text-gray-500 text-2xl font-bold">Спорт</p>
				</header>

				<div className="flex flex-col gap-5 w-full max-w-3xl">
					{BUTTONS.map((btn) => (
						<NavButton key={btn.label} btn={btn} navigate={navigate} />
					))}
				</div>

				<button
					onClick={() => navigate(-1)}
					className="
						px-8 py-3
						rounded-2xl border-2 border-blue-200
						bg-white hover:bg-blue-700 active:scale-95
						transition-all duration-200
						text-blue-700 hover:text-white font-semibold text-lg
						shadow-md hover:shadow-xl hover:border-blue-700
					"
				>
					← Назад
				</button>
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
			onClick={() => btn.path && navigate(btn.path)}
			className="
				w-full h-36
				rounded-2xl border-2 border-blue-200
				bg-white hover:bg-blue-700 active:scale-95
				transition-all duration-200
				flex items-center justify-center
				text-blue-700 hover:text-white font-semibold text-2xl text-center px-4
				shadow-md hover:shadow-xl hover:border-blue-700
			"
		>
			{btn.label}
		</button>
	);
}
