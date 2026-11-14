import {APOLLO_11,START,END,eventTime,missionState} from './apollo11-data.js';
import {loadFlightData,validateFlightData,flightState,sampleState,findInterval,inertialToScene,ECLIPTIC_OBLIQUITY,lunarOrbit} from './apollo-flight.js';

/** Mission geometry belongs to the existing atlas renderer. No renderer,
 * artificial transfer curve or replacement Earth/Moon is created here. */
export function createAtlasMission({THREE,scene,camera,controls,getEarth,getMoonMesh,getEarthMesh,getRadius,frame,onStart,onStop,onTime,onStatus=()=>{},onCameraTransform=()=>{},loadModel,loadData=loadFlightData}){
 const group=new THREE.Group();group.name='Apollo 11 · native atlas';group.visible=false;scene.add(group);
 const fill=new THREE.HemisphereLight(0xffffff,0x555555,.85);group.add(fill);
 const V=(array=[0,0,0])=>new THREE.Vector3(...array);
 const materials=[],geometries=[];
 function line(name,opacity){const geometry=new THREE.BufferGeometry(),material=new THREE.LineBasicMaterial({color:0xffffff,opacity,transparent:true,depthWrite:false});geometries.push(geometry);materials.push(material);const node=new THREE.Line(geometry,material);node.name=name;group.add(node);return node;}
 const route=line('Trajet géocentrique calculé',.2),trail=line('Trajet déjà parcouru',.8),orbit=line('Orbite lunaire osculatrice calculée',.35),eaglePath=line('Trajet d’Eagle · référentiel lunaire',.28),moonTrack=line('Orbite historique de la Lune · JPL',.12);
 const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=Math.round(255*THREE.MathUtils.clamp(15-Math.hypot(x-15.5,y-15.5),0,1));}
 const pointTexture=new THREE.DataTexture(pixels,32,32);pointTexture.needsUpdate=true;
 function point(name,color){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0],3));const material=new THREE.PointsMaterial({color,size:7,sizeAttenuation:false,map:pointTexture,transparent:true,alphaTest:.1,depthWrite:false});geometries.push(geometry);materials.push(material);const node=new THREE.Points(geometry,material);node.name=name;node.frustumCulled=false;group.add(node);return node;}
 const columbia=point('Columbia · point',0xffffff),eagle=point('Eagle · point',0xc7c7c7);
 const qScene=new THREE.Quaternion().setFromAxisAngle(V([1,0,0]),-Math.PI/2-ECLIPTIC_OBLIQUITY),qMesh=new THREE.Quaternion().setFromAxisAngle(V([1,0,0]),Math.PI/2);
 let active=false,starting=false,disposed=false,generation=0,data=null,pending=null,model=null,modelRequest=null,modelFailed=false;
 let time=START,playing=false,speed=3600,mode='journey',lastReport=-Infinity,lastOrbit=-Infinity,previousCenter=null,previousOrientation=null,routeRows=[],eagleRows=[];
 const earth=V(),moon=V(),site=V(),normal=V(),moonQuaternion=new THREE.Quaternion(),savedUp=camera.up.clone();
 const lat=APOLLO_11.site.latitude*Math.PI/180,lon=APOLLO_11.site.longitude*Math.PI/180,siteLocal=V([Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)]);
 const abort=new AbortController();
 const scale=()=>getRadius('earth')/6371;
 function bodyQuaternion(body,seconds){
  const rows=data.orientations,i=findInterval(rows,seconds),a=rows[i],b=rows[i+1]||a,u=THREE.MathUtils.clamp((seconds-a[0])/(b[0]-a[0]||1),0,1),offset=body==='earth'?1:5;
  const qa=new THREE.Quaternion().fromArray(a,offset),qb=new THREE.Quaternion().fromArray(b,offset);return qa.slerp(qb,u);
 }
 function meshQuaternion(body,seconds){return qScene.clone().multiply(bodyQuaternion(body,seconds)).multiply(qMesh);}
 function write(node,values){
  let attribute=node.geometry.getAttribute('position');if(!attribute||attribute.count!==values.length){attribute=new THREE.Float32BufferAttribute(new Float32Array(values.length*3),3);node.geometry.setAttribute('position',attribute);}
  for(let i=0;i<values.length;i++){const p=values[i];attribute.setXYZ(i,p.x,p.y,p.z);}attribute.needsUpdate=true;node.geometry.computeBoundingSphere();
 }
 // Positions remain physical kilometres until this boundary. Small radial
 // offsets keep ground-level points on the atlas's enlarged spherical symbols.
 function project(position,seconds){
  const m=sampleState(data.ephemeris.moon,seconds).position,r=position.map((v,i)=>v-m[i]),rm=Math.hypot(...r),re=Math.hypot(...position),p=V(inertialToScene(position)).multiplyScalar(scale());
  if(rm<20000){const weight=THREE.MathUtils.clamp((20000-rm)/15000,0,1),delta=getRadius('moon')-data.gravity.moonSurfaceRadiusKm*scale();p.addScaledVector(V(inertialToScene(r)).normalize(),delta*weight);}
  if(re<20000){const weight=THREE.MathUtils.clamp((20000-re)/12000,0,1),delta=getRadius('earth')-6378.137*scale();p.addScaledVector(p.clone().normalize(),delta*weight);}
  return p;
 }
 function moonRelativePosition(date=time){if(!data)return null;return V(inertialToScene(sampleState(data.ephemeris.moon,(date-START)/1000).position));}
 function synchronizeBodies(state){
  earth.copy(getEarth());group.position.copy(earth);moon.copy(V(inertialToScene(state.moon.position))).multiplyScalar(scale());
  moonQuaternion.copy(meshQuaternion('moon',state.seconds));normal.copy(siteLocal).applyQuaternion(moonQuaternion);site.copy(moon).addScaledVector(normal,getRadius('moon'));
  const mesh=getMoonMesh();if(mesh){const world=moon.clone().add(earth);mesh.parent?.updateWorldMatrix(true,false);mesh.position.copy(mesh.parent?mesh.parent.worldToLocal(world):world);mesh.scale.setScalar(getRadius('moon')/(mesh.geometry?.parameters?.radius||1));mesh.quaternion.copy(moonQuaternion);mesh.updateWorldMatrix(true,false);}
  const earthMesh=getEarthMesh?.();if(earthMesh){earthMesh.quaternion.copy(meshQuaternion('earth',state.seconds));earthMesh.updateWorldMatrix(true,false);}
 }
 function buildRoute(){
  routeRows=[...data.tracks.stack.states,...data.tracks.columbia.states.slice(1)];
  const points=routeRows.map(row=>project(row.slice(1,4),row[0]));write(route,points);write(trail,points);trail.geometry.setDrawRange(0,0);
  write(moonTrack,data.ephemeris.moon.filter(row=>row[0]>=0&&row[0]<=(END-START)/1000).map(row=>V(inertialToScene(row.slice(1,4))).multiplyScalar(scale())));
  eagleRows=data.tracks.eagle.states.filter((_row,i)=>i%4===0);
  const pointsEagle=eagleRows.map(row=>{
   const m=sampleState(data.ephemeris.moon,row[0]).position,p=V(inertialToScene(row.slice(1,4).map((v,i)=>v-m[i]))).applyQuaternion(meshQuaternion('moon',row[0]).invert()).multiplyScalar(scale());
   const r=p.length();return p.multiplyScalar((r+getRadius('moon')-data.gravity.moonSurfaceRadiusKm*scale())/r);
  });write(eaglePath,pointsEagle);
 }
 function updateOrbit(state,force=false){
  if(!force&&Math.abs(time-lastOrbit)<30000)return;lastOrbit=time;
  const seconds=state.seconds,loi=data.anchors.find(a=>a.id==='loi-cut').t,tei=data.anchors.find(a=>a.id==='tei-ign').t;
  const points=seconds>=loi&&seconds<tei?lunarOrbit(state.columbia,state.moon,data.gravity.moonGM):[];
  orbit.visible=mode!=='site'&&points.length>0;
  if(points.length)write(orbit,points.map(p=>V(inertialToScene(p)).multiplyScalar(scale()).add(moon)));
 }
 function updateEaglePath(state){
  eaglePath.visible=mode==='orbit'&&state.seconds>=data.tracks.eagle.states[0][0];if(!eaglePath.visible)return;
  eaglePath.position.copy(moon);eaglePath.quaternion.copy(moonQuaternion);eaglePath.geometry.setDrawRange(0,Math.min(eagleRows.length,findInterval(eagleRows,state.seconds)+1));
 }
 function disposeModel(loaded){loaded.root.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])if(material){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}});}
 function ensureModel(){
  if(!loadModel||modelRequest||modelFailed)return;
  modelRequest=loadModel().then(loaded=>{if(disposed){disposeModel(loaded);return;}model=loaded;group.add(model.root);render(true);}).catch(()=>{modelFailed=true;onStatus('model-error','Le modèle d’Eagle est indisponible. Sa position reste représentée par un point.');});
 }
 function render(force=false){
  if(!active||!data)return;const state=flightState(data,time);synchronizeBodies(state);camera.up.copy(mode==='site'?normal:savedUp);
  columbia.position.copy(project(state.columbia.position,state.seconds));columbia.visible=true;
  eagle.visible=Boolean(state.eagle);if(state.eagle)eagle.position.copy(project(state.eagle.position,state.seconds));
  route.visible=trail.visible=moonTrack.visible=mode==='journey';trail.geometry.setDrawRange(0,Math.min(routeRows.length,findInterval(routeRows,state.seconds)+1));
  updateOrbit(state,force);updateEaglePath(state);
  if(model){
   const landed=state.seconds>=(eventTime('landing')-START)/1000,ascended=state.seconds>=(eventTime('ascent')-START)/1000;
   model.root.visible=mode==='site'&&landed;model.root.position.copy(site).addScaledVector(normal,.00001);model.root.quaternion.setFromUnitVectors(V([0,1,0]),normal);model.root.scale.setScalar(getRadius('moon')*.025/6.8);
   model.lower.visible=landed;model.upper.visible=landed&&Boolean(state.eagle||state.attached);
   if(ascended&&state.eagle)model.upper.position.copy(eagle.position).sub(model.root.position).applyQuaternion(model.root.quaternion.clone().invert()).divideScalar(model.root.scale.x).add(V([0,2.8,0]));else model.upper.position.set(0,2.8,0);
   if(model.root.visible&&state.eagle)eagle.visible=ascended;
  }
  const center=mode==='site'?site:mode==='orbit'?moon:null;
  if(center&&previousCenter){
   const oldWorld=previousCenter.clone().add(earth),newWorld=center.clone().add(earth),rotation=mode==='site'&&previousOrientation?moonQuaternion.clone().multiply(previousOrientation.clone().invert()):new THREE.Quaternion();
   camera.position.sub(oldWorld).applyQuaternion(rotation).add(newWorld);controls.target.sub(oldWorld).applyQuaternion(rotation).add(newWorld);onCameraTransform(oldWorld,newWorld,rotation);
  }previousCenter=center?.clone()||null;previousOrientation=mode==='site'?moonQuaternion.clone():null;
 }
 function reset(){
  if(!active)return;const fromUp=camera.up.clone();previousCenter=null;previousOrientation=null;render(true);camera.up.copy(fromUp);
  if(mode==='site'){
   const target=site.clone().add(earth),up=V([0,1,0]),tangent=up.addScaledVector(normal,-up.dot(normal)).normalize();
   frame(target,target.clone().addScaledVector(normal,getRadius('moon')*.1).addScaledVector(tangent,getRadius('moon')*.15),normal);previousCenter=site.clone();previousOrientation=moonQuaternion.clone();
  }else if(mode==='orbit'){
   const target=moon.clone().add(earth),distance=getRadius('moon')*5.5/Math.min(1,camera.aspect);frame(target,target.clone().add(normal.clone().add(V([0,.45,0])).normalize().multiplyScalar(distance)),savedUp);previousCenter=moon.clone();
  }else{
   route.geometry.computeBoundingBox();const box=route.geometry.boundingBox,center=box.getCenter(V()).add(earth),extent=box.getSize(V()).length()*.5+getRadius('earth')*2;
   const distance=extent/Math.tan(camera.fov*Math.PI/360)/Math.min(1,camera.aspect)*1.15;
   frame(center,center.clone().add(V([.12,.55,1]).normalize().multiplyScalar(distance)),savedUp);
  }
 }
 function report(){const state=flightState(data,time),name=state.seconds<data.anchors.find(a=>a.id==='csm-separation').t?'● Saturn V · Apollo 11':'● Columbia';onTime(time,playing,{method:'Reconstruction physique · jalons NASA et éphémérides JPL',mode,vehicle:name+(state.eagle?' · ● Eagle':'')});}
 const controller={
  get active(){return active;},get starting(){return starting;},get time(){return time;},get playing(){return playing;},get mode(){return mode;},get data(){return data;},
  moonRelativePosition,
  async start(){
   if(active||starting||disposed)return;starting=true;const token=++generation;onStatus('loading','Chargement des trajectoires historiques…');
   try{
    if(!data){pending??=loadData({signal:abort.signal});data=await pending;if(!validateFlightData(data))throw new Error('Les données de trajectoire ne sont pas valides.');}
    if(token!==generation||disposed)return;
    starting=false;active=true;time=START;mode='journey';playing=!matchMedia('(prefers-reduced-motion: reduce)').matches;group.visible=true;
    savedUp.copy(camera.up);onStart();buildRoute();reset();onStatus('ready');report();
   }catch(error){if(token!==generation||disposed)return;starting=false;pending=null;data=null;onStatus('error',error.message||'La reconstitution ne peut pas démarrer.');}
  },
  setTime(value){if(!active)return;time=missionState(value).time;if(time>=END)playing=false;render(true);report();},
  setPlaying(value){if(!active)return;playing=Boolean(value)&&time<END;report();},
  setSpeed(value){if(Number.isFinite(value)&&value>0&&value<=86400)speed=value;},
  setMode(value){if(!active)return;mode=['site','orbit'].includes(value)?value:'journey';if(mode==='site'){playing=false;time=eventTime('landing');ensureModel();}
   if(mode==='orbit'){const start=data.anchors.find(a=>a.id==='loi-cut').t,end=data.anchors.find(a=>a.id==='tei-ign').t;if((time-START)/1000<start||(time-START)/1000>=end){playing=false;time=START+start*1000;}}reset();report();},
  reset,
  enforceCamera(){if(!active)return;for(const [center,radius] of [[earth,getRadius('earth')],[moon.clone().add(earth),getRadius('moon')]]){const offset=camera.position.clone().sub(center);if(offset.length()<radius*1.002){if(offset.lengthSq()<1e-12)offset.copy(normal);camera.position.copy(center).add(offset.setLength(radius*1.002));camera.lookAt(controls.target);}}},
  advance(dt){if(active&&playing&&Number.isFinite(dt)&&dt>0){time=Math.min(END,time+Math.min(dt,.25)*speed*1000);if(time>=END)playing=false;}},
  update(dt,now){if(!active)return;controller.advance(dt);render();if(now-lastReport>100){lastReport=now;report();}},
  stop(restore=true){if(!active&&!starting)return;generation++;active=starting=playing=false;group.visible=false;previousCenter=null;camera.up.copy(savedUp);onStop(restore);},
  dispose(){if(disposed)return;disposed=true;controller.stop(false);abort.abort();if(model)disposeModel(model);scene.remove(group);for(const item of [...geometries,...materials,pointTexture])item.dispose();}
 };return controller;
}
