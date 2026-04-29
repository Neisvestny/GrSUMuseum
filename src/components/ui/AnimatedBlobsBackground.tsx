import { motion } from 'framer-motion';

export type AnimatedBlob = {
	w: number;
	h: number;
	left: string;
	top: string;
	x: number;
	y: number;
	duration: number;
};

type AnimatedBlobsBackgroundProps = {
	blobs: readonly AnimatedBlob[];
	className?: string;
};

export function AnimatedBlobsBackground({ blobs, className }: AnimatedBlobsBackgroundProps) {
	return (
		<div className={className ?? 'absolute inset-0'}>
			{blobs.map((blob, i) => (
				<motion.div
					key={i}
					className="absolute rounded-full bg-blue-300/40"
					style={{
						width: blob.w,
						height: blob.h,
						left: blob.left,
						top: blob.top,
						filter: 'blur(60px)',
					}}
					animate={{
						x: [0, blob.x, 0],
						y: [0, blob.y, 0],
					}}
					transition={{
						duration: blob.duration,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
				/>
			))}
		</div>
	);
}
