import {interpolatePlanetState} from '../atlas/planetary-ephemeris.js';
import {archiveClock} from './archive-clock.js';

export const LIGHT_SPEED_KM_S=299792.458;
export const LIGHT_DAY_KM=LIGHT_SPEED_KM_S*86400;
export const VOYAGER_LIGHT_DAY_AT=Date.parse('2026-11-18T10:16:07Z');
export const VOYAGER_MILESTONE_SOURCE='https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/';
export const DISTANT_PROBES=[
 {id:'voyager-1',name:'Voyager 1',year:1977,launch:'1977-09-05T12:56:00Z',interstellar:true},
 {id:'voyager-2',name:'Voyager 2',year:1977,launch:'1977-08-20T14:29:00Z',interstellar:true},
 {id:'pioneer-10',name:'Pioneer 10',year:1972,launch:'1972-03-03T01:49:00Z'},
 {id:'pioneer-11',name:'Pioneer 11',year:1973,launch:'1973-04-06T02:11:00Z'},
 {id:'new-horizons',name:'New Horizons',year:2006,launch:'2006-01-19T19:00:00Z'},
];
export const isDistantProbe=id=>DISTANT_PROBES.some(probe=>probe.id===id);
export const rowTime=row=>(row[0]-2440587.5)*86400000;
export function lightDayCountdown(now=Date.now()){
 const seconds=Math.max(0,Math.ceil((VOYAGER_LIGHT_DAY_AT-now)/1000));
 return {reached:now>=VOYAGER_LIGHT_DAY_AT,days:Math.floor(seconds/86400),hours:Math.floor(seconds/3600)%24,minutes:Math.floor(seconds/60)%60,seconds:seconds%60};
}
export function distantEvents(record,events,now=Date.now()){
 const definition=DISTANT_PROBES.find(row=>row.id===record.id);if(!definition)return events;
 const launch=Date.parse(definition.launch),clock=archiveClock(record,events);
 const rows=[{id:'departure',date:definition.launch,time:launch,title:'Launch from Earth',text:'Departure from Earth · followed by the NASA/JPL Horizons heliocentric trajectory.'}];
 for(const [i,event] of events.entries()){
  const time=record.id==='voyager-1'&&/jour.lumi[eè]re/i.test(event.title+' '+event.text)?VOYAGER_LIGHT_DAY_AT:clock.anchors[i]?.instant;
  if(time>launch&&time<now)rows.push({...event,time});
 }
 rows.sort((a,b)=>a.time-b.time);
 const unique=rows.filter((row,i)=>!i||row.time!==rows[i-1].time);
 unique.push({id:'present',date:new Date(now).toISOString(),time:now,title:'Present-day position',text:'Position calculated from NASA/JPL Horizons ephemerides · geometric distances to Earth and the Sun.'});
 return unique;
}
export function distantTimeAt(events,progress){
 const index=Math.max(0,Math.min(events.length-1,Math.floor(progress))),a=events[index].time,b=events[index+1]?.time??a;
 return a+(b-a)*Math.max(0,Math.min(1,progress-index));
}
export function sampleDistantProbe(data,time){
 const first=rowTime(data.states[0]),launch=Date.parse(data.launch);
 if(time>=launch&&time<first){
  const t=(time-launch)/(first-launch),a=data.launchEarthState,b=data.states[0];
  return {positionKm:Object.fromEntries(['x','y','z'].map((axis,i)=>[axis,a[i+1]+(b[i+1]-a[i+1])*t])),launchSchematic:true};
 }
 return interpolatePlanetState(data,time);
}
export function distantMetrics(data,planets,time){
 const craft=sampleDistantProbe(data,time),earth=interpolatePlanetState(planets.bodies.earth,time);
 if(!craft||!earth)return null;
 const p=craft.positionKm,e=earth.positionKm,earthKm=Math.hypot(p.x-e.x,p.y-e.y,p.z-e.z),sunKm=Math.hypot(p.x,p.y,p.z);
 return {earthKm,sunKm,lightSeconds:earthKm/LIGHT_SPEED_KM_S,time,launchSchematic:Boolean(craft.launchSchematic)};
}
