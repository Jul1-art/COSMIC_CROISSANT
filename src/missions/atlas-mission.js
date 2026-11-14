import {APOLLO_11,START,END,eventTime,missionState} from './apollo11-data.js';

/** A schematic journey in the atlas's own Earth–Moon reference frame.
 * Historical mission dates drive the vehicle; the atlas keeps its current ephemeris. */
export function createAtlasMission({THREE,scene,camera,controls,getEarth,getMoon,getMoonMesh,getRadius,frame,onStart,onStop,onTime,loadModel}){
 const group=new THREE.Group();group.name='Apollo 11 · native atlas';group.visible=false;scene.add(group);
 const fill=new THREE.HemisphereLight(0xffffff,0x555555,.85);group.add(fill);
 const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
 const lineMaterial=new THREE.LineBasicMaterial({color:0x999999,transparent:true,opacity:.4,depthWrite:false});
 const trailMaterial=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthWrite:false});
 const geometry=new THREE.BufferGeometry(),trailGeometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(323*3),3));
 trailGeometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(241*3),3));
 function writePoints(geometry,points){const attribute=geometry.getAttribute('position');for(let i=0;i<points.length;i++)attribute.setXYZ(i,points[i].x,points[i].y,points[i].z);attribute.needsUpdate=true;geometry.computeBoundingSphere();}
 const line=new THREE.Line(geometry,lineMaterial),trail=new THREE.Line(trailGeometry,trailMaterial);group.add(line,trail);
 const craft=new THREE.Group();craft.name='Columbia / Eagle';
 const hullGeometry=new THREE.ConeGeometry(.45,1.1,20),hullMaterial=new THREE.MeshStandardMaterial({color:0xf4f4f4,metalness:.7,roughness:.3,emissive:0x555555});
 const hull=new THREE.Mesh(hullGeometry,hullMaterial);hull.rotation.z=-Math.PI/2;craft.add(hull);group.add(craft);
 const earth=V(),moon=V(),axis=V(),up=V(),side=V(),landing=V(),ship=V();
 let model=null,modelRequest=null,disposed=false;
 let active=false,time=START,playing=false,speed=21600,mode='journey',lastReport=-Infinity,previousCenter=null;
 const tli=eventTime('tli'),orbit=eventTime('orbit'),descent=eventTime('descent'),land=eventTime('landing'),ascent=eventTime('ascent'),dock=eventTime('dock'),returnTime=eventTime('return');
 const fraction=(t,a,b)=>THREE.MathUtils.clamp((t-a)/(b-a),0,1);
 function coordinates(){
  earth.copy(getEarth());moon.copy(getMoon()).sub(earth);axis.copy(moon).normalize();
  side.crossVectors(axis,V(0,1,0));if(side.lengthSq()<.001)side.set(0,0,1);side.normalize();up.crossVectors(side,axis).normalize();
  const mesh=getMoonMesh(),lat=APOLLO_11.site.latitude*Math.PI/180,lon=APOLLO_11.site.longitude*Math.PI/180;
  landing.set(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon));
  if(mesh){if(mode==='site')mesh.scale.setScalar(getRadius('moon')/(mesh.geometry?.parameters?.radius||1));mesh.updateWorldMatrix(true,false);landing.multiplyScalar(mesh.geometry?.parameters?.radius||1);mesh.localToWorld(landing).sub(earth);}else landing.multiplyScalar(getRadius('moon')).add(moon);
 }
 function lunar(angle){const r=getRadius('moon')*1.23;return moon.clone().addScaledVector(axis,Math.cos(angle)*r).addScaledVector(up,Math.sin(angle)*r);}
 function outbound(p){return V().lerpVectors(axis.clone().multiplyScalar(getRadius('earth')*1.1),lunar(Math.PI),p).addScaledVector(up,Math.sin(Math.PI*p)*moon.length()*.18);}
 function inbound(p){return V().lerpVectors(lunar(0),axis.clone().multiplyScalar(getRadius('earth')*1.02),p).addScaledVector(up,-Math.sin(Math.PI*p)*moon.length()*.14);}
 function position(t){
  if(t<tli){const a=fraction(t,START,tli)*Math.PI*4;return axis.clone().multiplyScalar(Math.cos(a)*getRadius('earth')*1.08).addScaledVector(up,Math.sin(a)*getRadius('earth')*1.08);}
  if(t<orbit)return outbound(fraction(t,tli,orbit));
  if(t<descent)return lunar(Math.PI+fraction(t,orbit,descent)*Math.PI*4);
  if(t<land)return lunar(Math.PI).lerp(landing,fraction(t,descent,land));
  if(t<ascent)return landing.clone();
  if(t<dock)return landing.clone().lerp(lunar(0),fraction(t,ascent,dock));
  if(t<returnTime)return lunar(fraction(t,dock,returnTime)*Math.PI*2);
  return inbound(fraction(t,returnTime,END));
 }
 function rebuild(){
  coordinates();group.position.copy(earth);
  const route=[];for(let i=0;i<=120;i++)route.push(outbound(i/120));for(let i=0;i<=80;i++)route.push(lunar(Math.PI+i/80*Math.PI*4));for(let i=0;i<=120;i++)route.push(inbound(i/120));
  writePoints(geometry,route);line.visible=trail.visible=mode==='journey';
  const travelled=[];for(let i=0;i<=240;i++)travelled.push(position(START+(time-START)*i/240));writePoints(trailGeometry,travelled);
  ship.copy(position(time));craft.position.copy(ship);const tangent=position(Math.min(END,time+60000)).sub(ship);if(tangent.lengthSq()>.00001)craft.quaternion.setFromUnitVectors(V(1,0,0),tangent.normalize());
  const size=mode==='journey'?moon.length()*.0035:getRadius('moon')*.012;craft.scale.setScalar(size);
  craft.visible=mode==='journey'||!model||time<land||time>=ascent;
  if(model){const normal=landing.clone().sub(moon).normalize();model.root.position.copy(landing).addScaledVector(normal,.00001);model.root.quaternion.setFromUnitVectors(V(0,1,0),normal);model.root.scale.setScalar(getRadius('moon')*.025/6.8);model.root.visible=mode==='site'&&time>=land;model.upper.visible=time<ascent;}
 }
 function reset(){
  rebuild();previousCenter=earth.clone();
  if(mode==='site'){
   const target=landing.clone().add(earth),normal=landing.clone().sub(moon).normalize();
   const tangent=up.clone().addScaledVector(normal,-up.dot(normal)).normalize();
   frame(target,target.clone().addScaledVector(normal,getRadius('moon')*.22).addScaledVector(tangent,getRadius('moon')*.1));
  }else{
   const center=earth.clone().addScaledVector(moon,.5),extent=moon.length()*.55+getRadius('earth')*2;
   const distance=extent/Math.tan(camera.fov*Math.PI/360)/Math.min(camera.aspect,1)*1.22;
   frame(center,center.clone().addScaledVector(side,distance*.94).addScaledVector(up,distance*.34));
  }
 }
 function disposeModel(loaded){loaded.root.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])if(material){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}});}
 const controller={
  get active(){return active;},get time(){return time;},get playing(){return playing;},
  start(){if(active)return;active=true;onStart();group.visible=true;time=START;playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;mode='journey';reset();onTime(time,playing);},
  setTime(value){time=missionState(value).time;rebuild();if(time>=END)playing=false;onTime(time,playing);},
  setPlaying(value){playing=Boolean(value)&&time<END;onTime(time,playing);},
  setSpeed(value){if(Number.isFinite(value)&&value>0)speed=value;},
  setMode(value){mode=value==='site'?'site':'journey';
   if(mode==='site'&&loadModel&&!modelRequest)modelRequest=loadModel().then(loaded=>{if(disposed){disposeModel(loaded);return;}model=loaded;group.add(model.root);rebuild();}).catch(()=>{});if(mode==='site'){playing=false;time=land;}reset();onTime(time,playing);},
  reset,
  update(dt,now){if(!active)return;if(playing)time=Math.min(END,time+dt*speed*1000);if(time>=END)playing=false;
   rebuild();if(previousCenter){const shift=earth.clone().sub(previousCenter);camera.position.add(shift);controls.target.add(shift);}previousCenter=earth.clone();
   if(now-lastReport>100){lastReport=now;onTime(time,playing);}
  },
  stop(restore=true){if(!active)return;active=false;playing=false;group.visible=false;previousCenter=null;onStop(restore);},
  dispose(){disposed=true;controller.stop(false);if(model)disposeModel(model);scene.remove(group);for(const item of [geometry,trailGeometry,lineMaterial,trailMaterial,hullGeometry,hullMaterial])item.dispose();}
 };return controller;
}
