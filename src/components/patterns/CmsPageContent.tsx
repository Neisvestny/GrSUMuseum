import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { PageDto } from '../../api/pages';
import { EmptyState, ErrorState, LoadingState } from '../design-system/States';
import TabsBar from '../design-system/TabsBar';
import AlternatingBlocks from './AlternatingBlocks';
import TextImagePanel from './TextImagePanel';

type Props = {
	page: PageDto | null;
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
	const tabs = page?.tabs ?? [];
	const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id ? String(tabs[0].id) : '');

	useEffect(() => {
		if (!tabs.length) {
			setActiveTab('');
			return;
		}
		if (!tabs.some((t) => String(t.id) === activeTab)) {
			setActiveTab(String(tabs[0].id));
		}
	}, [activeTab, tabs]);

	const preparedTabs = useMemo(
		() => tabs.map((tab) => ({ id: String(tab.id), label: tab.label })),
		[tabs],
	);

	const blocks = useMemo(() => {
		if (!page) return [];
		if (!isTabsTemplate(page.template)) return page.blocks;
		if (tabs.length === 0) return page.blocks;
		const selectedTabId = Number(activeTab || tabs[0]?.id);
		const selectedTab = tabs.find((tab) => tab.id === selectedTabId) ?? tabs[0];
		return selectedTab?.blocks ?? [];
	}, [activeTab, page, tabs]);

	const preparedBlocks = blocks.map((b) => ({
		img: b.img ?? undefined,
		text: b.paragraphs.map((p) => p.text).join('\n\n'),
	}));

	const firstBlock = blocks[0];
	const firstText = firstBlock?.paragraphs.map((p) => p.text).join('\n\n') ?? '';
	const firstImage = firstBlock?.img ?? '';

	if (loading) return <LoadingState />;
	if (error) return <ErrorState text={error} />;
	if (!page) return <EmptyState text={emptyText} />;

	return (
		<>
			{isTabsTemplate(page.template) && preparedTabs.length > 0 && (
				<TabsBar
					tabs={preparedTabs}
					activeTab={activeTab || preparedTabs[0].id}
					onChange={setActiveTab}
				/>
			)}
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab || 'no-tabs'}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -16 }}
					transition={{ duration: 0.2 }}
				>
					{renderTemplate({
						template: page.template,
						title: page.title,
						preparedBlocks,
						firstImage,
						firstText,
						emptyText,
					})}
				</motion.div>
			</AnimatePresence>
		</>
	);
}

function isTabsTemplate(template: PageDto['template']): boolean {
	return template === 'tabs_alternating' || template === 'tabs_text_image';
}

function renderTemplate({
	template,
	title,
	preparedBlocks,
	firstText,
	firstImage,
	emptyText,
}: {
	template: PageDto['template'];
	title: string;
	preparedBlocks: Array<{ img?: string; text: string }>;
	firstText: string;
	firstImage: string;
	emptyText: string;
}) {
	if (preparedBlocks.length === 0) {
		return <EmptyState text={emptyText} />;
	}

	switch (template) {
		case 'text_image':
		case 'tabs_text_image':
			return (
				<TextImagePanel
					title={title}
					text={firstText || 'Текст для страницы пока не заполнен'}
					imageSrc={firstImage || '/images/teachers-institute.jpg'}
					imageAlt={title}
				/>
			);
		case 'alternating_blocks':
		case 'tabs_alternating':
		default:
			return <AlternatingBlocks blocks={preparedBlocks} />;
	}
}
