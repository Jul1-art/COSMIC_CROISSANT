/** Apollo 11 departed LC-39A. The ion photogrammetry shows today's site,
 * not a model of the tower or Saturn V as they stood in July 1969. */
export const APOLLO_LAUNCHPAD=Object.freeze({id:'earth',inspection:'apollo-launchpad',lat:28.608389,lon:-80.604333,range:1800,heading:35,tilt:55,date:'1969-07-16T13:32:00Z',context:[]});
export function createLaunchpadView({globe,mission,capture=()=>()=>{},onChange=()=>{}}){
 let active=false,restore=null,wasPlaying=false,status='off';
 function emit(next){if(next===status)return;status=next;onChange({active,status});}
 function focus(){emit('loading');globe.setFocus({...APOLLO_LAUNCHPAD});}
 function open(){if(active||!mission.active)return false;wasPlaying=mission.playing;mission.setPlaying(false);restore=capture();active=true;focus();return true;}
 function close({resume=true}={}){if(!active)return;active=false;globe.hide();restore?.();restore=null;if(mission.active)mission.setPlaying(resume&&wasPlaying);emit('off');}
 function sync(state){if(!active)return;if(state.error){emit('error');return;}if(state.id!=='earth')return;
  if(state.active&&state.sourceMode==='ion-photorealistic'&&state.ionStatus==='ready')emit('ready');
  else if(state.active&&state.sourceMode==='ion-photorealistic')emit('streaming');
  else if(['asset-unavailable','missing-token','invalid-token'].includes(state.ionStatus))emit('error');
  else emit('loading');
 }
 return {open,close,sync,retry(){if(active){globe.hide();focus();}},get active(){return active;}};
}
