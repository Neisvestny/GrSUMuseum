import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

type BlockCollapseApi = {
	isCollapsed: (blockId: string) => boolean;
	toggle: (blockId: string) => void;
	collapseAll: (ids: string[]) => void;
	expandAll: () => void;
};

const BlockCollapseContext = createContext<BlockCollapseApi | null>(null);

export function BlockCollapseProvider({ children }: { children: ReactNode }) {
	const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

	const isCollapsed = useCallback((blockId: string) => collapsedIds.has(blockId), [collapsedIds]);

	const toggle = useCallback((blockId: string) => {
		setCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(blockId)) next.delete(blockId);
			else next.add(blockId);
			return next;
		});
	}, []);

	const collapseAll = useCallback((ids: string[]) => {
		setCollapsedIds(new Set(ids));
	}, []);

	const expandAll = useCallback(() => {
		setCollapsedIds(new Set());
	}, []);

	const value = useMemo<BlockCollapseApi>(
		() => ({ isCollapsed, toggle, collapseAll, expandAll }),
		[isCollapsed, toggle, collapseAll, expandAll],
	);

	return (
		<BlockCollapseContext.Provider value={value}>{children}</BlockCollapseContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components -- hook exported with provider
export function useBlockCollapse(): BlockCollapseApi {
	const ctx = useContext(BlockCollapseContext);
	if (!ctx) {
		return {
			isCollapsed: () => false,
			toggle: () => {},
			collapseAll: () => {},
			expandAll: () => {},
		};
	}
	return ctx;
}
