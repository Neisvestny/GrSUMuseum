import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRector } from '../hooks/useRector';
import MainLayout from '../layouts/MainLayout';

export default function RectorDetails() {
	const { id } = useParams<{ id: string }>();
	const rectorId = useMemo(() => (id ? Number(id) : null), [id]);
	const { rector, loading, error } = useRector(rectorId);

	if (loading) {
		return (
			<MainLayout title="Ректор">
				<div className="flex items-center justify-center h-64 text-blue-600 text-lg">
					Загрузка...
				</div>
			</MainLayout>
		);
	}

	if (error || !rector) {
		return (
			<MainLayout title="Ректор">
				<div className="flex items-center justify-center h-64 text-red-500 text-lg">
					{error ?? 'Ректор не найден'}
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout title={rector.name}>
			<div className="max-w-4xl mx-auto flex flex-col gap-10 pb-10">
				{/* Шапка */}
				<div className="flex flex-col md:flex-row gap-8 items-start bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-8 shadow-sm">
					<div className="w-48 h-60 shrink-0 rounded-2xl overflow-hidden border-2 border-blue-100 bg-blue-50">
						{rector.img ? (
							<img
								src={rector.img}
								alt={rector.name}
								className="w-full h-full object-cover"
								onError={(e) => {
									(e.target as HTMLImageElement).style.display = 'none';
								}}
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center text-blue-200 text-6xl">
								👤
							</div>
						)}
					</div>
					<div className="flex flex-col gap-3">
						<h1 className="text-3xl font-bold text-blue-800 leading-tight">
							{rector.name}
						</h1>
						<p className="text-blue-500 font-semibold text-lg">{rector.years}</p>
						{rector.description && (
							<p className="text-gray-600 italic text-base leading-relaxed">
								{rector.description}
							</p>
						)}
					</div>
				</div>

				{/* Биография */}
				{rector.full_text && (
					<div className="bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-8 shadow-sm">
						<h2 className="text-xl font-bold text-blue-700 mb-4">
							Биография и достижения
						</h2>
						<div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
							{rector.full_text}
						</div>
					</div>
				)}

				{/* Галерея */}
				{rector.images?.length > 0 && (
					<div>
						<h2 className="text-xl font-bold text-blue-700 mb-4">Фотогалерея</h2>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
							{rector.images.map((url, i) => (
								<div
									key={i}
									className="rounded-xl overflow-hidden border-2 border-blue-100 aspect-video bg-blue-50"
								>
									<img
										src={url}
										alt={`Фото ${i + 1}`}
										className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
										onError={(e) => {
											(e.target as HTMLImageElement).style.display = 'none';
										}}
									/>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Документы */}
				{rector.files?.length > 0 && (
					<div className="bg-blue-50/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 p-6">
						<h2 className="text-xl font-bold text-blue-800 mb-4">
							Документы и материалы
						</h2>
						<div className="flex flex-col gap-3">
							{rector.files.map((file, i) => (
								<a
									key={i}
									href={file.url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-3 bg-white p-4 rounded-xl border-2 border-blue-100 hover:border-blue-400 hover:shadow-md transition-all duration-200"
								>
									<span className="text-2xl">📄</span>
									<span className="font-semibold text-blue-700">
										{file.name || file.url}
									</span>
									<span className="ml-auto text-blue-400 text-sm">↗</span>
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</MainLayout>
	);
}
