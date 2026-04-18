import { useEffect, useState } from 'react';
import type { Teacher } from '../api/teachers';
import * as api from '../api/teachers';

export function useTeachers(section: 'vov' | 'afgan') {
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await api.fetchTeachers(section);
			setTeachers(data);
		} catch {
			setError('Не удалось загрузить данные');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, [section]);

	const add = async (data: Partial<Teacher> & { position?: number }) => {
		const teacher = await api.createTeacher(section, data);
		await load(); // перезагружаем чтобы позиции были актуальны
		return teacher;
	};

	const update = async (position: number, data: Partial<Teacher> & { position?: number }) => {
		await api.updateTeacher(section, position, data);
		await load();
	};

	const remove = async (position: number) => {
		await api.deleteTeacher(section, position);
		await load();
	};

	const reset = async () => {
		const data = await api.resetTeachers(section);
		setTeachers(data);
	};

	return {
		teachers,
		loading,
		error,
		add,
		update,
		remove,
		reset,
		reload: load,
	};
}
