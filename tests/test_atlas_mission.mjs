import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createAtlasMission} from '../src/missions/atlas-mission.js';
import {START,END,EVENTS,eventTime,APOLLO_11} from '../src/missions/apollo11-data.js';

function fixture(aspect=1.5){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,aspect,.01,1e6),controls={target:new THREE.Vector3()};
 const earth=new THREE.Vector3(500,4,300),moon=new THREE.Vector3(610,8,310);
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(.5),new THREE.MeshBasicMaterial());mesh.position.copy(moon);scene.add(mesh);
 const calls=[];globalThis.matchMedia=()=>({matches:false});
 const mission=createAtlasMission({THREE,scene,camera,controls,getEarth:()=>earth,getMoon:()=>moon,getMoonMesh:()=>mesh,getRadius:id=>id==='earth'?1.9:.5,
  frame:(target,position)=>{controls.target.copy(target);camera.position.copy(position);calls.push(['frame']);},onStart:()=>calls.push(['start']),onStop:restore=>calls.push(['stop',restore]),onTime:(time,playing)=>calls.push(['time',time,playing])});
 return {scene,camera,controls,earth,moon,mesh,calls,mission,group:scene.getObjectByName('Apollo 11 · native atlas')};
}
test('mission overlays the existing atlas, scrubs every historical event and keeps finite world positions',()=>{
 const {mission,scene,group,calls}=fixture();const originalCount=scene.children.length;
 mission.start();assert.equal(scene.children.length,originalCount);assert.equal(group.visible,true);assert.equal(mission.time,START);
 const route=group.children.find(node=>node.isLine);const routeAttribute=route.geometry.getAttribute('position');
 for(const row of EVENTS){mission.setTime(row.time);const craft=group.getObjectByName('Columbia / Eagle');assert.ok(craft.position.toArray().every(Number.isFinite));}
 assert.equal(route.geometry.getAttribute('position'),routeAttribute,'scrubbing reuses GPU attributes');
 mission.setTime(END+1e6);assert.equal(mission.time,END);assert.equal(mission.playing,false);
 mission.stop();assert.equal(group.visible,false);assert.deepEqual(calls.at(-1),['stop',true]);mission.dispose();assert.equal(scene.children.includes(group),false);
});
test('landing position uses the actual atlas Moon transform and both views frame in portrait',()=>{
 const {mission,group,mesh,camera,controls}=fixture(.46);mesh.scale.setScalar(6);mission.start();
 const journeyRange=camera.position.distanceTo(controls.target);
 mission.setMode('site');assert.equal(mesh.scale.x,1,'close view cancels distance-based Moon enlargement before framing');assert.equal(mission.time,eventTime('landing'));assert.equal(mission.playing,false);
 const lat=APOLLO_11.site.latitude*Math.PI/180,lon=APOLLO_11.site.longitude*Math.PI/180;
 const expected=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)).multiplyScalar(.5);mesh.localToWorld(expected);
 group.updateMatrixWorld(true);const actual=group.getObjectByName('Columbia / Eagle').getWorldPosition(new THREE.Vector3());assert.ok(actual.distanceTo(expected)<1e-9);
 assert.ok(camera.position.distanceTo(controls.target)<journeyRange);mission.dispose();
});
test('playback advances mission time without mutating atlas bodies and stops at recovery',()=>{
 const {mission,earth,moon}=fixture();const before=[earth.clone(),moon.clone()];mission.start();mission.setSpeed(86400);mission.update(1,1000);
 assert.equal(mission.time,START+86400000);assert.deepEqual([earth,moon],before);
 mission.setTime(END-1000);mission.setPlaying(true);mission.update(1,2000);assert.equal(mission.time,END);assert.equal(mission.playing,false);
 mission.stop(false);assert.equal(mission.active,false);mission.dispose();
});
