import test from 'node:test';
import assert from 'node:assert/strict';
import {APOLLO_11,EVENTS,HARDWARE,START,END,eventTime,missionState,missionProgress,formatUTC,elapsedLabel,MISSIONS} from '../src/missions/apollo11-data.js';

test('Apollo 11 has a single mission at the NASA landing coordinates',()=>{
  assert.equal(MISSIONS.size,1);assert.equal(MISSIONS.get('apollo-11'),APOLLO_11);
  assert.deepEqual(APOLLO_11.site,{name:'Base de la Tranquillité',body:'moon',latitude:.67409,longitude:23.47298});
});
test('the clock clamps invalid and out-of-mission input and keeps boundaries reversible',()=>{
  assert.equal(missionState(NaN).time,START);assert.equal(missionState(START-1000).time,START);
  assert.equal(missionState(END+1000).time,END);assert.equal(missionProgress(START),0);assert.equal(missionProgress(END),1);
  assert.equal(missionState(eventTime('landing')-1).landed,false);assert.equal(missionState(eventTime('landing')).landed,true);
  assert.equal(missionState(eventTime('step')-1).deployed,false);assert.equal(missionState(eventTime('step')).deployed,true);
  assert.equal(missionState(eventTime('ascent')).ascent,true);assert.equal(missionState(START).ascent,false);
  for(const row of EVENTS)assert.equal(missionState(row.time).event.id,row.id);
});
test('historical stages are ordered, separate the SM at Earth on July 24 and end at recovery',()=>{
  for(let i=1;i<EVENTS.length;i++)assert.ok(EVENTS[i].time>EVENTS[i-1].time);
  assert.equal(new Date(eventTime('separation')).toISOString(),'1969-07-24T16:21:12.000Z');
  assert.equal(new Date(END).toISOString(),'1969-07-24T16:50:35.000Z');
  assert.equal(elapsedLabel(START),'T+000:00:00');assert.equal(elapsedLabel(END),'T+195:18:35');
  assert.match(formatUTC(START),/13:32:00 UTC$/);
});
test('all inventory objects have a valid appearance stage and unknown locations stay unpositioned',()=>{
  assert.equal(new Set(HARDWARE.map(row=>row.id)).size,HARDWARE.length);
  for(const row of HARDWARE){assert.ok(EVENTS.some(event=>event.id===row.since));assert.ok(row.text.length>40);if(row.position)assert.ok(row.position.every(Number.isFinite));}
  for(const id of ['ascent','service','sivb','sla'])assert.equal(HARDWARE.find(row=>row.id===id).position,undefined);
  assert.equal(HARDWARE.find(row=>row.id==='ascent').status,'Devenir non confirmé');
});
test('the embedded reconstruction and its attribution point to NASA HTTPS resources',()=>{
  for(const [,url] of APOLLO_11.sources)assert.ok(new URL(url).hostname.endsWith('nasa.gov'));
  const video=APOLLO_11.videos[0];assert.equal(new URL(video.src).protocol,'https:');assert.equal(new URL(video.src).hostname,'svs.gsfc.nasa.gov');assert.equal(video.source,'https://svs.gsfc.nasa.gov/4185/');
});

test('the projected lunar pin is unique, accessible, horizon-occluded and removable',async()=>{
  const {createCesiumMissionMarker}=await import('../src/missions/cesium-mission-marker.js');
  const C=await import('../vendor/cesium/index.js');
  const added=[],opened=[],listeners=new Map();let removed=false,stopped=false,lastPosition;
  const document={querySelector:()=>true,body:{append:node=>added.push(node)},createElement:()=>({dataset:{},style:{},setAttribute(name,value){this[name]=value;},addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),remove(){removed=true;}})};
  const point=C.Cartesian3.fromDegrees(APOLLO_11.site.longitude,APOLLO_11.site.latitude,-1900,C.Ellipsoid.MOON);
  const viewer={isDestroyed:()=>false,canvas:{getBoundingClientRect:()=>({left:10,top:20,width:800,height:600})},camera:{positionWC:C.Cartesian3.multiplyByScalar(point,1.01,new C.Cartesian3()),directionWC:C.Cartesian3.negate(C.Cartesian3.normalize(point,new C.Cartesian3()),new C.Cartesian3())},scene:{postRender:{addEventListener:()=>()=>{stopped=true;}},cartesianToCanvasCoordinates(position){lastPosition=position;return {x:400,y:300};}}};
  assert.equal(createCesiumMissionMarker({Cesium:C,viewer,body:'earth',document}),null);assert.equal(added.length,0);
  const marker=createCesiumMissionMarker({Cesium:C,viewer,body:'moon',document,getSurfaceHeight:()=>-1900,onOpen:id=>opened.push(id)});assert.equal(added.length,1);
  assert.ok(C.Cartesian3.distance(lastPosition,point)<1e-6);assert.equal(added[0].hidden,false);assert.equal(added[0].type,'button');assert.equal(added[0].style.left,'410px');assert.match(added[0]['aria-label'],/Apollo 11/);
  listeners.get('click')();assert.deepEqual(opened,['apollo-11']);viewer.camera.positionWC=C.Cartesian3.negate(point,new C.Cartesian3());marker.update();assert.equal(added[0].hidden,true);
  marker.dispose();assert.ok(removed&&stopped);assert.equal(listeners.size,0);
});
