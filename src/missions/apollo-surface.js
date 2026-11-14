import * as THREE from 'three';
import {APOLLO_11} from './apollo11-data.js';
import {createSurfaceSampler} from './apollo-surface-math.js';

/** Measured local terrain inside the atlas's existing lunar mesh and renderer. */
export async function loadApolloSurface({signal,moonMesh,worldPerMeter}){
 const base=new URL('../../assets/terrain/',import.meta.url);
 const [catalogResponse,heightsResponse]=await Promise.all([fetch(new URL('catalog.json',base),{signal}),fetch(new URL('moon-apollo11.bin',base),{signal})]);
 if(!catalogResponse.ok||!heightsResponse.ok)throw new Error('Relief lunaire indisponible');
 const [catalog,buffer]=await Promise.all([catalogResponse.json(),heightsResponse.arrayBuffer()]);
 const sampler=createSurfaceSampler({grid:catalog.grid,values:new Uint16Array(buffer),site:catalog.sites['moon-apollo11'],latitude:APOLLO_11.site.latitude,longitude:APOLLO_11.site.longitude});
 const texture=await new THREE.TextureLoader().loadAsync(new URL('moon-apollo11.webp',base).href);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
 if(signal?.aborted){texture.dispose();throw new DOMException('Aborted','AbortError');}
 const root=new THREE.Group();root.name='Apollo 11 · relief LRO mesuré';root.scale.setScalar(worldPerMeter);
 const objects=[],materials=[];const half=20000;
 function geometry(bounds,n){
  const [left,top,right,bottom]=bounds,geometry=new THREE.PlaneGeometry(right-left,bottom-top,n-1,n-1);geometry.rotateX(-Math.PI/2);
  const positions=geometry.getAttribute('position');
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=left+i/(n-1)*(right-left),z=top+j/(n-1)*(bottom-top);positions.setXYZ(j*n+i,x,sampler.height(x,z),z);}
  geometry.computeVertexNormals();objects.push(geometry);return geometry;
 }
 const material=new THREE.MeshStandardMaterial({map:texture,color:0x888888,roughness:1,metalness:0,polygonOffset:true,polygonOffsetFactor:-1});materials.push(material);
 const terrain=new THREE.Mesh(geometry(sampler.bounds,catalog.grid),material);terrain.name='NAC Apollo 11 · relief et photographie NASA';terrain.receiveShadow=true;root.add(terrain);
 const collarMaterial=new THREE.MeshBasicMaterial({map:moonMesh.material.map,color:moonMesh.material.map?0xffffff:0x888888});materials.push(collarMaterial);
 collarMaterial.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 apolloLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\napolloLocal = position;');
  shader.fragmentShader='varying vec3 apolloLocal;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nif(apolloLocal.x>${sampler.bounds[0]}&&apolloLocal.x<${sampler.bounds[2]}&&apolloLocal.z>${sampler.bounds[1]}&&apolloLocal.z<${sampler.bounds[3]})discard;`);
 };
 const collarGeometry=geometry([-half,-half,half,half],129),uv=collarGeometry.getAttribute('uv'),pos=collarGeometry.getAttribute('position');
 const lat=APOLLO_11.site.latitude*Math.PI/180,lon=APOLLO_11.site.longitude*Math.PI/180;
 for(let i=0;i<uv.count;i++){const longitude=lon+pos.getX(i)/sampler.metersLon*Math.PI/180,latitude=lat-pos.getZ(i)/sampler.metersLat*Math.PI/180;uv.setXY(i,(longitude+Math.PI)/(2*Math.PI),latitude/Math.PI+.5);}
 const collar=new THREE.Mesh(collarGeometry,collarMaterial);collar.name='Raccord au globe lunaire';root.add(collar);
 // Remove only the globe fragments covered by the loaded cap. The globe's
 // coarse sphere cannot protrude through the measured local topography.
 const originalGeometry=moonMesh.geometry,detailGeometry=new THREE.SphereGeometry(originalGeometry.parameters?.radius||1,256,128);
 const materialMoon=moonMesh.material,compile=materialMoon.onBeforeCompile,key=materialMoon.customProgramCacheKey,enabled={value:0};
 const up=new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)),east=new THREE.Vector3(-Math.sin(lon),0,-Math.cos(lon)),south=new THREE.Vector3(Math.sin(lat)*Math.cos(lon),-Math.cos(lat),-Math.sin(lat)*Math.sin(lon));
 materialMoon.onBeforeCompile=function(shader,renderer){
  compile.call(this,shader,renderer);shader.uniforms.apolloCap=enabled;
  shader.vertexShader='varying vec3 apolloMoonLocal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\napolloMoonLocal = position;');
  shader.fragmentShader='uniform float apolloCap;\nvarying vec3 apolloMoonLocal;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nvec3 lunarPoint=normalize(apolloMoonLocal);\nif(apolloCap>.5&&dot(lunarPoint,vec3(${up.toArray().join(',')}))>.99&&abs(dot(lunarPoint,vec3(${east.toArray().join(',')})))<${half/1737400}&&abs(dot(lunarPoint,vec3(${south.toArray().join(',')})))<${half/1737400})discard;`);
 };
 materialMoon.customProgramCacheKey=function(){return key.call(this)+':apollo-lro-cap-v1';};materialMoon.needsUpdate=true;
 const light=new THREE.DirectionalLight(0xffffff,2.6);light.position.set(25,35,15);light.target.position.set(0,2,0);light.castShadow=true;light.shadow.autoUpdate=false;light.shadow.needsUpdate=true;light.shadow.mapSize.set(1024,1024);
 Object.assign(light.shadow.camera,{left:-30*worldPerMeter,right:30*worldPerMeter,top:30*worldPerMeter,bottom:-30*worldPerMeter,near:worldPerMeter,far:120*worldPerMeter});light.shadow.bias=-.0002;light.shadow.normalBias=.015*worldPerMeter;root.add(light,light.target);
 let active=false,lastShadowTime=null;
 return {root,sampler,worldPerMeter,
  setActive(value){if(value&&!active)light.shadow.needsUpdate=true;active=Boolean(value);root.visible=active;enabled.value=active?1:0;moonMesh.geometry=active?detailGeometry:originalGeometry;},
  refreshShadows(){light.shadow.needsUpdate=true;},
  updateShadows(time){if(time!==lastShadowTime){lastShadowTime=time;light.shadow.needsUpdate=true;}},
  protectCamera(camera){if(!active)return false;root.updateWorldMatrix(true,false);const local=root.worldToLocal(camera.position.clone());if(Math.abs(local.x)>half||Math.abs(local.z)>half||Math.abs(local.y)>100000)return false;const floor=sampler.height(local.x,local.z)+1;if(local.y<floor){local.y=floor;camera.position.copy(root.localToWorld(local));}return true;},
  dispose(){enabled.value=0;if(moonMesh.geometry===detailGeometry)moonMesh.geometry=originalGeometry;detailGeometry.dispose();materialMoon.onBeforeCompile=compile;materialMoon.customProgramCacheKey=key;materialMoon.needsUpdate=true;texture.dispose();for(const item of [...objects,...materials])item.dispose();light.shadow.map?.dispose();root.removeFromParent();}
 };
}
