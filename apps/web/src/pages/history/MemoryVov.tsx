import MemoryWarPage from '../../components/features/memory/MemoryWarPage';
import { PEOPLE_ROLES } from '../../lib/people-roles';

export default function MemoryVov() {
	return (
		<MemoryWarPage
			pageTitle="Купаловцы помнят"
			bookTabLabel="Великая Отечественная Война"
			peopleRole={PEOPLE_ROLES.teacherVov}
			coverTitle="Великая Отечественная Война"
			pdfPath="/book_vov.pdf"
		/>
	);
}
