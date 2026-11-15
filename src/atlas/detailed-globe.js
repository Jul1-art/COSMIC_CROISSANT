import {normalizeVisualSettings} from '../ui/visual-effects.js';

const BODIES=new Set(['earth','moon','mars']);
const CHANNEL='relic-detailed-globe-v15';
const KNOWN_MISSION_SITES={
  moon: new Set(['apollo-11','apollo-12','apollo-14','apollo-15','apollo-16','apollo-17','surveyor-1','surveyor-3','surveyor-5','surveyor-6','surveyor-7','luna-9','luna-13','luna-16','luna-17','lunokhod-1','lunokhod-2','chang-e-3','chang-e-4','chang-e-5','chang-e-6','chandrayaan-3']),
  earth: new Set(['sputnik-1','spoutnik-1','spoutnik-2']),
  mars: new Set(['perseverance','curiosity','mars-pathfinder','sojourner','viking-1','viking-2','spirit','opportunity','rover-zhurong','exomars','rover-rosalind-franklin','mars-express']),
  venus: new Set(['venera-7','venera-8','venera-9','venera-10','venera-11','venera-12','venera-13','venera-14'])
};
/** One lazy, same-origin Cesium frame. Removing it releases its WebGL context,
 * terrain queues and credentials in memory when returning to the solar view.
 * No access token ever crosses the parent/frame message channel or URL.
 */
export function createDetailedGlobe({host,onState=()=>{},onInteraction=()=>{},onSelect=()=>{}}){
  if(!document.querySelector('link[href*="detailed-globe.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./detailed-globe.css?v=25',import.meta.url).href;document.head.append(link);
  }
  let visualSettings=null;
  let frame=null,current=null,ready=false,active=false,timer=0,state={},disposed=false,loading=false;
  let blend=null,arrival=false,sputnikActive=false;
  const origin=location.origin;
  const theme=()=>document.documentElement?.dataset.theme==='day'?'day':'night';
  const send=(action,payload={})=>frame?.contentWindow?.postMessage({channel:CHANNEL,action,...payload},origin);
  const updateTheme=()=>send('theme',{value:theme(),motion:document.documentElement.dataset.motion,language:document.documentElement.lang});
  function teardown(){
    clearTimeout(timer);blend?.cancel();blend=null;
    if(frame){send('dispose');frame.remove();if(sputnikActive)window.dispatchEvent(new CustomEvent('relic-sputnik-ended',{detail:{}}));sputnikActive=false;}
    frame=null;ready=false;active=false;loading=false;state={};
  }
  function emit(extra={}){onState({id:current?.id||null,active,loading,transitioning:Boolean(blend),...state,...extra});}
  function hide(){teardown();current=null;arrival=false;emit();}
  function reveal(){
    if(!ready||active)return;
    active=true;loading=false;
    const motion=document.documentElement.dataset.motion;
    const reduced=motion==='reduced'||(!motion&&matchMedia('(prefers-reduced-motion: reduce)').matches);
    if(!reduced&&frame.animate){
      // God's Eye View foundation.css transition-smooth, applied to the two renderers.
      const animation=frame.animate([{opacity:0},{opacity:1}],{
        duration:300,easing:'cubic-bezier(0.4, 0, 0.2, 1)',
      });
      blend=animation;
      animation.finished.then(()=>{
        if(blend!==animation)return;
        blend=null;
        emit();
        if(arrival){arrival=false;send('reveal');}
      },()=>{});
    }else if(arrival){
      arrival=false;
      if(!reduced)send('reveal');
    }
    frame.classList.add('is-ready');
    emit();
  }
  function setFocus(value,{animateArrival=false}={}){
    if(disposed)return false;
    if(!BODIES.has(value?.id)){hide();return false;}
    const changed=current?.id!==value.id;current={...value};arrival=animateArrival&&!active;
    if(!frame||changed){
      teardown();loading=true;frame=document.createElement('iframe');frame.className='detailed-globe-frame';
      frame.title=value.id==='earth'?'Earth · detailed 3D':value.id==='moon'?'Moon · detailed 3D':'Mars · detailed 3D';
      frame.setAttribute('allow','fullscreen');
      const url=new URL('../../pages/globe.html',import.meta.url);url.searchParams.set('body',value.id);
      url.searchParams.set('theme',theme());
      frame.src=url.href;host.append(frame);emit();
      timer=setTimeout(()=>{if(!ready){teardown();emit({error:'unavailable'});}},30000);
    }else send('focus',{focus:current});
    return true;
  }
  function receive(event){
    if(disposed||event.origin!==origin||event.source!==frame?.contentWindow||event.data?.channel!==CHANNEL)return;
    const data=event.data;
    if(data.type==='launchpad-close'&&current?.inspection==='apollo-launchpad'){window.dispatchEvent(new CustomEvent('relic-launchpad-command',{detail:{action:'close'}}));return;}
    if(data.type==='sputnik-state'&&current?.id==='earth'){sputnikActive=Boolean(data.state?.active);window.dispatchEvent(new CustomEvent('relic-sputnik-state',{detail:data.state}));return;}
    if(data.type==='fps'){if(active&&Number.isFinite(data.fps)&&data.fps>=0)window.dispatchEvent(new CustomEvent('relic-render-fps',{detail:{source:'inspection',body:current?.id,fps:data.fps}}));return;}
    if(data.type==='boot'){updateTheme();send('focus',{focus:current});if(visualSettings)send('visualSettings',{value:visualSettings});return;}
    if(data.type==='ready'){clearTimeout(timer);ready=true;state={...state,...data.state};return;}
    if(data.type==='state'){state={...state,...data.state};emit();return;}
    if(data.type==='interaction'){arrival=false;onInteraction();return;}
    if(['mission','mission-anchor'].includes(data.type)&&(KNOWN_MISSION_SITES[current?.id]?.has(data.id))){const bounds=frame.getBoundingClientRect?.();const anchor=Number.isFinite(data.anchor?.x)&&Number.isFinite(data.anchor?.y)?{x:data.anchor.x+(bounds?.left||0),y:data.anchor.y+(bounds?.top||0)}:undefined;window.dispatchEvent(new CustomEvent(data.type==='mission'?'relic-mission-open':'relic-mission-anchor',{detail:{id:data.id,anchor}}));return;}
    if(data.type==='select'&&typeof data.id==='string'){onSelect(data.id);return;}
    if(data.type==='error'){teardown();emit({error:'unavailable'});}
  }
  const sputnikCommand=event=>{if(current?.id==='earth'&&ready)send('sputnik',{command:event.detail?.action,value:event.detail?.value});};
  window.addEventListener('relic-sputnik-command',sputnikCommand);
  window.addEventListener('message',receive);
  window.addEventListener('relic-preferences-change',updateTheme);
  const languageObserver=new MutationObserver(updateTheme);languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  const command=(action,value)=>{if(!active)return false;arrival=false;send(action,{value});return true;};
  return {setFocus,hide,reveal,setVisualSettings(value){visualSettings=normalizeVisualSettings(value,visualSettings);send('visualSettings',{value:visualSettings});},setContext(context){if(current)current.context=context;send('context',{context});},lookAt:id=>command('lookAt',id),lookAround:(yaw,pitch)=>command('look',{yaw,pitch}),
    get active(){return active;},get transitioning(){return Boolean(blend)||arrival;},get loading(){return loading;},
    getViewState:()=>active?{id:current?.id,...state}:null,
    getSurfaceCoordinates:()=>active?{id:current?.id,latitude:state.latitude,longitude:state.longitude,altitudeKm:state.altitudeKm}:null,
    zoom:factor=>command('zoom',factor),tilt:degrees=>command('tilt',degrees),setTilt:degrees=>command('setTilt',degrees),
    toggleViewTilt:()=>command('toggleViewTilt'),northUp:()=>command('northUp'),
    turn:degrees=>command('turn',degrees),move:direction=>command('move',direction),topDown:()=>command('topDown'),resetView:()=>command('resetView'),
    pause(value=true){if(value)arrival=false;send('pause',{value:Boolean(value)});},
    dispose(){hide();disposed=true;languageObserver.disconnect();window.removeEventListener('message',receive);window.removeEventListener('relic-sputnik-command',sputnikCommand);window.removeEventListener('relic-preferences-change',updateTheme);}
  };
}
