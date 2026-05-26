type Tab<T extends string> = {
	id: T;
	label: string;
};

type Props<T extends string> = {
	tabs: ReadonlyArray<Tab<T>>;
	activeTab: T;
	onChange: (id: T) => void;
};

export default function TabsBar<T extends string>({ tabs, activeTab, onChange }: Props<T>) {
	return (
		<div className="relative z-10 flex items-center gap-3 mb-6">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					onClick={() => onChange(tab.id)}
					className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold text-sm text-center transition-all duration-200 active:scale-95 ${
						activeTab === tab.id
							? 'bg-blue-700 border-blue-700 text-white shadow-lg'
							: 'bg-white/80 border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-white'
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}
