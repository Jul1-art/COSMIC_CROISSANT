import test from 'node:test';
import assert from 'node:assert/strict';
import {APOLLO_11,EVENTS,HARDWARE,START,END,eventTime,missionState,missionProgress,formatUTC,elapsedLabel,MISSIONS} from '../src/missions/apollo11-data.js';

test('Apollo 11 has a single mission at the NASA landing coordinates',()=>{
  assert.equal(MISSIONS.size,1);assert.equal(MISSIONS.get('apollo-11'),APOLLO_11);
  assert.deepEqual(APOLLO_11.site,{name:'Base de la Tranquillité',body:'moon',latitude:.67409,longitude:23.47298});
});
test('the clock clamps invalid and out-of-mission input and keeps boundaries reversible',()=>{
  assert.equal(missionState(NaN).time,START);assert.equal(missionState(START-1000).time,START);
  assert.equal(missionState(END+1000).time,END);assert.equal(missionProgress(START),0);assert.equal(missionProgress(END),1);
  assert.equal(missionState(eventTime('landing')-1).landed,false);assert.equal(missionState(eventTime('landing')).landed,true);
  assert.equal(missionState(eventTime('step')-1).deployed,false);assert.equal(missionState(eventTime('step')).deployed,true);
  assert.equal(missionState(eventTime('ascent')).ascent,true);assert.equal(missionState(START).ascent,false);
  for(const row of EVENTS)assert.equal(missionState(row.time).event.id,row.id);
});
test('historical stages are ordered, separate the SM at Earth on July 24 and end at recovery',()=>{
  for(let i=1;i<EVENTS.length;i++)assert.ok(EVENTS[i].time>EVENTS[i-1].time);
  assert.equal(new Date(eventTime('separation')).toISOString(),'1969-07-24T16:21:12.000Z');
  assert.equal(new Date(END).toISOString(),'1969-07-24T16:50:35.000Z');
  assert.equal(elapsedLabel(START),'T+000:00:00');assert.equal(elapsedLabel(END),'T+195:18:35');
  assert.match(formatUTC(START),/13:32:00 UTC$/);
});
test('all inventory objects have a valid appearance stage and unknown locations stay unpositioned',()=>{
  assert.equal(new Set(HARDWARE.map(row=>row.id)).size,HARDWARE.length);
  for(const row of HARDWARE){assert.ok(EVENTS.some(event=>event.id===row.since));assert.ok(row.text.length>40);if(row.position)assert.ok(row.position.every(Number.isFinite));}
  for(const id of ['ascent','service','sivb','sla'])assert.equal(HARDWARE.find(row=>row.id===id).position,undefined);
  assert.equal(HARDWARE.find(row=>row.id==='ascent').status,'Devenir non confirmé');
});
test('the complete mission film has NASA provenance and covers JFK through recovery',async()=>{
  const {readFile,stat}=await import('node:fs/promises');
  for(const [,url] of APOLLO_11.sources)assert.ok(new URL(url).hostname.endsWith('nasa.gov'));
  assert.equal(new URL(APOLLO_11.film.source).hostname,'images.nasa.gov');
  assert.deepEqual(APOLLO_11.film.coverage,['JFK','Préparatifs','Décollage','Voyage Terre–Lune','Alunissage','Sortie lunaire','Retour sur Terre','Récupération']);
  const base=new URL('../assets/missions/apollo-11/film/',import.meta.url),manifest=await readFile(new URL('mission.m3u8',base),'utf8');
  assert.match(manifest,/#EXT-X-PLAYLIST-TYPE:VOD/);assert.match(manifest,/#EXT-X-ENDLIST/);
  const duration=[...manifest.matchAll(/#EXTINF:([\d.]+)/g)].reduce((total,match)=>total+Number(match[1]),0);assert.ok(Math.abs(duration-APOLLO_11.film.duration)<.1);assert.ok(duration>1800);
  const segments=manifest.split('\n').filter(line=>line&&!line.startsWith('#'));assert.ok(segments.length>200);
  const sizes=await Promise.all(segments.map(name=>stat(new URL(name,base)).then(row=>row.size)));assert.ok(sizes.every(size=>size>0&&size<25*1024*1024));
  const provenance=JSON.parse(await readFile(new URL('provenance.json',base),'utf8'));assert.equal(provenance.sources.length,2);assert.equal(provenance.sources[0].range_seconds[0],0);
});

test('the dossier keeps the five requested tabs and documented local NASA photographs',async()=>{
  const {DOSSIER_TABS,renderDossierTab}=await import('../src/missions/mission-dossier-content.js');const {readFile,stat}=await import('node:fs/promises');
  assert.deepEqual(DOSSIER_TABS.map(row=>row[1]),['Identité de la mission','Inventaire du hardware perdu','Chronologie','Science et héritage','Sources et pour aller plus loin']);
  assert.equal((renderDossierTab('inventaire').match(/class="dossier-hardware"/g)||[]).length,14);
  assert.match(renderDossierTab('sources'),/fiche-mission.pdf/);
  const photos=JSON.parse(await readFile(new URL('../assets/missions/apollo-11/photos.json',import.meta.url),'utf8'));assert.equal(Object.keys(photos).length,5);
  for(const [key,row] of Object.entries(photos)){assert.equal(new URL(row.source).hostname,'images.nasa.gov');assert.ok((await stat(new URL(`../assets/missions/apollo-11/${key}.jpg`,import.meta.url))).size>1000);}
});

test('the projected lunar pin is unique, accessible, horizon-occluded and removable',async()=>{
  const {createCesiumMissionMarker}=await import('../src/missions/cesium-mission-marker.js');
  const C=await import('../vendor/cesium/index.js');
  const added=[],opened=[],listeners=new Map();let removed=false,stopped=false,lastPosition;
  const document={querySelector:()=>true,body:{append:node=>added.push(node)},createElement:()=>({dataset:{},style:{},setAttribute(name,value){this[name]=value;},addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),remove(){removed=true;}})};
  const point=C.Cartesian3.fromDegrees(APOLLO_11.site.longitude,APOLLO_11.site.latitude,-1900,C.Ellipsoid.MOON);
  const viewer={isDestroyed:()=>false,canvas:{getBoundingClientRect:()=>({left:10,top:20,width:800,height:600})},camera:{positionWC:C.Cartesian3.multiplyByScalar(point,1.01,new C.Cartesian3()),directionWC:C.Cartesian3.negate(C.Cartesian3.normalize(point,new C.Cartesian3()),new C.Cartesian3())},scene:{postRender:{addEventListener:()=>()=>{stopped=true;}},cartesianToCanvasCoordinates(position){lastPosition=position;return {x:400,y:300};}}};
  assert.equal(createCesiumMissionMarker({Cesium:C,viewer,body:'mars',document}),null);assert.equal(added.length,0);
  const marker=createCesiumMissionMarker({Cesium:C,viewer,body:'moon',document,getSurfaceHeight:()=>-1900,onOpen:id=>opened.push(id)});assert.equal(added.length,1);
  assert.ok(C.Cartesian3.distance(lastPosition,point)<1e-6);assert.equal(added[0].hidden,false);assert.equal(added[0].type,'button');assert.equal(added[0].style.left,'410px');assert.match(added[0]['aria-label'],/Apollo 11/);
  listeners.get('click')();assert.deepEqual(opened,['apollo-11']);viewer.camera.positionWC=C.Cartesian3.negate(point,new C.Cartesian3());marker.update();assert.equal(added[0].hidden,true);
  marker.dispose();assert.ok(removed&&stopped);assert.equal(listeners.size,0);
  const earthPoint=C.Cartesian3.fromDegrees(63.3422,45.9203,0,C.Ellipsoid.WGS84);viewer.camera.positionWC=C.Cartesian3.multiplyByScalar(earthPoint,1.1,new C.Cartesian3());viewer.camera.directionWC=C.Cartesian3.negate(C.Cartesian3.normalize(earthPoint,new C.Cartesian3()),new C.Cartesian3());
  const sp=createCesiumMissionMarker({Cesium:C,viewer,body:'earth',document,onOpen:id=>opened.push(id)});assert.ok(C.Cartesian3.distance(lastPosition,earthPoint)<1e-6);assert.match(added[1]['aria-label'],/Spoutnik 1/);listeners.get('click')();assert.equal(opened.at(-1),'sputnik-1');sp.dispose();
});
