import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeExplorerName,getExplorerName,saveExplorerName,EXPLORER_NAME_KEY} from '../src/core/explorer-profile.js';
test('explorer identity preserves international names and persists locally',()=>{const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};assert.equal(saveExplorerName('  Élise   王  ',storage),'Élise 王');assert.equal(getExplorerName(storage),'Élise 王');assert.equal(data.get(EXPLORER_NAME_KEY),'Élise 王');assert.equal(normalizeExplorerName('\n  Jules\u0000  '),'Jules');assert.equal(saveExplorerName(' ',storage),'');assert.equal(getExplorerName(storage),'Élise 王');});
test('blocked local storage does not prevent entering the experience',()=>{const storage={getItem(){throw Error();},setItem(){throw Error();}};assert.equal(getExplorerName(storage),'');assert.equal(saveExplorerName('Zoé',storage),'Zoé');});
