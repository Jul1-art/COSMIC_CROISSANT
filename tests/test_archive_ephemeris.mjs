import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sampleEyesEntity,projectEyesOrbit,eyesEphemerisTime} from '../src/missions/archive-ephemeris.js';
const data=JSON.parse(await readFile(new URL('../assets/missions/ephemerides/stereo.json',import.meta.url),'utf8'));
test('published STEREO samples preserve the two observatories and keep heliocentric states near their documented one-AU orbits',()=>{
 assert.equal(data.entities.length,2);
 const time=Date.parse('2013-08-12T00:00:00Z');
 for(const entity of data.entities){const state=sampleEyesEntity(entity,time);assert.ok(state);assert.equal(state.parent,'sun');assert.ok(state.rangeKm>1.3e8&&state.rangeKm<1.7e8);assert.ok(Math.abs(state.positionKm[2]/state.rangeKm)<.02);assert.ok(Math.hypot(...state.velocityKmS)>25&&Math.hypot(...state.velocityKmS)<35);}
 assert.equal(sampleEyesEntity(data.entities[0],Date.parse('2000-01-01T00:00:00Z')),null);
 assert.ok(sampleEyesEntity(data.entities[0],Date.parse('2023-08-12T00:00:00Z')));
 assert.equal(sampleEyesEntity(data.entities[1],Date.parse('2023-08-12T00:00:00Z')),null,'STEREO-B is not extrapolated beyond its published coverage');
});
test('NASA packet time convention includes the leap second effective in 2017',()=>{
 assert.ok(Math.abs(eyesEphemerisTime(Date.parse('2000-01-01T12:00:00Z'))-64.184)<1e-6);
 assert.ok(Math.abs(eyesEphemerisTime(Date.parse('2017-01-01T00:00:00Z'))-eyesEphemerisTime(Date.parse('2016-12-31T23:59:59Z'))-2)<1e-6);
});
test('conic propagation respects periapsis and reversibility for elliptical and hyperbolic flybys',()=>{
 const circle=[0,7000,0,2*Math.PI/6000,0,1,0,0,0];assert.ok(Math.abs(projectEyesOrbit(circle,1500).position[1]-7000)<1e-8);
 const hyper=[0,20000,1.5,.0001,0,1,0,0,0];assert.ok(Math.abs(projectEyesOrbit(hyper,0).position[0]-10000)<1e-8);
 assert.ok(Math.abs(projectEyesOrbit(hyper,1000).position[1]+projectEyesOrbit(hyper,-1000).position[1])<1e-8);
});
