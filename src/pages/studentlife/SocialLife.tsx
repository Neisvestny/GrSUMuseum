import TextImagePanel from '../../components/patterns/TextImagePanel';
import MainLayout from '../../layouts/MainLayout';

export default function SocialLife() {
	return (
		<MainLayout title="Общественная жизнь">
			<TextImagePanel
				title="Общественная жизнь в ГрГУ"
				text="Здесь будет размещена типовая информация о общественной жизни в ГрГУ."
				imageSrc="/images/social-life.jpg"
				imageAlt="Общественная жизнь"
			/>
		</MainLayout>
	);
}
