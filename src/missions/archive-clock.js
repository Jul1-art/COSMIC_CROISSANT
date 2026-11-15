const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const ABBREVIATIONS={janv:0,fév:1,févr:1,fev:1,fevr:1,avr:3,juil:6,juill:6,aout:7,sept:8,oct:9,nov:10,déc:11,dec:11};
const ZONES={utc:0,gmt:0,tu:0,ist:330,jst:540,msk:180,cet:60,cest:120,est:-300,edt:-240,pst:-480,pdt:-420};
/** Calendar anchors from the dossier, not recovered spacecraft state vectors.
 * Multi-date and month/year-only entries deliberately have no exact anchor. */
export function archiveDate(text,yearHint){
 const source=String(text).toLowerCase().replace(/\u00a0/g,' ');
 if(/[&·]/.test(source))return null;
 const match=source.match(/^(\d{1,2})(?:er)?\s+([a-zéûô]+)\.?(?:\s+(\d{4}))?(?:\s*,?\s*[~≈]?(\d{1,2})[h:](\d{2})(?:[:hm](\d{2})s?)?)?/);
 if(!match)return null;
 const day=Number(match[1]),month=ABBREVIATIONS[match[2]]??MONTHS.indexOf(match[2]),year=Number(match[3]||source.match(/\b\d{4}\b/)?.[0]||yearHint),hour=Number(match[4]||0),minute=Number(match[5]||0),second=Number(match[6]||0);
 if(month<0||!Number.isInteger(year)||year<1950||year>2100||hour>23||minute>59||second>59)return null;
 const local=Date.UTC(year,month,day,hour,minute,second),date=new Date(local);
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month||date.getUTCDate()!==day)return null;
 const zone=source.slice(match[0].length).match(/^\s*(utc|gmt|tu|ist|jst|msk|cet|cest|est|edt|pst|pdt)\b/)?.[1];
 const unqualifiedLocal=match[4]&&!zone&&/^\s*(?:\(?heure locale)/.test(source.slice(match[0].length));
 const instant=unqualifiedLocal?Date.UTC(year,month,day):local-(ZONES[zone]||0)*60000;
 return {instant,year,precision:unqualifiedLocal||!match[4]?'day':match[6]?'second':'minute',source:text};
}
export function archiveClock(record,events){
 const launch=record.facts.find(([label])=>/^lancement/i.test(label))?.[1],departure=archiveDate(launch,record.year);
 let year=record.year;
 const anchors=events.map(event=>{const anchor=archiveDate(event.date,year);if(anchor)year=anchor.year;return anchor;});
 const fallback=departure?.instant??anchors.find(Boolean)?.instant??Date.UTC(record.year||2000,0,1);
 return {anchors,at(progress){
  const index=Math.max(0,Math.min(anchors.length-1,Math.floor(progress))),fraction=progress-index,a=anchors[index],b=anchors[index+1];
  if(a&&b&&b.instant>=a.instant)return a.instant+(b.instant-a.instant)*fraction;
  if(a)return a.instant;
  for(let previous=index-1;previous>=0;previous--)if(anchors[previous])return anchors[previous].instant;
  return fallback;
 }};
}
