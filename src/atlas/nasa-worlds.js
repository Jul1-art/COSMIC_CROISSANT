// Locations and imagery are drawn from the linked NASA mission catalogues.
// Earth starts without curated demo destinations; use place or coordinate search.
export const EARTH_SITES = [];

export const PLANET_SITES = {
  mars:[
    { id:'jezero', name:'Jezero crater', tag:'PERSEVERANCE · HIRISE', lat:18.488, lon:77.403, altitude:.00065, local:true, terrainRange:6500,
      description:'At Jezero, the HiRISE stereo model measures terrain at 1 m per pixel within its coverage area.',
      source:'https://www.uahirise.org/dtm/ESP_045994_1985' },
    { id:'olympus', name:'Olympus Mons', tag:'GIANT VOLCANO', lat:18, lon:-135, altitude:.12,
      description:'The largest volcano in the solar system lies in the Tharsis region.',
      source:'https://science.nasa.gov/photojournal/maps-of-mars-global-topography/' },
    { id:'hellas', name:'Hellas Planitia', tag:'IMPACT BASIN', lat:-45, lon:70, altitude:.12,
      description:'A large impact basin visible in Martian topographic maps.',
      source:'https://science.nasa.gov/photojournal/maps-of-mars-global-topography/' },
  ],
  moon:[
    { id:'apollo11', name:'Apollo 11', tag:'LANDING SITE · LROC', lat:.67416, lon:23.47314, altitude:.0006, local:true, terrainRange:2200,
      description:'Eagle landed here on 20 July 1969. LROC covers a small area around the site.',
      source:'https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html' },
    { id:'tycho', name:'Tycho crater', tag:'CRATER · LRO', lat:-43.37, lon:-11.32, altitude:.14, terrainRange:18000,
      description:'At its central peak, LROC stereo terrain and the orthophoto measure detail at 2 m per pixel.',
      source:'https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_DTM_TYCHOPK' },
    { id:'surveyor7', name:'Surveyor 7', tag:'PROBE · 1968', lat:-40.97, lon:-11.44, altitude:.02,
      description:'Surveyor 7 landed near the northern rim of Tycho.',
      source:'https://science.nasa.gov/mission/surveyor-7/' },
  ],
};

export const NASA_IMAGERY = {
  earthBlueMarble:'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
  earthModis:date => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg`,
  gibsInfo:'https://data.nasa.gov/dataset/gibs-web-map-tile-service-wmts',
  marsTrek:'https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars',
  moonTrek:'https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon',
};
