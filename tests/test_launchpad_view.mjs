import test from 'node:test';
import assert from 'node:assert/strict';
import {APOLLO_LAUNCHPAD,createLaunchpadView} from '../src/missions/launchpad-view.js';
function fixture(playing=true){const states=[],focuses=[];let restored=0,captured=0,hidden=0;const mission={active:true,playing,time:123456,setPlaying(value){this.playing=value;}};
 const view=createLaunchpadView({mission,globe:{setFocus(value){focuses.push(value);},hide(){hidden++;}},capture(){captured++;return()=>restored++;},onChange:state=>states.push(state)});
 return {view,mission,states,focuses,get restored(){return restored;},get captured(){return captured;},get hidden(){return hidden;}};}
test('Saturn V opens LC-39A in the existing Earth renderer without moving mission time',()=>{
 const f=fixture();assert.equal(f.view.open(),true);assert.equal(f.mission.playing,false);assert.equal(f.mission.time,123456);assert.equal(f.captured,1);
 assert.equal(f.focuses[0].inspection,'apollo-launchpad');assert.equal(f.focuses[0].lat,28.608389);assert.equal(f.focuses[0].lon,-80.604333);assert.equal(f.focuses[0].id,'earth');assert.ok(APOLLO_LAUNCHPAD.range<3000);assert.ok(APOLLO_LAUNCHPAD.tilt>0);
 assert.equal(f.view.open(),false);f.view.close();assert.equal(f.restored,1);assert.equal(f.hidden,1);assert.equal(f.mission.playing,true);assert.equal(f.mission.time,123456);
});
test('only genuine ion photogrammetry marks the launchpad ready; failures allow a safe retry',()=>{
 const f=fixture(false);f.view.open();f.view.sync({id:'earth',active:true,sourceMode:'ion-terrain',ionStatus:'loading'});assert.equal(f.states.at(-1).status,'loading');
 f.view.sync({id:'earth',active:true,sourceMode:'ion-terrain',ionStatus:'asset-unavailable'});assert.equal(f.states.at(-1).status,'error');
 f.view.retry();assert.equal(f.captured,1);assert.equal(f.focuses.length,2);assert.equal(f.states.at(-1).status,'loading');
 f.view.sync({id:'earth',active:true,sourceMode:'ion-photorealistic',ionStatus:'ready'});assert.equal(f.states.at(-1).status,'ready');const n=f.states.length;f.view.sync({id:'earth',active:true,sourceMode:'ion-photorealistic',ionStatus:'ready'});assert.equal(f.states.length,n);
 f.view.close();assert.equal(f.mission.playing,false);f.view.sync({id:'earth',active:true,sourceMode:'ion-photorealistic',ionStatus:'ready'});assert.equal(f.states.at(-1).status,'off');
});
test('leaving the mission releases the detail frame without restarting playback',()=>{
 const f=fixture();f.view.open();f.mission.active=false;f.view.close({resume:false});assert.equal(f.mission.playing,false);assert.equal(f.restored,1);assert.equal(f.view.active,false);
 f.view.close();assert.equal(f.restored,1);assert.equal(f.view.open(),false);
});
