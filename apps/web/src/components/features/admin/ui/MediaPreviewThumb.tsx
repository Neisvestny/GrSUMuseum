import { useRef, useState } from 'react';
import type { MediaRoot } from '../../../../api/media';
import {
	getFileExtension,
	getFileTypeIcon,
	getPreviewKind,
	getVideoThumbnail,
	type PreviewKind,
} from '../../../../lib/media-preview';
import { resolvePublicAssetUrl } from '../../../../lib/public-asset-url';

type MediaPreviewThumbProps = {
	url: string;
	root?: MediaRoot;
	mimeType?: string | null;
	fileName?: string;
	size?: 'sm' | 'lg';
	className?: string;
};

const sizeClasses = {
	sm: 'w-12 h-12 rounded-lg',
	lg: 'w-full aspect-video rounded-xl',
} as const;

function PlayOverlay({ large }: { large?: boolean }) {
	return (
		<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div
				className={`relative flex items-center justify-center rounded-full bg-black/45 text-white ${
					large ? 'w-14 h-14' : 'w-8 h-8'
				}`}
			>
				<span
					className={`absolute inset-0 rounded-full border-2 border-white/60 animate-ping ${
						large ? 'opacity-40' : 'opacity-30'
					}`}
					aria-hidden
				/>
				<span className={large ? 'text-2xl ml-1' : 'text-sm ml-0.5'} aria-hidden>
					▶
				</span>
			</div>
			<div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
		</div>
	);
}

function FileTypeBadge({
	ext,
	large,
}: {
	ext: string;
	large?: boolean;
}) {
	const meta = getFileTypeIcon(ext);
	return (
		<div
			className={`flex flex-col items-center justify-center w-full h-full ${meta.bgClass} ${
				large ? 'gap-1 p-3' : 'gap-0.5 p-1'
			}`}
		>
			<span className={large ? 'text-3xl' : 'text-xl'} aria-hidden>
				{meta.icon}
			</span>
			<span className={`font-bold uppercase ${large ? 'text-xs' : 'text-[9px] leading-none'}`}>
				{meta.label}
			</span>
		</div>
	);
}

function ImagePreview({
	src,
	onFallback,
}: {
	src: string;
	onFallback: () => void;
}) {
	return (
		<img
			src={src}
			alt=""
			loading="lazy"
			className="w-full h-full object-cover"
			onError={onFallback}
		/>
	);
}

function LocalVideoPreview({ src, large }: { src: string; large?: boolean }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [hovering, setHovering] = useState(false);

	return (
		<div
			className="relative w-full h-full bg-black"
			onMouseEnter={() => {
				setHovering(true);
				void videoRef.current?.play().catch(() => undefined);
			}}
			onMouseLeave={() => {
				setHovering(false);
				const el = videoRef.current;
				if (!el) return;
				el.pause();
				el.currentTime = 0;
			}}
		>
			<video
				ref={videoRef}
				src={src}
				muted
				playsInline
				preload="metadata"
				loop={hovering}
				className="w-full h-full object-cover"
			/>
			{!hovering && <PlayOverlay large={large} />}
		</div>
	);
}

function RemoteVideoPreview({
	thumbnail,
	large,
}: {
	thumbnail: string;
	large?: boolean;
}) {
	const [failed, setFailed] = useState(false);
	if (failed) {
		return (
			<div className="w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
				<PlayOverlay large={large} />
			</div>
		);
	}
	return (
		<div className="relative w-full h-full bg-black">
			<img
				src={thumbnail}
				alt=""
				loading="lazy"
				className="w-full h-full object-cover"
				onError={() => setFailed(true)}
			/>
			<PlayOverlay large={large} />
		</div>
	);
}

export default function MediaPreviewThumb({
	url,
	root,
	mimeType,
	fileName,
	size = 'sm',
	className = '',
}: MediaPreviewThumbProps) {
	const [imageFailed, setImageFailed] = useState(false);
	const kind: PreviewKind = getPreviewKind({ root, url, mimeType, fileName });
	const ext = getFileExtension(fileName ?? url);
	const large = size === 'lg';
	const frameClass = `${sizeClasses[size]} overflow-hidden shrink-0 border border-blue-100 bg-blue-50/30 ${className}`;

	if (kind === 'file' || (kind === 'image' && imageFailed)) {
		return (
			<div className={frameClass}>
				<FileTypeBadge ext={ext} large={large} />
			</div>
		);
	}

	if (kind === 'image') {
		return (
			<div className={frameClass}>
				<ImagePreview src={resolvePublicAssetUrl(url)} onFallback={() => setImageFailed(true)} />
			</div>
		);
	}

	const remoteThumb = getVideoThumbnail(url);
	return (
		<div className={frameClass}>
			{remoteThumb ? (
				<RemoteVideoPreview thumbnail={remoteThumb} large={large} />
			) : (
				<LocalVideoPreview src={resolvePublicAssetUrl(url)} large={large} />
			)}
		</div>
	);
}
