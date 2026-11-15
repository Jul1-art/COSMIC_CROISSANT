import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {archiveSections,archiveEvents} from '../src/missions/archive-data.js';
import {renderArchiveDossierTab} from '../src/missions/archive-dossier-content.js';
const root=new URL('../assets/missions/',import.meta.url);
const json=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const catalog=await json('catalog.json');
test('the 90 supplied dossiers have unique identities, original PDFs and all five source sections',async()=>{
 assert.equal(catalog.length,90);assert.equal(new Set(catalog.map(m=>m.id)).size,90);
 for(const entry of catalog){
  const record=await json(`${entry.id}.json`);assert.equal(record.id,entry.id);assert.ok(record.facts.length,entry.id+' facts');
  const pdf=await readFile(new URL(record.pdf,root));assert.equal(pdf.subarray(0,4).toString(),'%PDF',entry.id+' original PDF');
  const sections=archiveSections(record);
  for(const key of ['identite','inventaire','chronologie','science','sources'])assert.ok(sections[key].length,`${entry.id}: missing ${key}`);
  assert.ok(archiveEvents(record).length,entry.id+' dated chronology');
 }
});
test('every mission has an attributed local archive image and a playable local documentary',async()=>{
 for(const entry of catalog){
  const media=await json(`${entry.id}.media.json`);assert.ok(media.images.length,entry.id+' images');
  for(const image of media.images){assert.match(image.source,/^https:\/\//);assert.ok(image.credit);assert.doesNotMatch(image.title,/OOjs|edit-ltr|ISS HERA|Lunokhod 2 Crater on Mars/i,entry.id+' irrelevant image');assert.ok((await stat(new URL(image.src,root))).size>100);}
  assert.ok(media.documentary?.local,entry.id+' local film');const film=await readFile(new URL(media.documentary.src,root));assert.equal(film.subarray(4,8).toString(),'ftyp',entry.id+' MP4');
 }
});
test('all additional dossiers render the reference identity, inventory and timeline components',async()=>{
 for(const entry of catalog){
  const record=await json(`${entry.id}.json`),media=await json(`${entry.id}.media.json`);
  assert.match(renderArchiveDossierTab(record,media,'identite'),/class="dossier-facts"/,entry.id);
  assert.match(renderArchiveDossierTab(record,media,'inventaire'),/class="dossier-hardware-grid"|class="mission-table-wrap"/,entry.id);
  assert.match(renderArchiveDossierTab(record,media,'chronologie'),/class="dossier-timeline"/,entry.id);
  assert.doesNotMatch(renderArchiveDossierTab(record,media,'sources'),/href="[^"]+\.pdf"/,entry.id+' source-brief CTA');
 }
});
