import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/design-system/Button';
import { AnimatedBlobsBackground } from '../components/ui/AnimatedBlobsBackground';
import { BLOB_PRESETS } from '../components/ui/animatedBlobsPresets';

const BLOBS = BLOB_PRESETS.layout;

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
			<AnimatedBlobsBackground blobs={BLOBS} />

			{/* НАВБАР */}
			{title && (
				<nav className="relative z-10 flex items-center gap-4 px-8 py-4 bg-white/70 backdrop-blur-md border-b border-blue-100 shrink-0">
					<Button
						onClick={() => {
							if (window.history.length > 1) {
								navigate(-1);
							} else {
								navigate('/');
							}
						}}
						size="md"
						variant="secondary"
						className="flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-blue-700 hover:text-white hover:border-blue-700"
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
					</Button>
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
