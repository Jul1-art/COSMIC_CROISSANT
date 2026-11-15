import {localizeMissionElement} from './mission-locale.js';
import {PIN_SVG} from './mission-icons.js';
import {getMissionSitesForBody} from './mission-sites.js';
import {discoverMission} from '../core/mission-discoveries.js';

/**
 * Interactive, keyboard-accessible 3D surface pins for missions across Mars, Moon, and Earth.
 * Projects geographic coordinates to screen space in Cesium with limb-horizon occlusion.
 */
export function createCesiumMissionMarker({
  Cesium,
  viewer,
  body,
  onOpen,
  onLocate,
  onAnchor=()=>{},
  getSurfaceHeight=()=>0,
  document:doc=globalThis.document
}) {
  const sites = getMissionSitesForBody(body);
  if (!sites.length || !viewer) return null;

  if (!doc.querySelector('link[data-mission-marker-style]')) {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./missions.css', import.meta.url).href;
    link.dataset.missionMarkerStyle = '';
    doc.head.append(link);
  }

  const ellipsoid = viewer.scene?.globe?.ellipsoid ||
    (body === 'moon' ? Cesium.Ellipsoid.MOON : body === 'mars' ? new Cesium.Ellipsoid(3396190, 3396190, 3396190) : Cesium.Ellipsoid.WGS84);

  const container = doc.createElement('div');
  container.className = 'mission-markers-container';
  container.setAttribute('aria-label', `Sites de mission · ${body}`);
  doc.body.append(container);

  const markerEntries = sites.map(site => {
    const marker = doc.createElement('button');
    marker.type = 'button';
    marker.className = 'mission-marker';
    marker.hidden = true;
    marker.innerHTML = PIN_SVG + `<span>${site.name}</span>`;
    marker.setAttribute('aria-label', `${site.name} · ${site.siteName || ''} · open mission`);
    marker.dataset.missionId = site.id;
    container.append(marker);

    const locale = localizeMissionElement(marker);

    const click = (event) => {
      event?.stopPropagation();
      discoverMission(site.id);
      if (onLocate) {
        onLocate({ lat: site.lat, lon: site.lon, name: site.name, id: site.id });
      }
      const rect = marker.getBoundingClientRect?.();
      const anchor = rect ? { x: rect.left + rect.width / 2, y: rect.bottom } : undefined;
      onOpen(site.id, anchor);
    };

    marker.addEventListener('click', click);
    return { site, marker, locale, click };
  });

  let enabled = true;
  let lastAnchor = -Infinity;
  const toward = new Cesium.Cartesian3();
  const pixel = new Cesium.Cartesian2();

  function update() {
    if (!enabled || viewer.isDestroyed()) {
      for (const entry of markerEntries) entry.marker.hidden = true;
      return;
    }

    const bounds = viewer.canvas?.getBoundingClientRect?.() || { left: 0, top: 0, width: innerWidth, height: innerHeight };
    const cameraPos = viewer.camera.positionWC;
    const cameraDir = viewer.camera.directionWC;

    for (const entry of markerEntries) {
      const { site, marker } = entry;
      const height = getSurfaceHeight(site.lat, site.lon);
      const point = Cesium.Cartesian3.fromDegrees(
        site.lon,
        site.lat,
        Number.isFinite(height) ? height : 0,
        ellipsoid
      );

      Cesium.Cartesian3.subtract(cameraPos, point, toward);
      const screen = viewer.scene.cartesianToCanvasCoordinates(point, pixel);

      // Horizon & boundary occlusion
      const occluded = !screen ||
        Cesium.Cartesian3.dot(point, toward) <= 0 ||
        Cesium.Cartesian3.dot(toward, cameraDir) >= 0 ||
        screen.x < -30 || screen.y < -40 ||
        screen.x > bounds.width + 30 || screen.y > bounds.height + 40;

      marker.hidden = occluded;
      if (!occluded) {
        marker.style.left = `${bounds.left + screen.x}px`;
        marker.style.top = `${bounds.top + screen.y}px`;

        if (performance.now() - lastAnchor > 120 && (site.id === 'curiosity' || site.id === 'apollo-11' || site.id === 'spoutnik-1')) {
          lastAnchor = performance.now();
          onAnchor({ x: bounds.left + screen.x, y: bounds.top + screen.y });
        }
      }
    }
  }

  const stop = viewer.scene.postRender.addEventListener(update);
  update();

  return {
    update,
    setVisible(value) {
      enabled = Boolean(value);
      update();
    },
    dispose() {
      stop();
      for (const entry of markerEntries) {
        entry.locale?.dispose?.();
        entry.marker.removeEventListener('click', entry.click);
        entry.marker.remove();
      }
      container.remove();
    }
  };
}
