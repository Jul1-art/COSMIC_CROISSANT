# Apollo 11: map, in-app replay and mission dossier

One map pin is anchored at Tranquility Base (0.67409° N, 23.47298° E). Its
multicolour teardrop silhouette is shared by the Three.js and Cesium views.
The lunar terrain height is used in the detailed globe; the fallback sphere
uses the actual mesh radius, body orientation and a radial horizon test.

## Visitor flow

1. Click the lunar pin: a compact, non-modal information card opens near it.
   The card contains only the mission name, agency, landing date, landing site and a dropdown button. It has no photograph, slogan or expanded crew section. The map stays interactive. There is no mission landing-page dialog.
2. Expand **Explorer la mission**: the mission immediately becomes a full-viewport
   3D view inside the running app. The URL and document do not change. The menu
   exposes **Vision 3D dans l’app**, **Voir la vidéo**, and **Les détails de la mission**.
3. The in-app scene starts at the landing site. Switch between the site and the
   Earth–Moon journey, seek or play the UTC timeline, and approach equipment.
   **Retour à la Lune** releases the mission renderer and restores the map.
4. **Voir la vidéo** opens a continuous local NASA archive programme: JFK's
   1961 address, followed by the complete HQ-194 documentary, including launch,
   lunar operations, return, recovery and quarantine. Its original sound is
   retained. The native player has a full timeline and two chapter shortcuts.
5. **Les détails de la mission** opens `pages/mission.html?mission=apollo-11`.
   This is the only separate reading page. It has exactly five accessible tabs:
   Identité de la mission; Inventaire du hardware perdu; Chronologie; Science et
   héritage; Sources et pour aller plus loin. Five locally hosted NASA photos
   are captioned and linked to their source records. The original reference PDF
   is linked in Sources. Arrow keys, Home and End navigate the tab list.

## Files and local checks

- `src/missions/apollo11-data.js`: inventory, UTC events and film metadata.
- `mission-icons.js`, `mission-markers.js`, `cesium-mission-marker.js`: pin and
  projection. The iframe sends its screen anchor through the existing
  same-origin, current-frame validation in `detailed-globe.js`.
- `mission-ui.js`, `missions.css`: card, dropdown and full-viewport in-app scene.
- `mission-scene.js`, `mission-models.js`: lazy Three.js scene and equipment.
- `mission-film.js`: bounded HLS player using the existing local hls.js library.
- `mission-dossier*.js`, `mission-dossier.css`, `pages/mission.html`: reading page.
- `assets/missions/apollo-11/photos.json`: NASA image records and descriptions.
- `assets/missions/apollo-11/film/provenance.json`: film sources and retained cuts.

Run `python -m server` for the existing app/API server, or
`python -m http.server 4173` for static validation. A direct Moon entry is
`/?view=inspection&body=moon&lat=0.67409&lon=23.47298&range=3000000&tilt=0`.

Validate with `node --experimental-vm-modules --test tests/*.mjs` and
`node tools/build_static.mjs`. The film is packaged as 312 HLS segments, each
below the 25 MiB hosting limit. It is not warmed into the offline cache.

## Source handling and visual limits

The supplied PDF is reference content. NASA sources correct the SM separation
to July 24, distinguish surface TV footage from descent footage, and date the
PSEP's last response to August 25. The unsupported 5.2-tonne surface total and
claim of a recovered lunar waste bag are not presented as established facts.
The ascent stage's final location is unknown. Component masses are estimates
and must not be summed as independently weighed inventory items.

The site reuses the project's NASA LROC imagery and 257² height raster across
5 km (approximately 19.5 m between mesh vertices). The close-up grain is a
local decorative bump map. Equipment models and their local placement are
illustrative. Historical dates are exact to the published event precision;
travel curves, vehicle sizes and trajectories are pedagogical, not navigation
telemetry or a 1969 ephemeris. The 3D scene stops rendering behind the film and
in hidden tabs; closing it aborts terrain requests and releases GPU resources.

The NASA film derivative contained colour-bar/transport leaders and unrelated
silent press-room footage after HQ-194. These are omitted; the documentary's
end credits are retained. The movie is original English archive material, not
a newly generated video or invented historical speech. It is now served from
this project, without depending on the previously failing SVS MP4 server.

## Visual system and motion

The interface uses the project's local Inter and JetBrains Mono fonts, the application’s
neutral day/night chrome and monochrome controls and shared typography between
map card, film player, immersive controls and the editorial dossier. Popovers,
menus, chapter headings, reading tabs and scroll reveals use native browser
animations and respect reduced-motion preferences.

The landing-site scene now loads NASA / Michael D. Carbajal's published GLB
lunar module, locally decoded with the pinned Three.js r164 Draco loader.
Meshes are batched by material and visually separated into ascent/descent groups.
The source is a general Apollo lunar module model, not an Eagle survey. See
`assets/missions/apollo-11/models/provenance.json` for source, hash and adaptations.
Environment reflections, a directional key light and cached soft shadows provide
the new material rendering. Local grain and scattered small pebbles are decorative;
the underlying elevation still comes from the existing LROC height raster.

`mission-camera.js` owns interruptible camera easing for arrival, reset and
individual equipment. Direct pointer control cancels the current camera flight.
Closing the scene releases model geometry, textures, decoder workers and lighting
resources. The old geometric module remains available as a loading-error fallback.
