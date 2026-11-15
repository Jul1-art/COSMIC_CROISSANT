import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {archiveOrbit,archiveSite,archiveOrbitPosition} from '../src/missions/archive-orbit.js';
const record=async id=>JSON.parse(await readFile(new URL(`../assets/missions/${id}.json`,import.meta.url),'utf8'));
test('Sputnik 2 uses the supplied 212 × 1660 km initial orbit and 65.33 degree inclination',async()=>{
 const orbit=archiveOrbit(await record('spoutnik-2'));assert.equal(orbit.pericentreKm,212);assert.equal(orbit.apocentreKm,1660);assert.equal(orbit.inclinationDeg,65.33);assert.equal(orbit.periodSeconds,103.7*60);
 assert.ok(Math.abs(Math.hypot(...archiveOrbitPosition(orbit,6378.137,0))-6590.137)<1e-8);
 assert.ok(Math.abs(Math.hypot(...archiveOrbitPosition(orbit,6378.137,Math.PI))-8038.137)<1e-8);
});
test('LRO preserves its documented circular primary orbit instead of inventing an ellipse',async()=>{
 const orbit=archiveOrbit(await record('lro'));assert.equal(orbit.pericentreKm,50);assert.equal(orbit.apocentreKm,50);assert.equal(orbit.inclinationDeg,90);
});
test('Curiosity uses the signed Bradbury Landing coordinates and has no invented orbital elements',async()=>{
 const data=await record('curiosity'),site=archiveSite(data);assert.equal(site.latitude,-4.5895);assert.equal(site.longitude,137.4417);assert.equal(archiveOrbit(data),null);
});
test('Odyssey circular altitude and Chang’e 5 landing coordinates are read without assigning an epoch',async()=>{
 const orbit=archiveOrbit(await record('2001-mars-odyssey'));
 assert.equal(orbit.pericentreKm,400);assert.equal(orbit.apocentreKm,400);assert.equal(orbit.inclinationDeg,93.1);assert.equal(orbit.periodSeconds,118*60);
 const site=archiveSite(await record('chang-e-5'));
 assert.equal(site.latitude,43.1);assert.equal(site.longitude,-51.8);
});
