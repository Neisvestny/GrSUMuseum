import 'dotenv/config';
import { bootstrap } from './app/bootstrap';

void bootstrap().catch((error: unknown) => {
	console.error('Server bootstrap failed:', error);
	process.exit(1);
});
