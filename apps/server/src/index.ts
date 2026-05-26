import { config } from 'dotenv';
import { envFilePath } from './lib/paths.js';

config({ path: envFilePath });

const { bootstrap } = await import('./app/bootstrap.js');

void bootstrap().catch((error: unknown) => {
	console.error('Server bootstrap failed:', error);
	process.exit(1);
});
