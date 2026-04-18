import { useEffect, useState } from 'react';
import { 
    type Rector, 
    fetchRectors, 
    createRector, 
    updateRector, 
    deleteRector 
} from '../api/rectors';

export function useRectors() {
    const [rectors, setRectors] = useState<Rector[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchRectors();
            setRectors(data);
        } catch (e) {
            console.error("Ошибка загрузки ректоров", e);
            setError("Не удалось загрузить данные");
        } finally {
            setLoading(false);
        }
    };

    const add = async (data: Partial<Rector>) => {
        try {
            await createRector(data);
            await load(); // Перезагружаем список для актуализации позиций и ID
        } catch (e) {
            alert("Ошибка при добавлении");
        }
    };

    const update = async (id: number, data: Partial<Rector>) => {
        try {
            await updateRector(id, data);
            await load();
        } catch (e) {
            alert("Ошибка при обновлении");
        }
    };

    const remove = async (id: number) => {
        if (!window.confirm("Вы уверены, что хотите удалить этого ректора?")) return;
        try {
            await deleteRector(id);
            await load();
        } catch (e) {
            alert("Ошибка при удалении");
        }
    };

    useEffect(() => {
        load();
    }, []);

    return { 
        rectors, 
        loading, 
        error, 
        add, 
        update, 
        remove, 
        reload: load 
    };
}