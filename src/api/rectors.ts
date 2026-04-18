export interface Rector {
    id: number;
    position: number;
    name: string;
    years: string;
    description: string;
    full_text: string;    // Добавлено
    img: string;
    images: string[];     // Добавлено
    files: { name: string; url: string }[]; // Добавлено (как массив объектов)
}

const BASE = 'http://localhost:3001/api/rectors';

export async function fetchRectors(): Promise<Rector[]> {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error('Failed to fetch rectors');
    return res.json();
}

export async function createRector(data: Partial<Rector>): Promise<Rector> {
    const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create rector');
    return res.json();
}

export async function updateRector(id: number, data: Partial<Rector>): Promise<Rector> {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'PUT', // Или PATCH, в зависимости от вашего бэкенда
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update rector');
    return res.json();
}

export async function deleteRector(id: number): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete rector');
}