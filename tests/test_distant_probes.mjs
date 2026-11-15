import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {DISTANT_PROBES,distantEvents,distantMetrics,sampleDistantProbe,lightDayCountdown,LIGHT_DAY_KM,VOYAGER_LIGHT_DAY_AT,rowTime} from '../src/missions/distant-data.js';
import {interpolatePlanetState} from '../src/atlas/planetary-ephemeris.js';
import {archiveEvents} from '../src/missions/archive-data.js';
import {kmToWorld} from '../src/atlas/solar-scale.js';
const json=async path=>JSON.parse(await readFile(new URL('../assets/missions/'+path,import.meta.url)));
const planets=await json('distant/planets.json');

test('Voyager countdown uses the NASA second, physical light-day and stops at zero',()=>{
 assert.equal(new Date(VOYAGER_LIGHT_DAY_AT).toISOString(),'2026-11-18T10:16:07.000Z');
 assert.deepEqual(lightDayCountdown(VOYAGER_LIGHT_DAY_AT-90061000),{reached:false,days:1,hours:1,minutes:1,seconds:1});
 assert.deepEqual(lightDayCountdown(VOYAGER_LIGHT_DAY_AT+1),{reached:true,days:0,hours:0,minutes:0,seconds:0});
 assert(Math.abs(LIGHT_DAY_KM-25902068371.2)<.001);
});

test('all five real trajectories are bounded, independently checked and extend from departure to beyond Neptune',async()=>{
 for(const probe of DISTANT_PROBES){
  const data=await json('distant/'+probe.id+'.json');
  assert.equal(data.center,'500@10');assert.equal(data.timeScale,'UTC');assert.equal(data.units.velocity,'km/day');
  assert(data.solution.includes(probe.name));assert(data.states.length>2000);
  assert(data.states.every((row,i)=>row.length===7&&row.every(Number.isFinite)&&(!i||row[0]>data.states[i-1][0])));
  for(const reference of data.validation.states){const state=interpolatePlanetState(data,rowTime(reference));const p=state.positionKm;assert(Math.hypot(p.x-reference[1],p.y-reference[2],p.z-reference[3])<100);}
  const launch=sampleDistantProbe(data,Date.parse(probe.launch));assert(launch.launchSchematic);assert.equal(launch.positionKm.x,data.launchEarthState[1]);
  assert.equal(sampleDistantProbe(data,Date.parse(probe.launch)-1),null);
  assert.equal(sampleDistantProbe(data,rowTime(data.states.at(-1))+1000),null);
  const present=distantMetrics(data,planets,Date.parse('2026-11-15T12:00:00Z'));assert(present.sunKm>60*149597870.7);
 }
});

test('Voyager one-light-day distance matches the independently published NASA milestone',async()=>{
 const data=await json('distant/voyager-1.json'),metrics=distantMetrics(data,planets,VOYAGER_LIGHT_DAY_AT);
 assert(Math.abs(metrics.earthKm-LIGHT_DAY_KM)<1);
 assert(Math.abs(metrics.lightSeconds-86400)<.001);
 assert.notEqual(Math.round(metrics.sunKm),Math.round(metrics.earthKm));
});

test('all five documentary timelines start at Earth, remain ordered and end at the current date',async()=>{
 const now=Date.parse('2026-11-15T12:00:00Z');
 for(const probe of DISTANT_PROBES){const record=await json(probe.id+'.json'),events=distantEvents(record,archiveEvents(record),now);assert.equal(events[0].time,Date.parse(probe.launch));assert.equal(events.at(-1).time,now);assert(events.every((event,i)=>!i||event.time>events[i-1].time));assert(events.length>=4);}
 const voyager=await json('voyager-1.json'),milestone=[{id:'light-day',date:'18 novembre 2026',title:'Un jour-lumière',text:''}];
 assert(!distantEvents(voyager,milestone,VOYAGER_LIGHT_DAY_AT-1000).some(event=>event.id==='light-day'));
 assert.equal(distantEvents(voyager,milestone,VOYAGER_LIGHT_DAY_AT+1000).find(event=>event.id==='light-day').time,VOYAGER_LIGHT_DAY_AT);
});

async function fixture(id){
 const record=await json(id+'.json'),now={value:Date.parse('2026-11-15T12:00:00Z')},events=distantEvents(record,archiveEvents(record),now.value),data=await json('distant/'+id+'.json');
 const context=vm.createContext({console:{warn(){}},URL}),url=new URL('../src/missions/distant-atlas.js',import.meta.url),source=new vm.SourceTextModule(await readFile(url,'utf8'),{context});
 await source.link(async specifier=>{
  let ns;
  if(specifier==='./spacecraft-models.js')ns={buildSpacecraft(){const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial()));return group;}};
  else if(specifier==='./catalog.js')ns={loadJSON:async()=>({}),asset:path=>path};
  else if(/GLTFLoader/.test(specifier))ns={GLTFLoader:class{}};
  else if(/DRACOLoader/.test(specifier))ns={DRACOLoader:class{}};
  else if(/KTX2Loader/.test(specifier))ns={KTX2Loader:class{}};
  else if(/RoomEnvironment/.test(specifier))ns={RoomEnvironment:class{}};
  else ns=await import(new URL(specifier,url));
  return new vm.SyntheticModule(Object.keys(ns),function(){for(const [key,value]of Object.entries(ns))this.setExport(key,value);},{context});
 });await source.evaluate();
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,1e-7,150000),controls={target:new THREE.Vector3()},reports=[];
 const load=async path=>path==='models.json'?{}:json(path);
 const controller=source.namespace.createDistantAtlas({THREE,scene,camera,controls,record,events,onState:s=>reports.push(s),onStart(){},onStop(){},onRebase(shift){camera.position.sub(shift);controls.target.sub(shift);},onMaterialsChanged(){},onContextChanged(){},frame(target,position,up){camera.position.copy(position);controls.target.copy(target);camera.up.copy(up);},load,now:()=>now.value});
 await controller.start();return{controller,scene,camera,controls,now,reports,data,events};
}

test('distant renderer departs Earth, traverses the full path and isolates a real 3D model at the current position',async()=>{
 const f=await fixture('voyager-1'),vehicle=f.scene.getObjectByName('Voyager 1 · spacecraft');
 assert(f.controller.showSolarSystem);assert(!vehicle.visible);assert(f.scene.getObjectByName('Full NASA/JPL departure-to-present trajectory'));
 const launch=f.data.launchEarthState;assert(vehicle.position.distanceTo(new THREE.Vector3(kmToWorld(launch[1]),kmToWorld(launch[3]),-kmToWorld(launch[2])))<1e-10);
 f.controller.setProgress(f.events.length-1);f.controller.update(0,1000);assert(f.reports.at(-1).metrics.earthKm>25e9);
 f.controller.setMode('site');assert(!f.controller.showSolarSystem);assert(vehicle.visible);assert(!f.scene.getObjectByName('Full NASA/JPL departure-to-present trajectory').visible);
 assert(cameraDistance(f)>0&&cameraDistance(f)<1e-6);assert(f.camera.near<1e-10);
 const offset=f.camera.position.clone().sub(vehicle.getWorldPosition(new THREE.Vector3()));f.now.value+=3600000;f.controller.update(0,2000);
 assert(f.camera.position.clone().sub(vehicle.getWorldPosition(new THREE.Vector3())).distanceTo(offset)<1e-9);
 f.controller.setMode('journey');assert.equal(f.reports.at(-1).progress,0);assert(f.controller.showSolarSystem);assert(!vehicle.visible);
 f.controller.dispose();assert.equal(f.scene.children.length,0);
});
function cameraDistance(f){return f.camera.position.distanceTo(f.controls.target);}
