import type { FormEvent, ReactNode } from 'react';
import AdminButton from './AdminButton';

type Props = {
	onSubmit: () => void | Promise<void>;
	disabled?: boolean;
	submitLabel: string;
	className?: string;
	children: ReactNode;
};

export default function AdminCreateForm({
	onSubmit,
	disabled,
	submitLabel,
	className = '',
	children,
}: Props) {
	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		void onSubmit();
	};

	return (
		<form
			onSubmit={handleSubmit}
			className={`flex flex-wrap gap-3 items-end ${className}`}
		>
			{children}
			<AdminButton type="submit" disabled={disabled} variant="primary" size="md">
				{submitLabel}
			</AdminButton>
		</form>
	);
}
