import {localizeMissionElement} from './mission-locale.js';
import {PIN_SVG,installMissionUI,openMission} from './mission-ui.js';
import {getMissionSitesForBody,MISSION_SITES} from './mission-sites.js';
import {discoverMission} from '../core/mission-discoveries.js';

/**
 * Universal Three.js mission markers on planetary globes (Moon, Mars, Earth, Venus).
 * Projects coordinates from each body's oriented local mesh frame into screen coordinates
 * with accurate limb and horizon occlusion.
 */
export function createMissionMarkers({THREE,camera,getMoon,getBodyMesh,getSelected,isDetailed,onLocate}){
  installMissionUI();

  const container = document.createElement('div');
  container.className = 'three-mission-markers-container';
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:46;overflow:hidden;';
  document.body.append(container);

  const entriesByBody = new Map();
  const position = new THREE.Vector3();
  const center = new THREE.Vector3();
  const toward = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (const [body, sites] of Object.entries(MISSION_SITES)) {
    const entries = sites.map(site => {
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'mission-marker';
      marker.style.pointerEvents = 'auto';
      marker.hidden = true;
      marker.setAttribute('aria-label', `${site.name} · ${site.siteName || ''} · open mission`);
      marker.innerHTML = PIN_SVG + `<span>${site.name}</span>`;
      marker.dataset.missionId = site.id;
      container.append(marker);

      const locale = localizeMissionElement(marker);

      const lat = site.lat * Math.PI / 180;
      const lon = site.lon * Math.PI / 180;
      const local = new THREE.Vector3(
        Math.cos(lat) * Math.cos(lon),
        Math.sin(lat),
        -Math.cos(lat) * Math.sin(lon)
      );

      const click = (event) => {
        event?.stopPropagation();
        discoverMission(site.id);
        const bounds = marker.getBoundingClientRect();
        const anchor = { x: bounds.left + bounds.width / 2, y: bounds.bottom };
        onLocate?.({ latitude: site.lat, longitude: site.lon, ...site });
        openMission(site.id, 'summary', anchor);
      };

      marker.addEventListener('click', click);
      return { site, marker, local, locale, click };
    });
    entriesByBody.set(body, entries);
  }

  let lastAnchor = -Infinity;

  const locate = event => {
    const id = event.detail?.id;
    for (const entries of entriesByBody.values()) {
      const match = entries.find(e => e.site.id === id);
      if (match) {
        onLocate?.(match.site);
        break;
      }
    }
  };
  window.addEventListener('relic-mission-locate', locate);

  function hideAll() {
    for (const entries of entriesByBody.values()) {
      for (const entry of entries) entry.marker.hidden = true;
    }
  }

  return {
    update() {
      const selected = getSelected?.();
      const detailed = isDetailed?.();

      if (!selected || selected === 'overview' || detailed) {
        hideAll();
        return;
      }

      const mesh = getBodyMesh ? getBodyMesh(selected) : (selected === 'moon' ? getMoon?.() : null);
      if (!mesh || !mesh.visible) {
        hideAll();
        return;
      }

      // Hide all bodies except current selected
      for (const [body, entries] of entriesByBody.entries()) {
        if (body !== selected) {
          for (const entry of entries) entry.marker.hidden = true;
        }
      }

      const activeEntries = entriesByBody.get(selected) || [];
      if (!activeEntries.length) return;

      mesh.updateWorldMatrix(true, false);
      const meshRadius = mesh.geometry?.parameters?.radius || 1;
      mesh.getWorldPosition(center);
      const viewport = camera.userData.missionViewport?.() || { left: 0, top: 0, width: innerWidth, height: innerHeight };

      for (const entry of activeEntries) {
        const { marker, local, site } = entry;
        position.copy(local).multiplyScalar(meshRadius * 1.0001);
        mesh.localToWorld(position);

        normal.copy(position).sub(center).normalize();
        toward.copy(camera.position).sub(position).normalize();

        // Limb horizon occlusion
        if (normal.dot(toward) <= 0.04) {
          marker.hidden = true;
          continue;
        }

        position.project(camera);
        const offScreen = position.z < -1 || position.z > 1 || Math.abs(position.x) > 1.05 || Math.abs(position.y) > 1.05;
        marker.hidden = offScreen;

        if (!offScreen) {
          const screenX = viewport.left + (position.x + 1) * 0.5 * viewport.width;
          const screenY = viewport.top + (1 - position.y) * 0.5 * viewport.height;
          marker.style.left = `${screenX.toFixed(1)}px`;
          marker.style.top = `${screenY.toFixed(1)}px`;

          if (performance.now() - lastAnchor > 120 && (site.id === 'apollo-11' || site.id === 'curiosity' || site.id === 'spoutnik-1')) {
            lastAnchor = performance.now();
            window.dispatchEvent(new CustomEvent('relic-mission-anchor', {
              detail: { id: site.id, anchor: { x: screenX, y: screenY } }
            }));
          }
        }
      }
    },
    hide: hideAll,
    dispose() {
      hideAll();
      window.removeEventListener('relic-mission-locate', locate);
      for (const entries of entriesByBody.values()) {
        for (const entry of entries) {
          entry.locale?.dispose?.();
          entry.marker.removeEventListener('click', entry.click);
          entry.marker.remove();
        }
      }
      container.remove();
    }
  };
}
