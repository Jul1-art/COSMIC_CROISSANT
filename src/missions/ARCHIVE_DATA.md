# Mission archive corpus

The catalogue contains the 90 supplied French mission PDFs, their extracted
tables and paragraphs, attributed archival imagery, local labelled photographic
documentaries, and dedicated NASA video editions where identified. Apollo 11
and Sputnik retain their existing reference experiences. Additional missions
use the same dossier, film player, atlas renderer and collapsible controls.

NASA model provenance is recorded in `assets/missions/models.json`; NASA Eyes
glTF models are repackaged without changing their mesh or texture bytes.
The source credit and individual dependency checksums are retained. The NASA
Rosetta catalogue's incorrect IBEX download is replaced by the correctly named
asset from NASA's own 3D Resources repository.

## Scientific scope of this implementation

Imported geometry and reconstructed vehicle architectures are distinguished in
the interface. Most additional mission positions are presentation positions,
not a recovered continuous historical trajectory. Documented orbital altitudes,
inclinations and landing coordinates constrain the reconstructions where given.
The local shadow receiver does not reconstruct measured local topography.

STEREO additionally uses bounded published NASA Eyes orbital packets, including
the second spacecraft where coverage and the selected parent frame permit.
These are visualization ephemerides: an independent Horizons check at
2023-08-12 found a position difference of approximately 33,500 km for STEREO-A.
They must not be described as precision telemetry or extrapolated beyond their
published coverage. The full historical trajectory and stage audit remains
ongoing, as does complete English editorial content for the additional dossiers.

## Maintenance and checks

`tools/verify_mission_assets.py` verifies PDF signatures, local images, H.264
documentary durations, and GLB file integrity. JavaScript tests run with
`node --experimental-vm-modules --test tests/*.mjs`.

The collection scripts are acquisition tools, not unattended publication steps.
Search matches require identity review: NASA search can match ambiguous names,
and even upstream catalogue pages can link an unrelated binary. Curated image
overrides are in `tools/mission_archive_overrides.json`. Prepare selected remote
videos with `tools/prepare_mission_videos.py` to retain full-length compatible
editions and real duration/bitrate metadata. Rebuild the local documentary with
`tools/build_mission_films.py` after changing its credited photographs or text.
