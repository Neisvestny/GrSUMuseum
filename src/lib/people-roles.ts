/** Slug ролей в БД — используются на публичных страницах и в фильтрах админки. */
export const PEOPLE_ROLES = {
	rector: 'rector',
	teacherVov: 'teacher-vov',
	teacherAfgan: 'teacher-afgan',
	olympicCoach: 'olympic-coach',
	olympicStudent: 'olympic-student',
	trainer: 'trainer',
} as const;

export type PeopleRoleSlug = (typeof PEOPLE_ROLES)[keyof typeof PEOPLE_ROLES];
