import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRectors } from '../../hooks/useRectors';
import MainLayout from '../../layouts/MainLayout';

// const RECTORS = [
// 	{
// 		id: 1,
// 		name: 'Иванов Иван Иванович',
// 		years: '1940 — 1950',
// 		description:
// 			'Первый ректор института. Заложил основы учебной и научной деятельности.',
// 		img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn2nmWoa-66Yo5xylQwIiAxtvMrK2pB2l4CA&s',
// 	},
// 	{
// 		id: 2,
// 		name: 'Петров Пётр Петрович',
// 		years: '1950 — 1962',
// 		description: 'Расширил факультетскую базу, открыл новые специальности.',
// 		img: '/images/rector2.jpg',
// 	},
// 	{
// 		id: 3,
// 		name: 'Сидоров Семён Семёнович',
// 		years: '1962 — 1975',
// 		description: 'Провёл масштабную реорганизацию учебного процесса.',
// 		img: '/images/rector3.jpg',
// 	},
// 	{
// 		id: 4,
// 		name: 'Козлов Андрей Николаевич',
// 		years: '1975 — 1988',
// 		description: 'Руководил преобразованием института в университет.',
// 		img: '/images/rector4.jpg',
// 	},
// 	{
// 		id: 5,
// 		name: 'Михайлов Виктор Степанович',
// 		years: '1988 — 2002',
// 		description:
// 			'Развивал международные связи и научные школы университета.',
// 		img: '/images/rector5.jpg',
// 	},
// 	{
// 		id: 6,
// 		name: 'Романов Олег Александрович',
// 		years: '2002 — настоящее время',
// 		description:
// 			'Под его руководством университет вышел на новый уровень развития.',
// 		img: '/images/rector6.jpg',
// 	},
// ];

export default function Rectors() {
	const { rectors, loading } = useRectors();
	const navigate = useNavigate();
	const scrollRef = useRef<HTMLDivElement>(null);
	const [atBottom, setAtBottom] = useState(false);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = el;
			setAtBottom(scrollHeight - scrollTop - clientHeight < 40);
		};

		el.addEventListener('scroll', handleScroll);
		return () => el.removeEventListener('scroll', handleScroll);
	}, []);
	if (loading) return <div>Загрузка...</div>;
	return (
		<MainLayout title="Ректоры ГрГУ" scrollRef={scrollRef}>
			<div className="relative max-w-6xl mx-auto hidden md:block">
				<div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-blue-200" />

				<div className="flex flex-col gap-16">
					{rectors.map((rector, i) => {
						const isLeft = i % 2 === 0;
						return (
							<motion.div
								key={rector.id}
								initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true, margin: '-60px' }}
								transition={{ duration: 0.4, ease: 'easeOut' }}
								className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
							>
								<button
									onClick={() => navigate(`/history/rectors/${rector.id}`)}
									className="
                                    w-[calc(50%-2.5rem)] flex gap-6 items-center
                                    bg-white/80 backdrop-blur-sm
                                    border-2 border-blue-200 rounded-2xl p-7
                                    shadow-md hover:shadow-xl hover:border-blue-500
                                    hover:bg-white active:scale-95
                                    transition-all duration-200 text-left
                                "
								>
									<div className="w-32 h-32 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
										<img
											src={rector.img}
											alt={rector.name}
											className="w-full h-full object-cover"
											onError={(e) => {
												(e.target as HTMLImageElement).style.display =
													'none';
											}}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<span className="text-blue-700 font-bold text-xl leading-tight">
											{rector.name}
										</span>
										<span className="text-blue-400 text-base font-semibold">
											{rector.years}
										</span>
										<span className="text-gray-500 text-base leading-relaxed">
											{rector.description}
										</span>
									</div>
								</button>

								<div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-700 border-4 border-white shadow-md shrink-0" />
								<div className="w-[calc(50%-2.5rem)]" />
							</motion.div>
						);
					})}
				</div>

				<div className="relative flex justify-center mt-6">
					<div className="w-5 h-5 rounded-full bg-blue-300 border-4 border-white shadow-md" />
				</div>
			</div>

			{/* ИНДИКАТОР СКРОЛЛА — фиксирован внизу экрана */}
			<div
				className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-opacity duration-500"
				style={{ opacity: atBottom ? 0 : 1 }}
			>
				<motion.div
					animate={{ y: [0, 8, 0] }}
					transition={{
						duration: 1.5,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
					className="flex flex-col items-center gap-2"
				>
					<span className="text-blue-400 text-sm font-medium">листайте</span>
					<div className="w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center">
						<motion.div
							animate={{ y: [0, 12, 0] }}
							transition={{
								duration: 1.5,
								repeat: Infinity,
								ease: 'easeInOut',
							}}
							className="w-1.5 h-3 bg-blue-400 rounded-full mt-1.5"
						/>
					</div>
				</motion.div>
			</div>
		</MainLayout>
	);
}
