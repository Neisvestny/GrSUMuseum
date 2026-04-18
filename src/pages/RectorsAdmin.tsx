import { useState } from 'react';
import { useRectors } from '../hooks/useRectors'; // Создайте по аналогии с useTeachers

export default function RectorsAdmin() {
    const { rectors, add, update, remove, loading } = useRectors();
    const [editing, setEditing] = useState<any>(null);

    const emptyRector = {
        name: '', years: '', description: '', full_text: '',
        img: '', images: [''], files: [{ name: '', url: '' }]
    };

    if (loading) return <div>Загрузка...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-blue-700">Управление Ректорами</h1>
            
            <button 
                onClick={() => setEditing({ ...emptyRector, isNew: true })}
                className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
                + Добавить ректора
            </button>

            {/* Список ректоров */}
            <div className="grid gap-4">
                {rectors.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 border rounded-xl">
                        <div className="flex gap-4 items-center">
                            <img src={r.img} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <p className="font-bold">{r.name}</p>
                                <p className="text-sm text-gray-500">{r.years}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setEditing(r)} className="text-blue-600 p-2">Редактировать</button>
                            <button onClick={() => remove(r.id)} className="text-red-600 p-2">Удалить</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Модальное окно формы */}
            {editing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editing.isNew ? 'Новый ректор' : 'Редактирование'}</h2>
                        
                        <div className="flex flex-col gap-4">
                            <input placeholder="ФИО" className="border p-2 rounded" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
                            <input placeholder="Годы правления" className="border p-2 rounded" value={editing.years} onChange={e => setEditing({...editing, years: e.target.value})} />
                            <textarea placeholder="Краткое описание" className="border p-2 rounded" value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} />
                            <textarea placeholder="Полная биография" className="border p-2 rounded h-32" value={editing.full_text} onChange={e => setEditing({...editing, full_text: e.target.value})} />
                            <input placeholder="URL главного фото" className="border p-2 rounded" value={editing.img} onChange={e => setEditing({...editing, img: e.target.value})} />
                            
                            {/* Управление галереей */}
                            <div className="border p-3 rounded">
                                <p className="font-semibold mb-2">Галерея (URL фото)</p>
                                {editing.images.map((img: string, idx: number) => (
                                    <input 
                                        key={idx} className="border p-2 rounded w-full mb-2" value={img}
                                        onChange={e => {
                                            const newImgs = [...editing.images];
                                            newImgs[idx] = e.target.value;
                                            setEditing({...editing, images: newImgs});
                                        }}
                                    />
                                ))}
                                <button onClick={() => setEditing({...editing, images: [...editing.images, '']})} className="text-sm text-blue-600">+ Еще фото</button>
                            </div>

                            {/* Управление файлами */}
                            <div className="border p-3 rounded">
                                <p className="font-semibold mb-2">Файлы и документы</p>
                                {editing.files.map((f: any, idx: number) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input placeholder="Название файла" className="border p-2 rounded flex-1" value={f.name} onChange={e => {
                                            const newFiles = [...editing.files];
                                            newFiles[idx].name = e.target.value;
                                            setEditing({...editing, files: newFiles});
                                        }} />
                                        <input placeholder="URL" className="border p-2 rounded flex-1" value={f.url} onChange={e => {
                                            const newFiles = [...editing.files];
                                            newFiles[idx].url = e.target.value;
                                            setEditing({...editing, files: newFiles});
                                        }} />
                                    </div>
                                ))}
                                <button onClick={() => setEditing({...editing, files: [...editing.files, {name: '', url: ''}]})} className="text-sm text-blue-600">+ Еще файл</button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditing(null)} className="px-4 py-2 text-gray-500">Отмена</button>
                            <button 
                                onClick={() => { 
                                    editing.isNew ? add(editing) : update(editing.id, editing);
                                    setEditing(null);
                                }} 
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}