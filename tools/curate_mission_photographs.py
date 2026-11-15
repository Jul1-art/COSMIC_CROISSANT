"""Select distinct, mission-specific NASA photographs without replacing other media."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import json,re,sys,urllib.parse,unicodedata
from collect_mission_media import get
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'
def normal(text):return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode().lower()).strip()
def improve(m):
 ident=m['id'];path=ROOT/f'{ident}.media.json';media=json.loads(path.read_text(encoding='utf8'))
 if any('-reviewed-' in image['src'] for image in media['images']):return ident,[image['title'] for image in media['images']]
 query={'james-webb':'James Webb','nancy-grace-roman':'Roman Space Telescope','cassinihuygens':'Cassini','rosetta-philae':'Rosetta','lro':'Lunar Reconnaissance Orbiter','ace':'Advanced Composition Explorer','stereo':'Solar Terrestrial Relations Observatory','hera':'Hera spacecraft','hope':'Emirates Mars Mission','lunokhod-2':'Luna 21','chandrayaan-3':'Chandrayaan-3'}.get(ident,m['name'].split(' (')[0].replace('Spoutnik','Sputnik').replace('Rover ',''))
 search='https://images-api.nasa.gov/search?'+urllib.parse.urlencode({'q':query,'media_type':'image','page_size':100})
 items=get(search)['collection']['items']
 candidates=[]
 for item in items:
  d=item['data'][0];title=normal(d['title']);hay=' '+normal(d['title']+' '+d.get('description',''))+' '
  needle=normal(query)
  if ' '+needle+' ' not in hay:continue
  if re.search(r'\b(?:mock up|emblem|insignia|anniversary celebration|press conference)\b',title):continue
  if ident=='hera' and not re.search(r'didymos|dimorphos|planetary defen',hay):continue
  if ident=='hope' and 'emirates' not in hay:continue
  if ident=='chandrayaan-3' and 'chandrayaan 3' not in hay:continue
  if ident=='lunokhod-2' and ('crater on mars' in hay or 'luna 21' not in hay):continue
  if ident.startswith('surveyor-') and 'mars global surveyor' in title:continue
  if ident=='perseverance' and not ('perseverance rover' in hay or 'mars 2020' in hay):continue
  if ident=='curiosity' and 'rover' not in hay:continue
  score=8 if needle in title else 0
  for pattern,value in [(r'selfie|self portrait',35),(r'crew portrait',25),(r'launch|liftoff|moonwalk|astronaut.*moon',15),(r'spacecraft|rover',5),(r'emblem|insignia|logo|patch',-40),(r'mock up|wheel|component|test fixture',-20),(r'illustration|artist|concept|diagram|map',-12)]:
   if re.search(pattern,title):score+=value
  candidates.append((score,item))
 selected=[];titles=set()
 for score,item in sorted(candidates,key=lambda row:row[0],reverse=True):
  d=item['data'][0];title=normal(d['title'])
  if title in titles or score<0:continue
  href=next((link['href'] for link in item.get('links',[]) if link.get('rel')=='preview'),None)
  if not href:continue
  nasaid=d['nasa_id'];filename=f'{ident}-nasa-{re.sub(r"[^a-zA-Z0-9_-]+","-",nasaid)}.jpg';dest=ROOT/'archives'/filename
  if not dest.exists():dest.write_bytes(get(href,True))
  selected.append({'title':d['title'],'credit':d.get('photographer') or d.get('secondary_creator') or 'NASA / '+d.get('center',''),'date':d.get('date_created',''),'source':'https://images.nasa.gov/details/'+urllib.parse.quote(nasaid),'nasaId':nasaid,'description':d.get('description','')[:1200],'src':'archives/'+filename})
  titles.add(title)
  if len(selected)==3:break
 if selected:
  old=media['images'];media['images']=(selected+[image for image in old if not image.get('nasaId')])[:3]
  path.write_text(json.dumps(media,ensure_ascii=False,indent=2),encoding='utf8')
 return ident,[image['title'] for image in media['images']]
if __name__=='__main__':
 missions=json.loads((ROOT/'catalog.json').read_text(encoding='utf8'))
 if len(sys.argv)>1:missions=[m for m in missions if m['id'] in sys.argv[1:]]
 with ThreadPoolExecutor(max_workers=3) as pool:
  for future in as_completed([pool.submit(improve,m) for m in missions]):
   try:print(*future.result(),flush=True)
   except Exception as error:print('ERROR',error,flush=True)
