import {archiveTarget,archiveLagrange} from './archive-targets.js';
import {archiveVehicleSize} from './archive-vehicle-size.js';
import {archiveClock} from './archive-clock.js';
import {archiveCloseFrame} from './archive-framing.js';
import {archiveModelKey} from './archive-model-resources.js';
import {loadMissionEphemeris,sampleEyesEntity} from './archive-ephemeris.js';
import {osculatingOrbit} from '../atlas/planetary-ephemeris.js';
import {archiveOrbit,archiveSite,archiveOrbitPosition} from './archive-orbit.js';
import {normalizeSpacecraft} from './normalize-spacecraft.js';
import {buildSpacecraft} from './spacecraft-models.js';
import {archiveBody} from './archive-data.js';
import {loadJSON,asset} from './catalog.js';
import {GLTFLoader} from '../../vendor/three-addons/loaders/GLTFLoader.js';
import {DRACOLoader} from '../../vendor/three-addons/loaders/DRACOLoader.js';
import {KTX2Loader} from '../../vendor/three-addons/loaders/KTX2Loader.js';
import {RoomEnvironment} from '../../vendor/three-addons/environments/RoomEnvironment.js';
import {appURL} from '../core/paths.js';
import {reducedMissionMotion} from './mission-motion.js';

/** Additional vehicles belong to the atlas scene, camera and animation loop. */
export function createArchiveAtlas({THREE,scene,camera,controls,renderer,record,events,onState,getPosition,getRadius,getRadiusKm,onStart,onStop,onRebase,frame,onMaterialsChanged,onCameraTranslation=()=>{},onCameraRotation=()=>{},onSurfaceActive=()=>{},onContextChanged=()=>{},setDepthScale=()=>{},getOrientation=()=>null,getName=id=>id}){
 const targetDefinition=archiveTarget(record),lagrange=archiveLagrange(record),vehicleSize=archiveVehicleSize(record),customCenter=new THREE.Vector3(),sunward=new THREE.Vector3(-1,0,0);
 const clock=archiveClock(record,events);
 let focusBody=targetDefinition?.id||(lagrange?'earth':archiveBody(record));const group=new THREE.Group();group.name=record.name;group.visible=false;scene.add(group);
 const targetGeometryGroup=new THREE.Group();group.add(targetGeometryGroup);
 const vehicle=new THREE.Group();vehicle.name=record.name+' · spacecraft';group.add(vehicle);let model=buildSpacecraft(record);vehicle.add(model);
 const fill=new THREE.HemisphereLight(0xffffff,0x555555,.85);group.add(fill);
 const point=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));group.add(point);
 let lastCenter=null,lastNormal=null,environment=null;
 let ephemeris=null,publishedState=null,publishedStates=[],needsFraming=false;
 const publishedMarkers=new Map(),publishedOrbit=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(193*3),3)),new THREE.LineBasicMaterial({color:0xe1e4e8,transparent:true,opacity:.3,depthWrite:false}));publishedOrbit.name='Published NASA osculating orbit';publishedOrbit.visible=false;group.add(publishedOrbit);
 let active=false,starting=false,disposed=false,playing=false,progress=0,speed=1,mode='journey',lastReport=0,generation=0;
 const radius=()=>targetDefinition?.radiusWorld||getRadius(focusBody),physicalRadius=()=>targetDefinition?.radiusKm||getRadiusKm(focusBody),metre=()=>radius()/physicalRadius()/1000;
 const center=()=>targetDefinition?customCenter.clone():getPosition(focusBody).clone(),rebase=shift=>{if(targetDefinition)customCenter.sub(shift);onRebase(shift);},normal=new THREE.Vector3(.65,.35,.67).normalize();
 if(targetDefinition){targetDefinition.radiusWorld=.5;const material=new THREE.MeshStandardMaterial({color:targetDefinition.id==='pluto'?0xbba695:0x81776c,roughness:1,flatShading:targetDefinition.id!=='pluto'}),body=new THREE.Mesh(targetDefinition.id==='pluto'?new THREE.SphereGeometry(.5,64,40):new THREE.IcosahedronGeometry(.5,3),material);body.scale.set(...targetDefinition.axes);body.name=targetDefinition.name;targetGeometryGroup.add(body);if(targetDefinition.secondary){const small=targetDefinition.secondary,moon=new THREE.Mesh(new THREE.IcosahedronGeometry(.5*small.radiusKm/targetDefinition.radiusKm,2),material.clone());moon.position.x=.5*small.separationKm/targetDefinition.radiusKm;moon.name=small.name;targetGeometryGroup.add(moon);}}
 const site=archiveSite(record),orbit=archiveOrbit(record),siteNormal=normal.clone();
 if(site){const lat=site.latitude*Math.PI/180,lon=site.longitude*Math.PI/180;siteNormal.set(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon));normal.copy(siteNormal);}
 const orbitPoint=mean=>new THREE.Vector3(...archiveOrbitPosition(orbit,physicalRadius(),mean)).multiplyScalar(radius()/physicalRadius());
 const orbitLine=orbit?new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:192},(_,i)=>orbitPoint(i/192*Math.PI*2))),new THREE.LineBasicMaterial({color:0xe1e4e8,transparent:true,opacity:.3,depthWrite:false})):null;
 if(orbitLine){orbitLine.name=record.name+' · orbite de la fiche';group.add(orbitLine);}

 const surface=['apollo','surveyor','viking','lunar-lander','luna-lander','luna-return','lunokhod','rover-rtg','mer','sojourner','zhurong','exomars','venera','venera-early'].includes(record.family)&&!['apollo-13','surveyor-2','surveyor-4','luna-15','venera-3','venera-4','venera-5','venera-6'].includes(record.id);
 const ground=new THREE.Group();ground.name='Local reference surface';ground.visible=false;group.add(ground);
 const groundMesh=new THREE.Mesh(new THREE.PlaneGeometry(80,80).rotateX(-Math.PI/2),new THREE.ShadowMaterial({opacity:.35}));groundMesh.receiveShadow=true;ground.add(groundMesh);
 const surfaceLight=new THREE.DirectionalLight(0xffffff,2.6);surfaceLight.position.set(25,35,15);surfaceLight.target.position.set(0,1,0);surfaceLight.castShadow=true;surfaceLight.shadow.autoUpdate=false;surfaceLight.shadow.needsUpdate=true;surfaceLight.shadow.mapSize.set(1024,1024);
 Object.assign(surfaceLight.shadow.camera,{left:-30*metre(),right:30*metre(),top:30*metre(),bottom:-30*metre(),near:metre(),far:120*metre()});surfaceLight.shadow.bias=-.0002;surfaceLight.shadow.normalBias=.015*metre();ground.add(surfaceLight,surfaceLight.target);
 const status=()=>`${record.name} · ${model.userData.official?'Modèle officiel NASA':'Architecture reconstituée d’après la fiche'} · Jalons documentaires ; position de présentation, sans télémétrie historique continue.${targetDefinition?' '+targetDefinition.note:''}${lagrange?' '+lagrange.point+' Soleil–Terre · '+lagrange.distanceKm.toLocaleString('fr-FR')+' km de la Terre ; phase de halo non reconstituée.':''}${orbit?' Orbite calculée avec les altitudes de la fiche ; orientation et phase illustratives.':''}`;
 function report(){const source=ephemeris?publishedState?`${publishedState.name} · Données orbitales publiées NASA Eyes · ${new Date(clock.at(progress)).toISOString().replace('T',' ').slice(0,19)} UTC · Jalons documentaires de la fiche ; attitude et éclairage de présentation.`:`${record.name} · Date hors de la couverture orbitale publiée · Vue d’architecture, sans position historique attribuée · Jalons documentaires de la fiche.`:status();onState({progress,playing,mode,status:source});}
 const closeInspection=()=>mode==='site'||Boolean(ephemeris&&!publishedState);
 function syncPublished(){
  if(!ephemeris)return;
  const known=Boolean(publishedState),oldBody=focusBody;publishedStates=ephemeris.entities.map(entity=>sampleEyesEntity(entity,clock.at(progress)));publishedState=publishedStates[0]||null;
  if(publishedState)focusBody=publishedState.parent;
  if(known!==Boolean(publishedState)||oldBody!==focusBody){lastCenter=lastNormal=null;needsFraming=true;setDepthScale(closeInspection()?1/metre():1);onContextChanged();}
 }
 let modelFloorMetres=0,modelExtentMetres=6.8;
 function normalize(){
  if(renderer&&!environment){const room=new RoomEnvironment(),generator=new THREE.PMREMGenerator(renderer);environment=generator.fromScene(room,.04);room.dispose();generator.dispose();}
  model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;for(const material of Array.isArray(node.material)?node.material:[node.material])if(environment&&material.isMeshStandardMaterial){material.envMap=environment.texture;material.envMapIntensity=.7;material.needsUpdate=true;}}});surfaceLight.shadow.needsUpdate=true;
  modelExtentMetres=vehicleSize?.extentMetres||6.8;
  if(vehicleSize?.nativeMetres){const parent=model.parent;model.removeFromParent();model.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());modelExtentMetres=Math.max(size.x,size.y,size.z);parent?.add(model);}
  normalizeSpacecraft(THREE,model,modelExtentMetres);
  model.updateMatrix();
  // The vehicle parent may be translated and rescaled by atlas rebasing.
  // Measure its child in local coordinates so the feet meet the surface.
  const parent=model.parent;model.removeFromParent();model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model);
  if(vehicleSize?.heightMetres){
   const factor=vehicleSize.heightMetres/bounds.getSize(new THREE.Vector3()).y;
   if(Number.isFinite(factor)&&factor>0){model.scale.multiplyScalar(factor);model.position.multiplyScalar(factor);model.updateMatrixWorld(true);bounds.setFromObject(model);}
  }
  const size=bounds.getSize(new THREE.Vector3());modelExtentMetres=Math.max(size.x,size.y,size.z);
  modelFloorMetres=-bounds.min.y;parent?.add(model);
 }

 normalize();
 function render(){
  syncPublished();
  const current=center();group.position.copy(current);
  if(lagrange)sunward.copy(getPosition('sun')).sub(getPosition('earth')).normalize();
  if(site){normal.copy(siteNormal);const orientation=getOrientation(focusBody);if(orientation)normal.applyQuaternion(orientation);}
  ground.visible=surface&&mode==='site';ground.position.copy(normal).multiplyScalar(radius()+.002*metre());ground.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);ground.scale.setScalar(metre());
  const height=surface?radius()+modelFloorMetres*metre():radius()*1.25;
  if(publishedState){const p=publishedState.positionKm;vehicle.position.set(p[0],p[2],-p[1]).multiplyScalar(radius()/physicalRadius());}else if(lagrange)vehicle.position.copy(sunward).multiplyScalar((lagrange.sunward?1:-1)*lagrange.distanceKm*radius()/physicalRadius());else if(orbit&&!surface)vehicle.position.copy(orbitPoint(progress/Math.max(1,events.length-1)*Math.PI*6));else vehicle.position.copy(normal).multiplyScalar(height);vehicle.scale.setScalar(metre());
  // A close inspection follows the spacecraft, including its orbital motion.
  // Tracking only its planet would immediately lose a moving orbiter at metre scale.
  const anchor=closeInspection()||lagrange&&mode==='orbit'?vehicle.position.clone().add(current):current;
  if(lastCenter){const shift=anchor.clone().sub(lastCenter);camera.position.add(shift);controls.target.add(shift);onCameraTranslation(shift);}lastCenter=anchor.clone();
  if(surface&&mode==='site'){if(lastNormal){const rotation=new THREE.Quaternion().setFromUnitVectors(lastNormal,normal);camera.position.sub(anchor).applyQuaternion(rotation).add(anchor);controls.target.sub(anchor).applyQuaternion(rotation).add(anchor);camera.up.applyQuaternion(rotation);onCameraRotation(rotation,anchor);}lastNormal=normal.clone();}else lastNormal=null;
  if(orbitLine)orbitLine.visible=!ephemeris&&mode!=='site';
  vehicle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
  vehicle.visible=closeInspection();point.position.copy(vehicle.position);point.scale.setScalar(Math.max(radius()*.002,camera.position.distanceTo(vehicle.position.clone().add(group.position))*2*Math.tan(camera.fov*Math.PI/360)*4/Math.max(1,camera.userData.missionViewport?.().height||globalThis.innerHeight||1000)));point.visible=!closeInspection();
  const curve=publishedState?.gm?osculatingOrbit({positionKm:Object.fromEntries(['x','y','z'].map((key,index)=>[key,publishedState.positionKm[index]])),velocityKmS:Object.fromEntries(['x','y','z'].map((key,index)=>[key,publishedState.velocityKmS[index]]))},192,publishedState.gm):[];
  publishedOrbit.visible=curve.length===193&&!closeInspection();if(curve.length===193){const attribute=publishedOrbit.geometry.attributes.position;curve.forEach((p,index)=>attribute.setXYZ(index,p.x*radius()/physicalRadius(),p.z*radius()/physicalRadius(),-p.y*radius()/physicalRadius()));attribute.needsUpdate=true;publishedOrbit.geometry.computeBoundingSphere();}
  for(const [index,marker]of publishedMarkers){const state=publishedStates[index];marker.visible=Boolean(state&&state.parent===focusBody&&!closeInspection());if(marker.visible){const p=state.positionKm;marker.position.set(p[0],p[2],-p[1]).multiplyScalar(radius()/physicalRadius());marker.scale.copy(point.scale);}}
 }
 function reset(){
  if(!active)return;render();needsFraming=false;
  if(closeInspection()){const shift=vehicle.position.clone().add(group.position);lastCenter=null;rebase(shift);render();}
  const target=closeInspection()||lagrange&&mode==='orbit'?vehicle.position.clone().add(group.position):lagrange?vehicle.position.clone().multiplyScalar(.5).add(group.position):center();
  const publishedRange=publishedState?(publishedState.envelopeKm||publishedState.rangeKm)*radius()/physicalRadius()*1.5:0;
  const distance=closeInspection()?modelExtentMetres*2.65*metre():Math.max(radius()*(mode==='orbit'?2.7:5),publishedRange,orbit?3*radius()*(1+orbit.apocentreKm/physicalRadius()):0,lagrange&&mode==='journey'?vehicle.position.length()*1.7:0,targetDefinition?.secondary?radius()*10:0);
  const framedDistance=distance*Math.max(1,1/camera.aspect);
  if(closeInspection()){const close=archiveCloseFrame(THREE,{target,radial:surface?normal:vehicle.position.clone(),distance:framedDistance,surface});frame(close.target,close.position,close.up,{approach:true});}
  else frame(target,target.clone().add(new THREE.Vector3(1,.6,1).normalize().multiplyScalar(framedDistance)),new THREE.Vector3(0,1,0),{approach:true});
 }
 function disposeModel(root){root.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:node.material?[node.material]:[]){for(const value of Object.values(material))if(value?.isTexture&&value!==environment?.texture)value.dispose();material.dispose();}});}
 function textureDecoder(){return renderer?new KTX2Loader().setTranscoderPath(appURL('vendor/three-addons/libs/basis/').href).setWorkerLimit(1).detectSupport(renderer):null;}
 async function official(){
  // Apollo 13 never landed: retain the combined CSM/LM architecture rather
  // than replacing that assembly with the isolated surface lunar module.
  if(record.id==='apollo-13')return;
  if(record.family==='apollo'){const {loadNasaLunarModule}=await import('./nasa-lunar-module.js');const result=await loadNasaLunarModule();if(disposed){disposeModel(result.root);return;}vehicle.remove(model);disposeModel(model);model=result.root;model.userData.official={source:'NASA / Michael D. Carbajal · Apollo lunar module'};vehicle.add(model);normalize();onMaterialsChanged();render();report();return;}
  const key=archiveModelKey(record);
  const definitions=await loadJSON('models.json');const resource=definitions[key];if(!resource||disposed)return;
  const textures=textureDecoder(),draco=new DRACOLoader();draco.setDecoderPath(appURL('vendor/three-addons/libs/draco/').href);draco.setWorkerLimit(1);
  try{const gltf=await new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(textures).loadAsync(asset(resource.path));if(disposed){disposeModel(gltf.scene);return;}vehicle.remove(model);disposeModel(model);model=gltf.scene;model.userData.official=resource;vehicle.add(model);normalize();onMaterialsChanged();render();report();}finally{draco.dispose();textures?.dispose();}
 }
 async function officialTarget(){
  if(!targetDefinition)return;
  const definitions=await loadJSON('models.json'),resource=definitions[targetDefinition.id];if(!resource||disposed)return;
  const textures=textureDecoder(),decoder=new DRACOLoader();decoder.setDecoderPath(appURL('vendor/three-addons/libs/draco/').href);decoder.setWorkerLimit(1);
  try{const loaded=await new GLTFLoader().setDRACOLoader(decoder).setKTX2Loader(textures).loadAsync(asset(resource.path));if(disposed){disposeModel(loaded.scene);return;}normalizeSpacecraft(THREE,loaded.scene,radius()*2);for(const node of [...targetGeometryGroup.children]){targetGeometryGroup.remove(node);disposeModel(node);}targetGeometryGroup.add(loaded.scene);targetDefinition.note='Modèle officiel NASA de '+targetDefinition.name+' ; orientation de présentation illustrative.';targetDefinition.modelSource=resource.source;onMaterialsChanged();report();}finally{decoder.dispose();textures?.dispose();}
 }
 const controller={id:record.id,name:record.name,archive:true,get focusBody(){return focusBody;},get contextAvailable(){return !ephemeris||Boolean(publishedState);},
  get bodyRadius(){return radius();},get bodyRadiusKm(){return physicalRadius();},
  get active(){return active;},get starting(){return starting;},get playing(){return playing;},get time(){return clock.at(progress);},
  async start(){if(active||starting||disposed)return;starting=true;const token=++generation;ephemeris=await loadMissionEphemeris(record.id).catch(error=>{console.warn('Published ephemeris unavailable.',error);return null;});if(disposed||token!==generation)return;for(let index=1;index<(ephemeris?.entities.length||0);index++){const marker=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xdce3e9}));marker.name=ephemeris.entities[index].name+' · NASA position';marker.visible=false;group.add(marker);publishedMarkers.set(index,marker);}active=true;group.visible=true;sunward.copy(getPosition('sun')).sub(getPosition('earth')).normalize();onStart();rebase(center());starting=false;playing=!reducedMissionMotion();onMaterialsChanged();render();setDepthScale(closeInspection()?1/metre():1);reset();report();void officialTarget().catch(error=>console.warn('Target mesh unavailable; dimensional envelope retained.',error));void official().catch(error=>{if(token===generation&&!disposed){console.warn('Official model unavailable; documented architecture retained.',error);report();}});},
  setProgress(value){progress=Math.max(0,Math.min(Math.max(0,events.length-1),value));report();},
  setPlaying(value){if(progress>=events.length-1&&value)progress=0;playing=Boolean(value);report();},setSpeed(value){if(Number.isFinite(value)&&value>0)speed=value;},
  setMode(value){if(!['journey','orbit','site'].includes(value))return;mode=value;lastCenter=null;lastNormal=null;setDepthScale(closeInspection()?1/metre():1);onSurfaceActive(surface&&mode==='site');surfaceLight.shadow.needsUpdate=true;reset();report();},reset,
  advance(dt){if(active&&playing){progress=Math.min(Math.max(0,events.length-1),progress+Math.min(dt,.25)*speed/6);if(progress>=events.length-1)playing=false;}},
  update(dt,now){if(!active)return;render();if(needsFraming)reset();if(now-lastReport>100){lastReport=now;report();}},
  releaseCamera(){},enforceCamera(){if(!active||!controller.contextAvailable)return;const origin=center(),offset=camera.position.clone().sub(origin),minimum=radius()+Math.max(.5*metre(),radius()*1e-8);if(offset.length()<minimum){if(offset.lengthSq()===0)offset.copy(normal);camera.position.copy(origin).add(offset.setLength(minimum));camera.lookAt(controls.target);}},moonRelativePosition(){return null;},projectAnnotations(bounds={left:0,top:0,width:globalThis.innerWidth||1,height:globalThis.innerHeight||1}){
   if(!active)return [];camera.updateMatrixWorld(true);
   const rows=[];if(controller.contextAvailable)rows.push({id:'target',text:targetDefinition?.name||getName(focusBody),position:center()});
   rows.push({id:'craft',text:(ephemeris?.entities[0]?.name||record.name)+(lagrange?' · '+lagrange.point:''),position:vehicle.position.clone().add(group.position)});
   for(const [index,marker] of publishedMarkers)if(marker.visible)rows.push({id:'source-'+index,text:ephemeris.entities[index].name,position:marker.position.clone().add(group.position)});
   return rows.map(row=>{const p=row.position.clone().project(camera);return {id:row.id,text:row.text,x:bounds.left+(p.x+1)*bounds.width/2,y:bounds.top+(1-p.y)*bounds.height/2,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<.96&&Math.abs(p.y)<.96};});
  },resize:reset,
  stop(restore=true){if(!active&&!starting)return;active=starting=playing=false;group.visible=false;generation++;onSurfaceActive(false);onStop(restore);},
  dispose(){if(disposed)return;disposed=true;controller.stop(false);scene.remove(group);surfaceLight.shadow.map?.dispose();disposeModel(group);environment?.dispose();}
 };return controller;
}
