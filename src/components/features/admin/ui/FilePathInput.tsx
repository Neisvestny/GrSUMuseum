import { useState } from 'react';
import FileManagerModal from '../files/FileManagerModal';
import { adminInputClass, adminLabelClass } from './adminFormStyles';

export default function FilePathInput({
	label = 'Файл',
	value,
	onChange,
	placeholder = '/images/file.ext или https://...',
}: {
	label?: string;
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
}) {
	const [pickerOpen, setPickerOpen] = useState(false);

	return (
		<div className="relative">
			<label className="block">
				<span className={adminLabelClass}>{label}</span>
				<div className="flex items-stretch gap-2">
					<input
						className={adminInputClass}
						value={value}
						placeholder={placeholder}
						onChange={(e) => onChange(e.target.value)}
					/>
					<button
						type="button"
						onClick={() => setPickerOpen(true)}
						className="px-4 rounded-xl border-2 border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50 active:scale-95 transition-all"
					>
						Выбрать…
					</button>
				</div>
			</label>

			<FileManagerModal
				open={pickerOpen}
				title="Файловый менеджер"
				onClose={() => setPickerOpen(false)}
				onPick={(url) => onChange(url)}
			/>
		</div>
	);
}

