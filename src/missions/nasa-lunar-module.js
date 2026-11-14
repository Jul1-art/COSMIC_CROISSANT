import * as THREE from 'three';
import {GLTFLoader} from '../../vendor/three-addons/loaders/GLTFLoader.js';
import {DRACOLoader} from '../../vendor/three-addons/loaders/DRACOLoader.js';
import {mergeGeometries} from '../../vendor/three-addons/utils/BufferGeometryUtils.js';

/** NASA / Michael D. Carbajal's published lunar module. Batch by material and
 * stage to keep the detailed model inexpensive to draw. Stage split is visual. */
export async function loadNasaLunarModule(){
 const decoder=new DRACOLoader();decoder.setDecoderPath(new URL('../../vendor/three-addons/libs/draco/',import.meta.url).href);decoder.setWorkerLimit(1);
 const loader=new GLTFLoader().setDRACOLoader(decoder);
 try{
  const gltf=await loader.loadAsync(new URL('../../assets/missions/apollo-11/models/lunar-module.glb',import.meta.url).href);
  const original=gltf.scene;original.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(original),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=6.8/size.y;
  const normalize=new THREE.Matrix4().makeScale(scale,scale,scale).multiply(new THREE.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
  const root=new THREE.Group(),lower=new THREE.Group(),upper=new THREE.Group();upper.position.y=2.8;root.add(lower,upper);root.name='NASA Apollo Lunar Module';
  const batches=new Map(),sourceGeometries=new Set();
  original.traverse(node=>{
   if(!node.isMesh)return;sourceGeometries.add(node.geometry);
   const geometry=node.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalize,node.matrixWorld));geometry.computeBoundingBox();
   const stage=geometry.boundingBox.getCenter(new THREE.Vector3()).y>2.8?'upper':'lower';if(stage==='upper')geometry.translate(0,-2.8,0);
   const material=node.material;if(Array.isArray(material)){const mesh=new THREE.Mesh(geometry,material);(stage==='upper'?upper:lower).add(mesh);return;}
   if(!geometry.attributes.normal)geometry.computeVertexNormals();if(!geometry.attributes.uv)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
   for(const key of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(key))geometry.deleteAttribute(key);
   material.roughness=material.color.r>material.color.b*1.4?.43:.55;material.metalness=material.color.r>material.color.b*1.4?.6:.35;material.envMapIntensity=.65;
   const key=stage+material.uuid;if(!batches.has(key))batches.set(key,{stage,material,geometries:[]});batches.get(key).geometries.push(geometry);
  });
  for(const {stage,material,geometries} of batches.values()){const combined=mergeGeometries(geometries,false);if(combined){const mesh=new THREE.Mesh(combined,material);mesh.castShadow=true;mesh.receiveShadow=true;(stage==='upper'?upper:lower).add(mesh);for(const geometry of geometries)geometry.dispose();}else for(const geometry of geometries){const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;(stage==='upper'?upper:lower).add(mesh);}}
  for(const geometry of sourceGeometries)geometry.dispose();
  return {root,lower,upper};
 }finally{decoder.dispose();}
}
