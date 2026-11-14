# Apollo 11: historical constraints and physical reconstruction

This dataset is **not continuous spacecraft telemetry**. The spacecraft paths
are numerical reconstructions constrained by the rounded best-estimated
trajectory parameters in NASA's *Apollo 11 Mission Report*, MSC-00171,
table 7-II (printed p. 7-9, PDF p. 117) and entry table 7-VII.
`trajectory-anchors.json` preserves the transcribed source values and notes.

- Epoch: 1969-07-16 13:32:00 UTC. Flight records use seconds since this epoch,
  kilometres, and kilometres per second in geocentric J2000 equatorial / ICRF.
- Moon and Sun vectors: geometric NASA/JPL Horizons UTC vectors, centre Earth,
  with position/velocity Hermite interpolation. No present-day lunar phase is
  substituted for the historical lunar position.
- Earth rotation: NASA SPICE `IAU_EARTH`. Moon rotation: `MOON_ME` / DE421.
  Kernel and downloaded-response hashes are recorded in `trajectory.json`.
- Coasts: DOP853 integration of point-mass Earth, Moon and Sun gravity, with
  a shooting fit to endpoint positions. The lunar velocity direction is solved
  from endpoints, using retrograde motion as its initial guess. The scanned
  heading convention is not assumed to be modern Moon-ME local north.
- Powered intervals: controlled quintic boundary-value reconstructions.
  Surface-constrained radial profiles prevent launch, landing, ascent and entry
  from crossing the body surface. Entry uses a monotone damped radial profile
  fitted to its initial radial speed and terminal position. Actual throttle,
  bank angle, lift, drag, attitude and guidance histories are not recovered.
- Columbia and Eagle have separate tracks between undocking and docking.
  Discarded Eagle is shown only through the final recorded separation; no
  long-term debris location is extrapolated.

The old report lunar frame is aligned to the modern LRO landing coordinate by a
minimal rigid rotation. Earth geodetic conversion substitutes WGS84 for the
historical Fischer ellipsoid. The printed docking flight-path angle at MET
3:24:03.1 is inconsistent with adjacent coast states; it remains unchanged in
the source file, and its fitted velocity correction is exposed in the audit.
The poorly legible ejection row is omitted. Gravity harmonics, radiation pressure
and actual propulsion/aerodynamic histories are not resolved. These limitations
prevent claiming an exact recovered historical trajectory. Numerical endpoint
residuals describe the solver's closure, **not historical accuracy**.

The atlas keeps its existing body sizes. Only the renderer applies the atlas
scale and the small radial offsets needed to place ground-level objects on its
spherical body symbols. The inertial data are never rescaled or warped in the
physics model. The lunar orbit guide is an osculating conic from instantaneous
relative position and velocity, rather than a decorative circle.

Rebuild offline assets (Python with `numpy`, `scipy`, `spiceypy`):

```sh
python tools/data/build-apollo11-trajectory.py --cache /tmp/apollo-flight-research
```

The builder serializes Horizons requests and caches the results and public NASA
kernels. No NASA API calls or numerical orbit solving run in the browser. Browser
work is bounded to interpolation, reference-frame transforms and rendering.

Sources:
- https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf
- https://ssd.jpl.nasa.gov/horizons/
- https://naif.jpl.nasa.gov/pub/naif/generic_kernels/

The current mission viewer has a free camera: no selected body, automatic body
follow, or time-scrub camera tracking. Framing buttons move the camera only when
requested. A pending surface download never overrides subsequent manual input.
Close-up coordinates are rebased once to avoid floating-point artefacts in
metre-scale model details and shadows; this changes the render reference frame,
not the historical data or the visual camera position.

The close-up uses the existing LRO NAC elevation grid and image, with geographic
bounds converted using the Moon's radius. The patch spans about 1.36 km, despite
the older terrain catalogue's Earth-derived `widthKm: 5` label. Eagle and this
measured patch use the same local metre scale. A curved, blended collar joins the
patch to the globe outside the measured footprint; those surrounding heights
are a visual transition, not additional LRO measurements. The directional light
is for legibility and does not claim to reproduce historical solar illumination.
