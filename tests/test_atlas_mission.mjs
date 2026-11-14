import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {createAtlasMission} from '../src/missions/atlas-mission.js';
import {START,END,EVENTS,eventTime} from '../src/missions/apollo11-data.js';
const data=JSON.parse(await readFile(new URL('../assets/missions/apollo-11/trajectory.json',import.meta.url),'utf8'));
function fixture({aspect=1.5,loadData=async()=>data,loadSurface}={}){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,aspect,.000001,1e6),controls={target:new THREE.Vector3()},earth=new THREE.Vector3(500,4,300);
 const parent=new THREE.Group();parent.position.copy(earth);scene.add(parent);
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1),new THREE.MeshBasicMaterial());mesh.scale.setScalar(.518);parent.add(mesh);
 const calls=[];globalThis.matchMedia=()=>({matches:false});
 const mission=createAtlasMission({THREE,scene,camera,controls,getEarth:()=>earth,getMoonMesh:()=>mesh,getRadius:id=>id==='earth'?1.9:.518,loadData,loadSurface,
 frame:(target,position)=>{controls.target.copy(target);camera.position.copy(position);calls.push(['frame']);},onStart:()=>calls.push(['start']),onStop:restore=>calls.push(['stop',restore]),onTime:(time,playing)=>calls.push(['time',time,playing]),onStatus:(status,message)=>calls.push(['status',status,message])});
 return {scene,camera,controls,earth,mesh,calls,mission,group:scene.getObjectByName('Apollo 11 · native atlas')};
}
test('one native scene uses points for vehicles and retains GPU route buffers while scrubbing',async()=>{
 const {mission,scene,group,calls}=fixture();const count=scene.children.length;await mission.start();assert.equal(scene.children.length,count);assert.equal(mission.active,true);
 const route=group.getObjectByName('Trajet géocentrique calculé'),attribute=route.geometry.getAttribute('position');
 for(const row of EVENTS){mission.setTime(row.time);assert.ok(group.getObjectByName('Columbia · point').position.toArray().every(Number.isFinite));}
 assert.equal(route.geometry.getAttribute('position'),attribute);assert.equal(group.getObjectByName('Columbia · point').isPoints,true);
 assert.equal(group.getObjectByName('Eagle · point').isPoints,true);assert.equal(group.getObjectByProperty('isMesh',true),undefined);
 mission.stop();assert.equal(group.visible,false);assert.deepEqual(calls.at(-1),['stop',true]);mission.dispose();assert.equal(scene.children.includes(group),false);
});
test('site and lunar views frame in portrait, stay outside the Moon and preserve catalogue body size',async()=>{
 const {mission,group,mesh,camera,controls}=fixture({aspect:.46});await mission.start();const range=camera.position.distanceTo(controls.target);
 mission.setMode('site');assert.equal(mission.time,eventTime('landing'));assert.equal(mission.playing,false);assert.equal(mesh.scale.x,.518);
 assert.ok(camera.position.distanceTo(controls.target)<range);const worldMoon=mesh.getWorldPosition(new THREE.Vector3());
 assert.ok(camera.position.distanceTo(worldMoon)>.518);
 group.updateMatrixWorld(true);const landing=group.getObjectByName('Eagle · point').getWorldPosition(new THREE.Vector3());assert.ok(Math.abs(landing.distanceTo(worldMoon)-.518)<.00001);
 mission.setMode('orbit');assert.equal(mission.mode,'orbit');mission.dispose();
});
test('playback has one bounded tick, historical Moon motion, and a deterministic rewind',async()=>{
 const {mission,earth,mesh}=fixture();const before=earth.clone();await mission.start();mission.setSpeed(86400);mission.update(.1,1000);assert.equal(mission.time,START+8640000);
 const position=mesh.position.clone();mission.setTime(eventTime('landing'));assert.ok(mesh.position.distanceTo(position)>1);assert.deepEqual(earth,before);
 const original=mesh.position.clone();mission.setTime(START);mission.setTime(eventTime('landing'));assert.ok(mesh.position.distanceTo(original)<1e-9);
 mission.setTime(END-1000);mission.setPlaying(true);mission.update(.1,2000);assert.equal(mission.time,END);assert.equal(mission.playing,false);mission.dispose();
});
test('closing during data loading prevents late scene takeover, and a failure remains retryable',async()=>{
 let resolve;const f=fixture({loadData:()=>new Promise(r=>{resolve=r;})});const pending=f.mission.start();assert.equal(f.mission.starting,true);f.mission.stop(false);resolve(data);await pending;
 assert.equal(f.mission.active,false);assert.equal(f.calls.some(row=>row[0]==='start'),false);f.mission.dispose();
 let tries=0;const g=fixture({loadData:async()=>{if(++tries===1)throw new Error('Unavailable');return data;}});await g.mission.start();assert.equal(g.mission.active,false);assert.equal(g.calls.at(-1)[1],'error');await g.mission.start();assert.equal(g.mission.active,true);g.mission.dispose();
});
test('surface presets do not lock the camera, and collision guard rejects entering a body',async()=>{
 const {mission,camera,controls,mesh,earth}=fixture();await mission.start();mission.setMode('site');
 const moon=()=>mesh.getWorldPosition(new THREE.Vector3());const original=camera.position.clone();
 const target=controls.target.clone(),up=camera.up.clone();
 for(const t of [START,END,eventTime('landing')]){mission.setTime(t);assert.deepEqual(camera.position,original,'historical time cannot drag the camera');assert.deepEqual(controls.target,target);assert.deepEqual(camera.up,up);}
 assert.ok(camera.position.distanceTo(original)<1e-7,'the free camera stays where the user placed it');
 camera.position.copy(moon());mission.enforceCamera();assert.ok(camera.position.distanceTo(moon())>.518);
 camera.position.copy(earth);mission.enforceCamera();assert.ok(camera.position.distanceTo(earth)>1.9);assert.ok(camera.quaternion.toArray().every(Number.isFinite));
 assert.ok(controls.target.toArray().every(Number.isFinite));mission.dispose();
});
test('a late local terrain load cannot take the camera back after the user starts navigating',async()=>{
 let resolve;const f=fixture({loadSurface:()=>new Promise(r=>{resolve=r;})});await f.mission.start();f.mission.setMode('site');f.mission.releaseCamera();
 f.camera.position.add(new THREE.Vector3(2,3,4));f.controls.target.add(new THREE.Vector3(4,5,6));const pose=f.camera.position.clone(),target=f.controls.target.clone();
 resolve({root:new THREE.Group(),setActive(){},updateShadows(){},dispose(){},protectCamera(){return false;}});
 await new Promise(r=>setTimeout(r,950));assert.deepEqual(f.camera.position,pose);assert.deepEqual(f.controls.target,target);f.mission.dispose();
});
