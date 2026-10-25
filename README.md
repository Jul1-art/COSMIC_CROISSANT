# RELIC — Private edition

**A privately configured journey through the Solar System and the traces of space exploration.**

This edition keeps provider configuration in `api-config.js`. Visitors are never asked to enter API keys, and provider tokens are not stored in browser local storage. The [public RELIC repository](https://github.com/Jul1-art/RELIC) keeps its separate bring-your-own-key interface.

RELIC combines an interactive Solar System atlas, detailed views of Earth, the Moon and Mars, and a bilingual documentary introduction. Explore measured terrain, follow the history behind missions, and help improve the project through ideas, issues and pull requests.

The original application code is available under the [Apache License 2.0](LICENSE). Third-party libraries, scientific datasets, imagery, music and archival film retain their own licenses; see [Third-party notices](THIRD_PARTY_NOTICES.md). RELIC is an independent project and does not imply endorsement by the organizations whose data it uses.

## Explore

- Move between the eight planets, the Moon and the Sun, then enter the detailed Earth, lunar or Martian views.
- Explore Earth with Cesium, satellite imagery and NASA SRTM elevation; optional Google Photorealistic 3D Tiles use the author-configured Cesium ion token.
- Inspect global Mars MOLA and lunar LOLA terrain, with local HiRISE and LROC datasets around selected destinations.
- Search supported locations or enter latitude and longitude. Place search and generated terrain tiles use the Python server.
- Watch the English or French introduction, with sound, captions and playback controls. Historical recordings and illustrative reconstructions are identified in the film sources.
- Inspect a conceptual lunar outpost. Its systems and architecture are simulations, not flight-qualified equipment or measured lunar topography.

Sizes and orbital distances are adapted for readability. Horizons positions are calculated ephemerides, not spacecraft telemetry. NOAA solar-wind measurements describe conditions near Earth. Terrain and imagery have finite, source-dependent resolution; enlarging them does not create new measured detail.

## Run locally

Use Python 3.10 or newer. Node.js 22 or newer is recommended for the static build and JavaScript checks.

```sh
git clone https://github.com/Jul1-art/Hackathon_NASA.git
cd Hackathon_NASA
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 terrain_server.py
```

The clone stores the two MP4 fallbacks as transport-sized binary parts. The Python server and static build verify the parts and automatically reconstruct the original MP4 files before serving or publishing them; no re-encoding or download is needed.

Open **http://localhost:8000/**. On Windows, use the corresponding virtual-environment activation command and `python` if `python3` is unavailable.

Run `terrain_server.py` for the complete experience. A generic static HTTP server does not implement the generated elevation, live-data or place-search endpoints. Some upstream terrain products are large and are downloaded on first use, then reused from the server cache. External imagery, geocoding and current data require a network connection.

To choose a different port, set `NASA_ATLAS_PORT` before starting the server. For example:

```sh
NASA_ATLAS_PORT=8080 python3 terrain_server.py
```

### Enable current JPL data

The NASA/JPL, NOAA and public NASA imagery paths used here do **not** require a NASA API key. Automated JPL requests require a real contact in the server's `User-Agent`, according to the [JPL API policy](https://ssd-api.jpl.nasa.gov/doc/index.php).

1. Copy `.env.example` to `.env`.
2. Set `NASA_ATLAS_CONTACT` to your own public HTTPS contact page or contact address.
3. Load that file in the server's environment before starting Python. The server does not automatically load `.env`.

On a POSIX shell:

```sh
set -a
. ./.env
set +a
python3 terrain_server.py
```

The contact is a server setting, not an API key, and remains separate from the browser provider configuration. With no valid contact configured, the app uses available cached positions with their timestamps or reports that current data is unavailable instead of sending anonymous JPL requests.

## Private provider configuration

The application reads the author-controlled Cesium ion browser token directly from `api-config.js`. There is no API-key form, save/forget control or browser-token storage. The optional Google 3D button uses that configuration directly.

| Service | Required? | Configuration |
| --- | --- | --- |
| Cesium ion | Optional, for Google Photorealistic 3D Tiles | The maintainer configures the browser token in the private `api-config.js` module. An empty or unavailable configuration leaves the NASA rendering path usable. |
| NASA/JPL, NOAA and public NASA Trek/GIBS data | No API key for the implemented endpoints | Keep the default sources. Configure the separate server contact above for JPL requests. |
| Google Cloud API key | Not used by this integration | The optional Google 3D layer is accessed through Cesium ion. |

Use a browser-facing Cesium token limited to the required assets and permitted deployment origins. Browser JavaScript sends it to Cesium when the optional service is requested. [Cesium's plans and quotas](https://cesium.com/platform/cesium-ion/pricing/) and [Google 3D integration terms](https://cesium.com/learn/cesiumjs-learn/cesiumjs-photorealistic-3d-tiles/) apply. NASA imagery and the basic atlas do not require this token, subject to source availability.

Keep this private configuration separate from the public RELIC edition, whose users supply their own keys. Do not copy the private token module into a public export.

## Build and deploy

The Python server serves the application directly, without a frontend compilation step. Use HTTPS and an appropriate reverse proxy for a hosted installation that needs the Python data endpoints.

For a static deployment:

```sh
node tools/build_static.mjs
```

Publish the resulting `dist/` directory. A static host serves the interface, bundled assets and browser-accessible external layers; it does not execute Python. In particular, `/api/height`, `/api/live/atlas`, `/api/places` and `/api/imagery/moon/tycho` are unavailable unless you separately deploy and route a compatible backend. The browser uses available imagery, an unmeasured ellipsoid, labelled orbital-model estimates, timestamped public NOAA readings and browser geocoding when the Python endpoints are absent. The optional Cesium layer uses the token configured in the private `api-config.js` module.

Third-party tile services may restrict redistribution, caching or offline use. Keep their on-screen attributions and review their terms before changing how assets are served.

## Checks

```sh
python3 -m unittest discover -s tests -v
node --experimental-vm-modules --test tests/*.mjs
node tools/build_static.mjs
```

Live JPL tests may be skipped when no contact is configured. For visual changes, also check portrait and landscape phone layouts, keyboard interaction, the NASA-only rendering path and the author-configured Google 3D path.

## Contribute

Everyone is welcome to propose improvements, suggest missions or datasets, report bugs and submit pull requests. Start with [Contributing](CONTRIBUTING.md). Include reliable references for scientific additions and keep measured data, approximations, historical imagery and fictional simulations clearly distinguished.

Keep provider tokens out of issues, screenshots, test fixtures and example configuration. Only the author-controlled browser token belongs in this private edition's `api-config.js`; server-only credentials and service-account files must stay outside the application source. See [Security](SECURITY.md) for reporting guidance.

## License and credits

Original RELIC source code and original interface artwork are licensed under **Apache 2.0**. Preserve [NOTICE](NOTICE) and the notices that accompany bundled dependencies.

The documentary and other third-party media are **not relicensed as Apache 2.0**. They combine NASA and other archives, ESA material, CC-BY media, Pixabay material and the score **“Helios” by Scott Buckley, CC-BY 4.0**. Their source credits, modifications and individual terms remain applicable. Review [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the film's source manifest before redistributing, replacing or repurposing those media. The original source recordings and large intermediate rendering files are not included.

## Guide rapide en français

RELIC est un projet open source ouvert aux idées, signalements et contributions de toutes et tous. Le code original est sous licence Apache 2.0 ; les médias et bibliothèques tiers conservent leurs propres conditions.

Installez Python et les dépendances indiquées plus haut, puis lancez `python3 terrain_server.py` et ouvrez `http://localhost:8000/`. Le mode NASA de base n'exige aucune clé API. Pour les données JPL actualisées, renseignez votre propre contact public côté serveur. Google 3D utilise directement le jeton Cesium ion configuré par l’auteur dans le module privé `api-config.js` ; aucun formulaire ni stockage local de clé n’est proposé. La version publique RELIC conserve son propre formulaire pour les clés de chaque utilisateur. Ne recopiez pas le module privé dans cette version publique.

Une publication statique reste possible avec `node tools/build_static.mjs`, mais elle n'exécute pas les routes Python de relief, de recherche et de données actualisées.

## Interface and static hosting

Earth, Moon and Mars share a responsive command bar, location search, imagery drawer and compact Font Awesome controls. Settings include English/French, light/dark appearance, an optional NASA-blue accent, motion preferences and adaptive/high rendering quality. Preferences apply across pages.

GitHub Pages serves static files and cannot run the Python API. The browser detects that mode, avoids missing `/api` requests and falls back to clearly labelled NASA/JPL model positions, timestamped NOAA solar-wind observations, public geocoding, local destinations and coordinates. Model values are estimates, not telemetry; expired measurements are omitted. Without a terrain backend, the globe is an unmeasured ellipsoid with imagery. Optional Google 3D remains a separate provider layer.

Build with `node tools/build_static.mjs` and publish only `dist/`; this also reconstructs both verified MP4 fallbacks. A custom GitHub Pages workflow must use **Settings → Pages → Source: GitHub Actions**. Branch/Jekyll publication serves the source tree without that build. GitHub Pages can still impose host-level IP or bandwidth limits; the application reduces request bursts, reuses cached modules and honours `Retry-After`, but cannot disable the hosting service’s protection.
