import { useEffect } from 'react';
import type { MediaBrowseEntry } from '../../../../api/media';
import AdminButton from '../ui/AdminButton';
import FileManager from './FileManager';

export default function FileManagerModal({
	open,
	title = 'Выбор файла',
	onClose,
	onPick,
}: {
	open: boolean;
	title?: string;
	onClose: () => void;
	onPick: (url: string, entry: MediaBrowseEntry) => void;
}) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50">
			<div
				className="absolute inset-0 bg-black/40"
				onMouseDown={() => onClose()}
				role="presentation"
			/>
			<div className="absolute inset-0 p-4 md:p-8 flex items-start justify-center overflow-auto">
				<div
					className="w-full max-w-6xl bg-white rounded-3xl border-2 border-blue-100 shadow-2xl overflow-hidden"
					onMouseDown={(e) => e.stopPropagation()}
					role="presentation"
				>
					<div className="flex items-center justify-between px-6 py-4 border-b border-blue-50 bg-blue-50/40">
						<div className="text-blue-900 font-bold">{title}</div>
						<AdminButton size="sm" variant="secondary" onClick={onClose}>
							Закрыть
						</AdminButton>
					</div>
					<div className="p-4">
						<FileManager
							initialRoot="images"
							onPick={(url, entry) => {
								onPick(url, entry);
								onClose();
							}}
							allowPickKinds={['file']}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

