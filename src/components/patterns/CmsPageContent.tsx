import { AnimatePresence, motion } from 'framer-motion';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ContentTemplate, PageBlock, PageDto } from '../../api/pages';
import { EmptyState, ErrorState, LoadingState } from '../design-system/States';
import TabsBar from '../design-system/TabsBar';
import AlternatingBlocks from './AlternatingBlocks';
import MediaStrip from './MediaStrip';
import TextImagePanel from './TextImagePanel';

type Props = {
	page: PageDto | null;
	loading: boolean;
	error: string | null;
	emptyText?: string;
};

function pageDefaultContentTemplate(t: PageDto['template']): ContentTemplate {
	if (t === 'text_image' || t === 'tabs_text_image') return 'text_image';
	return 'alternating_blocks';
}

function isTabsChrome(t: PageDto['template']): boolean {
	return t === 'tabs_alternating' || t === 'tabs_text_image';
}

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

	const pageBase = page ? pageDefaultContentTemplate(page.template) : 'alternating_blocks';
	const showTabsBar = page ? isTabsChrome(page.template) && tabs.length > 0 : false;

	const selectedTabId = Number(activeTab || tabs[0]?.id);
	const selectedTab = tabs.find((tab) => tab.id === selectedTabId) ?? tabs[0];

	const sectionBase: ContentTemplate =
		showTabsBar && selectedTab ? (selectedTab.template ?? pageBase) : pageBase;

	const blocksToRender: PageBlock[] = showTabsBar
		? (selectedTab?.blocks ?? [])
		: (page?.blocks ?? []);

	const mediaToRender = showTabsBar ? (selectedTab?.media ?? []) : (page?.media ?? []);

	if (loading) return <LoadingState />;
	if (error) return <ErrorState text={error} />;
	if (!page) return <EmptyState text={emptyText} />;

	return (
		<>
			{showTabsBar && preparedTabs.length > 0 && (
				<TabsBar
					tabs={preparedTabs}
					activeTab={activeTab || preparedTabs[0].id}
					onChange={setActiveTab}
				/>
			)}
			<AnimatePresence mode="wait">
				<motion.div
					key={showTabsBar ? activeTab || 'tab' : 'direct'}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -16 }}
					transition={{ duration: 0.2 }}
					className="flex flex-col gap-8"
				>
					{mediaToRender.length > 0 && <MediaStrip items={mediaToRender} />}
					{blocksToRender.length === 0 ? (
						<EmptyState text={emptyText} />
					) : (
						(() => {
							const blocksPrepared = blocksToRender.map((block) => ({
								id: block.id,
								layout: (block.template ?? sectionBase) as ContentTemplate,
								text: block.paragraphs.map((p) => p.text).join('\n\n'),
								img: block.img ?? undefined,
							}));

							const out: ReactNode[] = [];
							let acc: Array<{ text: string; img?: string }> = [];

							const flushAcc = (key: string) => {
								if (acc.length === 0) return;
								out.push(<AlternatingBlocks key={key} blocks={acc} />);
								acc = [];
							};

							for (const b of blocksPrepared) {
								if (b.layout === 'alternating_blocks') {
									acc.push({ text: b.text, img: b.img });
									continue;
								}

								flushAcc(`alt:${b.id}`);
								out.push(
									<Fragment key={b.id}>
										{renderContentLayout({
											layout: b.layout,
											title: page.title,
											preparedBlocks: [{ img: b.img, text: b.text }],
											firstText: b.text,
											firstImage: b.img ?? '',
											emptyText,
										})}
									</Fragment>,
								);
							}

							flushAcc('alt:tail');
							return <>{out}</>;
						})()
					)}
				</motion.div>
			</AnimatePresence>
		</>
	);
}

function renderContentLayout({
	layout,
	title,
	preparedBlocks,
	firstText,
	firstImage,
	emptyText,
}: {
	layout: ContentTemplate;
	title: string;
	preparedBlocks: Array<{ img?: string; text: string }>;
	firstText: string;
	firstImage: string;
	emptyText: string;
}) {
	if (preparedBlocks.length === 0) {
		return <EmptyState text={emptyText} />;
	}

	switch (layout) {
		case 'text_image':
			return (
				<TextImagePanel
					title={title}
					text={firstText || 'Текст для страницы пока не заполнен'}
					imageSrc={firstImage || '/images/teachers-institute.jpg'}
					imageAlt={title}
				/>
			);
		case 'alternating_blocks':
		default:
			return <AlternatingBlocks blocks={preparedBlocks} />;
	}
}
