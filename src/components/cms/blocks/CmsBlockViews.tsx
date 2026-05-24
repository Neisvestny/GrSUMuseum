import { useState, type ReactNode } from 'react';
import { SurfaceCard } from '../../design-system/Card';
import { blockPayload, bool, num, recordArray, str, stringArray } from './payload';
import type { BlockNode } from '../../../types/document';

const card = 'bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 shadow-sm';

export function HeroView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const title = str(p, 'title');
	const subtitle = str(p, 'subtitle');
	const image = str(p, 'image') || str(p, 'img');
	const buttonLabel = str(p, 'buttonLabel');
	const buttonHref = str(p, 'buttonHref');
	const align = str(p, 'align', 'left');
	const centered = align === 'center';

	return (
		<section
			className={`${card} overflow-hidden ${image ? 'grid md:grid-cols-2 gap-0' : ''}`}
		>
			<div className={`p-8 md:p-10 flex flex-col justify-center gap-4 ${centered ? 'text-center items-center' : ''}`}>
				{title && <h1 className="text-3xl md:text-4xl font-bold text-blue-900 leading-tight">{title}</h1>}
				{subtitle && <p className="text-lg text-blue-600/90 max-w-xl">{subtitle}</p>}
				{buttonLabel && buttonHref && (
					<a
						href={buttonHref}
						className="inline-flex px-6 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 transition-colors"
					>
						{buttonLabel}
					</a>
				)}
			</div>
			{image && (
				<div className="min-h-[200px] md:min-h-full bg-blue-50">
					<img src={image} alt="" className="w-full h-full object-cover min-h-[220px]" />
				</div>
			)}
		</section>
	);
}

export function HeadingView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const text = str(p, 'text');
	const level = num(p, 'level', 2);
	const align = str(p, 'align', 'left');
	const cls =
		level <= 2
			? 'text-2xl md:text-3xl font-bold text-blue-900'
			: level === 3
				? 'text-xl md:text-2xl font-bold text-blue-800'
				: 'text-lg font-bold text-blue-800';
	if (!text) return null;
	return (
		<h2 className={`${cls} ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''}`}>
			{text}
		</h2>
	);
}

export function RichTextView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const text = str(p, 'text');
	const align = str(p, 'align', 'left');
	if (!text.trim()) return null;
	return (
		<SurfaceCard className={`p-6 md:p-8 ${align === 'center' ? 'text-center' : ''}`}>
			<div className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">{text}</div>
		</SurfaceCard>
	);
}

export function QuoteView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const text = str(p, 'text');
	const author = str(p, 'author');
	if (!text.trim()) return null;
	return (
		<blockquote className={`${card} p-8 border-l-4 border-l-blue-600`}>
			<p className="text-xl text-blue-900 italic leading-relaxed">«{text}»</p>
			{author && <footer className="mt-4 text-blue-600 font-semibold">— {author}</footer>}
		</blockquote>
	);
}

const CALLOUT_STYLES: Record<string, string> = {
	info: 'bg-blue-50 border-blue-200 text-blue-900',
	success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
	warning: 'bg-amber-50 border-amber-200 text-amber-900',
	neutral: 'bg-stone-50 border-stone-200 text-stone-800',
};

export function CalloutView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const variant = str(p, 'variant', 'info');
	const title = str(p, 'title');
	const text = str(p, 'text');
	const style = CALLOUT_STYLES[variant] ?? CALLOUT_STYLES.info;
	if (!title && !text) return null;
	return (
		<div className={`rounded-2xl border-2 p-5 ${style}`}>
			{title && <div className="font-bold text-lg mb-1">{title}</div>}
			{text && <p className="leading-relaxed opacity-90">{text}</p>}
		</div>
	);
}

export function StatsView({ block }: { block: BlockNode }) {
	const items = recordArray(blockPayload(block), 'items');
	if (!items.length) return null;
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			{items.map((item, i) => (
				<div key={i} className={`${card} p-6 text-center`}>
					<div className="text-3xl font-bold text-blue-700">{str(item, 'value', '—')}</div>
					<div className="text-sm text-gray-500 mt-1 font-medium">{str(item, 'label')}</div>
				</div>
			))}
		</div>
	);
}

export function FeaturesView({ block }: { block: BlockNode }) {
	const items = recordArray(blockPayload(block), 'items');
	if (!items.length) return null;
	return (
		<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
			{items.map((item, i) => (
				<div key={i} className={`${card} p-6 flex flex-col gap-2`}>
					<span className="text-3xl">{str(item, 'icon', '✦')}</span>
					<h3 className="font-bold text-blue-900">{str(item, 'title')}</h3>
					<p className="text-gray-600 text-sm leading-relaxed">{str(item, 'text')}</p>
				</div>
			))}
		</div>
	);
}

export function AccordionView({ block }: { block: BlockNode }) {
	const items = recordArray(blockPayload(block), 'items');
	const [open, setOpen] = useState(0);
	if (!items.length) return null;
	return (
		<div className={`${card} divide-y divide-blue-100 overflow-hidden`}>
			{items.map((item, i) => {
				const isOpen = open === i;
				return (
					<div key={i}>
						<button
							type="button"
							onClick={() => setOpen(isOpen ? -1 : i)}
							className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-blue-900 hover:bg-blue-50/80"
						>
							{str(item, 'title', `Пункт ${i + 1}`)}
							<span className="text-blue-400">{isOpen ? '−' : '+'}</span>
						</button>
						{isOpen && (
							<div className="px-6 pb-4 text-gray-600 leading-relaxed whitespace-pre-wrap">
								{str(item, 'body')}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

export function TimelineView({ block }: { block: BlockNode }) {
	const items = recordArray(blockPayload(block), 'items');
	if (!items.length) return null;
	return (
		<div className="relative pl-8 border-l-2 border-blue-200 flex flex-col gap-8">
			{items.map((item, i) => (
				<div key={i} className="relative">
					<div className="absolute -left-[41px] w-5 h-5 rounded-full bg-blue-700 border-4 border-white shadow" />
					<span className="text-sm font-bold text-blue-500">{str(item, 'year')}</span>
					<h3 className="text-lg font-bold text-blue-900 mt-1">{str(item, 'title')}</h3>
					<p className="text-gray-600 mt-1">{str(item, 'text')}</p>
				</div>
			))}
		</div>
	);
}

export function ButtonRowView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const buttons = recordArray(p, 'buttons');
	const align = str(p, 'align', 'left');
	if (!buttons.length) return null;
	const justify =
		align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
	return (
		<div className={`flex flex-wrap gap-3 ${justify}`}>
			{buttons.map((b, i) => {
				const variant = str(b, 'variant', 'primary');
				const cls =
					variant === 'secondary'
						? 'border-2 border-blue-700 text-blue-700 hover:bg-blue-50'
						: 'bg-blue-700 text-white hover:bg-blue-800';
				return (
					<a
						key={i}
						href={str(b, 'href', '#')}
						className={`px-5 py-2.5 rounded-xl font-semibold transition-colors ${cls}`}
					>
						{str(b, 'label', 'Кнопка')}
					</a>
				);
			})}
		</div>
	);
}

export function DividerView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const style = str(p, 'style', 'line');
	const size = str(p, 'size', 'md');
	const py = size === 'sm' ? 'py-2' : size === 'lg' ? 'py-10' : 'py-5';
	if (style === 'space') return <div className={py} aria-hidden />;
	return <hr className={`border-0 border-t-2 border-blue-100 ${py}`} />;
}

function embedSrc(url: string): string | null {
	const u = url.trim();
	if (!u) return null;
	if (u.includes('youtube.com/watch')) {
		const id = new URL(u).searchParams.get('v');
		return id ? `https://www.youtube.com/embed/${id}` : null;
	}
	if (u.includes('youtu.be/')) {
		const id = u.split('youtu.be/')[1]?.split(/[?#]/)[0];
		return id ? `https://www.youtube.com/embed/${id}` : null;
	}
	return u;
}

export function EmbedView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const url = str(p, 'url');
	const title = str(p, 'title');
	const height = num(p, 'height', 400);
	const src = embedSrc(url);
	if (!src) return null;
	return (
		<SurfaceCard className="overflow-hidden p-2">
			{title && <p className="px-4 py-2 text-sm font-semibold text-blue-800">{title}</p>}
			<iframe
				title={title || 'embed'}
				src={src}
				className="w-full rounded-xl border-0"
				style={{ height }}
				allowFullScreen
			/>
		</SurfaceCard>
	);
}

export function ImageGalleryView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const images = stringArray(p, 'images').filter((s) => s.trim());
	const cols = num(p, 'columns', 3);
	if (!images.length) return null;
	const grid =
		cols === 2
			? 'grid-cols-2'
			: cols === 4
				? 'grid-cols-2 md:grid-cols-4'
				: 'grid-cols-2 md:grid-cols-3';
	return (
		<div className={`grid ${grid} gap-3`}>
			{images.map((src, i) => (
				<div key={i} className="aspect-[4/3] rounded-xl overflow-hidden border-2 border-blue-100 bg-blue-50">
					<img src={src} alt="" className="w-full h-full object-cover" />
				</div>
			))}
		</div>
	);
}

export function TwoColumnsView({ block }: { block: BlockNode }) {
	const columns = recordArray(blockPayload(block), 'columns');
	if (!columns.length) return null;
	return (
		<div className={`grid md:grid-cols-${Math.min(columns.length, 3)} gap-6`} style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 3)}, minmax(0, 1fr))` }}>
			{columns.map((col, i) => (
				<SurfaceCard key={i} className="p-6">
					{str(col, 'title') && (
						<h3 className="font-bold text-blue-900 mb-2">{str(col, 'title')}</h3>
					)}
					<p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{str(col, 'text')}</p>
				</SurfaceCard>
			))}
		</div>
	);
}

export function VideoBlockView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const src = str(p, 'src');
	const title = str(p, 'title');
	const poster = str(p, 'poster');
	const external = bool(p, 'is_external');
	if (!src) return null;

	if (external || src.includes('youtube') || src.includes('youtu.be')) {
		const embed = embedSrc(src);
		if (!embed) return null;
		return (
			<SurfaceCard className="overflow-hidden p-2">
				{title && <p className="px-4 py-2 font-semibold text-blue-800">{title}</p>}
				<iframe
					title={title || 'video'}
					src={embed}
					className="w-full aspect-video rounded-xl"
					allowFullScreen
				/>
			</SurfaceCard>
		);
	}

	return (
		<SurfaceCard className="overflow-hidden p-2">
			{title && <p className="px-4 py-2 font-semibold text-blue-800">{title}</p>}
			<video
				controls
				className="w-full rounded-xl"
				poster={poster || undefined}
				src={src}
			/>
		</SurfaceCard>
	);
}

export function ListView({ block }: { block: BlockNode }) {
	const p = blockPayload(block);
	const items = stringArray(p, 'items').filter((s) => s.trim());
	const style = str(p, 'style', 'bullet');
	if (!items.length) return null;
	const Tag = style === 'number' ? 'ol' : 'ul';
	const listCls =
		style === 'number'
			? 'list-decimal list-inside space-y-2 text-gray-700'
			: 'list-disc list-inside space-y-2 text-gray-700';
	return (
		<SurfaceCard className="p-6">
			<Tag className={listCls}>
				{items.map((item, i) => (
					<li key={i} className="leading-relaxed">
						{item}
					</li>
				))}
			</Tag>
		</SurfaceCard>
	);
}

export function renderCmsBlockType(
	block: BlockNode,
	_pageTitle: string,
	renderChild: (b: BlockNode) => ReactNode,
): ReactNode | null {
	switch (block.type) {
		case 'tab':
			return null;
		case 'hero':
			return <HeroView block={block} />;
		case 'heading':
			return <HeadingView block={block} />;
		case 'richText':
			return <RichTextView block={block} />;
		case 'quote':
			return <QuoteView block={block} />;
		case 'callout':
			return <CalloutView block={block} />;
		case 'stats':
			return <StatsView block={block} />;
		case 'features':
			return <FeaturesView block={block} />;
		case 'accordion':
			return <AccordionView block={block} />;
		case 'timeline':
			return <TimelineView block={block} />;
		case 'buttonRow':
			return <ButtonRowView block={block} />;
		case 'divider':
			return <DividerView block={block} />;
		case 'embed':
			return <EmbedView block={block} />;
		case 'imageGallery':
			return <ImageGalleryView block={block} />;
		case 'twoColumns':
			return <TwoColumnsView block={block} />;
		case 'video':
			return <VideoBlockView block={block} />;
		case 'list':
			return <ListView block={block} />;
		default:
			return renderChild(block);
	}
}
