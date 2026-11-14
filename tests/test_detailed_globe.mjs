import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {normalizeVisualSettings} from '../src/ui/visual-effects.js';

async function fixture(){
  const messages=[],states=[],fpsEvents=[],listeners=new Map(),frames=[],observers=[];
  const document={documentElement:{dataset:{theme:'night',motion:'full'}},querySelector:()=>true,createElement(tag){
    const value={tag,classList:{add(){}},setAttribute(){},remove(){this.removed=true;},contentWindow:{postMessage:(message,origin)=>messages.push({message,origin})}};
    if(tag==='iframe')frames.push(value);return value;
  }};
  const context=vm.createContext({MutationObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}},URL,document,location:{origin:'https://example.invalid'},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},window:{dispatchEvent:event=>fpsEvents.push(event),addEventListener:(type,cb)=>listeners.set(type,cb),removeEventListener:type=>listeners.delete(type)},setTimeout:()=>1,clearTimeout(){}});
  const source=await readFile(new URL('../src/atlas/detailed-globe.js',import.meta.url),'utf8');
  const module=new vm.SourceTextModule(source,{context,initializeImportMeta(meta){meta.url='https://example.invalid/RELIC/src/atlas/detailed-globe.js';}});
  await module.link(name=>{
    assert.equal(name,'../ui/visual-effects.js');
    return new vm.SyntheticModule(['normalizeVisualSettings'],function(){this.setExport('normalizeVisualSettings',normalizeVisualSettings);},{context});
  });await module.evaluate();
  const globe=module.namespace.createDetailedGlobe({host:{append(){}},onState:state=>states.push(state)});
  const receive=(frame,type,state,origin='https://example.invalid')=>listeners.get('message')({origin,source:frame.contentWindow,data:{channel:'relic-detailed-globe-v15',type,state}});
  return {globe,frames,messages,states,receive,listeners,document,observers,fpsEvents};
}

test('lazy detail view accepts only the current same-origin frame and releases replaced WebGL frames',async()=>{
  const f=await fixture();f.globe.setFocus({id:'earth',lat:40,lon:2,date:'2026-10-29T12:00:00Z'});
  assert.equal(f.globe.loading,true);assert.equal(f.frames.length,1);
  const first=f.frames[0];assert.equal(first.src,'https://example.invalid/RELIC/pages/globe.html?body=earth&theme=night');
  f.receive(first,'ready',{},'https://untrusted.invalid');assert.equal(f.globe.active,false);
  f.receive(first,'boot');assert.equal(f.messages.at(-1).message.action,'focus');
  f.receive(first,'ready',{latitude:40,longitude:2,rangeMeters:1000});
  assert.equal(f.globe.active,false,'A ready frame waits for the approach to finish');
  f.globe.reveal();assert.equal(f.globe.active,true);
  f.globe.zoom(.5);assert.equal(f.messages.at(-1).message.action,'zoom');
  f.globe.setFocus({id:'moon'});assert.equal(first.removed,true);assert.equal(f.globe.active,false);
  f.receive(first,'ready',{});assert.equal(f.globe.active,false,'A late replaced frame cannot reclaim the viewport');
  const second=f.frames[1];f.receive(second,'ready',{latitude:0,longitude:0});f.globe.reveal();assert.equal(f.globe.active,true);
  f.globe.hide();assert.equal(second.removed,true);assert.equal(f.globe.active,false);assert.equal(f.globe.getViewState(),null);
  f.globe.dispose();assert.equal(f.listeners.size,0);
});

test('detail failure restores the fallback and unsupported bodies never open a planetary frame',async()=>{
  const f=await fixture();assert.equal(f.globe.setFocus({id:'jupiter'}),false);assert.equal(f.frames.length,0);
  f.globe.setFocus({id:'mars'});f.receive(f.frames[0],'error');
  assert.equal(f.globe.active,false);assert.equal(f.globe.loading,false);assert.equal(f.frames[0].removed,true);
  assert.equal(f.states.at(-1).error,'unavailable');assert.equal(f.globe.zoom(.5),false);f.globe.dispose();
});

test('theme changes reach a loading or ready globe without replacing its camera or focus',async()=>{
  const f=await fixture();f.globe.setFocus({id:'moon',lat:10,lon:20});
  const frame=f.frames[0];f.document.documentElement.dataset.theme='day';
  f.receive(frame,'boot');
  assert.equal(f.messages.at(-2).message.action,'theme');assert.equal(f.messages.at(-2).message.value,'day');
  assert.equal(f.messages.at(-1).message.focus.lat,10);
  f.receive(frame,'ready',{});const focusMessages=f.messages.filter(row=>row.message.action==='focus').length;
  f.document.documentElement.dataset.theme='night';f.listeners.get('relic-preferences-change')();
  assert.equal(f.messages.at(-1).message.value,'night');assert.equal(f.messages.at(-1).message.action,'theme');
  assert.equal(f.frames.length,1);assert.equal(frame.removed,undefined);
  assert.equal(f.messages.filter(row=>row.message.action==='focus').length,focusMessages);f.globe.dispose();
});

// A preview can change before the child frame loads or while it is replaced.
test('the current safe visual settings reach every newly booted detail frame',async()=>{
  const f=await fixture();
  f.globe.setVisualSettings({style:'nvg',stars:false,token:'not-for-the-frame',styleParams:{gain:.7,token:'private'}});
  f.globe.setFocus({id:'earth'});f.receive(f.frames[0],'boot');
  let message=f.messages.at(-1).message;
  assert.equal(message.action,'visualSettings');assert.equal(message.value.style,'nvg');
  assert.equal(message.value.stars,false);assert.equal(message.value.styleParams.gain,.7);
  assert.equal('token' in message.value,false);assert.equal('token' in message.value.styleParams,false);
  f.globe.setFocus({id:'mars'});f.receive(f.frames[1],'boot');
  message=f.messages.at(-1).message;
  assert.equal(message.value.style,'nvg');assert.equal(message.value.styleParams.gain,.7);
  f.globe.dispose();
});


test('replacing a globe cancels its blend and discards its pending arrival flight',async()=>{
  const f=await fixture();f.globe.setFocus({id:'earth'},{animateArrival:true});
  const first=f.frames[0];let finish,cancelled=false;
  first.animate=()=>({finished:new Promise(resolve=>{finish=resolve;}),cancel(){cancelled=true;}});
  f.receive(first,'ready');f.globe.reveal();
  assert.equal(f.states.at(-1).transitioning,true);
  f.globe.setFocus({id:'mars'});
  assert.equal(cancelled,true);
  finish();
  await Promise.resolve();
  assert.equal(f.globe.active,false);
  assert.ok(!f.messages.some(row=>row.message.action==='reveal'));
  f.globe.dispose();
});


test('satellite panel language follows host language changes and releases its observer',async()=>{
  const f=await fixture();f.document.documentElement.lang='fr';f.globe.setFocus({id:'earth'});f.receive(f.frames[0],'boot');
  assert.equal(f.messages.find(row=>row.message.action==='theme').message.language,'fr');
  f.document.documentElement.lang='en';f.observers[0].callback();assert.equal(f.messages.at(-1).message.language,'en');
  f.globe.dispose();assert.equal(f.observers[0].disconnected,true);
});


test('FPS accepts real zero only from the current visible same-origin renderer',async()=>{
 const f=await fixture();f.globe.setFocus({id:'earth'});const frame=f.frames[0];
 const send=(fps,origin='https://example.invalid',source=frame.contentWindow)=>f.listeners.get('message')({origin,source,data:{channel:'relic-detailed-globe-v15',type:'fps',fps}});
 send(60);assert.equal(f.fpsEvents.length,0,'Hidden preload is not the visible FPS');
 f.receive(frame,'ready',{});f.globe.reveal();send(60,'https://other.invalid');send(60,'https://example.invalid',{});send(NaN);send(-1);assert.equal(f.fpsEvents.length,0);
 send(0);assert.equal(f.fpsEvents[0].detail.fps,0);assert.equal(f.fpsEvents[0].detail.body,'earth');f.globe.dispose();
});

test('mission popups accept only Apollo 11 from the current Moon iframe',async()=>{
  const f=await fixture();
  const send=(frame,id='apollo-11',origin='https://example.invalid')=>f.listeners.get('message')({origin,source:frame.contentWindow,data:{channel:'relic-detailed-globe-v15',type:'mission',id}});
  f.globe.setFocus({id:'earth'});const earth=f.frames[0];send(earth);assert.equal(f.fpsEvents.length,0);
  f.globe.setFocus({id:'moon'});const moon=f.frames[1];send(earth);send(moon,'apollo-11','https://untrusted.invalid');send(moon,'unknown');assert.equal(f.fpsEvents.length,0);
  send(moon);assert.equal(f.fpsEvents.length,1);assert.equal(f.fpsEvents[0].type,'relic-mission-open');assert.equal(f.fpsEvents[0].detail.id,'apollo-11');f.globe.dispose();
});

test('Sputnik commands and state belong only to the current ready Earth frame',async()=>{
 const f=await fixture();f.globe.setFocus({id:'earth'});const earth=f.frames[0];
 const send=f.listeners.get('relic-sputnik-command');
 const count=f.messages.length;send({detail:{action:'start'}});assert.equal(f.messages.length,count,'Do not send mission commands before the renderer is ready');
 f.receive(earth,'ready',{});send({detail:{action:'start'}});assert.equal(f.messages.at(-1).message.action,'sputnik');assert.equal(f.messages.at(-1).message.command,'start');
 f.receive(earth,'sputnik-state',{active:true,seconds:30});
 // fixture.receive nests supplied values in state, like a real renderer.
 assert.equal(f.fpsEvents.at(-1).type,'relic-sputnik-state');assert.equal(f.fpsEvents.at(-1).detail.seconds,30);
 f.globe.setFocus({id:'moon'});assert.equal(f.fpsEvents.at(-1).type,'relic-sputnik-ended');
 const after=f.messages.length;send({detail:{action:'start'}});assert.equal(f.messages.length,after);
 f.globe.dispose();assert.equal(f.listeners.size,0);
});
