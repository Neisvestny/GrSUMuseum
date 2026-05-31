export type AlternatingItem = {
	text: string;
	image?: string;
};

function readImage(raw: Record<string, unknown>): string | undefined {
	const image =
		typeof raw.image === 'string'
			? raw.image.trim()
			: typeof raw.img === 'string'
				? raw.img.trim()
				: '';
	return image || undefined;
}

function parseItem(raw: unknown): AlternatingItem {
	if (typeof raw !== 'object' || raw === null) return emptyAlternatingItem();
	const obj = raw as Record<string, unknown>;
	const text = typeof obj.text === 'string' ? obj.text : '';
	const image = readImage(obj);
	return { text, image };
}

export function readAlternatingItems(payload: Record<string, unknown>): AlternatingItem[] {
	if (Array.isArray(payload.items)) {
		if (payload.items.length > 0) {
			return payload.items.map(parseItem);
		}
	}

	const text = typeof payload.text === 'string' ? payload.text : '';
	const image = readImage(payload);
	if (text || image) return [{ text, image }];

	return [{ text: '', image: '' }];
}

export function alternatingItemsForRender(payload: Record<string, unknown>): AlternatingItem[] {
	return readAlternatingItems(payload).filter((item) => item.text.trim() || item.image);
}

export function emptyAlternatingItem(): AlternatingItem {
	return { text: '', image: '' };
}
