import type { PageDocument } from '@museum/document';
import { EmptyState, ErrorState, LoadingState } from '../design-system/States';
import BlockRenderer from '../cms/BlockRenderer';

type Props = {
	page: {
		title: string;
		document: PageDocument;
	} | null;
	loading: boolean;
	error: string | null;
	emptyText?: string;
};

export default function CmsPageContent({
	page,
	loading,
	error,
	emptyText = 'Контент страницы пока не заполнен',
}: Props) {
	if (loading) return <LoadingState />;
	if (error) return <ErrorState text={error} />;
	if (!page) return <EmptyState text={emptyText} />;

	return (
		<BlockRenderer document={page.document} pageTitle={page.title} emptyText={emptyText} />
	);
}
