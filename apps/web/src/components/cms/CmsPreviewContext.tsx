import { createContext, useContext } from 'react';

const CmsPreviewContext = createContext(false);

export function CmsPreviewProvider({
	preview,
	children,
}: {
	preview: boolean;
	children: React.ReactNode;
}) {
	return <CmsPreviewContext.Provider value={preview}>{children}</CmsPreviewContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useCmsPreview(): boolean {
	return useContext(CmsPreviewContext);
}
