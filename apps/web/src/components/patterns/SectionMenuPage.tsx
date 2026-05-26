import { useNavigate } from 'react-router-dom';
import Button from '../design-system/Button';

type Item = {
	label: string;
	path: string;
	disabled?: boolean;
};

type Props = {
	title: string;
	items: Item[];
};

export default function SectionMenuPage({ title, items }: Props) {
	const navigate = useNavigate();

	return (
		<div className="w-screen h-screen bg-white flex flex-col">
			<main className="flex-1 flex flex-col items-center justify-center gap-8 px-16">
				<header className="text-center">
					<p className="text-gray-500 text-2xl font-bold">{title}</p>
				</header>

				<div className="flex flex-col gap-5 w-full max-w-3xl">
					{items.map((item) => (
						<Button
							key={`${item.path}-${item.label}`}
							onClick={() => {
								if (!item.path) return;
								const target = item.path.startsWith('/') ? item.path : `/${item.path}`;
								navigate(target);
							}}
							disabled={item.disabled || !item.path}
							size="lg"
							className="w-full h-36 flex items-center justify-center text-2xl text-center px-4"
						>
							{item.label}
						</Button>
					))}
				</div>

				<Button onClick={() => navigate(-1)} size="lg">
					← Назад
				</Button>
			</main>
		</div>
	);
}
