import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PEOPLE_ROLES } from '../../lib/people-roles';
import { usePeopleByRole } from '../../hooks/usePeople';
import MainLayout from '../../layouts/MainLayout';

export default function Rectors() {
	const { people, loading } = usePeopleByRole(PEOPLE_ROLES.rector);
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
					{people.map((person, i) => {
						const isLeft = i % 2 === 0;
						return (
							<motion.div
								key={person.id}
								initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true, margin: '-60px' }}
								transition={{ duration: 0.4, ease: 'easeOut' }}
								className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
							>
								<button
									onClick={() => navigate(`/history/rectors/${person.id}`)}
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
										{person.img ? (
											<img
												src={person.img}
												alt={person.displayName}
												className="w-full h-full object-cover"
												onError={(e) => {
													(e.target as HTMLImageElement).style.display =
														'none';
												}}
											/>
										) : null}
									</div>
									<div className="flex flex-col gap-2">
										<span className="text-blue-700 font-bold text-xl leading-tight">
											{person.displayName}
										</span>
										<span className="text-blue-400 text-base font-semibold">
											{person.yearsLabel}
										</span>
										<span className="text-gray-500 text-base leading-relaxed">
											{person.shortDescription}
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
