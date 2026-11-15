import {localizeMissionElement} from './mission-locale.js';
import {PIN_SVG} from './mission-icons.js';
import {getMissionSitesForBody} from './mission-sites.js';
import {discoverMission} from '../core/mission-discoveries.js';

/**
 * Interactive 3D surface pins for missions across Mars, Moon, and Earth.
 * Combines native Cesium WebGL point/label primitives directly on the globe
 * with keyboard-accessible DOM markers.
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

  if (doc?.head && !doc.querySelector('link[data-mission-marker-style]')) {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./missions.css', import.meta.url).href;
    link.dataset.missionMarkerStyle = '';
    doc.head.append(link);
  }

  const ellipsoid = viewer.scene?.globe?.ellipsoid ||
    (body === 'moon' ? Cesium.Ellipsoid.MOON : body === 'mars' ? new Cesium.Ellipsoid(3396190, 3396190, 3396190) : Cesium.Ellipsoid.WGS84);

  // 1. Native Cesium WebGL Entities (guaranteed visibility on 3D globe)
  const entities = [];
  const pointColor = body === 'mars' ? Cesium.Color.fromCssColorString('#ff4757')
    : body === 'moon' ? Cesium.Color.fromCssColorString('#00d2ff')
    : Cesium.Color.fromCssColorString('#2ed573');

  if (viewer.entities) {
    for (const site of sites) {
      const position = Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 500, ellipsoid);
      const entity = viewer.entities.add({
        id: `relic-mission-pin-${site.id}`,
        name: site.name,
        position,
        point: {
          pixelSize: 13,
          color: pointColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: ` ${site.name} `,
          font: 'bold 12px Inter, ui-sans-serif, system-ui, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#0a101d'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      entity.missionSite = site;
      entities.push(entity);
    }
  }

  // 2. Click and hover picking via Cesium ScreenSpaceEventHandler
  let clickHandler = null;
  if (viewer.scene?.canvas) {
    clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    clickHandler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position);
      let site = picked?.id?.missionSite;
      if (!site && typeof picked?.id === 'string' && picked.id.startsWith('relic-mission-pin-')) {
        const id = picked.id.replace('relic-mission-pin-', '');
        site = sites.find(s => s.id === id);
      }
      if (site) {
        discoverMission(site.id);
        if (onLocate) onLocate({ lat: site.lat, lon: site.lon, name: site.name, id: site.id });
        onOpen(site.id, click.position);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    clickHandler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.endPosition);
      const isSite = Boolean(picked?.id?.missionSite || (typeof picked?.id === 'string' && picked.id.startsWith('relic-mission-pin-')));
      viewer.canvas.style.cursor = isSite ? 'pointer' : '';
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  // 3. DOM Markers floating above for keyboard & accessibility
  let container = null;
  let markerEntries = [];
  if (doc?.body) {
    container = doc.createElement('div');
    container.className = 'mission-markers-container';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:46;overflow:hidden;';
    container.setAttribute('aria-label', `Sites de mission · ${body}`);
    doc.body.append(container);

    markerEntries = sites.map(site => {
      const marker = doc.createElement('button');
      marker.type = 'button';
      marker.className = 'mission-marker';
      marker.style.pointerEvents = 'auto';
      marker.hidden = true;
      marker.innerHTML = PIN_SVG + `<span>${site.name}</span>`;
      marker.setAttribute('aria-label', `${site.name} · ${site.siteName || ''} · open mission`);
      marker.dataset.missionId = site.id;
      container.append(marker);

      const locale = localizeMissionElement(marker);

      const click = (event) => {
        event?.stopPropagation();
        discoverMission(site.id);
        if (onLocate) onLocate({ lat: site.lat, lon: site.lon, name: site.name, id: site.id });
        const rect = marker.getBoundingClientRect?.();
        const anchor = rect ? { x: rect.left + rect.width / 2, y: rect.bottom } : undefined;
        onOpen(site.id, anchor);
      };

      marker.addEventListener('click', click);
      return { site, marker, locale, click };
    });
  }

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

      // Occlusion: point must face camera
      const dot = Cesium.Cartesian3.dot(point, toward);
      const occluded = !screen || dot <= 0 ||
        screen.x < -40 || screen.y < -50 ||
        screen.x > bounds.width + 40 || screen.y > bounds.height + 50;

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
      for (const entity of entities) entity.show = enabled;
      update();
    },
    dispose() {
      stop();
      clickHandler?.destroy?.();
      for (const entity of entities) viewer.entities?.remove?.(entity);
      entities.length = 0;
      for (const entry of markerEntries) {
        entry.locale?.dispose?.();
        entry.marker.removeEventListener('click', entry.click);
        entry.marker.remove();
      }
      container?.remove?.();
    }
  };
}
