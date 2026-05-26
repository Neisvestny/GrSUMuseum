/**
 * Smoke-test monorepo path resolution (no DB). Run from repo root:
 *   npx tsx apps/server/scripts/verify-paths.ts
 */
import fs from 'fs';
import path from 'path';
import {
	imageSearchDirs,
	physicalMediaRoot,
	repoRoot,
	webDistDir,
	webPublicDir,
} from '../src/lib/paths.js';

function assert(cond: boolean, msg: string): void {
	if (!cond) throw new Error(msg);
}

assert(fs.existsSync(repoRoot), `repoRoot missing: ${repoRoot}`);
assert(fs.existsSync(webPublicDir), `webPublicDir missing: ${webPublicDir}`);
assert(
	physicalMediaRoot('images') === path.join(webPublicDir, 'images'),
	'physicalMediaRoot(images) must be under webPublicDir',
);
assert(imageSearchDirs().every((d) => path.isAbsolute(d)), 'imageSearchDirs must be absolute');
assert(!physicalMediaRoot('images').includes('apps/server'), 'must not resolve under apps/server cwd');

for (const root of ['images', 'videos', 'files'] as const) {
	const dir = physicalMediaRoot(root);
	fs.mkdirSync(dir, { recursive: true });
	const probe = path.join(dir, '.path-verify');
	fs.writeFileSync(probe, 'ok');
	assert(fs.readFileSync(probe, 'utf8') === 'ok', `write failed: ${probe}`);
	fs.unlinkSync(probe);
}

console.log('paths OK:', {
	repoRoot,
	webPublicDir,
	webDistDir,
	images: physicalMediaRoot('images'),
	searchDirs: imageSearchDirs(),
});
