import type { BlockNode } from '../types/document';

/** Все типы блоков CMS (строка в JSON — без миграции БД). */
export type BlockType =
	| 'tabs'
	| 'tab'
	| 'textImage'
	| 'alternating'
	| 'mediaStrip'
	| 'hero'
	| 'heading'
	| 'richText'
	| 'quote'
	| 'callout'
	| 'stats'
	| 'features'
	| 'accordion'
	| 'timeline'
	| 'buttonRow'
	| 'divider'
	| 'embed'
	| 'imageGallery'
	| 'twoColumns'
	| 'video'
	| 'list';

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
	tabs: 'Вкладки',
	tab: 'Вкладка',
	textImage: 'Текст и фото',
	alternating: 'Текст с фото (чередование)',
	mediaStrip: 'Медиа-лента',
	hero: 'Обложка (hero)',
	heading: 'Заголовок',
	richText: 'Текстовый блок',
	quote: 'Цитата',
	callout: 'Выноска / подсказка',
	stats: 'Цифры и факты',
	features: 'Карточки преимуществ',
	accordion: 'Аккордеон (FAQ)',
	timeline: 'Хронология',
	buttonRow: 'Кнопки-ссылки',
	divider: 'Разделитель',
	embed: 'Встраивание (iframe)',
	imageGallery: 'Сетка фотографий',
	twoColumns: 'Две колонки текста',
	video: 'Видео',
	list: 'Список',
};

export const BLOCK_TYPE_GROUPS: Array<{ label: string; types: BlockType[] }> = [
	{
		label: 'Структура',
		types: ['tabs'],
	},
	{
		label: 'Текст и медиа',
		types: [
			'hero',
			'heading',
			'richText',
			'textImage',
			'alternating',
			'quote',
			'callout',
			'list',
			'twoColumns',
		],
	},
	{
		label: 'Галереи и видео',
		types: ['mediaStrip', 'imageGallery', 'video', 'embed'],
	},
	{
		label: 'Секции и сетки',
		types: ['stats', 'features', 'accordion', 'timeline', 'buttonRow'],
	},
	{
		label: 'Прочее',
		types: ['divider'],
	},
];

const LEAF_BLOCK_TYPES: BlockType[] = BLOCK_TYPE_GROUPS.flatMap((g) => g.types).filter(
	(t) => t !== 'tabs',
);

export const TOP_LEVEL_BLOCK_TYPES: BlockType[] = ['tabs', ...LEAF_BLOCK_TYPES];

export const TAB_CHILD_BLOCK_TYPES: BlockType[] = [...LEAF_BLOCK_TYPES];

export function defaultPayload(type: BlockType): Record<string, unknown> {
	switch (type) {
		case 'tabs':
			return {};
		case 'tab':
			return { label: 'Новая вкладка', media: [] };
		case 'textImage':
		case 'alternating':
			return { text: '', image: '' };
		case 'mediaStrip':
			return { items: [] };
		case 'hero':
			return {
				title: 'Заголовок страницы',
				subtitle: '',
				image: '',
				buttonLabel: '',
				buttonHref: '',
				align: 'left',
			};
		case 'heading':
			return { text: 'Заголовок', level: 2, align: 'left' };
		case 'richText':
			return { text: '', align: 'left' };
		case 'quote':
			return { text: '', author: '' };
		case 'callout':
			return { variant: 'info', title: '', text: '' };
		case 'stats':
			return {
				items: [
					{ value: '100+', label: 'Студентов' },
					{ value: '50', label: 'Преподавателей' },
				],
			};
		case 'features':
			return {
				items: [
					{ icon: '🎓', title: 'Образование', text: 'Описание' },
					{ icon: '🔬', title: 'Наука', text: 'Описание' },
				],
			};
		case 'accordion':
			return {
				items: [{ title: 'Вопрос', body: 'Ответ' }],
			};
		case 'timeline':
			return {
				items: [{ year: '2020', title: 'Событие', text: 'Описание' }],
			};
		case 'buttonRow':
			return {
				align: 'left',
				buttons: [{ label: 'Подробнее', href: '/', variant: 'primary' }],
			};
		case 'divider':
			return { style: 'line', size: 'md' };
		case 'embed':
			return { url: '', title: '', height: 400 };
		case 'imageGallery':
			return { images: [''], columns: 3 };
		case 'twoColumns':
			return {
				columns: [
					{ title: 'Колонка 1', text: '' },
					{ title: 'Колонка 2', text: '' },
				],
			};
		case 'video':
			return { src: '', title: '', poster: '', is_external: false };
		case 'list':
			return { style: 'bullet', items: ['Пункт списка'] };
		default:
			return {};
	}
}

export function newBlockId(): string {
	return crypto.randomUUID();
}

export function createBlock(type: BlockType): BlockNode {
	if (type === 'tabs') {
		return {
			id: newBlockId(),
			type,
			schemaVersion: 1,
			payload: defaultPayload(type),
			children: [createBlock('tab')],
		};
	}
	return {
		id: newBlockId(),
		type,
		schemaVersion: 1,
		payload: defaultPayload(type),
		children: [],
	};
}
