import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MISSION_SITES,getMissionSitesForBody,missionSiteLabelOffset} from '../src/missions/mission-sites.js';
import {placeMissionLabels} from '../src/missions/marker-labels.js';
const catalog=JSON.parse(await readFile(new URL('../assets/missions/catalog.json',import.meta.url)));
const ids=new Set(catalog.map(row=>row.id));

test('surface markers open existing dossiers and use valid geographic coordinates',()=>{
  for(const [body,sites] of Object.entries(MISSION_SITES)) {
    const unique=new Set();
    for(const site of sites) {
      assert(ids.has(site.id),`${body}: unknown mission ${site.id}`);
      assert(!unique.has(site.id),`${body}: duplicate dossier ${site.id}`);unique.add(site.id);
      assert(Number.isFinite(site.lat)&&Math.abs(site.lat)<=90,site.id);
      assert(Number.isFinite(site.lon)&&site.lon>=-180&&site.lon<=360,site.id);
      assert(site.year<=2026,`${site.id}: planned landing presented as completed`);
      if(site.approximate)assert.match(site.siteName,/approximative|probable|non confirmée|prédite/);
    }
  }
});
test('surface catalog distinguishes landings, impacts and original launch sites',()=>{
  const all=Object.values(MISSION_SITES).flat();
  for(const id of ['rover-rosalind-franklin','apollo-13','venera-4','venera-5','venera-6','maven','mars-reconnaissance-orbiter'])assert(!all.some(row=>row.id===id),id);
  for(const id of ['surveyor-2','surveyor-4','luna-2','luna-15','messenger'])assert.equal(all.find(row=>row.id===id)?.kind,'impact',id);
  assert(getMissionSitesForBody('earth').every(row=>row.kind==='launch'));
  assert(getMissionSitesForBody('mars').some(row=>row.id==='tianwen-1'));
  const huygens=getMissionSitesForBody('naif-606').find(row=>row.id==='cassinihuygens');
  assert.equal(huygens.lat,-10.25);assert.equal(huygens.lon,167.68);
  assert(!getMissionSitesForBody('saturn').some(row=>row.id==='cassinihuygens'));
});
test('co-located dossiers retain separate labels without displacing their pin coordinates',()=>{
  for(const [body,first,second] of [['mars','tianwen-1','rover-zhurong'],['mars','mars-pathfinder','sojourner'],['moon','luna-17','lunokhod-1']]) {
    const sites=getMissionSitesForBody(body),a=sites.find(row=>row.id===first),b=sites.find(row=>row.id===second);
    assert.equal(a.lat,b.lat);assert.equal(a.lon,b.lon);
    assert.equal(Math.abs(missionSiteLabelOffset(a,sites)-missionSiteLabelOffset(b,sites)),24);
  }
});
test('crowded surface labels remain inside a mobile viewport and independently selectable',()=>{
  const points=Array.from({length:8},(_,i)=>({x:170+i*9,y:430+i*4,width:120,height:20}));
  const original=structuredClone(points),bounds={left:0,top:70,width:390,height:660};
  const labels=placeMissionLabels(points,bounds);
  assert.deepEqual(points,original);
  for(const [i,a] of labels.entries()) {
    assert(a.x>=8&&a.x+a.width<=382&&a.y>=78&&a.y+a.height<=722);
    for(const b of labels.slice(i+1))assert(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),'Mission labels overlap');
  }
});
