export type BlockNode = {
	id: string;
	type: string;
	schemaVersion: number;
	payload: Record<string, unknown>;
	children: BlockNode[];
};

export type PageDocument = {
	blocks: BlockNode[];
};

export const EMPTY_DOCUMENT: PageDocument = { blocks: [] };

export type MediaItem =
	| { kind: 'photo'; src: string; title?: string; description?: string }
	| {
			kind: 'video';
			src: string;
			title?: string;
			description?: string;
			is_external?: boolean;
	  };
