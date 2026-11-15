import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {archiveCloseFrame} from '../src/missions/archive-framing.js';
test('surface close-ups stay outside the globe on both hemispheres and at the poles',()=>{
 for(const radial of [[-.73,-.08,-.67],[.9,.1,.1],[0,1,0],[0,-1,0]]){
  const normal=new THREE.Vector3(...radial).normalize(),target=normal.clone().multiplyScalar(3390001.1);
  const frame=archiveCloseFrame(THREE,{target,radial:normal,distance:12,surface:true});
  assert.ok(frame.position.length()>3390001.1,'camera is above the target, not under the regolith');
  assert.ok(frame.position.clone().sub(target).dot(normal)>0);
  assert.ok(frame.up.distanceTo(normal)<1e-12);
 }
});
test('orbiter inspection looks along the local horizon rather than straight down at an enlarged texture',()=>{
 const radial=new THREE.Vector3(-1,0,0),target=radial.clone().multiplyScalar(4000000);
 const frame=archiveCloseFrame(THREE,{target,radial,distance:20,surface:false});
 const view=frame.position.clone().sub(target).normalize();
 assert.ok(view.dot(radial)>0&&view.dot(radial)<.15);assert.ok(Number.isFinite(frame.position.length()));
});
