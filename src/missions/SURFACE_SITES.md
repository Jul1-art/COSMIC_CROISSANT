# Surface contacts and distant probes

`mission-sites.js` is the shared source for native and Cesium surface markers
and their same-origin message allowlist. Coordinates use degrees, east-positive
longitude; `year` describes surface contact. Original Earth launch sites remain
explicitly identified. Impacts and uncertain positions are labelled. Future
landings and probes destroyed in the atmosphere do not become fictitious
surface sites. Decluttering moves labels and leader lines, never pin anchors.

The supplied mission dossiers and the existing landing catalogue provide most
coordinates. Additional NASA sources:

- Huygens on Titan (`naif-606`), 10.25° S, 167.68° E:
  <https://science.nasa.gov/mission/cassini-huygens/>
- MESSENGER predicted impact, 54.4° N, 149.9° W:
  <https://science.nasa.gov/mission/messenger/>
- Surveyor 2 approximate impact, 5.5° N, 12° W:
  <https://science.nasa.gov/mission/surveyor-2/>
- Pioneer Venus Day Probe, 31.3° S, 317° E (Table 5-3):
  <https://history.arc.nasa.gov/hist_pdfs/nasa_sp461.pdf>

The home disclosure lists NASA's five spacecraft on solar-escape trajectories:
<https://science.nasa.gov/mission/voyager/frequently-asked-questions/>
Voyager 1 and 2 are labelled interstellar; Pioneer 10/11 and New Horizons are
labelled on escape trajectories. Selection opens the native model in paused
spacecraft inspection mode. This view does not claim live spacecraft positions.
