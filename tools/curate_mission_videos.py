"""Choose dedicated NASA mission films; ambiguous mentions retain the local documentary."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, re, urllib.parse, unicodedata, sys
from collect_mission_media import get
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'
def normal(text):
    return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',text).encode('ascii','ignore').decode().lower()).strip()

def curate(mission):
    ident=mission['id'];path=ROOT/f'{ident}.media.json';media=json.loads(path.read_text(encoding='utf8'))
    name={'ace':'Advanced Composition Explorer','james-webb':'James Webb','nancy-grace-roman':'Roman Space Telescope','lro':'LRO','rover-rosalind-franklin':'Rosalind Franklin','cassinihuygens':'Cassini'}.get(ident,mission['name'].split(' (')[0].replace('Spoutnik','Sputnik').replace('Rover ',''))
    aliases={'lro':['lro','lunar reconnaissance orbiter'],'james-webb':['james webb','jwst'],'nancy-grace-roman':['roman space telescope'],'rover-rosalind-franklin':['rosalind franklin']}.get(ident,[normal(name)])
    candidates={}
    for query in [name,name+' mission',name+' launch']:
        items=get('https://images-api.nasa.gov/search?'+urllib.parse.urlencode({'q':query,'media_type':'video','page_size':100}))['collection']['items']
        for item in items:
            data=item['data'][0];title=' '+normal(data['title'])+' '
            if not any(' '+alias+' ' in title for alias in aliases):continue
            if ident in ['spirit','opportunity'] and not re.search(r'rover|mars|martian',title):continue
            description=normal(data.get('description',''))
            if ident=='galileo' and not re.search(r'jupiter|spacecraft|jovian',description):continue
            if re.search(r'colloids|recientemente|artemis ii receive',title):continue
            score=20
            for pattern,value in [(r'launch|liftoff|landing|splashdown|mission|journey|trailer|grand finale',15),(r'anniversary|conference|remembering|interview|celebration|instrument|testing|construction',-25),(r'react|news|weather|birthday',-10)]:
                if re.search(pattern,title):score+=value
            if score>=10:candidates[data['nasa_id']]=(score,item)
    selected=[]
    for score,item in sorted(candidates.values(),key=lambda row:row[0],reverse=True):
        data=item['data'][0];assets=get(item['href'])
        if isinstance(assets,dict):assets=assets.get('collection',{}).get('items',[])
        urls=[value if isinstance(value,str) else value.get('href','') for value in assets]
        urls=[url.replace('http:','https:') for url in urls if url.lower().endswith('.mp4')]
        if not urls:continue
        url=next((url for suffix in ['~medium.mp4','~small.mp4','~mobile.mp4'] for url in urls if url.endswith(suffix)),urls[0])
        selected=[{'title':data['title'],'credit':data.get('secondary_creator') or data.get('center') or 'NASA','source':'https://images.nasa.gov/details/'+urllib.parse.quote(data['nasa_id']),'nasaId':data['nasa_id'],'src':urllib.parse.quote(url,safe=':/?=&%'),'description':data.get('description','')[:1200],'date':data.get('date_created','')}]
        break
    media['videos']=selected
    path.write_text(json.dumps(media,ensure_ascii=False,indent=2),encoding='utf8')
    return ident,selected[0]['title'] if selected else 'local attributed documentary'

if __name__=='__main__':
    catalog=json.loads((ROOT/'catalog.json').read_text(encoding='utf8'))
    missions=[mission for mission in catalog if mission['id'] in sys.argv[1:]] if len(sys.argv)>1 else [mission for mission in catalog if json.loads((ROOT/f"{mission['id']}.media.json").read_text(encoding='utf8')).get('videos')]
    with ThreadPoolExecutor(max_workers=3) as pool:
        for task in as_completed([pool.submit(curate,mission) for mission in missions]):
            print(*task.result(),flush=True)
