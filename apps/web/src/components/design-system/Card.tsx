import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
	className?: string;
};

export function SurfaceCard({ children, className = '' }: Props) {
	return (
		<div
			className={`bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 shadow-sm ${className}`}
		>
			{children}
		</div>
	);
}

export function PlainCard({ children, className = '' }: Props) {
	return (
		<div className={`bg-white rounded-2xl border-2 border-blue-100 shadow-sm ${className}`}>
			{children}
		</div>
	);
}
