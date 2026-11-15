import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {createAtlasMission} from '../src/missions/atlas-mission.js';
import {APOLLO_11,START,END,EVENTS,eventTime} from '../src/missions/apollo11-data.js';
const data=JSON.parse(await readFile(new URL('../assets/missions/apollo-11/trajectory.json',import.meta.url),'utf8'));
function fixture({aspect=1.5,loadData=async()=>data,loadSurface,rebase=false}={}){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,aspect,.000001,1e6),controls={target:new THREE.Vector3()},earth=new THREE.Vector3(500,4,300);
 const parent=new THREE.Group();parent.position.copy(earth);scene.add(parent);
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(1),new THREE.MeshBasicMaterial());mesh.scale.setScalar(.518);parent.add(mesh);
 const calls=[];globalThis.matchMedia=()=>({matches:false});
 const mission=createAtlasMission({THREE,scene,camera,controls,getEarth:()=>earth,getMoonMesh:()=>mesh,getRadius:id=>id==='earth'?1.9:.518,loadData,loadSurface,
 onRebase:rebase?shift=>{earth.sub(shift);parent.position.sub(shift);camera.position.sub(shift);controls.target.sub(shift);calls.push(['rebase']);}:null,
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
function sitePose(mesh){
 const lat=APOLLO_11.site.latitude*Math.PI/180,lon=APOLLO_11.site.longitude*Math.PI/180;
 const q=mesh.getWorldQuaternion(new THREE.Quaternion()),origin=mesh.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)).multiplyScalar(.518).applyQuaternion(q));
 return {origin,q,local:point=>point.clone().sub(origin).applyQuaternion(q.clone().invert())};
}
test('landing-site playback preserves the user view in the moving and rotating lunar frame',async()=>{
 const {mission,camera,controls,mesh,earth}=fixture();await mission.start();mission.setMode('site');
 camera.position.add(new THREE.Vector3(.03,-.02,.01));controls.target.add(new THREE.Vector3(-.01,.02,.03));mission.releaseCamera();
 const pose=sitePose(mesh),position=pose.local(camera.position),target=pose.local(controls.target),up=camera.up.clone().applyQuaternion(pose.q.clone().invert()),original=camera.position.clone();
 for(const t of [START,END,eventTime('landing')]){
  mission.setTime(t);const next=sitePose(mesh);assert.ok(next.local(camera.position).distanceTo(position)<1e-10);assert.ok(next.local(controls.target).distanceTo(target)<1e-10);assert.ok(camera.up.clone().applyQuaternion(next.q.clone().invert()).distanceTo(up)<1e-10);
 }
 assert.ok(camera.position.distanceTo(original)<1e-10,'Rewinding returns to the exact same landing-site view');
 mission.setPlaying(true);mission.setSpeed(86400);for(let i=0;i<80;i++){mission.update(.1,i*100);const p=sitePose(mesh);assert.ok(p.local(camera.position).distanceTo(position)<1e-10);}
 const moon=()=>mesh.getWorldPosition(new THREE.Vector3());camera.position.copy(moon());mission.enforceCamera();assert.ok(camera.position.distanceTo(moon())>.518);
 camera.position.copy(earth);mission.enforceCamera();assert.ok(camera.position.distanceTo(earth)>1.9);assert.ok(controls.target.toArray().every(Number.isFinite));mission.dispose();
});
test('surface playback keeps its floating origin without accumulating camera translations',async()=>{
 const f=fixture({rebase:true,loadSurface:async()=>({root:new THREE.Group(),setActive(){},updateShadows(){},refreshShadows(){},dispose(){},protectCamera(){return true;}})});
 await f.mission.start();f.mission.setMode('site');f.mission.releaseCamera();await new Promise(resolve=>setTimeout(resolve,0));
 const initial=sitePose(f.mesh),offset=initial.local(f.camera.position),target=initial.local(f.controls.target);assert.ok(initial.origin.length()<1e-10);
 for(const t of [END,START,eventTime('landing'),END,eventTime('landing')]){f.mission.setTime(t);f.mission.enforceCamera();const p=sitePose(f.mesh);assert.ok(p.origin.length()<1e-10);assert.ok(p.local(f.camera.position).distanceTo(offset)<1e-9);assert.ok(p.local(f.controls.target).distanceTo(target)<1e-9);}
 const position=f.camera.position.clone();for(let i=0;i<1000;i++)f.mission.update(0,i*16);assert.ok(f.camera.position.distanceTo(position)<1e-10);f.mission.dispose();
});
test('a late local terrain load cannot take the camera back after the user starts navigating',async()=>{
 let resolve;const f=fixture({loadSurface:()=>new Promise(r=>{resolve=r;})});await f.mission.start();f.mission.setMode('site');f.mission.releaseCamera();
 f.camera.position.add(new THREE.Vector3(2,3,4));f.controls.target.add(new THREE.Vector3(4,5,6));const pose=f.camera.position.clone(),target=f.controls.target.clone();
 resolve({root:new THREE.Group(),setActive(){},updateShadows(){},dispose(){},protectCamera(){return false;}});
 await new Promise(r=>setTimeout(r,950));assert.deepEqual(f.camera.position,pose);assert.deepEqual(f.controls.target,target);f.mission.dispose();
});

test('lunar orbit playback and rewinds retain user zoom and pan in the moving Moon frame',async()=>{
 const {mission,camera,controls,mesh}=fixture();await mission.start();mission.setMode('orbit');
 camera.position.add(new THREE.Vector3(.3,-.2,.1));controls.target.add(new THREE.Vector3(-.2,.1,.3));
 const moon=()=>mesh.getWorldPosition(new THREE.Vector3());
 const relative=camera.position.clone().sub(moon()),pan=controls.target.clone().sub(moon()),up=camera.up.clone();
 for(const t of [eventTime('landing'),eventTime('ascent'),eventTime('landing')]){
  mission.setTime(t);assert.ok(camera.position.clone().sub(moon()).distanceTo(relative)<1e-8);assert.ok(controls.target.clone().sub(moon()).distanceTo(pan)<1e-8);assert.deepEqual(camera.up,up);
 }
 mission.setSpeed(86400);mission.setPlaying(true);for(let i=0;i<20;i++)mission.update(.1,i*100);
 assert.ok(camera.position.clone().sub(moon()).distanceTo(relative)<1e-8,'Playback must not make the Moon recede');assert.ok(controls.target.clone().sub(moon()).distanceTo(pan)<1e-8);
 mission.setMode('journey');const fixed=camera.position.clone();mission.setTime(START);assert.deepEqual(camera.position,fixed,'The Earth–Moon overview retains its free inertial camera');mission.dispose();
});
