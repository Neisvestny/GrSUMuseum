import { useCallback, useEffect, useState } from 'react';
import type { Teacher, TeacherMutation, TeacherSection } from '../api/teachers';
import * as api from '../api/teachers';
import { ApiError } from '../shared/api/client';

export function useTeachers(section: TeacherSection) {
	const [teachers, setTeachers] = useState<Teacher[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await api.fetchTeachers(section);
			setTeachers(data);
		} catch (error) {
			setError(error instanceof ApiError ? error.message : 'Не удалось загрузить данные');
		} finally {
			setLoading(false);
		}
	}, [section]);

	useEffect(() => {
		load();
	}, [load]);

	const add = async (data: TeacherMutation) => {
		const teacher = await api.createTeacher(section, data);
		await load();
		return teacher;
	};

	const update = async (position: number, data: TeacherMutation) => {
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
