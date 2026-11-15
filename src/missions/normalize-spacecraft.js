/** Normalize imported geometry independently of the atlas's position and scale. */
export function normalizeSpacecraft(THREE,model,extent=6.8){
 const parent=model.parent;
 model.removeFromParent();model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),middle=bounds.getCenter(new THREE.Vector3());
 const width=Math.max(size.x,size.y,size.z),factor=width>0?extent/width:1;
 model.scale.multiplyScalar(factor);model.position.sub(middle).multiplyScalar(factor);
 model.updateMatrixWorld(true);parent?.add(model);
 return model;
}
