import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, '../..');

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, repoRoot, '');
	const serverPort = Number(env.PORT || 3000);
	const apiTarget = `http://127.0.0.1:${serverPort}`;

	return {
		plugins: [react(), tailwindcss()],
		envDir: repoRoot,
		server: {
			// /images, /videos, /files — из apps/web/public (без прокси, иначе 502 при неверном PORT).
			proxy: {
				'/api': { target: apiTarget },
			},
		},
		preview: {
			proxy: {
				'/api': { target: apiTarget },
			},
		},
	};
});
