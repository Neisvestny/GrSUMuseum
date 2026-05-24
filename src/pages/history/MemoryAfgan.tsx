import MemoryWarPage from '../../components/features/memory/MemoryWarPage';
import { PEOPLE_ROLES } from '../../lib/people-roles';

export default function MemoryAfgan() {
	return (
		<MemoryWarPage
			pageTitle="Купаловцы помнят"
			bookTabLabel="Афганистан"
			peopleRole={PEOPLE_ROLES.teacherAfgan}
			coverTitle="Афганистан"
		/>
	);
}
