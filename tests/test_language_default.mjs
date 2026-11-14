import test from 'node:test';
import assert from 'node:assert/strict';
import {initialLanguage} from '../src/core/language.js';
const store=values=>{const data=new Map(Object.entries(values));return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};};
test('fresh and legacy mixed-language installs start in English without losing other preferences',()=>{
 const fresh=store({});assert.equal(initialLanguage(fresh),'en');
 const old=store({'nasa-atlas-language':'fr','relic.preferences.v1':JSON.stringify({language:'fr',theme:'day',motion:'reduced'})});assert.equal(initialLanguage(old),'en');assert.deepEqual(JSON.parse(old.getItem('relic.preferences.v1')),{language:'en',theme:'day',motion:'reduced'});
 old.setItem('nasa-atlas-language','fr');assert.equal(initialLanguage(old),'fr','An explicit language choice after migration is retained');
});
test('English remains usable when browser storage is blocked or malformed',()=>{
 assert.equal(initialLanguage({getItem(){throw Error('blocked');}}),'en');
 const broken=store({'relic.preferences.v1':'{bad json'});assert.equal(initialLanguage(broken),'en');assert.equal(JSON.parse(broken.getItem('relic.preferences.v1')).language,'en');
});
