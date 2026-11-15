/**
 * Surface contacts from the mission dossiers, plus the two original Earth
 * launch sites. East-positive longitude in degrees; dates are contact years.
 * A planned landing or an atmospheric entry is never a completed landing.
 * Approximate impact sites are explicitly labelled as such.
 */
export const MISSION_SITES = {
  mars: [
    { id: 'perseverance', name: 'Perseverance', siteName: 'Jezero Crater', lat: 18.4447, lon: 77.4508, year: 2021 },
    { id: 'curiosity', name: 'Curiosity', siteName: 'Gale Crater', lat: -4.5895, lon: 137.4417, year: 2012 },
    { id: 'mars-pathfinder', name: 'Pathfinder & Sojourner', siteName: 'Ares Vallis', lat: 19.33, lon: -33.55, year: 1996 },
    { id: 'sojourner', name: 'Sojourner (Rover)', siteName: 'Ares Vallis', lat: 19.33, lon: -33.55, year: 1996 },
    { id: 'viking-1', name: 'Viking 1', siteName: 'Chryse Planitia', lat: 22.48, lon: -47.97, year: 1976 },
    { id: 'viking-2', name: 'Viking 2', siteName: 'Utopia Planitia', lat: 48.27, lon: 134.0, year: 1976 },
    { id: 'spirit', name: 'Spirit', siteName: 'Gusev Crater', lat: -14.57, lon: 175.47, year: 2004 },
    { id: 'opportunity', name: 'Opportunity', siteName: 'Meridiani Planum', lat: -2.07, lon: -5.53, year: 2004 },
    { id: 'rover-zhurong', name: 'Zhurong', siteName: 'Utopia Planitia', lat: 25.06, lon: 109.92, year: 2021 },
    { id: 'tianwen-1', name: 'Tianwen 1 · atterrisseur', siteName: 'Utopia Planitia', lat: 25.06, lon: 109.92, year: 2021 },
    { id: 'exomars', name: 'Schiaparelli · impact', siteName: 'Meridiani Planum', lat: -2.07, lon: -6.21, year: 2016, kind:'impact' },
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
    { id: 'surveyor-2', name: 'Surveyor 2 · impact estimé', siteName: 'Sud-est de Copernic · localisation approximative', lat:5.5, lon:-12, year:1966, kind:'impact', approximate:true, source:'https://science.nasa.gov/mission/surveyor-2/' },
    { id: 'surveyor-4', name: 'Surveyor 4 · impact estimé', siteName: 'Sinus Medii · localisation probable', lat: .45, lon: -1.39, year: 1967, kind:'impact', approximate:true },
    { id: 'luna-2', name: 'Luna 2 · impact', siteName: 'Palus Putredinis · localisation approximative', lat: 29.1, lon: 0, year: 1959, kind:'impact', approximate:true },
    { id: 'luna-9', name: 'Luna 9', siteName: 'Oceanus Procellarum', lat: 7.08, lon: -64.37, year: 1966 },
    { id: 'luna-13', name: 'Luna 13', siteName: 'Oceanus Procellarum', lat: 18.87, lon: -62.05, year: 1966 },
    { id: 'luna-16', name: 'Luna 16', siteName: 'Mare Fecunditatis', lat: -0.68, lon: 56.30, year: 1970 },
    { id: 'luna-15', name: 'Luna 15 · impact', siteName: 'Mare Crisium · localisation approximative', lat: 17, lon: 60, year: 1969, kind:'impact', approximate:true },
    { id: 'luna-17', name: 'Luna 17', siteName: 'Mare Imbrium', lat: 38.2378, lon: -35.0017, year: 1970 },
    { id: 'lunokhod-1', name: 'Lunokhod 1', siteName: 'Mare Imbrium', lat: 38.2378, lon: -35.0017, year: 1970 },
    { id: 'lunokhod-2', name: 'Luna 21 / Lunokhod 2', siteName: 'Le Monnier Crater', lat: 25.8323, lon: 30.9221, year: 1973 },
    { id: 'chang-e-3', name: "Chang'e 3", siteName: 'Mare Imbrium', lat: 44.12, lon: -19.51, year: 2013 },
    { id: 'chang-e-4', name: "Chang'e 4", siteName: 'Von Kármán (Face cachée)', lat: -45.46, lon: 177.59, year: 2019 },
    { id: 'chang-e-5', name: "Chang'e 5", siteName: 'Mons Rümker', lat: 43.10, lon: -51.80, year: 2020 },
    { id: 'chang-e-6', name: "Chang'e 6", siteName: 'Bassin Pôle Sud-Aitken', lat: -41.60, lon: -154.00, year: 2024 },
    { id: 'chandrayaan-3', name: 'Chandrayaan 3', siteName: 'Point Shiv Shakti', lat: -69.37, lon: 32.32, year: 2023 }
  ],
  earth: [
    { id: 'spoutnik-1', name: 'Spoutnik 1 · lancement', siteName: 'Cosmodrome de Baïkonour', lat: 45.9203, lon: 63.3422, year: 1957, kind:'launch' },
    { id: 'spoutnik-2', name: 'Spoutnik 2 · lancement', siteName: 'Cosmodrome de Baïkonour', lat: 45.9203, lon: 63.3422, year: 1957, kind:'launch' },
    { id: 'apollo-11', name: 'Saturn V · lancement', siteName: 'Centre spatial Kennedy · LC-39A', lat: 28.6084, lon: -80.6044, year: 1969, kind:'launch' }
  ],
  venus: [
    { id: 'venera-7', name: 'Venera 7', siteName: 'Navka Planitia', lat: -5.0, lon: 351.0, year: 1970 },
    { id: 'venera-8', name: 'Venera 8', siteName: 'Vasilisa Regio', lat: -10.7, lon: 335.25, year: 1972 },
    { id: 'venera-9', name: 'Venera 9', siteName: 'Beta Regio', lat: 31.0, lon: 291.6, year: 1975 },
    { id: 'venera-10', name: 'Venera 10', siteName: 'Beta Regio', lat: 15.42, lon: 291.51, year: 1975 },
    { id: 'venera-11', name: 'Venera 11', siteName: 'Phoebe Regio', lat: -14.0, lon: 299.0, year: 1978 },
    { id: 'venera-12', name: 'Venera 12', siteName: 'Phoebe Regio', lat: -7.0, lon: 294.0, year: 1978 },
    { id: 'venera-13', name: 'Venera 13', siteName: 'Phoebe Regio', lat: -7.5, lon: 303.0, year: 1982 },
    { id: 'venera-14', name: 'Venera 14', siteName: 'Phoebe Regio', lat: -13.25, lon: 310.0, year: 1982 },
    { id: 'venera-3', name: 'Venera 3 · impact estimé', siteName: 'Face nocturne · localisation non confirmée', lat: 0, lon: 20, year: 1966, kind:'impact', approximate:true },
    { id:'pioneer-venus-multiprobe', name:'Pioneer Venus · Day Probe', siteName:'Impact de la sonde Day', lat:-31.3, lon:317, year:1978, kind:'impact', source:'https://history.arc.nasa.gov/hist_pdfs/nasa_sp461.pdf' }
  ],
  mercury: [
    { id:'messenger', name:'MESSENGER · impact estimé', siteName:'Suisei Planitia · localisation prédite', lat:54.4, lon:-149.9, year:2015, kind:'impact', approximate:true, source:'https://science.nasa.gov/mission/messenger/' }
  ],
  'naif-606': [
    { id:'cassinihuygens', name:'Huygens', siteName:'Région d’Adiri · Titan', lat:-10.25, lon:167.68, year:2005, source:'https://science.nasa.gov/mission/cassini-huygens/' }
  ]
};

export function getMissionSitesForBody(body) {
  return MISSION_SITES[body === 'titan' ? 'naif-606' : body] || [];
}

export const MOON_MISSIONS = new Set([
  'apollo-14','apollo-15','apollo-16','apollo-17','apollo-11','apollo-12','apollo-13',
  'chang-e-3','chang-e-4','chang-e-1','chang-e-2','chang-e-5','chang-e-6','chandrayaan-3',
  'lro','luna-10','luna-11','luna-12','luna-13','luna-14','luna-15','luna-16','luna-17',
  'luna-2','luna-1','luna-3','luna-9','lunokhod-1','lunokhod-2',
  'surveyor-1','surveyor-2','surveyor-3','surveyor-4','surveyor-5','surveyor-6','surveyor-7'
]);

export const MARS_MISSIONS = new Set([
  '2001-mars-odyssey','exomars','hope','mars-express','mars-reconnaissance-orbiter',
  'maven','tianwen-1','curiosity','mars-pathfinder','perseverance','viking-1',
  'viking-2','opportunity','rover-rosalind-franklin','rover-zhurong','sojourner','spirit'
]);

export function getMissionPlanet(missionId) {
  if (MOON_MISSIONS.has(missionId)) return 'moon';
  if (MARS_MISSIONS.has(missionId)) return 'mars';
  return null;
}

export function getMissionSite(missionId) {
  for (const list of Object.values(MISSION_SITES)) {
    const site = list.find(s => s.id === missionId);
    if (site) return site;
  }
  return null;
}

// Co-located lander/rover dossiers remain individually selectable. Labels fan
// upwards while the map-pin tip stays at the actual surface coordinate.
export function missionSiteLabelOffset(site, sites) {
  const colocated=sites.filter(other=>Math.abs(other.lat-site.lat)<.001&&Math.abs(other.lon-site.lon)<.001);
  return Math.max(0,colocated.indexOf(site))*24;
}
