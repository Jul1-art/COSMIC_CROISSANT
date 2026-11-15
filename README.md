# 🥐 COSMIC CROISSANT (RELIC) — Interactive Planetary Atlas & Space Mission Explorer

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-blue.svg?style=for-the-badge&logo=nasa)](https://www.spaceappschallenge.org/2026/)
[![XERJ Corpus Hub contributor](https://hub.xerj.org/contributors/Jul1-art/badge.svg)](https://hub.xerj.org/contributors/Jul1-art)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Jul1-art/COSMIC_CROISSANT?style=for-the-badge)](https://github.com/Jul1-art/COSMIC_CROISSANT)

> **COSMIC CROISSANT** (project *RELIC*) is a 3D interactive planetary atlas and space exploration archive built for the **[NASA International Space Apps Challenge 2026](https://www.spaceappschallenge.org/2026/)**. It combines high-resolution planetary terrain cartography (CesiumJS), real-time orbital and interplanetary trajectory reconstructions (Three.js), and historical mission telemetry into an immersive pedagogical experience accessible from any browser.

---

## 🌟 Selected for the XERJ Corpus Hub

This implementation was selected for the **[XERJ Corpus Hub](https://hub.xerj.org/contributors/Jul1-art)**, an open reference memory curated for AI coding agents to retrieve verified, real-world implementations rather than hallucinating code.

* **Contributor:** [Jules Ferrier (@Jul1-art)](https://github.com/Jul1-art)
* **Corpus:** [`jul1-art--relic`](https://hub.xerj.org/corpus/jul1-art--relic)
* **Selected Commit:** [`c03a72a882`](https://github.com/Jul1-art/RELIC/commit/c03a72a882d511c8bdf452576641a4cef2205098) — *feat: unify planetary controls and settings with resilient static-host data*
* **Topics & Keywords:** `3d` · `exploration` · `nasa` · `space` · `cesium` · `threejs` · `planetary-science`

### Querying the RELIC Corpus with XERJ
AI coding agents and developers can index and query this repository directly as a worked reference:

```bash
# 1. Install xerj (if not present)
curl -fsSL https://xerj.org/get | sh

# 2. Clone at the pinned corpus commit
git clone https://github.com/Jul1-art/RELIC RELIC
cd RELIC && git checkout c03a72a882d511c8bdf452576641a4cef2205098

# 3. Start a local XERJ node
xerj --insecure --data-dir ./xerj-data

# 4. Autoindex the repository
xerj autoindex ./RELIC --url http://127.0.0.1:9200 --prefix relic --progress plain
xerj autoindex map --url http://127.0.0.1:9200
```

---

## 🚀 Key Features

* **🌍 High-Precision 3D Planetary Globes:**
  * Real lunar surface imagery and elevation maps (LROC / NASA PDS).
  * High-resolution Mars global terrain (Viking MDIM2.1, MOLA elevation data).
  * Dynamic day/night terminator, atmospheric scattering, and smooth camera gestures.

* **📍 Precise Surface Landing Sites:**
  * Direct fly-to navigation for all historical and modern surface missions on the Moon (Apollo 11–17, Chang'e series, Luna, Surveyor, Artemis) and Mars (Perseverance, Curiosity, Opportunity, Spirit, InSight, Viking, Zhurong).
  * High-visibility map pins with exact geographic coordinates (lat/lon).

* **🛰️ Interplanetary Trajectories & Deep Space:**
  * Real-time ephemerides and trajectory reconstructions based on NASA JPL Horizons data.
  * Deep-space probe tracking for interstellar voyagers (Voyager 1 & 2 light-day and light-hour live countdown, Pioneer 10 & 11, New Horizons).
  * Sun-Earth Lagrange point missions (JWST, SOHO, Gaia at L1/L2).

* **📖 Interactive 3D Mission Archives:**
  * Step-by-step milestone timeline with historical documentary events.
  * Interactive 3D spacecraft models with articulated components and instruments.
  * Multi-angle camera modes: Mission overview (Journey), Destination orbit, and Surface landing site.

* **📱 Mobile-First & Touch-Optimized:**
  * Seamless responsive design for smartphones, tablets, and desktops.
  * Touch-friendly double-tap dialogue progression and pinch-to-zoom camera controls.
  * PWA support with service worker offline caching.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Planetary Globes** | [CesiumJS](https://cesium.com/cesiumjs/) | 3D ellipsoidal rendering with terrain elevation & tile streaming |
| **Spacecraft & System** | [Three.js](https://threejs.org/) | Real-time WebGL engine for spacecraft models and solar system view |
| **Data Engine** | Vanilla ES Modules | Zero-dependency, lightweight, native modular JavaScript |
| **Trajectories** | NASA JPL Horizons | Accurate celestial coordinates, heliocentric vectors, and milestones |
| **Deployment** | Static Web / PWA | Serverless static hosting (GitHub Pages, Cloudflare Pages, Vercel) |

---

## 💻 Getting Started Locally

No complex build pipeline or package manager required. The application runs natively with standard ES modules:

```bash
# Clone the repository
git clone https://github.com/Jul1-art/COSMIC_CROISSANT.git
cd COSMIC_CROISSANT

# Serve with any static HTTP server (e.g., Python, Node, or VS Code Live Server)
python -m http.server 8000
# or with npx
npx serve .
```

Open your browser at `http://localhost:8000`.

### Running Tests

```bash
# Run unit and regression tests with Node.js
node --experimental-vm-modules tests/test_mission_sites.mjs
node --experimental-vm-modules tests/test_archive_data.mjs
```

---

## 📂 Project Structure

```
RELIC/
├── index.html              # Main application entry point & 3D solar system atlas
├── pages/
│   ├── exploration.html    # Detailed mission dossiers & multi-media viewer
│   ├── mission.html        # Interactive mission showcase
│   └── globe.html          # Embedded high-res planetary globe
├── src/
│   ├── atlas/              # Solar system core, camera controllers, body selector
│   ├── missions/           # Mission catalog, landing coordinates, archives & timelines
│   │   ├── mission-sites.js# Moon & Mars precise geographic sites
│   │   ├── archive-ui.js   # 3D mission player controls & Cesium globe routing
│   │   └── distant-data.js # Deep space probe trajectory calculations (Voyager, etc.)
│   ├── worlds/             # Cesium globe integration & terrain loaders
│   └── core/               # Path resolution, discoveries & locale management
├── intro/                  # Narrative cinematic welcome experience
├── tests/                  # Automated verification test suite
└── LICENSE                 # Apache-2.0 License
```

---

## 🏆 NASA Space Apps Challenge 2026

* **Event:** [NASA International Space Apps Challenge 2026](https://www.spaceappschallenge.org/2026/)
* **Project Name:** RELIC (Planetary Atlas & Space Mission Archive)
* **Author:** [Jules Ferrier](https://github.com/Jul1-art) ([@Jul1-art](https://github.com/Jul1-art))
* **XERJ Hub Profile:** [hub.xerj.org/contributors/Jul1-art](https://hub.xerj.org/contributors/Jul1-art)

---

## 📜 License

This project is licensed under the **Apache-2.0 License** — see the [LICENSE](LICENSE) file for details.
