import type { Pool } from 'pg';

export async function ensureTeachersSectionConstraint(db: Pool): Promise<void> {
	await db.query(`
		ALTER TABLE teachers
		DROP CONSTRAINT IF EXISTS teachers_section_check
	`);

	await db.query(`
		ALTER TABLE teachers
		ADD CONSTRAINT teachers_section_check
		CHECK (section IN ('vov', 'afgan', 'olympcoch', 'olympstud', 'trainer'))
	`);
}
