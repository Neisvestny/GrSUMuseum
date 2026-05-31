export type RemoteVideoMeta = {
	title?: string;
	duration?: string;
};

export function extractYoutubeId(url: string): string | null {
	const match = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
	);
	return match ? match[1] : null;
}

export function formatDuration(seconds: number): string {
	const total = Math.max(0, Math.round(seconds));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${m}:${String(s).padStart(2, '0')}`;
}

type NoembedResponse = {
	title?: string;
	duration?: number;
};

type OembedResponse = {
	title?: string;
};

type InnertubeResponse = {
	videoDetails?: {
		title?: string;
		lengthSeconds?: string;
	};
};

const YOUTUBE_USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchYoutubeInnertube(videoId: string): Promise<RemoteVideoMeta | null> {
	const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': YOUTUBE_USER_AGENT,
		},
		body: JSON.stringify({
			context: {
				client: {
					clientName: 'WEB',
					clientVersion: '2.20240101.00.00',
				},
			},
			videoId,
		}),
		signal: AbortSignal.timeout(8000),
	});
	if (!response.ok) return null;

	const data = (await response.json()) as InnertubeResponse;
	const details = data.videoDetails;
	if (!details) return null;

	const meta: RemoteVideoMeta = {};
	if (typeof details.title === 'string' && details.title.trim()) {
		meta.title = details.title.trim();
	}
	const seconds = Number(details.lengthSeconds);
	if (Number.isFinite(seconds) && seconds > 0) {
		meta.duration = formatDuration(seconds);
	}
	return Object.keys(meta).length > 0 ? meta : null;
}

async function fetchYoutubeWatchPageDuration(videoId: string): Promise<string | null> {
	const response = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
		headers: { 'User-Agent': YOUTUBE_USER_AGENT },
		signal: AbortSignal.timeout(8000),
	});
	if (!response.ok) return null;

	const html = await response.text();
	const match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
	if (!match) return null;

	const seconds = Number(match[1]);
	if (!Number.isFinite(seconds) || seconds <= 0) return null;
	return formatDuration(seconds);
}

async function fetchNoembed(url: string): Promise<RemoteVideoMeta | null> {
	const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
	const response = await fetch(endpoint, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(8000),
	});
	if (!response.ok) return null;

	const data = (await response.json()) as NoembedResponse;
	const meta: RemoteVideoMeta = {};
	if (typeof data.title === 'string' && data.title.trim()) {
		meta.title = data.title.trim();
	}
	if (typeof data.duration === 'number' && Number.isFinite(data.duration) && data.duration > 0) {
		meta.duration = formatDuration(data.duration);
	}
	return Object.keys(meta).length > 0 ? meta : null;
}

async function fetchYoutubeOembed(url: string): Promise<RemoteVideoMeta | null> {
	const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
	const response = await fetch(endpoint, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(8000),
	});
	if (!response.ok) return null;

	const data = (await response.json()) as OembedResponse;
	if (typeof data.title !== 'string' || !data.title.trim()) return null;
	return { title: data.title.trim() };
}

export async function fetchYoutubeMeta(url: string): Promise<RemoteVideoMeta | null> {
	const videoId = extractYoutubeId(url);
	if (!videoId) return null;

	try {
		const innertube = await fetchYoutubeInnertube(videoId);
		if (innertube?.title && innertube.duration) return innertube;
		if (innertube?.title) {
			const duration = innertube.duration ?? (await fetchYoutubeWatchPageDuration(videoId));
			return duration ? { ...innertube, duration } : innertube;
		}
		if (innertube?.duration) {
			const title =
				(await fetchYoutubeOembed(url))?.title ?? (await fetchNoembed(url))?.title;
			return title ? { title, duration: innertube.duration } : innertube;
		}
	} catch {
		// fall through
	}

	const meta: RemoteVideoMeta = {};

	try {
		const noembed = await fetchNoembed(url);
		if (noembed?.title) meta.title = noembed.title;
		if (noembed?.duration) meta.duration = noembed.duration;
	} catch {
		// ignore
	}

	if (!meta.title) {
		try {
			const oembed = await fetchYoutubeOembed(url);
			if (oembed?.title) meta.title = oembed.title;
		} catch {
			// ignore
		}
	}

	if (!meta.duration) {
		try {
			const duration = await fetchYoutubeWatchPageDuration(videoId);
			if (duration) meta.duration = duration;
		} catch {
			// ignore
		}
	}

	return Object.keys(meta).length > 0 ? meta : null;
}
