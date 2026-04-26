import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
	primary:
		'bg-blue-700 border-blue-700 text-white hover:bg-blue-800 hover:border-blue-800 shadow-md hover:shadow-lg',
	secondary:
		'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm hover:shadow-md',
	danger: 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600 shadow-sm hover:shadow-md',
	ghost: 'bg-transparent border-transparent text-blue-700 hover:bg-blue-50',
};

const sizeClasses: Record<Size, string> = {
	sm: 'px-3 py-1.5 text-xs rounded-xl',
	md: 'px-4 py-2 text-sm rounded-xl',
	lg: 'px-8 py-3 text-lg rounded-2xl',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
	size?: Size;
	children: ReactNode;
};

export default function Button({
	variant = 'secondary',
	size = 'md',
	className = '',
	children,
	...rest
}: Props) {
	return (
		<button
			{...rest}
			className={`border-2 font-semibold transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
		>
			{children}
		</button>
	);
}
