import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSurfaceSampler} from '../src/missions/apollo-surface-math.js';
const catalog=JSON.parse(await readFile(new URL('../assets/terrain/catalog.json',import.meta.url),'utf8'));
const buffer=await readFile(new URL('../assets/terrain/moon-apollo11.bin',import.meta.url));
const values=new Uint16Array(buffer.buffer,buffer.byteOffset,buffer.byteLength/2);
function sampler(){return createSurfaceSampler({grid:catalog.grid,values,site:catalog.sites['moon-apollo11'],latitude:.67409,longitude:23.47298});}
test('local LRO terrain uses its real lunar geographic footprint and anchors Eagle to measured ground',()=>{
 const s=sampler();assert.ok(Math.abs(s.height(0,0))<1e-9);
 const width=s.bounds[2]-s.bounds[0];assert.ok(width>1300&&width<1400,'footprint is about 1.36 km on the Moon, not the old Earth-derived 5 km');
 assert.ok(s.zero>=catalog.sites['moon-apollo11'].minMeters&&s.zero<=catalog.sites['moon-apollo11'].maxMeters);
 for(const [x,z] of [[30,20],[-400,300],[10000,0],[20000,20000]])assert.ok(Number.isFinite(s.height(x,z)));
 assert.ok(s.height(20000,0)<-100,'surrounding globe retains lunar curvature');
});
test('terrain samples preserve measured elevation differences at grid vertices',()=>{
 const s=sampler(),row=catalog.sites['moon-apollo11'],n=catalog.grid;
 for(const [i,j] of [[10,30],[128,128],[230,200]]){
  const x=s.bounds[0]+i/(n-1)*(s.bounds[2]-s.bounds[0]),z=s.bounds[1]+j/(n-1)*(s.bounds[3]-s.bounds[1]);
  const expected=row.minMeters+values[j*n+i]/65535*(row.maxMeters-row.minMeters)-s.zero+s.curvature(x,z);
  assert.ok(Math.abs(s.height(x,z)-expected)<1e-8);
 }
});
