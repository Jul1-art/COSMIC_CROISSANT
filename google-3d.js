import * as Cesium from './vendor/cesium/index.js';

const TOKEN_KEY = 'nasa-atlas-cesium-ion-token';
const GOOGLE_ASSET_ID = 2275207;

function savedToken() {
  try { return localStorage.getItem(TOKEN_KEY)?.trim() || ''; }
  catch { return ''; }
}

function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* Private browsing may disable storage. */ }
}

export function createGoogle3D(viewer, onState = () => {}) {
  let tileset = null;
  let loadedToken = '';
  let active = false;
  let serial = 0;
  let status = 'off';

  function emit(next, error = '') {
    status = next;
    onState({ status:next, error, active });
  }

  async function enable(token) {
    const request = ++serial;
    token = (token ?? savedToken()).trim();
    if (!token) {
      try {
        const response = await fetch(new URL('./api/cesium-token', document.baseURI), { cache:'no-store' });
        if (response.ok) token = String((await response.json()).token || '').trim();
      } catch (error) {
        console.warn('Configuration Cesium ion indisponible', error);
      }
    }
    if (request !== serial) return false;
    if (!token) { emit('missing'); return false; }
    if (tileset && token === loadedToken) {
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
      // Cesium ion brokers Google's 3D Tiles under its free Community quota.
      const resource = await Cesium.IonResource.fromAssetId(GOOGLE_ASSET_ID, { accessToken:token });
      const next = await Cesium.Cesium3DTileset.fromUrl(resource, {
        showCreditsOnScreen:true,
        maximumScreenSpaceError:16,
        cacheBytes:1536 * 1024 * 1024,
        maximumCacheOverflowBytes:1024 * 1024 * 1024,
        enableCollision:true,
      });
      if (request !== serial) { next.destroy(); return false; }
      if (tileset) viewer.scene.primitives.remove(tileset);
      tileset = viewer.scene.primitives.add(next);
      loadedToken = token;
      saveToken(token);
      tileset.tileFailed?.addEventListener(event => {
        console.warn('Tuile Google 3D indisponible', event);
      });
      viewer.scene.globe.show = false;
      active = true;
      viewer.scene.requestRender();
      emit('ready');
      return true;
    } catch (error) {
      if (request !== serial) return false;
      console.warn('Google 3D via Cesium ion indisponible', error);
      if (tileset) tileset.show = false;
      viewer.scene.globe.show = true;
      active = false;
      emit('error', error.message || String(error));
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

  return { enable, disable, get active() { return active; }, get status() { return status; }, hasToken:() => Boolean(savedToken()) };
}

export function askForCesiumToken() {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'google3d-dialog';
    dialog.innerHTML = `<form method="dialog">
      <h2>Activer Google 3D</h2>
      <p>Créez un compte Cesium ion Community gratuit, puis collez votre jeton d’accès. Les tuiles Google sont incluses dans son quota gratuit pour les projets individuels et l’évaluation.</p>
      <a href="https://ion.cesium.com/tokens" target="_blank" rel="noopener noreferrer">Créer ou trouver mon jeton Cesium ion ↗</a>
      <label for="cesium-token-input">JETON CESIUM ION</label>
      <input id="cesium-token-input" type="text" autocomplete="off" spellcheck="false" placeholder="eyJ…" required>
      <div class="google3d-actions"><button value="cancel" type="button">Annuler</button><button value="save" type="submit">Afficher Google 3D</button></div>
    </form>`;
    document.body.append(dialog);
    const input = dialog.querySelector('input');
    const close = value => { dialog.close(); dialog.remove(); resolve(value); };
    dialog.querySelector('[value="cancel"]').addEventListener('click', () => close(''));
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(''); });
    dialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      close(input.value.trim());
    });
    dialog.showModal();
    input.focus();
  });
}
