import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
	children: ReactNode;
	onClose: () => void;
	containerClassName?: string;
	backdropClassName?: string;
};

export default function BaseModal({
	children,
	onClose,
	containerClassName = 'relative z-10 w-full max-w-4xl mx-6',
	backdropClassName = 'absolute inset-0 bg-black/70 backdrop-blur-sm',
}: Props) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.22 }}
			className="fixed inset-0 z-50 flex items-center justify-center"
			onClick={onClose}
		>
			<div className={backdropClassName} />
			<motion.div
				initial={{ scale: 0.95, opacity: 0, y: 16 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.98, opacity: 0, y: 8 }}
				transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
				className={containerClassName}
				onClick={(e) => e.stopPropagation()}
			>
				{children}
			</motion.div>
		</motion.div>
	);
}
