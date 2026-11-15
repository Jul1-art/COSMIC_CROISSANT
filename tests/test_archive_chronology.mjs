import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {archiveEvents} from '../src/missions/archive-data.js';
import {renderArchiveDossierTab} from '../src/missions/archive-dossier-content.js';
const record=async id=>JSON.parse(await readFile(new URL(`../assets/missions/${id}.json`,import.meta.url),'utf8'));
test('Pathfinder descent timings remain a separate technical sequence after the calendar milestones',async()=>{
 const data=await record('mars-pathfinder'),events=archiveEvents(data);
 assert.equal(events.length,5);assert.match(events.at(-1).date,/27 septembre 1997/);
 const html=renderArchiveDossierTab(data,{images:[]},'chronologie');
 assert.match(html,/T − 30 min/);assert.match(html,/Décélération maximale/);assert.match(html,/Dégonflage et ouverture des pétales/);
 assert.doesNotMatch(html,/<time>T [−+]/);
});
test('numbered Parker flybys retain their dates and altitudes in a table, not as fake numbered calendar dates',async()=>{
 const data=await record('parker-solar-probe'),events=archiveEvents(data);
 assert.ok(events.every(event=>!/^\d{1,2}$/.test(event.date)));
 const html=renderArchiveDossierTab(data,{images:[]},'chronologie');assert.match(html,/Altitude de survol/);assert.match(html,/Date \(UTC\)/);
});
