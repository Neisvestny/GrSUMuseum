type Block = {
	text: string;
	img?: string;
};

type Props = {
	blocks: Block[];
};

export default function AlternatingBlocks({ blocks }: Props) {
	let imgCounter = 0;

	return (
		<div className="bg-white/70 backdrop-blur-md rounded-2xl border-2 border-blue-100 shadow-sm p-8 flex flex-col gap-10">
			{blocks.map((block, i) => {
				if (!block.img) {
					return (
						<p key={i} className="text-gray-600 text-lg leading-relaxed">
							{block.text}
						</p>
					);
				}

				const isEven = imgCounter % 2 === 0;
				imgCounter++;

				return (
					<div
						key={i}
						className={`flex gap-8 items-start ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
					>
						<div className="w-96 shrink-0 rounded-xl overflow-hidden border-2 border-blue-100">
							<img src={block.img} alt="" className="w-full h-full object-cover" />
						</div>
						<div className="flex-1 flex items-center">
							<p className="text-gray-600 text-lg leading-relaxed">{block.text}</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}
