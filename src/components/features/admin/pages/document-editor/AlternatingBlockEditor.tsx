import TextImageBlockEditor from './TextImageBlockEditor';
import type { BlockNode } from '../../../../../types/document';

export default function AlternatingBlockEditor({
	block,
	onChange,
}: {
	block: BlockNode;
	onChange: (patch: Record<string, unknown>) => void;
}) {
	return <TextImageBlockEditor block={block} onChange={onChange} />;
}
