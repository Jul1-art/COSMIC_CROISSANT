import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {archiveDate,archiveClock} from '../src/missions/archive-clock.js';
import {archiveEvents} from '../src/missions/archive-data.js';
test('documented launch times retain UTC and omitted timeline years use the preceding year',async()=>{
 const record=JSON.parse(await readFile(new URL('../assets/missions/apollo-14.json',import.meta.url),'utf8'));
 const clock=archiveClock(record,archiveEvents(record));
 assert.equal(clock.at(0),Date.UTC(1971,0,31,21,3));
 assert.equal(clock.at(4),Date.UTC(1971,1,5,14,42));
 assert.equal(clock.anchors[1].precision,'day');
 assert.equal(clock.at(.5),(clock.at(0)+clock.at(1))/2);
});
test('vague dates, multiple dates and invalid calendar dates never become invented exact milestones',()=>{
 for(const date of ['2028–2029','Années 2030','Janvier 1971','24–25 décembre 2004','16 & 30 janvier 2027','26 avril 1998 · 24 juin 1999','31 février 1971'])assert.equal(archiveDate(date,1971),null,date);
 assert.equal(archiveDate('1er juillet 2004').instant,Date.UTC(2004,6,1));
});
test('explicit local launch times convert to UTC, including a calendar-day rollover',()=>{
 assert.equal(archiveDate('14 juillet 2023, 14h35 IST (09h05 UTC)').instant,Date.UTC(2023,6,14,9,5));
 assert.equal(archiveDate('14 juillet 2023, 01h30 IST').instant,Date.UTC(2023,6,13,20));
 assert.equal(archiveDate('25 août 1997, 14:39:00 UTC').precision,'second');
 assert.equal(archiveDate('14 juillet 2023, 14h35 heure locale').precision,'day');
});
