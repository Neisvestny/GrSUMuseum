import TextImagePanel from '../../components/patterns/TextImagePanel';
import MainLayout from '../../layouts/MainLayout';

export default function StudentInitiatives() {
	return (
		<MainLayout title="Студенческие инициативы, проекты, конкурсы">
			<TextImagePanel
				title="Студенческие инициативы, проекты, конкурсы в ГрГУ"
				text="Здесь будет размещена типовая информация о студенческих инициативах, проектах, конкурсах."
				imageSrc="/images/teachers-institute.jpg"
				imageAlt="Студенческие инициативы, проекты, конкурсы"
			/>
		</MainLayout>
	);
}
