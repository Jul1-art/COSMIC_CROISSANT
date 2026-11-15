import {readFile, writeFile, unlink, readdir, stat} from 'node:fs/promises';
import {join, dirname, basename} from 'node:path';

export const MAX_ASSET_BYTES = 25 * 1024 * 1024;

// Repackage embedded buffer views without changing any mesh or texture bytes.
export function unpackGlb(bytes, stem) {
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('Invalid GLB');
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const binaryHeader = 20 + jsonLength;
  if (bytes.readUInt32LE(binaryHeader + 4) !== 0x004e4942 || document.buffers.length !== 1) throw new Error('Expected one embedded GLB buffer');
  const binary = bytes.subarray(binaryHeader + 8);
  const files = [];
  document.buffers = document.bufferViews.map((view, index) => {
    if (view.buffer !== 0 || view.byteLength > MAX_ASSET_BYTES) throw new Error('GLB buffer view cannot fit a Cloudflare asset');
    const start = view.byteOffset || 0;
    const data = binary.subarray(start, start + view.byteLength);
    if (data.length !== view.byteLength) throw new Error('Truncated GLB buffer view');
    const uri = `${stem}-buffer-${index}.bin`;
    files.push({uri, data});
    view.buffer = index;
    view.byteOffset = 0;
    return {uri, byteLength: data.length};
  });
  return {document, files};
}

export async function prepareCloudflareAssets(output) {
  const manifestPath = join(output, 'assets/missions/models.json');
  let models = null;
  try { models = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const model of Object.values(models || {})) {
    const source = join(dirname(manifestPath), model.path);
    if ((await stat(source)).size <= MAX_ASSET_BYTES) continue;
    if (!model.path.endsWith('.glb')) throw new Error(`Oversized model: ${model.path}`);
    const stem = basename(source, '.glb');
    const {document, files} = unpackGlb(await readFile(source), stem);
    for (const {uri, data} of files) await writeFile(join(dirname(source), uri), data);
    await writeFile(source.replace(/\.glb$/, '.gltf'), JSON.stringify(document));
    await unlink(source);
    model.path = model.path.replace(/\.glb$/, '.gltf');
  }
  if (models) await writeFile(manifestPath, JSON.stringify(models, null, 2) + '\n');
  let count = 0;
  async function check(directory) {
    for (const entry of await readdir(directory, {withFileTypes:true})) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await check(path);
      else {
        count++;
        if ((await stat(path)).size > MAX_ASSET_BYTES) throw new Error(`Cloudflare asset exceeds 25 MiB: ${path}`);
      }
    }
  }
  await check(output);
  if (count > 20000) throw new Error(`Cloudflare free-plan asset count exceeded: ${count}`);
  console.log(`Cloudflare limits verified: ${count} files, each <= 25 MiB`);
}
