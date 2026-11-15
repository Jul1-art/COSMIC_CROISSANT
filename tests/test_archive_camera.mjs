import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {archiveEvents} from '../src/missions/archive-data.js';

async function fixture(id,published=null){
 const record=JSON.parse(await readFile(new URL(`../assets/missions/${id}.json`,import.meta.url),'utf8'));
 const context=vm.createContext({console,URL}),url=new URL('../src/missions/archive-atlas.js',import.meta.url);
 const source=new vm.SourceTextModule(await readFile(url,'utf8'),{context});
 await source.link(async specifier=>{
  let namespace;
  if(specifier==='./spacecraft-models.js')namespace={buildSpacecraft(){const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial()));return root;}};
  else if(specifier==='./catalog.js')namespace={loadJSON:async()=>({}),asset:path=>path};
  else if(specifier.includes('GLTFLoader'))namespace={GLTFLoader:class{}};
  else if(specifier.includes('DRACOLoader'))namespace={DRACOLoader:class{}};
  else if(specifier.includes('KTX2Loader'))namespace={KTX2Loader:class{}};
  else if(specifier.includes('RoomEnvironment'))namespace={RoomEnvironment:class{}};
  else if(specifier==='./archive-ephemeris.js')namespace={...await import('../src/missions/archive-ephemeris.js'),loadMissionEphemeris:async()=>published};
  else if(specifier.includes('mission-motion'))namespace={reducedMissionMotion:()=>true};
  else namespace=await import(new URL(specifier,url));
  return new vm.SyntheticModule(Object.keys(namespace),function(){for(const [key,value] of Object.entries(namespace))this.setExport(key,value);},{context});
 });
 await source.evaluate();
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.000001,1e6),controls={target:new THREE.Vector3()};
 const positions={earth:new THREE.Vector3(),moon:new THREE.Vector3(50,0,0),mars:new THREE.Vector3(70,0,0),sun:new THREE.Vector3(1000,0,0)},orientation=new THREE.Quaternion();
 const mission=source.namespace.createArchiveAtlas({THREE,scene,camera,controls,record,events:archiveEvents(record),onState(){},getPosition:id=>positions[id].clone(),getOrientation:()=>orientation,getRadius:id=>id==='moon'?.5:1,getRadiusKm:id=>id==='moon'?1737.4:6371,onStart(){},onStop(){},onRebase(shift){for(const point of Object.values(positions))point.sub(shift);camera.position.sub(shift);controls.target.sub(shift);},frame(target,position,up){controls.target.copy(target);camera.position.copy(position);camera.up.copy(up);},onMaterialsChanged(){}});
 await mission.start();
 return {mission,record,scene,camera,controls,positions,orientation,vehicle:scene.getObjectByName(record.name+' · spacecraft')};
}
test('close inspection follows a moving orbiter while preserving the user camera offset and target',async()=>{
 const {mission,vehicle,camera,controls}=await fixture('lro');
 mission.setMode('site');camera.position.add(new THREE.Vector3(.000002,0,0));
 const point=()=>vehicle.getWorldPosition(new THREE.Vector3());
 const cameraOffset=camera.position.clone().sub(point()),targetOffset=controls.target.clone().sub(point());
 for(const progress of [.25,1.5,2.75]){
  mission.setProgress(progress);mission.update(0,1000+progress*1000);
  assert.ok(camera.position.clone().sub(point()).distanceTo(cameraOffset)<1e-12,'camera remains beside the moving spacecraft');
  assert.ok(controls.target.clone().sub(point()).distanceTo(targetOffset)<1e-12,'inspection target follows the same displacement');
 }
 mission.dispose();
});
test('Webb L2 stays opposite the Sun as the dated planet geometry changes',async()=>{
 const {mission,vehicle,positions}=await fixture('james-webb');
 const check=()=>{
  const away=vehicle.getWorldPosition(new THREE.Vector3()).sub(positions.earth),sun=positions.sun.clone().sub(positions.earth).normalize();
  assert.ok(Math.abs(away.length()-1500000/6371)<1e-8);
  assert.ok(away.clone().normalize().dot(sun)<-.999999999);
 };
 check();positions.sun.copy(positions.earth).add(new THREE.Vector3(0,0,1000));mission.update(0,2000);check();
 mission.dispose();
});
test('surface inspection follows body rotation and prevents dragging the camera beneath the globe',async()=>{
 const {mission,vehicle,camera,controls,positions,orientation}=await fixture('curiosity');
 mission.setMode('site');
 const originalRange=camera.position.distanceTo(controls.target);
 orientation.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);mission.update(0,2000);
 assert.ok(camera.position.distanceTo(positions.mars)>1);
 assert.ok(Math.abs(camera.position.distanceTo(controls.target)-originalRange)<1e-12);
 assert.ok(controls.target.distanceTo(vehicle.getWorldPosition(new THREE.Vector3()))<1e-12);
 camera.position.copy(positions.mars);mission.enforceCamera();assert.ok(camera.position.distanceTo(positions.mars)>1);
 mission.dispose();
});
test('the mission scale readout receives the focused body radius rather than Earth for every mission',async()=>{
 const {mission}=await fixture('lro');assert.equal(mission.bodyRadius,.5);assert.equal(mission.bodyRadiusKm,1737.4);mission.dispose();
});
test('STEREO draws both published spacecraft states at physical distances and omits unavailable later STEREO-B positions',async()=>{
 const data=JSON.parse(await readFile(new URL('../assets/missions/ephemerides/stereo.json',import.meta.url),'utf8'));
 const {sampleEyesEntity}=await import('../src/missions/archive-ephemeris.js');
 const {mission,vehicle,positions,scene,camera,controls}=await fixture('stereo',data);
 assert.equal(mission.contextAvailable,false,'no historical location is attributed before the first published orbital sample');
 mission.setProgress(3);mission.update(0,2000);
 assert.equal(mission.contextAvailable,true);assert.equal(mission.focusBody,'sun');
 const state=sampleEyesEntity(data.entities[0],mission.time),distance=vehicle.getWorldPosition(new THREE.Vector3()).distanceTo(positions.sun);
 assert.ok(Math.abs(distance-state.rangeKm*mission.bodyRadius/mission.bodyRadiusKm)<1e-8);
 const second=scene.getObjectByName('STEREO-B · NASA position');assert.equal(second.visible,true);
 mission.setMode('site');assert.ok(camera.position.distanceTo(controls.target)<.0001,'the existing camera frames metre-scale hardware after heliocentric rebasing');
 mission.setProgress(7);mission.update(0,3000);assert.equal(second.visible,false);
 mission.dispose();
});
