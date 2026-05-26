type Props = {
	onYes: () => void;
	onNo: () => void;
	busy: boolean;
};

export function ConfirmDelete({ onYes, onNo, busy }: Props) {
	return (
		<div className="flex gap-1 items-center">
			<span className="text-red-500 text-xs font-semibold">Удалить?</span>
			<button
				onClick={onYes}
				disabled={busy}
				className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-40"
			>
				{busy ? '...' : 'Да'}
			</button>
			<button
				onClick={onNo}
				className="px-3 py-1.5 rounded-xl border-2 border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 active:scale-95 transition-all"
			>
				Нет
			</button>
		</div>
	);
}
