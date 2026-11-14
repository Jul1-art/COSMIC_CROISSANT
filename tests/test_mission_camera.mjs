import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraEase,createMissionCamera} from '../src/missions/mission-camera.js';
class Vector{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}clone(){return new Vector(this.x,this.y,this.z);}copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}lerpVectors(a,b,t){this.x=a.x+(b.x-a.x)*t;this.y=a.y+(b.y-a.y)*t;this.z=a.z+(b.z-a.z)*t;return this;}}
function fixture(){let time=0,reduced=false;const camera={position:new Vector()},controls={target:new Vector(),update(){}};const motion=createMissionCamera({camera,controls,now:()=>time,reducedMotion:()=>reduced});return {camera,controls,motion,time(value){time=value;},reduce(){reduced=true;}};}
test('camera arrival eases without a jump and reaches the exact equipment framing',()=>{
 const f=fixture();f.motion.flyTo(new Vector(10,5,20),new Vector(2,1,0),{duration:1000});assert.equal(f.camera.position.x,0);f.motion.update(250);assert.equal(f.camera.position.x,.625);f.motion.update(500);assert.equal(f.camera.position.x,5);assert.equal(f.controls.target.x,1);f.motion.update(1000);assert.equal(f.camera.position.x,10);assert.equal(f.controls.target.x,2);assert.equal(f.motion.active,false);
});
test('new equipment flights start from the current view and pointer cancellation freezes the flight',()=>{
 const f=fixture();f.motion.flyTo(new Vector(10),new Vector(2),{duration:1000});f.motion.update(500);f.time(500);f.motion.flyTo(new Vector(-5),new Vector(-2),{duration:1000});assert.equal(f.camera.position.x,5);f.motion.update(1000);assert.equal(f.camera.position.x,0);f.motion.cancel();f.motion.update(1500);assert.equal(f.camera.position.x,0);assert.equal(f.motion.active,false);
});
test('reduced motion and immediate reset apply the destination without queuing animation',()=>{
 const f=fixture();f.reduce();f.motion.flyTo(new Vector(12,4,5),new Vector(1,2,3));assert.equal(f.camera.position.x,12);assert.equal(f.controls.target.y,2);assert.equal(f.motion.active,false);f.motion.flyTo(new Vector(2),new Vector(),{duration:0});assert.equal(f.camera.position.x,2);
});
test('camera easing stays bounded, symmetric and monotonic',()=>{
 let previous=0;for(let i=0;i<=100;i++){const t=i/100,value=cameraEase(t);assert.ok(value>=previous&&value<=1);assert.ok(Math.abs(value+cameraEase(1-t)-1)<1e-12);previous=value;}
});
