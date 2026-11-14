import test from 'node:test';
import assert from 'node:assert/strict';
import {SPUTNIK_ORBIT as P,SEMIMAJOR_KM as a,PERIOD_SECONDS as period,sputnikOrbitState as state,sputnikFixed} from '../src/missions/sputnik-orbit-math.js';
test('Sputnik ellipse matches the supplied perigee, apogee, inclination and approximately 96-minute period',()=>{
 assert.ok(Math.abs(state(0).altitudeKm-215)<1e-9);assert.ok(Math.abs(state(period/2).altitudeKm-939)<1e-9);
 assert.ok(period/60>96&&period/60<97);
 const {position:r,velocity:v}=state(period*.31),h=[r[1]*v[2]-r[2]*v[1],r[2]*v[0]-r[0]*v[2],r[0]*v[1]-r[1]*v[0]];
 assert.ok(Math.abs(Math.acos(h[2]/Math.hypot(...h))*180/Math.PI-P.inclinationDeg)<1e-10);
});
test('Sputnik Kepler propagation conserves orbital energy and returns continuously after one revolution',()=>{
 for(let n=0;n<=360;n++){
  const {position:r,velocity:v,speedKmS}=state(n/360*period);
  assert.ok(Math.abs(Math.hypot(...v)-speedKmS)<1e-10);
  const energy=.5*Math.hypot(...v)**2-P.mu/Math.hypot(...r);
  assert.ok(Math.abs(energy+P.mu/(2*a))<1e-10);
 }
 assert.ok(Math.hypot(...state(period).position.map((v,i)=>v-state(0).position[i]))<1e-7);
 assert.throws(()=>state(NaN),TypeError);
});
test('Earth-fixed projection rotates the orbital plane without distorting its altitude',()=>{
 const r=state(period/4).position,f=sputnikFixed(r,period/4);
 assert.ok(Math.abs(Math.hypot(...r)-Math.hypot(...f))<1e-9);assert.equal(r[2],f[2]);assert.notEqual(r[0],f[0]);
});
