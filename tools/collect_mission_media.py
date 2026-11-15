"""Collect attributed NASA archives and official 3D assets for the catalogue."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request, urllib.parse, json, re, time, unicodedata

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/missions'
def get(url, binary=False):
    url=urllib.parse.quote(url,safe=':/?=&%+#')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'RELIC-Educational-Archive/1.0'}),timeout=35) as r:
                data=r.read()
            return data if binary else json.loads(data)
        except Exception:
            if attempt==2: raise
            time.sleep(attempt+1)

def collect(m):
    ident=m['id']; name=m['name'].split(' (')[0]
    query=name.replace('Spoutnik','Sputnik').replace('Rover ','')
    query={'rosetta-philae':'Rosetta','james-webb':'James Webb','nancy-grace-roman':'Roman Space Telescope','chandrayaan-3':'Chandrayaan','rover-rosalind-franklin':'ExoMars','juice':'JUICE spacecraft','hera':'Hera spacecraft','hope':'Emirates Mars Mission','cassinihuygens':'Cassini','lro':'Lunar Reconnaissance Orbiter','rover-zhurong':'Zhurong'}.get(ident,query)
    result={'images':[],'videos':[]}
    def normalized(s):
        return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip()
    needle=normalized(query)
    aliases={'lro':['lunar reconnaissance orbiter','lro'],'hope':['emirates mars mission','hope probe','al amal'], 'rosetta-philae':['rosetta'],'nancy-grace-roman':['roman space telescope'],'james-webb':['james webb','jwst'],'juice':['jupiter icy moons','juice mission','juice spacecraft'],'hera':['hera spacecraft','hera mission']}.get(ident,[needle])
    def relevant(data):
        hay=' '+normalized(data.get('title','')+' '+data.get('description','')+' '+' '.join(data.get('keywords',[])))+' '
        return any(' '+a+' ' in hay for a in aliases)
    for kind in ('image','video'):
        try:
            url='https://images-api.nasa.gov/search?'+urllib.parse.urlencode({'q':query,'media_type':kind,'page_size':100})
            items=get(url)['collection']['items']
            for item in items:
                data=item['data'][0]; nasaid=data['nasa_id']
                if not relevant(data): continue
                entry={'title':data['title'],'credit':data.get('photographer') or data.get('secondary_creator') or data.get('center','NASA'),'date':data.get('date_created',''),'source':f'https://images.nasa.gov/details/{urllib.parse.quote(nasaid)}','nasaId':nasaid,'description':data.get('description','')[:1200]}
                if kind=='image':
                    href=next((x['href'] for x in item.get('links',[]) if x.get('rel')=='preview'),None)
                    if not href: continue
                    dest=OUT/'archives'/f'{ident}-{len(result["images"])+1}.jpg'
                    dest.parent.mkdir(exist_ok=True)
                    dest.write_bytes(get(href,True))
                    entry['src']='archives/'+dest.name
                    result['images'].append(entry)
                    if len(result['images'])==3: break
                else:
                    assets=get(item['href'])
                    if isinstance(assets,dict): assets=assets.get('collection',{}).get('items',[])
                    urls=[x if isinstance(x,str) else x.get('href','') for x in assets]
                    urls=[u.replace('http:','https:') for u in urls if u.lower().endswith('.mp4')]
                    if not urls: continue
                    entry['src']=urllib.parse.quote(next((u for u in urls if '~mobile' in u),next((u for u in urls if '~small' in u),urls[0])),safe=':/?=&%')
                    entry['poster']=next((x['href'] for x in item.get('links',[]) if x.get('rel')=='preview'),'')
                    result['videos'].append(entry)
                    break
        except Exception as e: result[kind+'Error']=str(e)
    (OUT/f'{ident}.media.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    return ident,len(result['images']),len(result['videos'])

if __name__=='__main__':
    missions=json.loads((OUT/'catalog.json').read_text(encoding='utf8'))
    with ThreadPoolExecutor(max_workers=5) as pool:
        for f in as_completed([pool.submit(collect,m) for m in missions]):
            print(*f.result(),flush=True)
