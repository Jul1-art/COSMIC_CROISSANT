import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {normalizeSpacecraft} from '../src/missions/normalize-spacecraft.js';
test('NASA vehicle framing is independent of the translated, metre-scale atlas parent',()=>{
 const make=()=>{const root=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(4,2,8),new THREE.MeshBasicMaterial());mesh.position.set(2,3,-5);root.add(mesh);root.position.set(1,2,3);root.scale.set(2,2,2);return root;};
 const plain=make(),attached=make(),parent=new THREE.Group();parent.position.set(150,-40,80);parent.scale.setScalar(0.0000003);parent.add(attached);parent.updateMatrixWorld(true);
 normalizeSpacecraft(THREE,plain);normalizeSpacecraft(THREE,attached);
 assert.equal(attached.parent,parent);assert.deepEqual(attached.scale.toArray(),plain.scale.toArray());assert.deepEqual(attached.position.toArray(),plain.position.toArray());
 attached.removeFromParent();attached.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(attached),size=bounds.getSize(new THREE.Vector3());
 assert.ok(Math.abs(Math.max(size.x,size.y,size.z)-6.8)<1e-10);assert.ok(bounds.getCenter(new THREE.Vector3()).length()<1e-10);
});
