import type { TaxonomyItem } from '../../../../api/people';
import { adminLabelClass } from '../ui/adminFormStyles';

type Props = {
	label: string;
	options: TaxonomyItem[];
	selected: string[];
	onChange: (slugs: string[]) => void;
	emptyHint?: string;
};

export default function TaxonomyMultiSelect({
	label,
	options,
	selected,
	onChange,
	emptyHint = 'Создайте элементы во вкладке «Справочники»',
}: Props) {
	const toggle = (slug: string) => {
		if (selected.includes(slug)) {
			onChange(selected.filter((s) => s !== slug));
		} else {
			onChange([...selected, slug]);
		}
	};

	return (
		<div>
			<span className={adminLabelClass}>{label}</span>
			{options.length === 0 ? (
				<p className="text-xs text-gray-400 mt-1">{emptyHint}</p>
			) : (
				<div className="flex flex-wrap gap-2 mt-1">
					{options.map((opt) => {
						const active = selected.includes(opt.slug);
						return (
							<button
								key={opt.id}
								type="button"
								onClick={() => toggle(opt.slug)}
								className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all active:scale-95 ${
									active
										? 'bg-blue-700 text-white border-blue-700 shadow-sm'
										: 'bg-white text-blue-800 border-blue-200 hover:border-blue-400'
								}`}
							>
								{opt.label}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
