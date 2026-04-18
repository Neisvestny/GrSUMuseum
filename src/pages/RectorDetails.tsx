import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function RectorDetails() {
    const { id } = useParams();
    const [rector, setRector] = useState<any>(null);

    useEffect(() => {
        fetch(`http://localhost:3001/api/rectors/${id}`)
            .then(res => res.json())
            .then(data => setRector(data));
    }, [id]);

    if (!rector) return <div>Загрузка...</div>;

    return (
        <MainLayout title={rector.name}>
            <div className="max-w-4xl mx-auto flex flex-col gap-10 p-6">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <img src={rector.img} className="w-64 h-80 object-cover rounded-2xl shadow-lg" />
                    <div>
                        <h1 className="text-4xl font-bold text-blue-800">{rector.name}</h1>
                        <p className="text-xl text-blue-500 font-semibold mb-4">{rector.years}</p>
                        <p className="text-gray-600 italic text-lg">{rector.description}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
                    <h2 className="text-2xl font-bold text-blue-700 mb-4">Биография и достижения</h2>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {rector.full_text}
                    </div>
                </div>

                {/* Динамическая галерея */}
                {rector.images?.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-blue-700 mb-4">Фотогалерея</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {rector.images.map((url: string, i: number) => (
                                <img key={i} src={url} className="w-full h-48 object-cover rounded-xl hover:scale-105 transition" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Список файлов */}
                {rector.files?.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold text-blue-800 mb-4">Документы и материалы</h2>
                        <div className="flex flex-col gap-3">
                            {rector.files.map((file: any, i: number) => (
                                <a key={i} href={file.url} target="_blank" className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 hover:shadow-md transition">
                                    <span className="text-2xl">📄</span>
                                    <span className="font-medium text-blue-700">{file.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}