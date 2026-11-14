import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createMissionDepth} from '../src/missions/mission-depth.js';
test('metre-scale depth preserves thin model details and one coherent depth map across materials',()=>{
 const camera={far:150000},depth=createMissionDepth(camera),scene=new THREE.Scene(),materials=[new THREE.MeshStandardMaterial(),new THREE.PointsMaterial()];
 for(const material of materials)scene.add(new THREE.Mesh(new THREE.BufferGeometry(),material));
 const original=materials.map(m=>m.onBeforeCompile);depth.install(scene);depth.setScale(6371000/1.9);
 const shaders=materials.map(material=>{const s={uniforms:{},vertexShader:'#include <logdepthbuf_vertex>',fragmentShader:'#include <logdepthbuf_fragment>'};material.onBeforeCompile(s);return s;});
 assert.equal(shaders[0].uniforms.relicDepthScale,shaders[1].uniforms.relicDepthScale);
 const scale=shaders[0].uniforms.relicDepthScale.value,factor=shaders[0].uniforms.relicDepthFactor.value;
 const encoded=meters=>Math.fround(Math.log2(Math.fround(1+meters/scale*scale))*factor*.5);
 assert.notEqual(encoded(20),encoded(20.001),'one-millimetre surfaces at 20 m must not collapse to one depth');
 assert.ok(Math.abs(Math.log2(1+camera.far*scale)*factor*.5-1)<1e-12);
 depth.setScale(1);assert.equal(shaders[0].uniforms.relicDepthScale.value,1);depth.dispose();assert.equal(materials[0].onBeforeCompile,original[0]);
 for(const material of materials)material.dispose();
});
