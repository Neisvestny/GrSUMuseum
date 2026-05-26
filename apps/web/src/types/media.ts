export type MediaItem =
	| { kind: 'photo'; src: string; title?: string; description?: string }
	| {
			kind: 'video';
			src: string;
			title?: string;
			description?: string;
			is_external?: boolean;
	  };
