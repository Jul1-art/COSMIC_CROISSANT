import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sampleState,flightState,validateFlightData,inertialToScene,lunarOrbit} from '../src/missions/apollo-flight.js';
import {START,END,eventTime} from '../src/missions/apollo11-data.js';
const data=JSON.parse(await readFile(new URL('../assets/missions/apollo-11/trajectory.json',import.meta.url),'utf8'));
const norm=v=>Math.hypot(...v),sub=(a,b)=>a.map((v,i)=>v-b[i]);
test('bundled historical trajectories have explicit units, ordered finite states and provenance',()=>{
 assert.equal(validateFlightData(data),true);assert.equal(data.reconstruction,true);assert.ok(data.sources.some(s=>s.includes('nasa.gov')));
 for(const q of data.orientations){assert.ok(Math.abs(norm(q.slice(1,5))-1)<1e-9);assert.ok(Math.abs(norm(q.slice(5,9))-1)<1e-9);}
 const invalid=structuredClone(data);invalid.tracks.stack.states[1][0]=invalid.tracks.stack.states[0][0];assert.equal(validateFlightData(invalid),false);
 for(const fit of data.coastFitAudit)assert.ok(fit.endpointResidualKm<.2,`${fit.start} → ${fit.end}`);
});
test('every sampled vehicle stays above Earth and the lunar surface, including between samples',()=>{
 for(const [name,track] of Object.entries(data.tracks)){
  for(let i=0;i<track.states.length-1;i++){
   const t=(track.states[i][0]+track.states[i+1][0])/2,state=sampleState(track.states,t),moon=sampleState(data.ephemeris.moon,t);
   assert.ok(norm(state.position)>=6371-.005,`${name}: Earth collision at ${t}`);
   assert.ok(norm(sub(state.position,moon.position))>=data.gravity.moonSurfaceRadiusKm-.005,`${name}: Moon collision at ${t}`);
  }
 }
});
test('gravity-coast interpolation follows Earth–Moon–Sun acceleration rather than a hand-drawn curve',()=>{
 for(const name of ['stack','columbia','eagle']){
  const track=data.tracks[name];
  for(const phase of track.phases.filter(p=>p.method==='gravity-fit')){
   const t=(phase.start+phase.end)/2,dt=.1,state=sampleState(track.states,t),m=sampleState(data.ephemeris.moon,t).position,s=sampleState(data.ephemeris.sun,t).position;
   const rm=sub(m,state.position),rs=sub(s,state.position),{earthGM:E,moonGM:M,sunGM:S}=data.gravity;
   const acceleration=state.position.map((v,i)=>-E*v/norm(state.position)**3+M*(rm[i]/norm(rm)**3-m[i]/norm(m)**3)+S*(rs[i]/norm(rs)**3-s[i]/norm(s)**3));
   const before=sampleState(track.states,t-dt).velocity,after=sampleState(track.states,t+dt).velocity,actual=after.map((v,i)=>(v-before[i])/(2*dt));
   assert.ok(norm(sub(actual,acceleration))/norm(acceleration)<.02,`${name}: ${phase.fromAnchor} gravity residual`);
  }
 }
});
test('separation keeps Columbia in orbit while Eagle lands, then both meet at docking',()=>{
 const landing=flightState(data,eventTime('landing'));assert.ok(landing.eagle);const moon=landing.moon.position;
 assert.ok(norm(sub(landing.columbia.position,moon))>data.gravity.moonSurfaceRadiusKm+30);
 assert.ok(Math.abs(norm(sub(landing.eagle.position,moon))-data.gravity.moonSurfaceRadiusKm)<.005);
 const dock=data.anchors.find(a=>a.id==='dock'),t=START+dock.t*1000;
 const lm=sampleState(data.tracks.eagle.states,dock.t),csm=sampleState(data.tracks.columbia.states,dock.t);
 assert.ok(norm(sub(lm.position,csm.position))<.001);assert.equal(flightState(data,t).attached,true);
 assert.equal(flightState(data,END).eagle,null,'unknown discarded-stage future is not fabricated');
});
test('lunar orbit guide is derived from the current state, with its position on the conic',()=>{
 const state=flightState(data,eventTime('landing')),points=lunarOrbit(state.columbia,state.moon,data.gravity.moonGM,2048);
 assert.ok(points.length>1000);const radii=points.map(norm);assert.ok(Math.max(...radii)-Math.min(...radii)>1,'guide is not a decorative circle');
 const r=norm(sub(state.columbia.position,state.moon.position));assert.ok(r>=Math.min(...radii)-.01&&r<=Math.max(...radii)+.01);
 assert.ok(Math.abs(norm(inertialToScene(state.columbia.position))-norm(state.columbia.position))<1e-8);
 assert.equal(flightState(data,START).seconds,0);
});
