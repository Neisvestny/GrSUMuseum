/**
 * One-off migration from legacy museum tables to canonical schema.
 * Run only when old tables still exist (before canonical migration) OR against a DB dump.
 *
 * Usage: npx tsx scripts/migrate-legacy-data.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../server/generated/prisma/client.js';
import { newBlockId, type BlockNode, type PageDocument } from '../server/domain/document.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function tableExists(name: string): Promise<boolean> {
	const rows = await pool.query(
		`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
		[name],
	);
	return rows.rowCount !== null && rows.rowCount > 0;
}

async function migratePages(): Promise<void> {
	if (!(await tableExists('page_tabs'))) return;

	const legacyPages = await pool.query<{
		id: number;
		slug: string;
		title: string;
		template: string;
		media: unknown;
	}>('SELECT id, slug, title, template, media FROM pages');

	for (const page of legacyPages.rows) {
		const tabs = await pool.query<{
			id: number;
			label: string;
			template: string | null;
			media: unknown;
		}>('SELECT id, label, template, media FROM page_tabs WHERE page_id = $1 ORDER BY position', [
			page.id,
		]);

		const blocks: BlockNode[] = [];

		if (page.template.startsWith('tabs_') && tabs.rows.length > 0) {
			blocks.push({
				id: newBlockId(),
				type: 'tabs',
				schemaVersion: 1,
				payload: {},
				children: tabs.rows.map((tab) => ({
					id: newBlockId(),
					type: 'tab',
					schemaVersion: 1,
					payload: { label: tab.label, media: tab.media },
					children: [],
				})),
			});
		} else {
			const pageBlocks = await pool.query<{
				img: string | null;
				template: string | null;
			}>(
				'SELECT img, template FROM page_blocks WHERE page_id = $1 ORDER BY position',
				[page.id],
			);
			for (const b of pageBlocks.rows) {
				blocks.push({
					id: newBlockId(),
					type: b.template === 'text_image' ? 'textImage' : 'alternating',
					schemaVersion: 1,
					payload: { image: b.img ?? '' },
					children: [],
				});
			}
		}

		const doc: PageDocument = { blocks };
		await prisma.page.upsert({
			where: { slug: page.slug },
			create: {
				slug: page.slug,
				title: page.title,
				draftDocument: doc,
				publishedDocument: doc,
			},
			update: {
				title: page.title,
				draftDocument: doc,
				publishedDocument: doc,
			},
		});
	}
}

async function main(): Promise<void> {
	console.log('Legacy data migration…');
	await migratePages();
	console.log('Done (extend script for rectors/teachers/gallery as needed).');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
		await pool.end();
	});
