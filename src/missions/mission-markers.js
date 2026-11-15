import {localizeMissionElement} from './mission-locale.js';
import {APOLLO_11} from './apollo11-data.js';
import {PIN_SVG,installMissionUI,openMission} from './mission-ui.js';
/** Project the landing site from the Moon's oriented local frame, with limb occlusion. */
export function createMissionMarkers({THREE,camera,getMoon,getSelected,isDetailed,onLocate}){
 installMissionUI();const marker=document.createElement('button');marker.type='button';marker.className='mission-marker';marker.hidden=true;marker.setAttribute('aria-label','Apollo 11 · Tranquility Base · open mission');marker.innerHTML=PIN_SVG+'<span>Apollo 11</span>';document.body.append(marker);const locale=localizeMissionElement(marker);marker.addEventListener('click',()=>{const bounds=marker.getBoundingClientRect();openMission(APOLLO_11.id,'summary',{x:bounds.left+bounds.width/2,y:bounds.bottom});});
 let lastAnchor=-Infinity;const lat=APOLLO_11.site.latitude*Math.PI/180,lon=APOLLO_11.site.longitude*Math.PI/180;
 const local=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)),position=new THREE.Vector3(),center=new THREE.Vector3(),toward=new THREE.Vector3(),normal=new THREE.Vector3();
 const locate=event=>{if(event.detail?.id===APOLLO_11.id)onLocate(APOLLO_11.site);};window.addEventListener('relic-mission-locate',locate);
 return {update(){
   const mesh=getMoon();if(getSelected()!=='moon'||isDetailed()||!mesh||!mesh.visible){marker.hidden=true;return;}
   mesh.updateWorldMatrix(true,false);position.copy(local).multiplyScalar((mesh.geometry?.parameters?.radius||1)*1.00001);mesh.localToWorld(position);mesh.getWorldPosition(center);normal.copy(position).sub(center).normalize();toward.copy(camera.position).sub(position).normalize();
   if(normal.dot(toward)<=.03){marker.hidden=true;return;}position.project(camera);marker.hidden=position.z< -1||position.z>1||Math.abs(position.x)>1.05||Math.abs(position.y)>1.05;
   if(!marker.hidden){const bounds=camera.userData.missionViewport?.()||{left:0,top:0,width:innerWidth,height:innerHeight};marker.style.left=`${bounds.left+(position.x+1)*.5*bounds.width}px`;marker.style.top=`${bounds.top+(1-position.y)*.5*bounds.height}px`;if(performance.now()-lastAnchor>100){lastAnchor=performance.now();window.dispatchEvent(new CustomEvent('relic-mission-anchor',{detail:{id:APOLLO_11.id,anchor:{x:bounds.left+(position.x+1)*.5*bounds.width,y:bounds.top+(1-position.y)*.5*bounds.height}}}));}}
 },hide(){marker.hidden=true;},dispose(){locale.dispose();marker.remove();window.removeEventListener('relic-mission-locate',locate);}};
}
