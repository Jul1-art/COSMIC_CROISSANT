"""Resolve missing archival illustrations through Wikimedia with full licenses."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
import json,re,urllib.request,urllib.parse,time
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'
UA='Mozilla/5.0 (compatible; RELIC educational mission archive)'
def fetch(url,binary=False):
 for i in range(3):
  try:
   request=urllib.request.Request(url,headers={'User-Agent':UA})
   with urllib.request.urlopen(request,timeout=30) as r: data=r.read()
   return data if binary else data.decode('utf8')
  except Exception:
   if i==2:raise RuntimeError(url+' : '+str(__import__('sys').exc_info()[1]))
   time.sleep((i+1)*3)
def clean(s):return re.sub(r'\s+',' ',unescape(re.sub('<[^>]+>',' ',s))).strip()
PAGES={'hera':'Hera_(space_mission)','james-webb':'James_Webb_Space_Telescope','nancy-grace-roman':'Nancy_Grace_Roman_Space_Telescope','rosetta-philae':'Rosetta_(spacecraft)','hope':'Emirates_Mars_Mission','rover-zhurong':'Zhurong_(rover)','rover-rosalind-franklin':'Rosalind_Franklin_(rover)','tianwen-1':'Tianwen-1','juice':'JUICE_(spacecraft)','cassinihuygens':'Cassini–Huygens','akatsuki':'Akatsuki_(spacecraft)','spoutnik-2':'Sputnik_2','spoutnik-1':'Sputnik_1','lro':'Lunar_Reconnaissance_Orbiter'}
def collect(m):
 path=ROOT/f'{m["id"]}.media.json';data=json.loads(path.read_text(encoding='utf8'))
 if data['images']:return m['id'],'existing archive'
 name=PAGES.get(m['id'],m['name'].split(' (')[0].replace(' ','_'))
 page='https://en.wikipedia.org/wiki/'+urllib.parse.quote(name,safe='_()')
 try:
  html=fetch(page)
  start=html.find('class="infobox-image');start=start if start>=0 else html.find('<table class="infobox')
  part=html[start:start+24000] if start>=0 else html
  resource=re.search(r'<img[^>]*resource="https://en\.wikipedia\.org/wiki/File:([^"#]+)"',part)
  file=re.search(r'href="(?:https://commons.wikimedia.org)?/(?:wiki/)?(?:File:|wiki/File:)([^"#]+)"',part)
  if resource:file=resource
  overrides={'chang-e-3':"Chang'e-3_lunar_landing_site.jpg",'chang-e-6':"Chang'e_6_lunar_samples_at_IAC_2024_03_(cropped).jpg",'hope':'المركبة_الفضائية_العربية_الإماراتية_(الأمل).jpg','tianwen-1':'Tianwen-1_launch_04_(cropped).jpg'}
  if m['id'] in overrides:
   filename=overrides[m['id']]
  elif m['id']=='luna-10':
   filename='Luna_10_Space_Probe.jpg'
  elif m['id']=='venera-10':
   filename='Venera10surface.gif'
  elif not file:
   image=re.search(r'<img[^>]+src="(//upload.wikimedia.org/[^" ]+)"',part)
   if not image:raise ValueError('No infobox image')
   bits=urllib.parse.unquote(image[1]).split('/')
   filename=bits[-2] if '/thumb/' in image[1] else bits[-1]
  else:filename=urllib.parse.unquote(unescape(file[1]))
  query=urllib.parse.urlencode({'action':'query','format':'json','titles':'File:'+filename,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':1200})
  api=json.loads(fetch('https://commons.wikimedia.org/w/api.php?'+query))
  item=next(iter(api['query']['pages'].values()))['imageinfo'][0]
  meta=item.get('extmetadata',{})
  url=item.get('thumburl',item['url'])
  license=clean(meta.get('LicenseShortName',{}).get('value',''))
  if not license:raise ValueError('Missing reuse license')
  if not any(s in license.lower() for s in ['cc','public domain','pd','attribution']):raise ValueError('Unsupported license: '+license)
  image=fetch(url,True)
  dest=ROOT/'archives'/f'{m["id"]}-commons{Path(urllib.parse.urlparse(url).path).suffix}'
  dest.write_bytes(image)
  title=clean(meta.get('ObjectName',{}).get('value',filename))
  description=clean(meta.get('ImageDescription',{}).get('value',title))
  entry={'title':title,'description':description,'credit':clean(meta.get('Artist',{}).get('value','Wikimedia Commons')),'license':license,'licenseURL':meta.get('LicenseUrl',{}).get('value',''),'source':item.get('descriptionurl','https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(filename)),'src':'archives/'+dest.name,'date':clean(meta.get('DateTimeOriginal',{}).get('value','')),'context':'Photographie, maquette ou illustration identifiée dans la notice originale.'}
  data['images'].insert(0,entry);path.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf8')
  return m['id'],'Commons '+license
 except Exception as error:return m['id'],'ERROR '+str(error)
if __name__=='__main__':
 catalog=json.loads((ROOT/'catalog.json').read_text(encoding='utf8'))
 with ThreadPoolExecutor(max_workers=1) as pool:
  for f in as_completed([pool.submit(collect,m) for m in catalog]):print(*f.result(),flush=True)
