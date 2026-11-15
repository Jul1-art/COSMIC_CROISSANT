"""Bundle geometric NASA/JPL Horizons trajectories; never query NASA in-browser."""
import importlib.util
import json
import math
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('horizons',Path(__file__).with_name('update-planetary-ephemeris.py'))
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
OUT=ROOT/'assets/missions/distant';OUT.mkdir(exist_ok=True)
STOP='2028-01-01'
PROBES={
 'voyager-1':('-31','1977-09-05T12:56:00Z','1977-09-05 13:59',['1979-03-05 12:05','1980-11-12 23:46']),
 'voyager-2':('-32','1977-08-20T14:29:00Z','1977-08-20 15:32',['1979-07-09 22:29','1981-08-26 03:24','1986-01-24 17:59','1989-08-25 03:56']),
 'pioneer-10':('-23','1972-03-03T01:49:00Z','1972-03-03 02:05',['1973-12-04 02:26']),
 'pioneer-11':('-24','1973-04-06T02:11:00Z','1973-04-06 02:26',['1974-12-03 05:22','1979-09-01 16:31']),
 'new-horizons':('-98','2006-01-19T19:00:00Z','2006-01-19 19:51',['2007-02-28 05:43','2015-07-14 11:49','2019-01-01 05:33']),
}
def date(text):return datetime.fromisoformat(text.replace('Z','+00:00')).replace(tzinfo=timezone.utc)
def stamp(dt):return dt.strftime('%Y-%m-%d %H:%M:%S')
def jd(dt):return dt.timestamp()/86400+2440587.5
def fetch(target,start,stop,step):
 print(target,start,stop,step,flush=True)
 return h.request_states(target,start=start,stop=stop,step=step)
def hermite(a,b,t):
 span=b[0]-a[0];u=(t-a[0])/span
 return [(2*u**3-3*u*u+1)*a[i]+(u**3-2*u*u+u)*span*a[i+3]+(-2*u**3+3*u*u)*b[i]+(u**3-u*u)*span*b[i+3] for i in range(1,4)]
def merge(results):return sorted({row[0]:row for result in results for row in result['states']}.values())
def validate(target,rows):
 for attempt in range(8):
  indexes=sorted(set(int((len(rows)-2)*i/19) for i in range(20)))
  reference=h.request_states(target,times=[(rows[i][0]+rows[i+1][0])/2 for i in indexes])['states']
  errors=[math.dist(hermite(rows[i],rows[i+1],r[0]),r[1:4]) for i,r in zip(indexes,reference)]
  if max(errors)<=100:return {'states':reference,'maximumPositionErrorKm':max(errors)}
  extra=[]
  for i,error in zip(indexes,errors):
   if error>100:extra.extend(rows[i][0]+(rows[i+1][0]-rows[i][0])*fraction for fraction in [.25,.5,.75])
  rows[:]=merge([{'states':rows},h.request_states(target,times=extra)])
 raise ValueError(f'{target}: interpolation error {max(errors)} km')

manifest={'source':'NASA/JPL Horizons','sourceUrl':'https://ssd.jpl.nasa.gov/horizons/','retrievedAt':datetime.now(timezone.utc).isoformat(),'frame':'heliocentric J2000 ecliptic / ICRF','center':'500@10','timeScale':'UTC','correction':'geometric / NONE','units':{'position':'km','velocity':'km/day','epoch':'JD UTC'},'interpolation':'cubic Hermite; no extrapolation','probes':{}}
for id,(target,launch,start,encounters) in PROBES.items():
 path=OUT/(id+'.json')
 if path.exists():manifest['probes'][id]=id+'.json';continue
 dt=date(start)
 results=[fetch(target,start,STOP,'14 d'),fetch(target,start,stamp(dt+timedelta(days=30)),'1 h'),fetch(target,start,stamp(dt+timedelta(days=2)),'5 m')]
 for encounter in encounters:
  at=date(encounter)
  results.append(fetch(target,stamp(at-timedelta(days=7)),stamp(at+timedelta(days=7)),'1 h'))
  results.append(fetch(target,stamp(at-timedelta(hours=6)),stamp(at+timedelta(hours=6)),'1 m'))
 # Explicit right endpoint, milestone and launch Earth position.
 results.append(h.request_states(target,times=[jd(date(STOP)),jd(date('2026-11-18T10:16:07Z'))]))
 rows=merge(results)
 earth=h.request_states('399',times=[jd(date(launch))])['states'][0]
 payload={**{k:v for k,v in manifest.items() if k!='probes'},'id':id,'target':target,'launch':launch,'launchEarthState':earth,'departureNote':'Launch-to-first-SPK gap is a schematic connection to Earth, not reconstructed launch telemetry.','solution':results[0]['solution'],'requests':[r['requestUrl'] for r in results],'states':rows,'validation':validate(target,rows)}
 path.write_text(json.dumps(payload,separators=(',',':'))+'\n',encoding='utf8');manifest['probes'][id]=id+'.json'
 print(id,len(rows),'samples; max independent error',payload['validation']['maximumPositionErrorKm'],flush=True)

bodyfile=OUT/'planets.json'
if not bodyfile.exists():
 bodies={}
 for id,target,step in [('earth','399','1 d'),('jupiter','599','1 d'),('saturn','699','1 d'),('uranus','799','14 d'),('neptune','899','14 d')]:
  results=[fetch(target,'1972-03-03',STOP,step),h.request_states(target,times=[jd(date(STOP))])]
  if id=='earth':
   for _,launch,_,_ in PROBES.values():results.append(h.request_states(target,times=[jd(date(launch))]))
   results.append(fetch(target,'2026-01-01',STOP,'1 d'))
  rows=merge(results);bodies[id]={'states':rows,'solution':results[0]['solution'],'validation':validate(target,rows)}
 bodyfile.write_text(json.dumps({'bodies':bodies},separators=(',',':'))+'\n',encoding='utf8')
manifest['planets']='planets.json'
(OUT/'catalog.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
