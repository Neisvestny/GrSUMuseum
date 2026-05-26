import type { BlockNode } from '@museum/document';

export function str(payload: Record<string, unknown>, key: string, fallback = ''): string {
	const v = payload[key];
	return typeof v === 'string' ? v : fallback;
}

export function num(payload: Record<string, unknown>, key: string, fallback: number): number {
	const v = payload[key];
	return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function bool(payload: Record<string, unknown>, key: string, fallback = false): boolean {
	const v = payload[key];
	return typeof v === 'boolean' ? v : fallback;
}

export function recordArray(payload: Record<string, unknown>, key: string): Record<string, unknown>[] {
	const v = payload[key];
	if (!Array.isArray(v)) return [];
	return v.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null);
}

export function stringArray(payload: Record<string, unknown>, key: string): string[] {
	const v = payload[key];
	if (!Array.isArray(v)) return [];
	return v.filter((x): x is string => typeof x === 'string');
}

export function blockPayload(block: BlockNode): Record<string, unknown> {
	return block.payload;
}
