import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {archiveVehicleSize} from '../src/missions/archive-vehicle-size.js';
const record=async id=>JSON.parse(await readFile(new URL(`../assets/missions/${id}.json`,import.meta.url),'utf8'));
test('deployed Webb and Hera sizes use their inventories rather than launcher dimensions',async()=>{
 assert.equal(archiveVehicleSize(await record('james-webb')).extentMetres,21.2);
 assert.equal(archiveVehicleSize(await record('hera')).extentMetres,11.4);
 assert.equal(archiveVehicleSize(await record('curiosity')).heightMetres,2.2);
 assert.equal(archiveVehicleSize(await record('perseverance')).heightMetres,2.2);
 assert.equal(archiveVehicleSize(await record('new-horizons')),null);
});
