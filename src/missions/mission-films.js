import {APOLLO_11} from './apollo11-data.js';
import {appURL} from '../core/paths.js';
/** Future missions register media here and reuse the isolated, localized player. */
const films=new Map();
export function registerMissionFilm(id,definition){
 if(!id||!definition?.media||!(definition.media.hls||definition.media.src))throw new TypeError('Mission film id and media source are required');
 films.set(id,definition);
}
export const getMissionFilm=id=>films.get(id);
/** Resolve additional dossiers lazily while retaining the exact shared player. */
export async function ensureMissionFilm(id){
 if(films.has(id))return films.get(id);
 if(!/^[a-z0-9-]+$/.test(id))return;
 const response=await fetch(appURL(`assets/missions/${id}.media.json`));
 if(!response.ok)throw new Error('Mission media unavailable');
 const archive=await response.json(),selected=archive.videos?.[0]||archive.documentary;
 if(!selected)return;
 const definition={prefix:id+'-',title:selected.title,ready:selected.title,media:{src:selected.local?appURL('assets/missions/'+selected.src).href:selected.src,duration:selected.duration||24,bitrate:selected.bitrate,poster:archive.images?.[0]?appURL('assets/missions/'+archive.images[0].src).href:'',endCard:false,captions:{fr:[],en:[]}}};
 registerMissionFilm(id,definition);return definition;
}
registerMissionFilm('apollo-11',{prefix:'apollo-',title:'Apollo 11 · The NASA film',ready:'Apollo 11 · NASA archives · 31 min',media:{hls:appURL(APOLLO_11.film.path).href,duration:APOLLO_11.film.duration,poster:appURL('assets/missions/apollo-11/launch.jpg').href,endCard:false}});
registerMissionFilm('sputnik-1',{prefix:'sputnik-',title:'Sputnik 1 · The mission in pictures',ready:'Sputnik 1 · Archives and visual story · 1 min 53',media:{hls:appURL('assets/missions/sputnik-1/film-en/index.m3u8').href,languages:{en:{hls:appURL('assets/missions/sputnik-1/film-en/index.m3u8').href},fr:{hls:appURL('assets/missions/sputnik-1/film-fr/index.m3u8').href}},duration:113.27,bitrate:535000,poster:appURL('assets/missions/sputnik-1/launch.jpg').href,endCard:false,captions:{fr:[],en:[]}}});
