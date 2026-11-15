# Escaping spacecraft: flight and instrument views

The five distant missions now use `distant-atlas.js`, not the generic
planet-relative presentation orbit. They retain the atlas renderer and controls.

- **Journey from Earth** draws the full departure-to-present path. The bright
  portion shows elapsed travel, with a moving spacecraft marker. Planet markers
  use the same historical date. Planet display radii are enlarged symbols.
- **Deep-space position** frames the present-day spacecraft at its calculated
  heliocentric position. All solar-system meshes and trajectory lines are hidden.
- **Spacecraft and instruments** gives a closer view of the actual NASA model
  at that position, with a floating origin and camera tracking. Model attitude
  and inspection lighting are illustrative, not reconstructed attitude telemetry.
- **3D visualization**, directly below Mission details, restarts the journey at
  Earth. The timeline can select intermediate dates or documented flybys.

## Ephemerides

`assets/missions/distant/` contains NASA/JPL Horizons geometric vectors:
Voyager 1 `-31`, Voyager 2 `-32`, Pioneer 10 `-23`, Pioneer 11 `-24`, New
Horizons `-98`. Centre `500@10` (Sun); J2000 ecliptic / ICRF; JD UTC epochs;
positions in km; velocities in km/day; aberration correction NONE. Cubic Hermite
interpolation uses both position and velocity; data is not extrapolated.

The collector stores provenance, request URLs, source solutions and independent
midpoint checks. It samples departures and flybys more densely. The short gap
between launch and each SPK's first available state is a schematic connection
from Earth's position, explicitly identified in the status and dataset.

Earth, Jupiter, Saturn, Uranus and Neptune have bundled historical vectors.
Other planets retain the atlas's existing ephemeris/model fallback. They are
context, not invented flyby targets. Source coverage ends **2028-01-01**; refresh
the bundles before extending beyond it. Present-day views show the actual
ephemeris date and do not label calculated or propagated states as live telemetry.

Regenerate with `python tools/data/update-distant-probes.py`. The script resumes
completed bundles; remove the specific JSON bundles to refresh those datasets.
Horizons requests run sequentially in the collector, never in visitors' browsers.

Source: <https://ssd.jpl.nasa.gov/horizons/>
API: <https://ssd-api.jpl.nasa.gov/doc/horizons.html>

## Voyager 1 light-day

The countdown uses NASA's announced instant, **2026-11-18 10:16:07 UTC**
(11:16:07 in Paris), independently of the historical playback date. It stops at
zero and displays the achieved milestone afterward. One light-day is exactly
`299792.458 × 86400 = 25902068371.2 km`. Earth distance and Sun distance remain
separate; the signal readout is geometric Earth distance divided by light speed.
An independent Horizons calculation at the announced instant agrees within 1 km.

NASA announcement:
<https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/>
