import {sputnikOrbitState,sputnikFixed,PERIOD_SECONDS,ORBIT_DURATION,SPUTNIK_ORBIT} from './sputnik-orbit-math.js';
/** Reuses the current Cesium Earth scene; owns only its point and orbit line. */
export function createSputnikOrbit({Cesium:C,viewer,onState=()=>{},onActive=()=>{}}){
 let active=false,playing=false,disposed=false,seconds=0,speed=120,paused=false,last=null,lastReport=-Infinity;
 let points=null,point=null,labels=null,label=null,route=null,savedView=null;
 const scene=viewer.scene;
 const request=()=>{if(!disposed&&!viewer.isDestroyed())scene.requestRender();};
 function report(){const state=sputnikOrbitState(seconds);onState({active,playing,seconds,speed,altitudeKm:state.altitudeKm,speedKmS:state.speedKmS,periodSeconds:PERIOD_SECONDS});}
 const position=(v,t)=>new C.Cartesian3(...sputnikFixed(v,t).map(x=>x*1000));
 function update(){if(!active)return;point.position=position(sputnikOrbitState(seconds).position,seconds);label.position=point.position;
  // A rigid rotation preserves the osculating ellipse as Earth turns beneath it.
  route.modelMatrix=C.Matrix4.fromRotationTranslation(C.Matrix3.fromRotationZ(-SPUTNIK_ORBIT.earthRotation*seconds));request();}
 function frame(){
  const half=Math.max(.15,Math.min(viewer.camera.frustum.fovy||Math.PI/3,2*Math.atan(Math.tan((viewer.camera.frustum.fovy||Math.PI/3)/2)*(viewer.camera.frustum.aspectRatio||1)))/2);
  viewer.camera.cancelFlight();viewer.trackedEntity=undefined;
  const distance=(SPUTNIK_ORBIT.earthRadiusKm+SPUTNIK_ORBIT.apogeeKm)*1000*1.15/Math.sin(half),destination=C.Cartesian3.multiplyByScalar(C.Cartesian3.normalize(new C.Cartesian3(.88,-.3,.36),new C.Cartesian3()),distance,new C.Cartesian3());
  viewer.camera.flyTo({destination,orientation:{direction:C.Cartesian3.negate(C.Cartesian3.normalize(destination,new C.Cartesian3()),new C.Cartesian3()),up:C.Cartesian3.UNIT_Z},duration:document.documentElement.dataset.motion==='reduced'||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:1.2});request();
 }
 function start(){if(disposed)return;if(active){frame();report();return;}
  savedView={destination:C.Cartesian3.clone(viewer.camera.positionWC),orientation:{direction:C.Cartesian3.clone(viewer.camera.directionWC),up:C.Cartesian3.clone(viewer.camera.upWC)}};
  active=true;seconds=0;playing=!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;last=null;
  points=scene.primitives.add(new C.PointPrimitiveCollection());point=points.add({position:position(sputnikOrbitState(0).position,0),pixelSize:10,color:C.Color.WHITE,outlineColor:C.Color.BLACK,outlineWidth:2,disableDepthTestDistance:0,id:'relic-sputnik-reconstruction'});
  labels=scene.primitives.add(new C.LabelCollection());label=labels.add({text:'Spoutnik 1',position:point.position,font:'12px system-ui',fillColor:C.Color.WHITE,outlineColor:C.Color.BLACK,outlineWidth:3,style:C.LabelStyle.FILL_AND_OUTLINE,pixelOffset:new C.Cartesian2(14,-14),disableDepthTestDistance:0});
  const positions=Array.from({length:361},(_,n)=>new C.Cartesian3(...sputnikOrbitState(n/360*PERIOD_SECONDS).position.map(v=>v*1000)));
  route=scene.primitives.add(new C.Primitive({geometryInstances:new C.GeometryInstance({geometry:new C.PolylineGeometry({positions,width:1.5,vertexFormat:C.PolylineColorAppearance.VERTEX_FORMAT}),attributes:{color:C.ColorGeometryInstanceAttribute.fromColor(C.Color.WHITE.withAlpha(.55))}}),appearance:new C.PolylineColorAppearance({translucent:true}),asynchronous:false}));
  onActive(true);update();frame();report();
 }
 function stop(restore=true){if(!active)return;active=false;playing=false;last=null;viewer.camera.cancelFlight();scene.primitives.remove(points);scene.primitives.remove(labels);scene.primitives.remove(route);points=point=labels=label=route=null;
  onActive(false);if(restore&&savedView)viewer.camera.setView(savedView);savedView=null;request();report();
 }
 function command(action,value){if(action==='start'){start();return;}if(!active)return;
  if(action==='stop'){stop();return;}if(action==='frame'){frame();return;}
  if(action==='play'){if(seconds>=ORBIT_DURATION)seconds=0;playing=!playing;last=null;}
  if(action==='seek'&&Number.isFinite(value)){seconds=Math.max(0,Math.min(ORBIT_DURATION,value));last=null;}
  if(action==='speed'&&[1,30,120,600].includes(value))speed=value;
  update();report();
 }
 const remove=scene.preRender.addEventListener(()=>{if(!active||disposed)return;const now=performance.now();if(playing&&!paused&&!document.hidden&&last!==null){seconds=Math.min(ORBIT_DURATION,seconds+Math.min(.1,(now-last)/1000)*speed);if(seconds>=ORBIT_DURATION)playing=false;update();}last=now;if(now-lastReport>150){lastReport=now;report();}});
 // Request frames only while playing; Cesium stays in request-render mode.
 const timer=setInterval(()=>{if(active&&playing&&!paused&&!document.hidden)request();},33);
 const visibility=()=>{last=null;if(!document.hidden)request();};document.addEventListener('visibilitychange',visibility);
 return {command,get active(){return active;},pause(value){paused=Boolean(value);last=null;request();},dispose(){if(disposed)return;stop(false);disposed=true;clearInterval(timer);remove();document.removeEventListener('visibilitychange',visibility);}};
}
