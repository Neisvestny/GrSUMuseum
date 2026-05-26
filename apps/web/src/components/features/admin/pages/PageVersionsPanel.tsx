import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
	fetchPageVersion,
	restorePageVersion,
	type DraftPage,
	type PageVersionSummary,
} from '../../../../api/pages';
import type { PageDocument } from '@museum/document';
import { ApiError } from '../../../../shared/api/client';
import BaseModal from '../../../design-system/BaseModal';
import BlockRenderer from '../../../cms/BlockRenderer';
import AdminButton from '../ui/AdminButton';
import { useAdminToast } from '../ui/AdminToastContext';

type Props = {
	draft: DraftPage;
	versions: PageVersionSummary[];
	saving: boolean;
	onRestored: (data: DraftPage) => void;
	onRevertToPublished: () => void;
};

function formatWhen(iso: string): string {
	return new Date(iso).toLocaleString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export default function PageVersionsPanel({
	draft,
	versions,
	saving,
	onRestored,
	onRevertToPublished,
}: Props) {
	const toast = useAdminToast();
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewTitle, setPreviewTitle] = useState('');
	const [previewDocument, setPreviewDocument] = useState<PageDocument | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);

	const openPreview = async (title: string, loadDoc: () => Promise<PageDocument>) => {
		setLoadingPreview(true);
		try {
			setPreviewTitle(title);
			setPreviewDocument(await loadDoc());
			setPreviewOpen(true);
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Не удалось загрузить превью');
		} finally {
			setLoadingPreview(false);
		}
	};

	const handleRestoreVersion = async (versionId: number, label: string) => {
		const ok = confirm(
			`Восстановить черновик из снимка «${label}»?\n\nТекущие несохранённые правки в редакторе будут заменены. После восстановления нажмите «Сохранить черновик», если нужно зафиксировать изменения в базе.`,
		);
		if (!ok) return;
		try {
			const refreshed = await restorePageVersion(draft.slug, versionId);
			onRestored(refreshed);
			toast.success('Черновик восстановлен из выбранной версии');
		} catch (err) {
			toast.error(err instanceof ApiError ? err.message : 'Не удалось восстановить версию');
		}
	};

	const handleRevertPublished = () => {
		if (!draft.publishedDocument) return;
		const ok = confirm(
			'Подставить в редактор содержимое, которое сейчас опубликовано на киоске?\n\nЭто не создаёт новую запись в истории — только меняет черновик в интерфейсе. Сохраните черновик, чтобы записать в базу.',
		);
		if (!ok) return;
		onRevertToPublished();
		toast.success('В редактор подставлена опубликованная версия');
	};

	return (
		<div className="rounded-2xl border-2 border-blue-100 bg-blue-50/30 p-4 space-y-4">
			<div>
				<h3 className="text-base font-bold text-blue-900">История и откат</h3>
				<p className="text-sm text-stone-600 mt-1">
					Каждая публикация сохраняет снимок. Вы можете посмотреть любую версию и вернуть её в
					черновик для правок.
				</p>
			</div>

			<ul className="space-y-2">
				<li className="flex flex-wrap items-center gap-2 rounded-xl bg-white border border-stone-200 px-3 py-2.5">
					<div className="flex-1 min-w-[200px]">
						<div className="text-sm font-medium text-stone-800">Сейчас на киоске</div>
						<div className="text-xs text-stone-500">
							{draft.publishedDocument
								? 'Опубликованный вариант'
								: 'Ещё не публиковалось'}
						</div>
					</div>
					{draft.publishedDocument && (
						<>
							<AdminButton
								type="button"
								size="sm"
								variant="secondary"
								disabled={loadingPreview || saving}
								onClick={() =>
									void openPreview('На киоске сейчас', async () => draft.publishedDocument!)
								}
							>
								Превью
							</AdminButton>
							<AdminButton
								type="button"
								size="sm"
								variant="secondary"
								disabled={saving}
								onClick={handleRevertPublished}
							>
								В черновик
							</AdminButton>
						</>
					)}
				</li>

				{versions.length === 0 ? (
					<li className="text-sm text-stone-500 px-1 py-2">
						Снимков публикаций пока нет. После первого нажатия «Опубликовать» они появятся
						здесь.
					</li>
				) : (
					versions.map((v, index) => {
						const label = formatWhen(v.createdAt);
						const isLatest = index === 0;
						return (
							<li
								key={v.id}
								className="flex flex-wrap items-center gap-2 rounded-xl bg-white border border-stone-200 px-3 py-2.5"
							>
								<div className="flex-1 min-w-[200px]">
									<div className="text-sm font-medium text-stone-800">
										{label}
										{isLatest && (
											<span className="ml-2 text-xs font-normal text-blue-600">
												последняя публикация
											</span>
										)}
									</div>
									<div className="text-xs text-stone-500">Снимок #{v.id}</div>
								</div>
								<AdminButton
									type="button"
									size="sm"
									variant="secondary"
									disabled={loadingPreview || saving}
									onClick={() =>
										void openPreview(label, () =>
											fetchPageVersion(draft.slug, v.id).then((r) => r.document),
										)
									}
								>
									Превью
								</AdminButton>
								<AdminButton
									type="button"
									size="sm"
									variant="primary"
									disabled={saving}
									onClick={() => void handleRestoreVersion(v.id, label)}
								>
									Восстановить в черновик
								</AdminButton>
							</li>
						);
					})
				)}
			</ul>

			<AnimatePresence>
				{previewOpen && previewDocument && (
					<BaseModal
						onClose={() => setPreviewOpen(false)}
						containerClassName="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-2xl border-2 border-blue-100 shadow-2xl"
					>
						<div className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4 shrink-0">
							<h4 className="font-bold text-blue-900">{previewTitle}</h4>
							<AdminButton
								type="button"
								size="sm"
								variant="secondary"
								onClick={() => setPreviewOpen(false)}
							>
								Закрыть
							</AdminButton>
						</div>
						<div className="overflow-y-auto p-5">
							<BlockRenderer document={previewDocument} pageTitle={draft.title} />
						</div>
					</BaseModal>
				)}
			</AnimatePresence>
		</div>
	);
}
