import test from 'node:test';
import assert from 'node:assert/strict';
import {missionText} from '../src/missions/mission-locale.js';
import {APOLLO_11,EVENTS,HARDWARE} from '../src/missions/apollo11-data.js';
import {EVENTS as FR_EVENTS,HARDWARE as FR_HARDWARE} from '../src/missions/mission-fr-data.js';
import {renderDossierTab} from '../src/missions/mission-dossier-fr.js';
import {renderSputnikFrench} from '../src/missions/sputnik-dossier-fr.js';
import {registerMissionFilm,getMissionFilm} from '../src/missions/mission-films.js';
test('mission UI has reversible English/French copy and translates live mission events',()=>{
 for(const key of ['Mission profile','Explore mission','Watch film','Mission details','Minimize controls','Expand controls','Back to mission']){assert.notEqual(missionText(key,'fr'),key);assert.equal(missionText(key,'en'),key);}
 for(const event of EVENTS){assert.notEqual(missionText(event.title,'fr'),event.title);assert.notEqual(missionText(event.text,'fr'),event.text);}
 assert.equal(missionText('Next: Timeline','fr'),'Suite : Chronologie');
});
test('French editorial records retain mission identifiers and timings without exposing the original brief CTA',()=>{
 assert.deepEqual(FR_EVENTS.map(({id,time})=>({id,time})),EVENTS.map(({id,time})=>({id,time})));
 assert.deepEqual(FR_HARDWARE.map(row=>row.id),HARDWARE.map(row=>row.id));
 for(const tab of ['identite','inventaire','chronologie','science','sources']){assert.ok(renderDossierTab(tab).length>100);assert.ok(renderSputnikFrench(tab).length>100);assert.doesNotMatch(renderDossierTab(tab),/fiche-mission\.pdf/);assert.doesNotMatch(renderSputnikFrench(tab),/fiche-mission\.pdf/);}
 assert.match(renderDossierTab('identite'),/Trois hommes/);assert.match(renderSputnikFrench('identite'),/premier satellite/);
});
test('current and future mission films use the shared media registry',()=>{
 assert.ok(getMissionFilm('apollo-11').media.hls.includes(APOLLO_11.film.path));
 const sputnik=getMissionFilm('sputnik-1');assert.match(sputnik.media.languages.fr.hls,/film-fr/);assert.match(sputnik.media.languages.en.hls,/film-en/);
 assert.throws(()=>registerMissionFilm('bad',{}),TypeError);registerMissionFilm('future-test',{title:'Future mission',media:{src:'/future.mp4'}});assert.equal(getMissionFilm('future-test').title,'Future mission');assert.equal(getMissionFilm('unknown'),undefined);
});
