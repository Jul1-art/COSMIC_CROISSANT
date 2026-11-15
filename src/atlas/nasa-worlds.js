// Locations and imagery are drawn from the linked NASA mission catalogues.
// Earth starts without curated demo destinations; use place or coordinate search.
export const EARTH_SITES = [];

export const PLANET_SITES = {
  mars:[
    { id:'perseverance', name:'Jezero crater (Perseverance)', tag:'PERSEVERANCE · 2021', lat:18.4447, lon:77.4508, altitude:.00065, local:true, terrainRange:6500,
      description:'At Jezero, the HiRISE stereo model measures terrain at 1 m per pixel within its coverage area.',
      source:'https://www.uahirise.org/dtm/ESP_045994_1985' },
    { id:'curiosity', name:'Gale crater (Curiosity)', tag:'CURIOSITY · 2011', lat:-4.5895, lon:137.4417, altitude:.001, local:true, terrainRange:8500,
      description:'Bradbury Landing site in Gale Crater explored by rover Curiosity.',
      source:'https://science.nasa.gov/mission/msl-curiosity/' },
    { id:'pathfinder', name:'Ares Vallis (Pathfinder)', tag:'PATHFINDER · 1996', lat:19.33, lon:-33.55, altitude:.001, terrainRange:10000,
      description:'Carl Sagan Memorial Station and Sojourner rover landing site.',
      source:'https://science.nasa.gov/mission/mars-pathfinder/' },
    { id:'viking1', name:'Chryse Planitia (Viking 1)', tag:'VIKING 1 · 1975', lat:22.48, lon:-47.97, altitude:.001, terrainRange:12000,
      description:'First successful long-duration Mars lander in 1976.',
      source:'https://science.nasa.gov/mission/viking-1/' },
    { id:'viking2', name:'Utopia Planitia (Viking 2)', tag:'VIKING 2 · 1975', lat:48.27, lon:134.0, altitude:.001, terrainRange:12000,
      description:'Utopia Planitia landing site of Viking 2 in 1976.',
      source:'https://science.nasa.gov/mission/viking-2/' },
    { id:'opportunity', name:'Meridiani Planum (Opportunity)', tag:'OPPORTUNITY · 2003', lat:-2.07, lon:-5.53, altitude:.001, terrainRange:10000,
      description:'Meridiani Planum landing site of rover Opportunity.',
      source:'https://science.nasa.gov/mission/mer-opportunity/' },
    { id:'spirit', name:'Gusev crater (Spirit)', tag:'SPIRIT · 2003', lat:-14.57, lon:175.47, altitude:.001, terrainRange:10000,
      description:'Gusev Crater landing site of rover Spirit.',
      source:'https://science.nasa.gov/mission/mer-spirit/' },
    { id:'zhurong', name:'Utopia Planitia (Zhurong)', tag:'ZHURONG · 2020', lat:25.06, lon:109.92, altitude:.001, terrainRange:10000,
      description:'Tianwen-1 landing platform and rover Zhurong.',
      source:'https://science.nasa.gov/' },
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
