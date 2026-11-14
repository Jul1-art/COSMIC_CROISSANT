import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
async function fixture({reduced=false}={}){
 const context=vm.createContext({document:{documentElement:{dataset:{}},hidden:false},matchMedia:()=>({matches:reduced}),setTimeout,clearTimeout,Promise});
 const module=new vm.SourceTextModule(await readFile(new URL('../src/missions/mission-motion.js',import.meta.url),'utf8'),{context});await module.link(()=>{throw new Error('Motion helper has no dependencies');});await module.evaluate();return module.namespace;
}
test('scene dismissal finishes even when the browser never resolves its animation',async()=>{
 const motion=await fixture();let cancelled=false;const element={animate(){return {finished:new Promise(()=>{}),cancel(){cancelled=true;}};}};
 const result=await Promise.race([motion.dismissMissionElement(element).then(()=> 'dismissed'),new Promise(resolve=>setTimeout(()=>resolve('stalled'),1200))]);assert.equal(result,'dismissed');assert.equal(cancelled,true);
});
test('reduced motion skips reveal and dismissal animations',async()=>{
 const motion=await fixture({reduced:true});const element={animate(){assert.fail('Reduced motion must not animate the view');}};assert.equal(motion.revealMissionElement(element),undefined);await motion.dismissMissionElement(element);
});
