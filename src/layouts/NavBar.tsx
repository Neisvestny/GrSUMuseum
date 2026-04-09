import { useNavigate } from "react-router-dom";

type PageTemplateProps = {
	title: string;
};

export default function NavBar({ title }: PageTemplateProps) {
	const navigate = useNavigate();

	return (
		<nav className="relative z-10 flex items-center gap-4 px-8 py-4 bg-white/70 backdrop-blur-md border-b border-blue-100 shrink-0">
			<button
				onClick={() => navigate(-1)}
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
	);
}
