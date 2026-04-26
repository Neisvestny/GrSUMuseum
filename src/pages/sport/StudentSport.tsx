import TextImagePanel from '../../components/patterns/TextImagePanel';
import MainLayout from '../../layouts/MainLayout';

export default function StudentSport() {
	return (
		<MainLayout title="Студенческий спорт">
			<TextImagePanel
				title="Студенческий спорт в ГрГУ"
				text="Здесь будет размещена типовая информация о спортивных секциях, соревнованиях, университетских командах и достижениях студентов."
				imageSrc="/images/teachers-institute.jpg"
				imageAlt="Студенческий спорт"
			/>
		</MainLayout>
	);
}
