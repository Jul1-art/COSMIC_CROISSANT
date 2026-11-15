/**
 * Mission landing and launch sites for planetary 3D globes (Mars, Moon, Earth).
 * Coordinates are sourced from NASA, ESA, and published mission landing records.
 */
export const MISSION_SITES = {
  mars: [
    { id: 'perseverance', name: 'Perseverance', siteName: 'Jezero Crater', lat: 18.4447, lon: 77.4508, year: 2021 },
    { id: 'curiosity', name: 'Curiosity', siteName: 'Gale Crater', lat: -4.5895, lon: 137.4417, year: 2011 },
    { id: 'mars-pathfinder', name: 'Pathfinder & Sojourner', siteName: 'Ares Vallis', lat: 19.33, lon: -33.55, year: 1996 },
    { id: 'viking-1', name: 'Viking 1', siteName: 'Chryse Planitia', lat: 22.48, lon: -47.97, year: 1975 },
    { id: 'viking-2', name: 'Viking 2', siteName: 'Utopia Planitia', lat: 48.27, lon: 134.0, year: 1975 },
    { id: 'spirit', name: 'Spirit', siteName: 'Gusev Crater', lat: -14.57, lon: 175.47, year: 2003 },
    { id: 'opportunity', name: 'Opportunity', siteName: 'Meridiani Planum', lat: -2.07, lon: -5.53, year: 2003 },
    { id: 'rover-zhurong', name: 'Zhurong (Tianwen 1)', siteName: 'Utopia Planitia', lat: 25.06, lon: 109.92, year: 2020 },
    { id: 'exomars', name: 'Schiaparelli (ExoMars)', siteName: 'Meridiani Planum', lat: -2.07, lon: -6.21, year: 2016 },
    { id: 'rover-rosalind-franklin', name: 'Rosalind Franklin', siteName: 'Oxia Planum', lat: 18.28, lon: -24.55, year: 2028 },
    { id: 'mars-express', name: 'Beagle 2 (Mars Express)', siteName: 'Isidis Planitia', lat: 11.53, lon: 90.43, year: 2003 }
  ],
  moon: [
    { id: 'apollo-11', name: 'Apollo 11', siteName: 'Sea of Tranquility', lat: 0.6741, lon: 23.4730, year: 1969 },
    { id: 'apollo-12', name: 'Apollo 12', siteName: 'Ocean of Storms', lat: -3.0124, lon: -23.4216, year: 1969 },
    { id: 'apollo-14', name: 'Apollo 14', siteName: 'Fra Mauro', lat: -3.6453, lon: -17.4714, year: 1971 },
    { id: 'apollo-15', name: 'Apollo 15', siteName: 'Hadley-Apennine', lat: 26.1322, lon: 3.6339, year: 1971 },
    { id: 'apollo-16', name: 'Apollo 16', siteName: 'Descartes', lat: -8.9730, lon: 15.5002, year: 1972 },
    { id: 'apollo-17', name: 'Apollo 17', siteName: 'Taurus-Littrow', lat: 20.1908, lon: 30.7717, year: 1972 },
    { id: 'surveyor-1', name: 'Surveyor 1', siteName: 'Oceanus Procellarum', lat: -2.46, lon: -43.32, year: 1966 },
    { id: 'surveyor-3', name: 'Surveyor 3', siteName: 'Oceanus Procellarum', lat: -2.94, lon: -23.34, year: 1967 },
    { id: 'surveyor-5', name: 'Surveyor 5', siteName: 'Mare Tranquillitatis', lat: 1.41, lon: 23.18, year: 1967 },
    { id: 'surveyor-6', name: 'Surveyor 6', siteName: 'Sinus Medii', lat: 0.47, lon: -1.43, year: 1967 },
    { id: 'surveyor-7', name: 'Surveyor 7', siteName: 'Tycho Rim', lat: -40.98, lon: -11.51, year: 1968 },
    { id: 'luna-9', name: 'Luna 9', siteName: 'Oceanus Procellarum', lat: 7.08, lon: -64.37, year: 1966 },
    { id: 'luna-13', name: 'Luna 13', siteName: 'Oceanus Procellarum', lat: 18.87, lon: -62.05, year: 1966 },
    { id: 'luna-16', name: 'Luna 16', siteName: 'Mare Fecunditatis', lat: -0.68, lon: 56.30, year: 1970 },
    { id: 'luna-17', name: 'Luna 17 / Lunokhod 1', siteName: 'Mare Imbrium', lat: 38.28, lon: -35.00, year: 1970 },
    { id: 'lunokhod-2', name: 'Luna 21 / Lunokhod 2', siteName: 'Le Monnier Crater', lat: 25.8323, lon: 30.9221, year: 1973 },
    { id: 'chang-e-3', name: "Chang'e 3", siteName: 'Mare Imbrium', lat: 44.12, lon: -19.51, year: 2013 },
    { id: 'chang-e-4', name: "Chang'e 4", siteName: 'Von Kármán (Far Side)', lat: -45.46, lon: 177.59, year: 2018 },
    { id: 'chang-e-5', name: "Chang'e 5", siteName: 'Mons Rümker', lat: 43.10, lon: -51.80, year: 2020 },
    { id: 'chang-e-6', name: "Chang'e 6", siteName: 'South Pole-Aitken Basin', lat: -41.60, lon: -154.00, year: 2024 },
    { id: 'chandrayaan-3', name: 'Chandrayaan 3', siteName: 'Shiv Shakti Point', lat: -69.37, lon: 32.32, year: 2023 }
  ],
  earth: [
    { id: 'spoutnik-1', name: 'Spoutnik 1', siteName: 'Cosmodrome de Baïkonour', lat: 45.9203, lon: 63.3422, year: 1957 },
    { id: 'spoutnik-2', name: 'Spoutnik 2', siteName: 'Cosmodrome de Baïkonour', lat: 45.9203, lon: 63.3422, year: 1957 },
    { id: 'apollo-11', name: 'Saturn V (LC-39A)', siteName: 'Kennedy Space Center', lat: 28.6084, lon: -80.6044, year: 1969 }
  ]
};

export function getMissionSitesForBody(body) {
  return MISSION_SITES[body] || [];
}
