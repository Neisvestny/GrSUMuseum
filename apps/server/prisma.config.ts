import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: path.join(repoRoot, '.env') });

const { env } = await import('./src/env.js');

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: env.DATABASE_URL,
	},
});
