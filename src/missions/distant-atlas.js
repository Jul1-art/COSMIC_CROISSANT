import {loadJSON,asset} from './catalog.js';
import {distantTimeAt,sampleDistantProbe,distantMetrics,rowTime} from './distant-data.js';
import {interpolatePlanetState} from '../atlas/planetary-ephemeris.js';
import {kmToWorld,AU_KM} from '../atlas/solar-scale.js';
import {archiveModelKey} from './archive-model-resources.js';
import {normalizeSpacecraft} from './normalize-spacecraft.js';
import {buildSpacecraft} from './spacecraft-models.js';
import {GLTFLoader} from '../../vendor/three-addons/loaders/GLTFLoader.js';
import {DRACOLoader} from '../../vendor/three-addons/loaders/DRACOLoader.js';
import {KTX2Loader} from '../../vendor/three-addons/loaders/KTX2Loader.js';
import {RoomEnvironment} from '../../vendor/three-addons/environments/RoomEnvironment.js';
import {appURL} from '../core/paths.js';

/** The five escaping spacecraft share the atlas renderer, with real geometric
 * heliocentric trajectories and a rebased, isolated present-day model view. */
export function createDistantAtlas({THREE,scene,camera,controls,renderer,record,events,onState,onStart,onStop,onRebase,onMaterialsChanged,onContextChanged=()=>{},onCameraTranslation=()=>{},frame,setDepthScale=()=>{},load=loadJSON,now=Date.now}){
 let active=false,starting=false,disposed=false,playing=false,progress=0,speed=1,mode='journey',data,planets,environment,modelReady=false,lastReport=0,lastAnchor=null;
 const metre=kmToWorld(.001),extent=record.family==='voyager'?13:record.family==='pioneer'?7:3;
 const originalNear=camera.near,origin=new THREE.Vector3(),group=new THREE.Group();group.name=record.name+' · heliocentric flight';group.visible=false;scene.add(group);
 const vehicle=new THREE.Group();vehicle.name=record.name+' · spacecraft';group.add(vehicle);
 let model=buildSpacecraft(record);vehicle.add(model);normalizeSpacecraft(THREE,model,extent);vehicle.scale.setScalar(metre);
 const hemisphere=new THREE.HemisphereLight(0xffffff,0x445566,1.4);group.add(hemisphere);
 const fill=new THREE.DirectionalLight(0xffffff,3);fill.position.set(1,2,3);scene.add(fill);
 const point=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xffffff,depthTest:false}));point.renderOrder=80;group.add(point);
 const contextPoints=new Map();
 const sourcePosition=new THREE.Vector3();let geometry,path,travelled,pathRows=[],pathBounds;
 const vector=p=>new THREE.Vector3(kmToWorld(p.x),kmToWorld(p.z),-kmToWorld(p.y));
 const observationTime=()=>Math.min(now(),rowTime(data.states.at(-1)));
 const time=()=>mode==='journey'?distantTimeAt(events,progress):observationTime();
 const worldCraft=()=>vehicle.position.clone().sub(origin);
 function rebase(shift){origin.add(shift);group.position.copy(origin).negate();onRebase(shift);}
 function report(){if(!data)return;const at=time(),metrics=distantMetrics(data,planets,at);
  onState({progress,playing,mode,time:at,metrics,status:`${record.name} · NASA/JPL Horizons · ${new Date(at).toISOString().replace('T',' ').slice(0,19)} UTC · ${modelReady?'Modèle officiel NASA':'Chargement du modèle NASA'} · ${metrics?.launchSchematic?'Raccord de lancement schématique jusqu’au début des vecteurs JPL.':'Trajectoire géométrique interpolée ; attitude de présentation.'}`});
 }
 function setScale(){camera.near=mode==='journey'?originalNear:.01*metre;camera.updateProjectionMatrix();controls.minDistance=mode==='journey'?.0000002:.2*metre;controls.maxDistance=150000;setDepthScale(mode==='journey'?1:1/metre);}
 function render(){if(!data)return;
  const at=time(),state=sampleDistantProbe(data,at);if(!state)return;
  sourcePosition.copy(vector(state.positionKm));vehicle.position.copy(sourcePosition);vehicle.visible=mode!=='journey';
  point.position.copy(sourcePosition);point.visible=mode==='journey';
  const height=camera.userData.missionViewport?.().height||globalThis.innerHeight||1000;
  const pixelScale=position=>camera.position.distanceTo(position.clone().sub(origin))*2*Math.tan(camera.fov*Math.PI/360)/Math.max(1,height);
  point.scale.setScalar(pixelScale(sourcePosition)*5);
  if(mode!=='journey'){
   const anchor=worldCraft();if(lastAnchor){const shift=anchor.clone().sub(lastAnchor);camera.position.add(shift);controls.target.add(shift);onCameraTranslation(shift);}lastAnchor=anchor;
   if(anchor.length()>.001){rebase(anchor);lastAnchor=worldCraft();}
  }else lastAnchor=null;
  path.visible=travelled.visible=mode==='journey';
  if(mode==='journey'){
   let lo=0,hi=pathRows.length;while(lo<hi){const mid=(lo+hi)>>1;if(pathRows[mid][0]<=at)lo=mid+1;else hi=mid;}
   travelled.geometry.setDrawRange(0,Math.max(2,lo));
  }
  for(const [id,marker] of contextPoints){const entry=planets.bodies[id],state=interpolatePlanetState(entry,at);marker.visible=mode==='journey'&&Boolean(state);if(state){marker.position.copy(vector(state.positionKm));marker.scale.setScalar(pixelScale(marker.position)*3);}}
  fill.visible=active&&mode!=='journey';
 }
 function reset(){if(!active)return;render();setScale();
  if(mode!=='journey'){
   rebase(worldCraft());render();const target=worldCraft(),distance=extent*(mode==='site'?2.4:4)*metre*Math.max(1,1/camera.aspect);
   frame(target,target.clone().add(new THREE.Vector3(1,.5,1).normalize().multiplyScalar(distance)),new THREE.Vector3(0,1,0),{approach:true});lastAnchor=target.clone();
  }else{
   if(origin.lengthSq())rebase(origin.clone().negate());render();
   const target=pathBounds.center.clone(),range=pathBounds.radius*2.9*Math.max(1,1/camera.aspect);
   frame(target,target.clone().add(new THREE.Vector3(.5,1,.7).normalize().multiplyScalar(range)),new THREE.Vector3(0,1,0));
  }
 }
 async function official(){
  const definitions=await load('models.json'),resource=definitions[archiveModelKey(record)];if(disposed||!resource)throw Error('NASA model unavailable');
  const draco=new DRACOLoader().setDecoderPath(appURL('vendor/three-addons/libs/draco/').href).setWorkerLimit(1);
  const textures=renderer?new KTX2Loader().setTranscoderPath(appURL('vendor/three-addons/libs/basis/').href).setWorkerLimit(1).detectSupport(renderer):null;
  try{
   const loaded=await new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(textures).loadAsync(asset(resource.path));
   if(disposed){disposeObject(loaded.scene);return;}
   vehicle.remove(model);disposeObject(model);model=loaded.scene;normalizeSpacecraft(THREE,model,extent);vehicle.add(model);modelReady=true;
   if(renderer){const room=new RoomEnvironment(),generator=new THREE.PMREMGenerator(renderer);environment=generator.fromScene(room,.04);room.dispose();generator.dispose();model.traverse(node=>{for(const material of Array.isArray(node.material)?node.material:node.material?[node.material]:[])if(material.isMeshStandardMaterial){material.envMap=environment.texture;material.envMapIntensity=1;material.needsUpdate=true;}});}
   onMaterialsChanged();report();
  }finally{draco.dispose();textures?.dispose();}
 }
 function disposeObject(object){object.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:node.material?[node.material]:[]){for(const value of Object.values(material))if(value?.isTexture&&value!==environment?.texture)value.dispose();material.dispose();}});}
 const controller={id:record.id,name:record.name,archive:true,distant:true,focusBody:'sun',contextAvailable:true,
  get bodyRadius(){return 1;},get bodyRadiusKm(){return AU_KM/160;},get showSolarSystem(){return mode==='journey';},
  get active(){return active;},get starting(){return starting;},get playing(){return playing;},get time(){return data?time():events[0].time;},
  bodyPosition(id,date){return planets?.bodies[id]?interpolatePlanetState(planets.bodies[id],date)?.positionKm:null;},
  async start(){if(active||starting||disposed)return;starting=true;
   const catalog=await load('distant/catalog.json');[data,planets]=await Promise.all([load('distant/'+catalog.probes[record.id]),load('distant/'+catalog.planets)]);if(disposed)return;
   const end=Math.min(now(),rowTime(data.states.at(-1))),last=sampleDistantProbe(data,end).positionKm;
   pathRows=[[Date.parse(data.launch),...data.launchEarthState.slice(1,4)],...data.states.filter(row=>rowTime(row)<=end).map(row=>[rowTime(row),...row.slice(1,4)]),[end,last.x,last.y,last.z]];
   geometry=new THREE.BufferGeometry().setFromPoints(pathRows.map(row=>vector({x:row[1],y:row[2],z:row[3]})));geometry.computeBoundingSphere();pathBounds=geometry.boundingSphere.clone();
   path=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0xa1b8cb,transparent:true,opacity:.24}));path.name='Full NASA/JPL departure-to-present trajectory';group.add(path);
   const flownGeometry=geometry.clone();travelled=new THREE.Line(flownGeometry,new THREE.LineBasicMaterial({color:0xaee8ff,transparent:true,opacity:.95}));travelled.name='Travelled heliocentric trajectory';group.add(travelled);
   for(const id of Object.keys(planets.bodies)){const marker=new THREE.Mesh(new THREE.SphereGeometry(1,10,6),new THREE.MeshBasicMaterial({color:id==='earth'?0x71caff:0xcec4aa,depthTest:false}));group.add(marker);contextPoints.set(id,marker);}
   active=true;starting=false;group.visible=true;playing=true;onStart();onMaterialsChanged();onContextChanged();render();reset();report();void official().catch(error=>{console.warn('Distant spacecraft model unavailable',error);onState({status:'Le modèle NASA ne peut pas se charger. Rechargez la visualisation.'});});
  },
  setMode(value){if(!['journey','orbit','site'].includes(value))return;mode=value;progress=value==='journey'?0:events.length-1;playing=false;lastAnchor=null;setScale();onContextChanged();reset();report();},
  setProgress(value){if(!Number.isFinite(value))return;if(mode!=='journey'){mode='journey';lastAnchor=null;setScale();onContextChanged();reset();}progress=Math.max(0,Math.min(events.length-1,value));render();report();},
  setPlaying(value){if(value&&mode!=='journey')controller.setMode('journey');if(value&&progress>=events.length-1)progress=0;playing=Boolean(value);report();},
  setSpeed(value){if(Number.isFinite(value)&&value>0)speed=value;},
  advance(dt){if(active&&playing){progress=Math.min(events.length-1,progress+Math.min(dt,.25)*speed/6);if(progress===events.length-1)playing=false;}},
  update(dt,stamp){if(!active)return;render();if(stamp-lastReport>500){lastReport=stamp;report();}},reset,resize:reset,releaseCamera(){},enforceCamera(){},moonRelativePosition(){return null;},
  projectAnnotations(bounds){if(!active)return[];camera.updateMatrixWorld(true);const rows=[{id:'craft',text:record.name,position:worldCraft()}];if(mode==='journey')for(const [id,marker]of contextPoints)rows.push({id:'planet-'+id,text:({earth:'Terre · départ',jupiter:'Jupiter',saturn:'Saturne',uranus:'Uranus',neptune:'Neptune'})[id],position:marker.position.clone().sub(origin)});
   return rows.map(row=>{const p=row.position.project(camera);return{id:row.id,text:row.text,x:bounds.left+(p.x+1)*bounds.width/2,y:bounds.top+(1-p.y)*bounds.height/2,visible:p.z>=-1&&p.z<=1&&Math.abs(p.x)<.98&&Math.abs(p.y)<.98};});
  },
  stop(restore=true){if(!active&&!starting)return;active=starting=playing=false;group.visible=fill.visible=false;camera.near=originalNear;camera.updateProjectionMatrix();onStop(restore);},
  dispose(){if(disposed)return;disposed=true;controller.stop(false);scene.remove(group,fill);disposeObject(group);environment?.dispose();}
 };return controller;
}
