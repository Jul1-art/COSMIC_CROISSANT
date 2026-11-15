# Shared mission experience

Every mission must use the shared components instead of introducing a separate
player, document layout or control disclosure.

- Use `mountDossier({ renderTab(id, language) })` from `dossier-experience.js`.
  Provide complete English and French chapter content. Keep the five chapter
  IDs stable and use the existing dossier header, hero and tab markup.
- The reader restores the selected language from the app, starts each page and
  chapter at the top, and removes source-brief links and the old dossier footer.
  Original source files may remain in the archive without exposing a brief CTA.
- Use `localizeMissionElement(root)` for live mission cards and `missionText` for
  immediate labels. Add new source-string translations to `mission-fr-strings.js`.
  A new content language must be provided explicitly; no automatic translation
  of scientific claims is assumed.
- Use `makeMissionControlsCollapsible(panel)` for every 3D mission control panel.
  It preserves playback and values when minimized, keeps the exit reachable,
  and localizes live updates. Dispose its returned controller on removal.
- Register films with `registerMissionFilm` in `mission-films.js`. Supply locale
  variants when available. Call `openVideo(id)` to reuse the same player, CSS
  readiness, opaque fullscreen layer, close behaviour and scroll restoration.
- Keep original media credits and distinguish original footage from calculated
  reconstructions. Test both languages, minimized controls, narrow screens,
  scroll reset, film bounds and the absence of content behind the film.
