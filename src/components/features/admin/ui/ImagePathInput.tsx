import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchImagesIndex } from '../../../../api/images';
import FileManagerModal from '../files/FileManagerModal';
import { adminInputClass, adminLabelClass } from './adminFormStyles';

type Suggestion = { name: string; url: string };

function isExternalUrl(value: string) {
	return /^https?:\/\//i.test(value.trim());
}

function normalizeLocalValue(raw: string) {
	const v = raw.trim();
	if (!v) return { display: '', stored: '' };
	if (isExternalUrl(v)) return { display: v, stored: v };
	const cleaned = v.replace(/^\/?images\//i, '').replace(/^\//, '');
	return { display: cleaned, stored: `/images/${cleaned}` };
}

export default function ImagePathInput({
	label = 'Главное фото',
	value,
	onChange,
	placeholder = 'например: rector.jpg',
}: {
	label?: string;
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
}) {
	const [open, setOpen] = useState(false);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const rootRef = useRef<HTMLDivElement>(null);

	const normalized = useMemo(() => normalizeLocalValue(value ?? ''), [value]);
	const showSuggestions = useMemo(
		() => open && !isExternalUrl(value ?? '') && normalized.display.length > 0,
		[open, value, normalized.display.length],
	);

	useEffect(() => {
		if (!showSuggestions) return;
		let cancelled = false;
		setBusy(true);
		fetchImagesIndex(normalized.display)
			.then((data) => {
				if (cancelled) return;
				const list = data.files.slice(0, 12).map((name) => ({
					name,
					url: `${data.baseUrl}${name}`,
				}));
				setSuggestions(list);
			})
			.catch(() => {
				if (cancelled) return;
				setSuggestions([]);
			})
			.finally(() => {
				if (cancelled) return;
				setBusy(false);
			});

		return () => {
			cancelled = true;
		};
	}, [showSuggestions, normalized.display]);

	useEffect(() => {
		const onDocMouseDown = (e: MouseEvent) => {
			const el = rootRef.current;
			if (!el) return;
			if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
		};
		document.addEventListener('mousedown', onDocMouseDown);
		return () => document.removeEventListener('mousedown', onDocMouseDown);
	}, []);

	return (
		<div ref={rootRef} className="relative">
			<label className="block">
				<span className={adminLabelClass}>
					{label}{' '}
					<span className="text-gray-400 font-normal">(URL или файл из /images)</span>
				</span>
				<div className="flex items-stretch gap-2">
					{!isExternalUrl(value ?? '') && (
						<div className="px-4 whitespace-nowrap flex items-center rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold select-none">
							/images/
						</div>
					)}
					<input
						className={adminInputClass}
						value={isExternalUrl(value ?? '') ? (value ?? '') : normalized.display}
						placeholder={isExternalUrl(value ?? '') ? 'https://...' : placeholder}
						onFocus={() => setOpen(true)}
						onChange={(e) => {
							const raw = e.target.value;
							const next = normalizeLocalValue(raw).stored;
							onChange(next);
							setOpen(true);
						}}
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

			{showSuggestions && (
				<div className="absolute z-30 mt-2 w-full rounded-2xl border-2 border-blue-100 bg-white shadow-lg overflow-hidden">
					<div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-blue-50">
						{busy ? 'Поиск изображений…' : 'Изображения в /images'}
					</div>
					{suggestions.length === 0 && !busy ? (
						<div className="px-4 py-3 text-sm text-gray-400">Ничего не найдено</div>
					) : (
						<div className="max-h-64 overflow-y-auto">
							{suggestions.map((s) => (
								<button
									key={s.name}
									type="button"
									onClick={() => {
										onChange(s.url);
										setOpen(false);
									}}
									className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 text-left"
								>
									<img
										src={s.url}
										alt={s.name}
										className="w-12 h-12 rounded-xl object-cover border border-blue-100 bg-blue-50"
										loading="lazy"
									/>
									<div className="min-w-0">
										<div className="text-sm font-semibold text-blue-800 truncate">
											{s.name}
										</div>
										<div className="text-xs text-gray-400 truncate">
											{s.url}
										</div>
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			)}

			<FileManagerModal
				open={pickerOpen}
				title="Файловый менеджер"
				onClose={() => setPickerOpen(false)}
				onPick={(url) => onChange(url)}
			/>
		</div>
	);
}
