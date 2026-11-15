import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {unpackGlb, MAX_ASSET_BYTES} from '../tools/cloudflare_assets.mjs';

test('Europa Clipper is repackaged losslessly into deployable glTF buffers', async () => {
  const bytes = await readFile(new URL('../assets/missions/models/europa-clipper.glb', import.meta.url));
  assert(bytes.length > MAX_ASSET_BYTES);
  const jsonLength = bytes.readUInt32LE(12);
  const original = JSON.parse(bytes.subarray(20,20+jsonLength));
  const binary = bytes.subarray(28+jsonLength);
  const {document, files} = unpackGlb(bytes, 'europa-clipper');
  assert.deepEqual(document.meshes, original.meshes);
  assert.deepEqual(document.images, original.images);
  assert.deepEqual(document.accessors, original.accessors);
  assert.deepEqual(document.nodes, original.nodes);
  for (const [i, view] of original.bufferViews.entries()) {
    assert(files[i].data.length <= MAX_ASSET_BYTES);
    assert.deepEqual(files[i].data, binary.subarray(view.byteOffset || 0, (view.byteOffset || 0)+view.byteLength));
    assert.equal(document.bufferViews[i].buffer, i);
    assert.equal(document.bufferViews[i].byteOffset, 0);
    assert.equal(document.buffers[i].uri, files[i].uri);
  }
});
