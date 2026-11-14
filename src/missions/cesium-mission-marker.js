import {APOLLO_11} from './apollo11-data.js';
import {PIN_SVG} from './mission-icons.js';
/** A keyboard-accessible pin projected from lunar coordinates. Native DOM input
 * remains reliable when a device cannot GPU-pick terrain-clamped billboards. */
export function createCesiumMissionMarker({Cesium,viewer,body,onOpen,onAnchor=()=>{},getSurfaceHeight=()=>0,document:doc=globalThis.document}){
 if(body!=='moon')return null;
 if(!doc.querySelector('link[data-mission-marker-style]')){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL('./missions.css',import.meta.url).href;link.dataset.missionMarkerStyle='';doc.head.append(link);}
 const marker=doc.createElement('button');marker.type='button';marker.className='mission-marker';marker.hidden=true;marker.innerHTML=PIN_SVG+'<span>Apollo 11</span>';marker.setAttribute('aria-label','Apollo 11 · Base de la Tranquillité · ouvrir la mission');doc.body.append(marker);
 const {latitude:lat,longitude:lon}=APOLLO_11.site;
 const open=()=>{const rect=marker.getBoundingClientRect?.();onOpen(APOLLO_11.id,rect?{x:rect.left+rect.width/2,y:rect.bottom}:undefined);};marker.addEventListener('click',open);
 let lastAnchor=-Infinity;const toward=new Cesium.Cartesian3(),pixel=new Cesium.Cartesian2();
 function update(){
   if(viewer.isDestroyed()){marker.hidden=true;return;}
   const height=getSurfaceHeight(lat,lon),point=Cesium.Cartesian3.fromDegrees(lon,lat,Number.isFinite(height)?height:0,Cesium.Ellipsoid.MOON);
   Cesium.Cartesian3.subtract(viewer.camera.positionWC,point,toward);
   const screen=viewer.scene.cartesianToCanvasCoordinates(point,pixel);
   const bounds=viewer.canvas.getBoundingClientRect();
   // Radial horizon test works even below the datum ellipsoid in a lunar mare.
   marker.hidden=!screen||Cesium.Cartesian3.dot(point,toward)<=0||Cesium.Cartesian3.dot(toward,viewer.camera.directionWC)>=0||screen.x<0||screen.y<0||screen.x>bounds.width||screen.y>bounds.height;
   if(!marker.hidden){marker.style.left=`${bounds.left+screen.x}px`;marker.style.top=`${bounds.top+screen.y}px`;if(performance.now()-lastAnchor>100){lastAnchor=performance.now();onAnchor({x:bounds.left+screen.x,y:bounds.top+screen.y});}}
 }
 const stop=viewer.scene.postRender.addEventListener(update);update();
 return {update,dispose(){stop();marker.removeEventListener('click',open);marker.remove();}};
}
