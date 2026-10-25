import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const configSource = await readFile(new URL('../api-config.js', import.meta.url), 'utf8');
const googleSource = await readFile(new URL('../google-3d.js', import.meta.url), 'utf8');
const fixtureToken = 'exampleHeader.examplePayload.exampleSignature';

async function privateConfig(context, token = '') {
  const configured = configSource.replace(/^export const CESIUM_ION_TOKEN = .*;$/m,
    `export const CESIUM_ION_TOKEN = ${JSON.stringify(token)};`);
  const module = new vm.SourceTextModule(configured, { context });
  await module.link(() => { throw new Error('Private configuration has no runtime dependencies.'); });
  await module.evaluate();
  return module;
}

function isolatedContext(extra = {}) {
  return vm.createContext({
    localStorage: new Proxy({}, { get() { throw new Error('Private keys must not use browser storage.'); } }),
    prompt() { throw new Error('The private edition must not ask users for a key.'); },
    fetch() { throw new Error('Private keys must not be fetched from an endpoint.'); },
    ...extra,
  });
}

test('the private configuration uses only the embedded value without browser storage or prompts', async () => {
  const module = await privateConfig(isolatedContext(), '  ' + fixtureToken + '  ');
  assert.equal(module.namespace.PRIVATE_CREDENTIAL_EDITION, true);
  assert.equal(module.namespace.getCesiumToken(), fixtureToken);
  assert.equal(module.namespace.setCesiumToken, undefined);
  assert.equal(module.namespace.clearApiKeys, undefined);
});

test('an empty or malformed configuration cannot activate the keyed service', async () => {
  const module = await privateConfig(isolatedContext());
  assert.equal(module.namespace.getCesiumToken(), '');
  for (const invalid of ['', 'password', 'https://ion.cesium.com/tokens', 'header.payload.signature with spaces', 'x'.repeat(9000)]) {
    assert(module.namespace.validateCesiumToken(invalid));
  }
  assert.equal(module.namespace.validateCesiumToken(fixtureToken), '');
});

async function googleView({ token = '', rejectProvider = false } = {}) {
  const requests = [], warnings = [], states = [], removed = [];
  const context = isolatedContext({ console: { warn: (...args) => warnings.push(args) } });
  const local = await privateConfig(context, token);
  const ion = { defaultAccessToken: 'unused-upstream-placeholder' };
  const tiles = { show: true, destroyed: false, destroy() { this.destroyed = true; }, tileFailed: { addEventListener() {} } };
  const provider = new vm.SyntheticModule(['Ion', 'IonResource', 'Cesium3DTileset'], function() {
    this.setExport('Ion', ion);
    this.setExport('IonResource', { async fromAssetId(id, options) {
      requests.push({ id, options });
      if (rejectProvider) throw new Error('Provider URL https://example.invalid/?access_token=' + fixtureToken);
      return {};
    } });
    this.setExport('Cesium3DTileset', { async fromUrl() { return tiles; } });
  }, { context });
  const module = new vm.SourceTextModule(googleSource, { context });
  await module.link(name => {
    if (name === './api-config.js') return local;
    if (name === './vendor/cesium/index.js') return provider;
    throw new Error('Unexpected import: ' + name);
  });
  await module.evaluate();
  const viewer = { scene: { globe: { show: true }, primitives: { add: item => item, remove: item => { removed.push(item); item.destroy(); } }, requestRender() {} } };
  return { view:module.namespace.createGoogle3D(viewer, state => states.push(state)), states, requests, warnings, ion, tiles, viewer, removed };
}

test('missing private configuration keeps the keyless globe usable and never requests a key', async () => {
  const { view, requests, viewer, ion } = await googleView();
  assert.equal(await view.enable(), false);
  assert.equal(view.status, 'missing');
  assert.equal(requests.length, 0);
  assert.equal(viewer.scene.globe.show, true);
  assert.equal(ion.defaultAccessToken, '');
});

test('the configured application token activates Google 3D without prompting or persisting it', async () => {
  const { view, requests, viewer, tiles, removed } = await googleView({ token: fixtureToken });
  assert.equal(await view.enable('ignoredCallerValue'), true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.accessToken, fixtureToken);
  assert.equal(viewer.scene.globe.show, false);
  view.disable();
  assert.equal(viewer.scene.globe.show, true);
  assert.equal(await view.enable(), true);
  assert.equal(requests.length, 1, 'A disabled tile set is reused.');
  view.destroy();
  assert.equal(tiles.destroyed, true);
  assert.equal(removed.length, 1);
});

test('provider failures never expose the configured token or request URL', async () => {
  const { view, states, warnings, viewer } = await googleView({ token: fixtureToken, rejectProvider: true });
  assert.equal(await view.enable(), false);
  assert.equal(view.status, 'error');
  assert.equal(viewer.scene.globe.show, true);
  for (const output of [states, warnings]) {
    assert(!JSON.stringify(output).includes(fixtureToken));
    assert(!JSON.stringify(output).includes('example.invalid'));
  }
});
