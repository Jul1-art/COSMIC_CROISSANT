import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
async function builder(){
 const context=vm.createContext({console});
 const three=new vm.SyntheticModule(Object.keys(THREE),function(){for(const [key,value]of Object.entries(THREE))this.setExport(key,value);},{context});
 const geometryURL=new URL('../src/missions/mission-models.js',import.meta.url),geometry=new vm.SourceTextModule(await readFile(geometryURL,'utf8'),{context});
 await geometry.link(()=>three);
 const source=new vm.SourceTextModule(await readFile(new URL('../src/missions/spacecraft-models.js',import.meta.url),'utf8'),{context});
 await source.link(specifier=>specifier==='three'?three:geometry);await source.evaluate();return source.namespace.buildSpacecraft;
}
test('Pathfinder represents its station with three solar petals as well as the separate six-wheel rover',async()=>{
 const build=await builder(),model=build({id:'mars-pathfinder',family:'sojourner'});
 const station=model.getObjectByName('Carl Sagan Memorial Station'),rover=model.getObjectByName('Sojourner');
 assert.ok(station&&rover);assert.equal(station.children.filter(node=>node.name.startsWith('Solar petal')).length,3);
 assert.ok(station.getObjectByName('IMP stereo camera'));
 const size=new THREE.Box3().setFromObject(rover).getSize(new THREE.Vector3());assert.ok(Math.abs(size.y-.3)<1e-9);
 const independent=build({id:'sojourner',family:'sojourner'});assert.equal(independent.getObjectByName('Carl Sagan Memorial Station'),undefined);
});
