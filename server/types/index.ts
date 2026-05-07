export type Section = 'vov' | 'afgan' | 'olympcoch' | 'olympstud' | 'trainer';

// TODO: когда появятся новые секции (например 'sport')
export function isValidSection(s: unknown): s is Section {
	return (
		s === 'vov' || s === 'afgan' || s === 'olympcoch' || s === 'olympstud' || s === 'trainer'
	);
}

export interface TeacherRow {
	id: number;
	name: string;
	role: string;
	desc: string;
	img: string;
}

export interface RectorRow {
	id: number;
	position: number;
	name: string;
	years: string;
	description: string;
	full_text: string;
	img: string;
	images: string[];
	files: { name: string; url: string }[];
}

export interface PageRow {
	id: number;
	slug: string;
	title: string;
	template: PageTemplate;
}

export type PageTemplate =
	| 'tabs_alternating'
	| 'alternating_blocks'
	| 'text_image'
	| 'tabs_text_image';

/** Вариант вёрстки контента вкладки или блока (без «tabs_*»). */
export type ContentTemplate = 'alternating_blocks' | 'text_image';

export interface PageTabRow {
	id: number;
	page_id: number;
	position: number;
	label: string;
	template: ContentTemplate | null;
}

export interface PageBlockRow {
	id: number;
	page_id: number | null;
	tab_id: number | null;
	position: number;
	img: string | null;
	template: ContentTemplate | null;
}

export interface PageParagraphRow {
	id: number;
	block_id: number;
	position: number;
	text: string;
}

export interface MenuItemRow {
	id: number;
	section: string;
	position: number;
	label: string;
	path: string;
	is_active: boolean;
}

export interface PageDto {
	id: number;
	slug: string;
	title: string;
	template: PageTemplate;
	media: MediaItem[];
	tabs: Array<{
		id: number;
		position: number;
		label: string;
		template: ContentTemplate | null;
		media: MediaItem[];
		blocks: BlockDto[];
	}>;
	blocks: BlockDto[];
}

export type MediaItem =
	| {
			kind: 'photo';
			src: string;
			title?: string;
			description?: string;
	  }
	| {
			kind: 'video';
			src: string;
			title?: string;
			description?: string;
			is_external?: boolean;
	  };

export interface BlockDto {
	id: number;
	position: number;
	img: string | null;
	template: ContentTemplate | null;
	paragraphs: Array<{
		id: number;
		position: number;
		text: string;
	}>;
}

export interface GalleryPhotoRow {
	id: number;
	src: string;
	title: string;
	annotation: string;
	year: number;
	position: number;
}

export interface GalleryVideoRow {
	id: number;
	src: string;
	title: string;
	description: string;
	tags: string[];
	duration: string | null;
	is_external: boolean;
	position: number;
}
