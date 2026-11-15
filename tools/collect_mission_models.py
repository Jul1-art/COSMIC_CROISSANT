"""Download official NASA GLB resources with source and attribution metadata."""
import json, re, urllib.request, urllib.parse, sys, html as html_module
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'
SPECS={
 'voyager':['voyager-3d-model'], 'cassini':['cassini-3d-model'],
 'galileo':['galileo-3d-model'],'new-horizons':['new-horizons-3d-model'],
 'curiosity':['curiosity-3d-model'],'perseverance':['mars-perseverance-rover-3d-model'],
 'maven':['mars-atmosphere-and-volatile-evolution-maven-b-3d-model','maven-3d-model'],'mars-odyssey':['mars-odyssey-orbiter-3d-model','mars-odyssey-3d-model'],
 'mro':['mars-reconnaissance-orbiter-3d-model'],'messenger':['mercury-surface-space-environment-geochemistry-and-ranging-messenger-3d-model','messenger-3d-model'],
 'lro':['lunar-reconnaissance-orbiter-a-3d-model','lunar-reconnaissance-orbiter-3d-model'],'parker':['parker-solar-probe-3d-model'],
 'webb':['james-webb-space-telescope-b-3d-model','james-webb-space-telescope-3d-model'],'roman':['nancy-grace-roman-space-telescope-b-3d-model','nancy-grace-roman-space-telescope-3d-model'],
 'pioneer':['pioneer-3d-model','pioneer-10-3d-model'],'europa-clipper':['europa-clipper-3d-model'],
 'near':['near-shoemaker-3d-model'],'rosetta':['rosetta-3d-model'],
 'mer':['mars-exploration-rovers-3d-model','spirit-and-opportunity-3d-model'],
 'sojourner':['sojourner-3d-model'],'viking':['viking-lander-3d-model'],
 'mariner':['mariner-2-3d-model'],'stereo':['stereo-3d-model'],'soho':['solar-and-heliospheric-observatory-soho-3d-model','soho-3d-model'],
 'ace':['advanced-composition-explorer-3d-model','ace-3d-model'],'bepicolombo':['bepicolombo-3d-model'],
 'tgo':['trace-gas-orbiter-3d-model'],
 'pluto':['pluto-3d-model'],'eros':['eros-3d-model'],'didymos':['didymos-3d-model'],'dimorphos':['dimorphos-3d-model'],
}

def model_credit(page):
 for pattern in [r'<h4[^>]*>\s*Source\s*</h4>\s*<p>(.*?)</p>',r'<th[^>]*>\s*(?:<span[^>]*>)?\s*Credit\s*(?:</span>)?\s*</th>\s*<td[^>]*>(.*?)</td>']:
  match=re.search(pattern,page,re.S|re.I)
  if match:return re.sub(r'\s+',' ',html_module.unescape(re.sub('<[^>]+>','',match[1]))).strip()
 keywords=re.search(r'"keywords":\s*(\[[^\]]+\])',page)
 if keywords:
  credits=[value for value in json.loads(keywords[1]) if value.startswith('NASA/')]
  if credits:return ' · '.join(credits)
 return None
def collect(spec):
 key,slugs=spec
 # NASA's Rosetta catalog page currently links the unrelated IBEX binary.
 # The agency's own repository contains the correctly named Rosetta asset.
 if key=='rosetta':
  source='https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Rosetta'
  download='https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/Rosetta/Rosetta.glb'
  payload=urllib.request.urlopen(download,timeout=45).read()
  if payload[:4]!=b'glTF':raise ValueError('NASA Rosetta asset is not GLB')
  folder=ROOT/'models';folder.mkdir(exist_ok=True);dest=folder/'rosetta.glb';dest.write_bytes(payload)
  return key,{'path':'models/rosetta.glb','source':source,'download':download,'credit':'NASA/JPL/Eyes on the Solar System'}
 sources=[f'https://science.nasa.gov/resource/{slug}/' for slug in slugs]
 for slug in slugs:
  simple=slug.replace('-3d-model','')
  sources.extend([f'https://science.nasa.gov/3d-resources/{simple}/'])
 for source in sources:
  try:
   html=urllib.request.urlopen(source,timeout=25).read().decode()
   urls=re.findall(r'href="(https://assets\.science\.nasa\.gov/[^"<>]+\.glb(?:\?[^"<>]*)?)"',html,re.I)
   # Known upstream catalog mistakes must never substitute another spacecraft.
   if key=='voyager':urls=[url for url in urls if 'voyager' in urllib.parse.unquote(url).lower()]
   if not urls: continue
   folder=ROOT/'models';folder.mkdir(exist_ok=True)
   dest=folder/f'{key}.glb'
   download=urllib.parse.quote(urls[0],safe=':/?=&%()+')
   if not dest.exists():dest.write_bytes(urllib.request.urlopen(download,timeout=90).read())
   if dest.read_bytes()[:4]!=b'glTF':raise ValueError('Not GLB')
   attribution=model_credit(html) or 'NASA / Visualization Technology Applications and Development (VTAD)'
   return key,{'path':'models/'+dest.name,'source':source,'download':download,'credit':attribution}
  except Exception: pass
 return key,None
if __name__=='__main__':
 with ThreadPoolExecutor(max_workers=5) as pool:
  result=json.loads((ROOT/'models.json').read_text(encoding='utf8')) if (ROOT/'models.json').exists() else {}
  selected=[item for item in SPECS.items() if len(sys.argv)==1 or item[0] in sys.argv[1:]]
  for future in as_completed([pool.submit(collect,s) for s in selected]):
   key,model=future.result()
   print(key, 'OK' if model else 'unavailable',flush=True)
   if model:result[key]=model
 (ROOT/'models.json').write_text(json.dumps(result,indent=2),encoding='utf8')
