import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
test('mission strokes use the real viewport resolution and reveal actual segments without reallocating buffers',async()=>{
 const context=vm.createContext({Float32Array,Uint16Array,Uint32Array,console}),cache=new Map();
 const core=new vm.SyntheticModule(Object.keys(THREE),function(){for(const key of Object.keys(THREE))this.setExport(key,THREE[key]);},{context});
 async function moduleAt(url){if(cache.has(url.href))return cache.get(url.href);const m=new vm.SourceTextModule(await readFile(url,'utf8'),{context,identifier:url.href});cache.set(url.href,m);return m;}
 const root=await moduleAt(new URL('../src/missions/flight-lines.js',import.meta.url));
 await root.link((specifier,parent)=>specifier==='three'?core:moduleAt(new URL(specifier,parent.identifier)));await root.evaluate();
 const line=root.namespace.createFlightLine({name:'Test flight',opacity:.8});line.onBeforeRender({getSize:value=>value.set(1440,900)});
 assert.equal(line.material.resolution.x,1440);assert.equal(line.material.resolution.y,900,'a default 1×1 viewport would turn every thin stroke into a full-screen quad');
 const points=[new THREE.Vector3(0,0,0),new THREE.Vector3(1,2,3),new THREE.Vector3(4,5,6)];line.userData.write(points);assert.equal(line.geometry.instanceCount,2);
 const buffer=line.geometry.attributes.instanceStart.data;points[1].y=20;line.userData.write(points);assert.equal(line.geometry.attributes.instanceStart.data,buffer);assert.equal(buffer.array[4],20);
 line.userData.reveal(2);assert.equal(line.geometry.instanceCount,1);line.userData.reveal(0);assert.equal(line.geometry.instanceCount,0);
 line.geometry.dispose();line.material.dispose();
});
