import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const RECTORS = [
	{
		id: 1,
		name: 'Иванов Иван Иванович',
		years: '1940 — 1950',
		description:
			'Первый ректор института. Заложил основы учебной и научной деятельности.',
		fullText:
			'Здесь может быть большое подробное описание ректора. Биография, достижения, реформы и т.д.',
		img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn2nmWoa-66Yo5xylQwIiAxtvMrK2pB2l4CA&s',
		images: [
			'https://placehold.co/300x200',
			'https://placehold.co/300x200',
			'https://placehold.co/300x200',
		],
		files: [
			{ name: 'Документ 1.pdf', url: '#' },
			{ name: 'Архив.zip', url: '#' },
		],
	},
	// остальные ректоры по аналогии
];

export default function RectorDetails() {
	const { id } = useParams();

	const rector = RECTORS.find((r) => r.id === Number(id));

	if (!rector) {
		return (
			<MainLayout title="Не найдено">
				<div className="text-center mt-20 text-gray-500">
					Ректор не найден
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout title={rector.name}>
			<div className="max-w-5xl mx-auto flex flex-col gap-10">
				{/* HEADER */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex gap-8 items-center flex-col md:flex-row"
				>
					<img
						src={rector.img}
						alt={rector.name}
						className="w-56 h-56 object-cover rounded-2xl border"
					/>

					<div className="flex flex-col gap-3 text-center md:text-left">
						<h1 className="text-3xl font-bold text-blue-700">
							{rector.name}
						</h1>
						<span className="text-blue-400 font-semibold text-lg">
							{rector.years}
						</span>
						<p className="text-gray-600">{rector.description}</p>
					</div>
				</motion.div>

				{/* ГАЛЕРЕЯ */}
				<div className="flex flex-col gap-4">
					<h2 className="text-xl font-semibold text-blue-600">
						Фотогалерея
					</h2>

					<div className="flex gap-4 overflow-x-auto pb-2">
						{rector.images.map((img, i) => (
							<img
								key={i}
								src={img}
								className="w-64 h-40 object-cover rounded-xl shrink-0 border hover:scale-105 transition"
							/>
						))}
					</div>
				</div>

				{/* ПОДРОБНОЕ ОПИСАНИЕ */}
				<div className="flex flex-col gap-4">
					<h2 className="text-xl font-semibold text-blue-600">
						Описание
					</h2>

					<p className="text-gray-700 leading-relaxed">
						{rector.fullText}
					</p>
				</div>

				{/* ФАЙЛЫ */}
				<div className="flex flex-col gap-4">
					<h2 className="text-xl font-semibold text-blue-600">
						Материалы
					</h2>

					<div className="flex flex-col gap-2">
						{rector.files.map((file, i) => (
							<a
								key={i}
								href={file.url}
								target="_blank"
								className="p-4 border rounded-xl hover:bg-blue-50 transition"
							>
								📄 {file.name}
							</a>
						))}
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
