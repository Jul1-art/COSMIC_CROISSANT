"""Archive numerical orbit packets published by NASA Eyes, with byte-level provenance."""
from pathlib import Path
from urllib.request import urlopen
import json,re,hashlib,sys
from nasa_dynamo import decode
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'
APP='https://eyes.nasa.gov/apps/solar-system/app.js'
DATA='https://eyes.nasa.gov/assets/dynamic/dynamo/'
MISSIONS={'stereo':[('sc_stereo_ahead','STEREO-A','stereo-a'),('sc_stereo_behind','STEREO-B','stereo-b')]}

def object_text(source,start):
 depth=0;quote=None;escaped=False
 for index in range(start,len(source)):
  character=source[index]
  if quote:
   if escaped:escaped=False
   elif character=='\\':escaped=True
   elif character==quote:quote=None
  elif character in ['"',"'",'`']:quote=character
  elif character=='{':depth+=1
  elif character=='}':
   depth-=1
   if depth==0:return source[start:index+1]
 raise ValueError('Unterminated public orbit metadata')

def entity(source,ident,label,model):
 match=re.search(re.escape(ident)+r':\{groups:',source)
 if not match:raise ValueError('NASA entity not found: '+ident)
 record=object_text(source,source.index('{',match.start()))
 raw_parents=re.search(r'parents:(\[\[.*?\]\])',record).group(1)
 parents=json.loads(raw_parents.replace('Number.NEGATIVE_INFINITY','-1e100').replace('Number.POSITIVE_INFINITY','1e100'))
 datasets=[];files=[]
 def fetch(address):
  with urlopen(address,timeout=35) as response:payload=response.read()
  files.append({'url':address,'bytes':len(payload),'sha256':hashlib.sha256(payload).hexdigest()})
  if len(files)>512 or sum(file['bytes'] for file in files)>80*1024*1024:raise ValueError('Orbit archive exceeds review limits')
  return payload
 for path in dict.fromkeys(re.findall(r'type:"dynamo",url:"([^"]+)"',record)):
  base=DATA+path+'/'
  try:definition=decode(fetch(base+'def.dyn'))
  except ValueError:continue # Orientation formats are separate from position ephemerides.
  if definition.kind not in ['orb','pos','lin']:continue
  def rows(tree):
   if 'points' in tree:return tree['points']
   result=[]
   for child in tree['children']:
    packet=decode(fetch(base+child['name']+'.dyn'),definition,child['name']);result.extend(rows(packet.tree))
   return result
  points=rows(definition.tree)
  if len(points)<2:continue
  unique={row[0]:row for row in points}
  datasets.append({'url':base,'kind':definition.kind,'header':definition.header,'points':[unique[time] for time in sorted(unique)]})
 if not datasets:raise ValueError('No published positional coverage for '+ident)
 return {'id':ident,'name':label,'model':model,'source':'https://eyes.nasa.gov/apps/solar-system/#/'+ident,'parents':parents,'datasets':datasets,'files':files}

def main():
 source=urlopen(APP,timeout=35).read().decode();folder=ROOT/'ephemerides';folder.mkdir(exist_ok=True)
 catalog_path=folder/'catalog.json';catalog=json.loads(catalog_path.read_text(encoding='utf8')) if catalog_path.exists() else {}
 for mission,specs in MISSIONS.items():
  if len(sys.argv)>1 and mission not in sys.argv[1:]:continue
  entities=[entity(source,*spec) for spec in specs]
  payload={'version':1,'mission':mission,'frame':'NASA Eyes J2000 equatorial, parent-relative','positionUnits':'km','velocityUnits':'km/s','timeScale':'NASA Eyes ET convention','metadataSource':APP,'metadataSha256':hashlib.sha256(source.encode()).hexdigest(),'entities':entities}
  destination=folder/(mission+'.json');destination.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf8');catalog[mission]='ephemerides/'+destination.name
  print(mission,len(entities),'entities',sum(len(dataset['points']) for item in entities for dataset in item['datasets']),'source samples',flush=True)
 catalog_path.write_text(json.dumps(catalog,indent=2),encoding='utf8')

if __name__=='__main__':main()
