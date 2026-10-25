import * as Cesium from './vendor/cesium/index.js';
Cesium.Ion.defaultAccessToken = ''; // Optional ion assets use this private edition's configured token explicitly.
import { getCesiumToken, validateCesiumToken } from './api-config.js';

const GOOGLE_ASSET_ID = 2275207;

export function createGoogle3D(viewer, onState = () => {}) {
  let tileset = null;
  let active = false;
  let serial = 0;
  let status = 'off';

  function emit(next, error = '') {
    status = next;
    onState({ status:next, error, active });
  }

  async function enable() {
    const request = ++serial;
    const token = getCesiumToken();
    if (!token) { emit('missing'); return false; }
    if (validateCesiumToken(token)) { emit('error', 'Google 3D is unavailable.'); return false; }
    if (tileset) {
      tileset.show = true;
      viewer.scene.globe.show = false;
      active = true;
      viewer.scene.requestRender();
      emit('ready');
      return true;
    }
    if (tileset) tileset.show = false;
    viewer.scene.globe.show = true;
    active = false;
    emit('loading');
    try {
      // Cesium ion brokers Google's 3D Tiles under this application's configured account.
      const resource = await Cesium.IonResource.fromAssetId(GOOGLE_ASSET_ID, { accessToken:token });
      const compact = globalThis.matchMedia?.('(pointer: coarse)').matches || (globalThis.navigator?.deviceMemory ?? 8) <= 4;
      const next = await Cesium.Cesium3DTileset.fromUrl(resource, {
        showCreditsOnScreen:true,
        maximumScreenSpaceError:compact ? 24 : 16,
        cacheBytes:(compact ? 96 : 384) * 1024 * 1024,
        maximumCacheOverflowBytes:(compact ? 32 : 128) * 1024 * 1024,
        enableCollision:true,
      });
      if (request !== serial) { next.destroy(); return false; }
      if (tileset) viewer.scene.primitives.remove(tileset);
      tileset = viewer.scene.primitives.add(next);
      tileset.tileFailed?.addEventListener(() => {
        // Provider error objects may contain request URLs with access tokens.
        console.warn('A Google 3D tile is unavailable.');
      });
      viewer.scene.globe.show = false;
      active = true;
      viewer.scene.requestRender();
      emit('ready');
      return true;
    } catch {
      if (request !== serial) return false;
      console.warn('Google 3D is unavailable.');
      if (tileset) tileset.show = false;
      viewer.scene.globe.show = true;
      active = false;
      emit('error', 'Google 3D is unavailable.');
      return false;
    }
  }

  function disable() {
    serial++;
    if (tileset) tileset.show = false;
    viewer.scene.globe.show = true;
    active = false;
    viewer.scene.requestRender();
    emit('off');
  }

  function destroy() {
    disable();
    if (tileset) viewer.scene.primitives.remove(tileset);
    tileset = null;
  }
  return { enable, disable, destroy, get active() { return active; }, get status() { return status; }, hasToken:() => Boolean(getCesiumToken()) };
}
