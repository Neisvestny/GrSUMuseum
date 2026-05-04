import { useEffect, useMemo } from 'react';
import { adminInputClass, adminLabelClass } from './adminFormStyles';

type Props = {
	label?: string;
	value: string;
	onChange: (next: string) => void;
	onErrorChange?: (msg: string | null) => void;
	minYear?: number;
	maxYear?: number;
};

function parseYears(value: string) {
	if (!value) return { from: '', to: '' };
	const parts = value.split('—').map((v) => v.trim());
	return { from: parts[0] ?? '', to: parts[1] ?? '' };
}

function formatYears(from: string, to: string) {
	if (!from && !to) return '';
	if (from && to) return `${from} — ${to}`;
	return from || to;
}

export default function YearsRangeInput({
	label = 'Годы работы',
	value,
	onChange,
	onErrorChange,
	minYear = 1800,
	maxYear = 2100,
}: Props) {
	const parsed = useMemo(() => parseYears(value), [value]);

	const validate = (fromRaw: string, toRaw: string) => {
		const from = fromRaw ? Number(fromRaw) : null;
		const to = toRaw ? Number(toRaw) : null;

		if (!from || !to) return null;
		if (to <= from) return 'Конечный год должен быть больше начального';

		return null;
	};

	const err = useMemo(() => validate(parsed.from, parsed.to), [parsed]);

	useEffect(() => {
		onErrorChange?.(err);
	}, [err, onErrorChange]);

	return (
		<div className="flex flex-col gap-2">
			<span className={adminLabelClass}>{label}</span>

			<div className="flex items-center gap-2">
				<input
					className={adminInputClass}
					style={{ width: 140 }}
					inputMode="numeric"
					type="number"
					min={minYear}
					max={maxYear}
					value={parsed.from}
					placeholder="с"
					onChange={(e) => onChange(formatYears(e.target.value, parsed.to))}
				/>

				<span className="text-gray-400 font-semibold">—</span>

				<input
					className={adminInputClass}
					style={{ width: 140 }}
					inputMode="numeric"
					type="number"
					min={minYear}
					max={maxYear}
					value={parsed.to}
					placeholder="по"
					onChange={(e) => onChange(formatYears(parsed.from, e.target.value))}
				/>

				{err && <span className="text-xs font-semibold text-red-500 ml-2">{err}</span>}
			</div>
		</div>
	);
}
