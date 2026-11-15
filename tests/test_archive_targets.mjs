import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {archiveTarget,archiveLagrange} from '../src/missions/archive-targets.js';
import {archiveBody} from '../src/missions/archive-data.js';
const load=async id=>JSON.parse(await readFile(new URL(`../assets/missions/${id}.json`,import.meta.url),'utf8'));
test('Hera and NEAR have their own asteroid targets, while Rosetta keeps 67P',async()=>{
 assert.equal(archiveTarget(await load('hera')).id,'didymos');assert.equal(archiveTarget(await load('near-shoemaker')).id,'eros');assert.equal(archiveBody(await load('rosetta-philae')),'67p');
 assert.equal(archiveTarget(await load('hera')).secondary.radiusKm*2000,151);
});
test('L1 and L2 observatories retain the 1.5-million-km distance stated by their briefs',async()=>{
 for(const [id,point,sunward] of [['ace','L1',true],['soho','L1',true],['james-webb','L2',false],['nancy-grace-roman','L2',false]]){const data=archiveLagrange(await load(id));assert.equal(data.point,point,id);assert.equal(data.distanceKm,1500000,id);assert.equal(data.sunward,sunward,id);}
 assert.equal(archiveLagrange(await load('lro')),null);
});
