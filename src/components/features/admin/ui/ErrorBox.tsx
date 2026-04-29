type Props = { msg: string };

export function ErrorBox({ msg }: Props) {
	return (
		<div className="px-3 py-2 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm">
			{msg}
		</div>
	);
}
