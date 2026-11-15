/** Local discovery journal, shared by mission cards, films and written dossiers. */
export const MISSION_GOAL=90;
export const DISCOVERIES_KEY='relic.missions.discovered.v1';
const valid=id=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(id);
const memory=new Set();
export function discoveredMissions(storage){
 let saved=[];try{const value=JSON.parse((storage??globalThis.localStorage).getItem(DISCOVERIES_KEY)||'[]');if(Array.isArray(value))saved=value;}catch{}
 return new Set([...saved,...(!storage?memory:[])].filter(valid));
}
export function discoverMission(id,{storage,events=globalThis.window}={}){
 const ids=discoveredMissions(storage);if(!valid(id)||ids.has(id))return false;
 ids.add(id);if(!storage)memory.add(id);
 try{(storage??globalThis.localStorage).setItem(DISCOVERIES_KEY,JSON.stringify([...ids]));}catch{}
 if(events?.dispatchEvent&&typeof CustomEvent==='function')events.dispatchEvent(new CustomEvent('relic-mission-discovered',{detail:{id,count:ids.size,total:MISSION_GOAL}}));
 return true;
}
