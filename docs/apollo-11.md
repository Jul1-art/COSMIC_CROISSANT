# Apollo 11 pilot mission

The existing atlas now exposes one mission pin at Tranquility Base (0.67409° N,
23.47298° E). Click the pin on the Moon, or use the Apollo 11 entry, then choose
Immersion 3D, Vidéos NASA, or Dossier. Localiser flies the existing Moon inspector
to the landing site. Only Apollo 11 is included in this pilot.

Run locally from the repository root with `python -m server` (the existing API
server) or `python -m http.server 4173` for the static interface; the latter uses
the atlas's existing API fallbacks. A direct entry is:
`/?view=inspection&body=moon&mission=apollo-11`.
Add `&missionView=explore`, `video`, or `article` to select a mission view.

## Implementation

- `src/missions/apollo11-data.js`: UTC chronology, inventory, sources and media.
- `mission-markers.js`: oriented Three.js Moon pin with back-face occlusion.
- `cesium-mission-marker.js`: single accessible Moon pin projected at the terrain height; its click is sent
  through the existing same-origin, current-frame message validation. A native DOM button
  handles pointer and keyboard input independently of GPU billboard picking.
- `mission-ui.js` and `missions.css`: summary, full-page dossier, NASA video
  selection and accessible modal navigation. Escape closes and restores focus.
- `mission-scene.js` and `mission-models.js`: lazy Three.js exploration with one
  renderer, separate journey/site scenes, orbit controls, timeline and equipment
  selection. Closing or changing views aborts terrain requests and releases GPU
  resources. The atlas is paused while the mission is open; hidden tabs pause
  scene rendering and do not accumulate playback time.

The site reuses the repository's Apollo 11 LROC elevation raster, catalogue and
imagery. The 257×257 mesh spans 5 km (approximately 19.5 m between mesh vertices).
Small decorative bump detail is generated locally. Missing elevation uses an
explicitly labelled flat-ground fallback; unsupported WebGL leaves the dossier
and videos available. NASA video playback requires an external connection; a
source link remains available if the media host cannot be reached.

## Historical and visual scope

Event dates are historical UTC. Journey curves are educational interpolations,
with compressed distances, enlarged vehicles, and a fixed Moon. They are not
1969 ephemerides, descent telemetry or a present-day debris propagation model.
Hardware is modelled geometrically and placed illustratively near the lander,
not at surveyed equipment coordinates. Deployment is grouped by event rather
than minute-by-minute EVA activity. Upper-stage motion and the falling flag
are illustrative; reversing time restores their earlier states.

The supplied PDF is treated as reference content. NASA sources correct the SM
separation to July 24, distinguish the surface TV camera from descent footage,
and date the seismic experiment's last response to August 25. The unverified
5.2-tonne surface total and claim of a recovered 2019 lunar waste bag are not
presented as established facts. The ascent stage's final location is unknown.
Component masses are estimates and must not be summed as independent items.

The first NASA video is the SVS 4185 LRO landing-site flyover, credited to NASA /
Ernie Wright. The second is the official NASA Video landing-profile reconstruction.
The UI links to the original media and mission references.

## Validation

`node --experimental-vm-modules --test tests/*.mjs`

`node tools/build_static.mjs`

Browser checks cover the summary, both scenes, seeking backwards and forwards,
play/pause, equipment focus, video selection, the full-page dossier, Escape and
focus restoration, closing during lazy scene creation, and 390 px mobile layout.
The integrated atlas/Moon iframe handoff is checked separately. Media host
availability is external to these checks; the SVS MP4 returned HTTP 503 from the
validation environment on 14 November 2026.
