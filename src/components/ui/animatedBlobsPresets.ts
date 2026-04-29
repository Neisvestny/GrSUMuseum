import type { AnimatedBlob } from './AnimatedBlobsBackground';

export const BLOB_PRESETS = {
	home: [
		{ w: 300, h: 250, left: '5%', top: '10%', x: 80, y: 60, duration: 14 },
		{ w: 200, h: 200, left: '70%', top: '5%', x: -60, y: 80, duration: 18 },
		{ w: 350, h: 300, left: '60%', top: '60%', x: -80, y: -60, duration: 12 },
		{ w: 250, h: 200, left: '15%', top: '65%', x: 60, y: -80, duration: 16 },
		{ w: 180, h: 180, left: '40%', top: '30%', x: -50, y: 70, duration: 20 },
		{ w: 220, h: 280, left: '85%', top: '35%', x: -70, y: -50, duration: 15 },
		{ w: 160, h: 160, left: '30%', top: '80%', x: 90, y: -40, duration: 11 },
	] satisfies AnimatedBlob[],
	layout: [
		{ w: 300, h: 250, left: '5%', top: '10%', x: 80, y: 60, duration: 14 },
		{ w: 200, h: 200, left: '70%', top: '5%', x: -60, y: 80, duration: 18 },
		{ w: 350, h: 300, left: '60%', top: '60%', x: -80, y: -60, duration: 12 },
		{ w: 250, h: 200, left: '15%', top: '65%', x: 60, y: -80, duration: 16 },
		{ w: 180, h: 180, left: '40%', top: '30%', x: -50, y: 70, duration: 20 },
	] satisfies AnimatedBlob[],
} as const;
