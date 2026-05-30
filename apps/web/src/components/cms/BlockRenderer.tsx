import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BlockNode, PageDocument } from '@museum/document';
import type { MediaItem } from '../../types/media';
import { renderCmsBlockType } from './blocks/CmsBlockViews';
import { CmsPreviewProvider } from './CmsPreviewContext';
import TabsBar from '../design-system/TabsBar';
import { EmptyState } from '../design-system/States';
import AlternatingBlocks from '../patterns/AlternatingBlocks';
import MediaStrip from '../patterns/MediaStrip';
import TextImagePanel from '../patterns/TextImagePanel';

type Props = {
	document: PageDocument;
	pageTitle: string;
	emptyText?: string;
};

function normalizeMediaItems(raw: unknown): MediaItem[] {
	if (!Array.isArray(raw)) return [];
	const out: MediaItem[] = [];
	for (const item of raw) {
		if (typeof item !== 'object' || item === null) continue;
		const v = item as Record<string, unknown>;
		const kind = v.kind;
		const src = typeof v.src === 'string' ? v.src.trim() : '';
		if ((kind !== 'photo' && kind !== 'video') || !src) continue;
		const title = typeof v.title === 'string' ? v.title : undefined;
		const description = typeof v.description === 'string' ? v.description : undefined;
		if (kind === 'photo') out.push({ kind, src, title, description });
		else
			out.push({
				kind,
				src,
				title,
				description,
				is_external: typeof v.is_external === 'boolean' ? v.is_external : undefined,
			});
	}
	return out;
}

function readTextImageFields(block: BlockNode): { text: string; imageSrc: string } {
	const text = typeof block.payload.text === 'string' ? block.payload.text : '';
	const imageSrc =
		(typeof block.payload.image === 'string' ? block.payload.image : '') ||
		(typeof block.payload.img === 'string' ? block.payload.img : '');
	return { text, imageSrc: imageSrc.trim() };
}

function renderTextImageContent(block: BlockNode, pageTitle: string): ReactNode {
	const { text, imageSrc } = readTextImageFields(block);
	if (!text.trim() && !imageSrc) return null;

	if (imageSrc) {
		return (
			<TextImagePanel
				title={pageTitle}
				text={text}
				imageSrc={imageSrc}
				imageAlt={pageTitle}
			/>
		);
	}

	return <AlternatingBlocks blocks={[{ text }]} />;
}

function renderLegacyBlock(block: BlockNode, pageTitle: string): ReactNode {
	switch (block.type) {
		case 'tabs':
			return <TabsBlock key={block.id} block={block} pageTitle={pageTitle} />;
		case 'mediaStrip':
			return (
				<MediaStrip
					key={block.id}
					items={normalizeMediaItems(block.payload.items)}
				/>
			);
		case 'textImage':
			return (
				<Fragment key={block.id}>
					{renderTextImageContent(block, pageTitle)}
				</Fragment>
			);
		case 'alternating':
			return <AlternatingBlock key={block.id} block={block} pageTitle={pageTitle} />;
		default:
			return null;
	}
}

function renderBlock(block: BlockNode, pageTitle: string): ReactNode {
	const custom = renderCmsBlockType(block, pageTitle, (b) => renderLegacyBlock(b, pageTitle));
	if (custom !== null) return <Fragment key={block.id}>{custom}</Fragment>;
	const legacy = renderLegacyBlock(block, pageTitle);
	if (legacy === null) return null;
	return <Fragment key={block.id}>{legacy}</Fragment>;
}

function AlternatingBlock({ block, pageTitle }: { block: BlockNode; pageTitle: string }) {
	if (block.children.length > 0) {
		return (
			<div className="flex flex-col gap-8">
				{block.children.map((child) => renderBlock(child, pageTitle))}
			</div>
		);
	}

	if (block.type === 'textImage') {
		return renderTextImageContent(block, pageTitle);
	}

	const text = typeof block.payload.text === 'string' ? block.payload.text : '';
	const img =
		typeof block.payload.image === 'string'
			? block.payload.image
			: typeof block.payload.img === 'string'
				? block.payload.img
				: undefined;

	if (text && img) {
		return (
			<TextImagePanel
				title={pageTitle}
				text={text}
				imageSrc={img}
				imageAlt={pageTitle}
			/>
		);
	}

	return <AlternatingBlocks blocks={[{ text, img }]} />;
}

function TabsBlock({ block, pageTitle }: { block: BlockNode; pageTitle: string }) {
	const tabs = block.children.filter((c) => c.type === 'tab');
	const prepared = useMemo(
		() => tabs.map((t) => ({ id: t.id, label: String(t.payload.label ?? 'Вкладка') })),
		[tabs],
	);
	const [activeTab, setActiveTab] = useState(prepared[0]?.id ?? '');

	useEffect(() => {
		if (!prepared.length) {
			setActiveTab('');
			return;
		}
		if (!prepared.some((t) => t.id === activeTab)) {
			setActiveTab(prepared[0].id);
		}
	}, [activeTab, prepared]);

	const selected = tabs.find((t) => t.id === activeTab) ?? tabs[0];

	return (
		<>
			{prepared.length > 0 && (
				<TabsBar tabs={prepared} activeTab={activeTab || prepared[0].id} onChange={setActiveTab} />
			)}
			{selected && (
				<div className="flex flex-col gap-8">
					{normalizeMediaItems(selected.payload.media).length > 0 && (
						<MediaStrip items={normalizeMediaItems(selected.payload.media)} />
					)}
					{selected.children.length === 0 ? (
						<EmptyState text="Контент вкладки пуст" />
					) : (
						selected.children.map((child) => (
							<Fragment key={child.id}>{renderBlock(child, pageTitle)}</Fragment>
						))
					)}
				</div>
			)}
		</>
	);
}

export default function BlockRenderer({
	document,
	pageTitle,
	emptyText = 'Контент страницы пока не заполнен',
	preview = false,
}: Props & { preview?: boolean }) {
	if (!document.blocks.length) {
		return <EmptyState text={emptyText} />;
	}

	return (
		<CmsPreviewProvider preview={preview}>
			<div className={`flex flex-col ${preview ? 'gap-4' : 'gap-8'}`}>
				{document.blocks.map((block) => (
					<Fragment key={block.id}>{renderBlock(block, pageTitle)}</Fragment>
				))}
			</div>
		</CmsPreviewProvider>
	);
}
