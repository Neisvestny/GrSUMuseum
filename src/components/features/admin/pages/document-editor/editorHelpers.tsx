import AdminButton from '../../ui/AdminButton';
import { adminInputClass, adminLabelClass } from '../../ui/adminFormStyles';

export function FieldLabel({ children }: { children: React.ReactNode }) {
	return <span className={adminLabelClass}>{children}</span>;
}

export function TextInput({
	label,
	value,
	onChange,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
}) {
	return (
		<label className="block">
			<FieldLabel>{label}</FieldLabel>
			<input
				className={adminInputClass}
				value={value}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
			/>
		</label>
	);
}

export function TextArea({
	label,
	value,
	onChange,
	rows = 4,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	rows?: number;
}) {
	return (
		<label className="block">
			<FieldLabel>{label}</FieldLabel>
			<textarea
				className={`${adminInputClass} resize-y`}
				rows={rows}
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
		</label>
	);
}

export function SelectInput({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	options: Array<{ value: string; label: string }>;
}) {
	return (
		<label className="block">
			<FieldLabel>{label}</FieldLabel>
			<select className={adminInputClass} value={value} onChange={(e) => onChange(e.target.value)}>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</label>
	);
}

export function RecordListEditor({
	label,
	items,
	onChange,
	fields,
	makeEmpty,
}: {
	label: string;
	items: Record<string, unknown>[];
	onChange: (items: Record<string, unknown>[]) => void;
	fields: Array<{ key: string; label: string; placeholder?: string }>;
	makeEmpty: () => Record<string, unknown>;
}) {
	return (
		<div>
			<FieldLabel>{label}</FieldLabel>
			<div className="flex flex-col gap-2 mt-1">
				{items.map((item, idx) => (
					<div
						key={idx}
						className="rounded-lg border border-stone-200 p-3 flex flex-col gap-2 bg-stone-50/50"
					>
						{fields.map((f) => (
							<input
								key={f.key}
								className={adminInputClass}
								placeholder={f.placeholder ?? f.label}
								value={typeof item[f.key] === 'string' ? (item[f.key] as string) : ''}
								onChange={(e) => {
									const next = [...items];
									next[idx] = { ...next[idx], [f.key]: e.target.value };
									onChange(next);
								}}
							/>
						))}
						<AdminButton
							type="button"
							size="sm"
							variant="danger"
							onClick={() => onChange(items.filter((_, i) => i !== idx))}
						>
							Удалить
						</AdminButton>
					</div>
				))}
				<AdminButton
					type="button"
					size="sm"
					variant="secondary"
					onClick={() => onChange([...items, makeEmpty()])}
				>
					+ Добавить
				</AdminButton>
			</div>
		</div>
	);
}

export function StringListEditor({
	label,
	items,
	onChange,
	placeholder,
}: {
	label: string;
	items: string[];
	onChange: (items: string[]) => void;
	placeholder?: string;
}) {
	return (
		<div>
			<FieldLabel>{label}</FieldLabel>
			<div className="flex flex-col gap-2 mt-1">
				{items.map((item, idx) => (
					<div key={idx} className="flex gap-2">
						<input
							className={adminInputClass}
							value={item}
							placeholder={placeholder}
							onChange={(e) => {
								const next = [...items];
								next[idx] = e.target.value;
								onChange(next);
							}}
						/>
						<AdminButton
							type="button"
							size="sm"
							variant="danger"
							onClick={() => onChange(items.filter((_, i) => i !== idx))}
						>
							✕
						</AdminButton>
					</div>
				))}
				<AdminButton
					type="button"
					size="sm"
					variant="secondary"
					onClick={() => onChange([...items, ''])}
				>
					+ Строка
				</AdminButton>
			</div>
		</div>
	);
}
