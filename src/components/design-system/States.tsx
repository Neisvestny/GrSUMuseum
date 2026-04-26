export function LoadingState({ text = 'Загрузка...' }: { text?: string }) {
	return (
		<div className="flex-1 flex items-center justify-center text-blue-600">
			<div className="text-lg font-medium">{text}</div>
		</div>
	);
}

export function ErrorState({ text }: { text: string }) {
	return <div className="flex-1 flex items-center justify-center text-red-500">{text}</div>;
}

export function EmptyState({ text }: { text: string }) {
	return (
		<div className="flex-1 flex items-center justify-center text-gray-400 text-lg">{text}</div>
	);
}

export function InlineError({ text }: { text: string }) {
	return (
		<div className="px-3 py-2 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm">
			{text}
		</div>
	);
}
