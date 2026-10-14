import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = join(root, 'dist');
const rootExtensions = new Set(['.html', '.css', '.js']);
const assetDirectories = ['assets', 'vendor', 'earth-search'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && rootExtensions.has(extname(entry.name))) {
    await cp(join(root, entry.name), join(output, entry.name));
  }
}
for (const directory of assetDirectories) {
  await cp(join(root, directory), join(output, directory), { recursive: true });
}

console.log(`Static build ready: ${(await readdir(output)).length} root entries in dist/`);
