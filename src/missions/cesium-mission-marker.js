import {SPUTNIK} from './sputnik.js';
import {APOLLO_11} from './apollo11-data.js';
import {PIN_SVG} from './mission-icons.js';
/** A keyboard-accessible pin projected from lunar coordinates. Native DOM input
 * remains reliable when a device cannot GPU-pick terrain-clamped billboards. */
export function createCesiumMissionMarker({Cesium,viewer,body,onOpen,onAnchor=()=>{},getSurfaceHeight=()=>0,document:doc=globalThis.document}){
 if(!['moon','earth'].includes(body))return null;const mission=body==='earth'?SPUTNIK:APOLLO_11;
 if(!doc.querySelector('link[data-mission-marker-style]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('./missions.css',import.meta.url).href;link.dataset.missionMarkerStyle='';doc.head.append(link);}
 const marker=doc.createElement('button');marker.type='button';marker.className='mission-marker';marker.hidden=true;marker.innerHTML=PIN_SVG+`<span>${mission.name}</span>`;marker.setAttribute('aria-label',mission.name+' · repère historique · ouvrir la mission');doc.body.append(marker);
 const {latitude:lat,longitude:lon}=mission.site;
 const open=()=>{const rect=marker.getBoundingClientRect?.();onOpen(mission.id,rect?{x:rect.left+rect.width/2,y:rect.bottom}:undefined);};marker.addEventListener('click',open);
 let enabled=true,lastAnchor=-Infinity;const toward=new Cesium.Cartesian3(),pixel=new Cesium.Cartesian2();
 function update(){
   if(!enabled||viewer.isDestroyed()){marker.hidden=true;return;}
   const height=getSurfaceHeight(lat,lon),point=Cesium.Cartesian3.fromDegrees(lon,lat,Number.isFinite(height)?height:0,(body==='moon'?Cesium.Ellipsoid.MOON:Cesium.Ellipsoid.WGS84));
   Cesium.Cartesian3.subtract(viewer.camera.positionWC,point,toward);
   const screen=viewer.scene.cartesianToCanvasCoordinates(point,pixel);
   const bounds=viewer.canvas.getBoundingClientRect();
   // Radial horizon test works even below the datum ellipsoid in a lunar mare.
   marker.hidden=!screen||Cesium.Cartesian3.dot(point,toward)<=0||Cesium.Cartesian3.dot(toward,viewer.camera.directionWC)>=0||screen.x<0||screen.y<0||screen.x>bounds.width||screen.y>bounds.height;
   if(!marker.hidden){marker.style.left=`${bounds.left+screen.x}px`;marker.style.top=`${bounds.top+screen.y}px`;if(performance.now()-lastAnchor>100){lastAnchor=performance.now();onAnchor({x:bounds.left+screen.x,y:bounds.top+screen.y});}}
 }
 const stop=viewer.scene.postRender.addEventListener(update);update();
 return {update,setVisible(value){enabled=Boolean(value);update();},dispose(){stop();marker.removeEventListener('click',open);marker.remove();}};
}
