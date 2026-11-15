"""Apply reviewed, primary-source archive records, including explicit context labels."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import json,urllib.request,sys
ROOT=Path(__file__).resolve().parents[1]
class Metadata(HTMLParser):
 def __init__(self):super().__init__();self.image=None
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='meta' and (attrs.get('property') or attrs.get('name'))=='og:image':self.image=attrs.get('content')
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=35) as response:return response.read()
for ident,records in json.loads((ROOT/'tools/mission_archive_overrides.json').read_text(encoding='utf8')).items():
 if len(sys.argv)>1 and ident not in sys.argv[1:]:continue
 images=[]
 for i,record in enumerate(records):
  url=record.get('image')
  if not url:
   metadata=Metadata();metadata.feed(fetch(record['source']).decode('utf8'));url=metadata.image
  if not url:raise ValueError(ident+' has no primary-source image')
  host=urlparse(url).hostname or ''
  if not any(host==domain or host.endswith('.'+domain) for domain in ['nasa.gov','esa.int']):raise ValueError('Unexpected archive host')
  extension=Path(urlparse(url).path).suffix or '.jpg';relative=f'archives/{ident}-reviewed-{i+1}{extension}'
  (ROOT/'assets/missions'/relative).write_bytes(fetch(url))
  images.append({**record,'src':relative})
 path=ROOT/'assets/missions'/f'{ident}.media.json';media=json.loads(path.read_text(encoding='utf8'));media['images']=images;path.write_text(json.dumps(media,ensure_ascii=False,indent=2),encoding='utf8');print(ident,images[0]['title'],flush=True)
