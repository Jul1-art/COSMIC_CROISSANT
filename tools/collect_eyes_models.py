"""Package published NASA Eyes glTF assets as GLB without changing their geometry or textures."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin,urlparse
import urllib.request,json,struct,hashlib,mimetypes,base64,sys
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'
SPECS={
 'soho':('sc_soho','sc_soho/soho.gltf'),
 'mars-express':('sc_mars_express','sc_mars_express/mars_express.gltf'),
 'juice':('sc_juice','sc_juice/juice.gltf'),
 'mariner':('sc_mariner_2','sc_mariner_2/mariner2.gltf'),
 'stereo-a':('sc_stereo_ahead','sc_stereo_ahead/stereo_a.gltf'),
 'stereo-b':('sc_stereo_behind','sc_stereo_behind/stereo_b.gltf'),
 'huygens':('sc_huygens','sc_huygens/Huygens.gltf'),
 'philae':('sc_philae','sc_philae/philae.gltf'),
 'galileo-probe':('sc_galileo_probe','sc_galileo_probe/galileo_probe.gltf'),
}

def package(url):
 resources=[]
 def fetch(uri):
  if uri.startswith('data:'):return base64.b64decode(uri.split(',',1)[1])
  address=urljoin(url,uri);parsed=urlparse(address)
  if parsed.scheme!='https' or parsed.hostname!='eyes.nasa.gov' or not parsed.path.startswith('/assets/static/models/'):raise ValueError('Unexpected model dependency: '+address)
  with urllib.request.urlopen(address,timeout=35) as response:data=response.read()
  resources.append({'url':address,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()});return data
 document=json.loads(fetch(url));assert document['asset']['version']=='2.0'
 binary=bytearray();offsets=[]
 def append(data):
  binary.extend(b'\0'*(-len(binary)%4));offset=len(binary);binary.extend(data);return offset
 for buffer in document.get('buffers',[]):
  payload=fetch(buffer['uri']);assert len(payload)>=buffer['byteLength'];offsets.append(append(payload))
 for view in document.get('bufferViews',[]):view['byteOffset']=view.get('byteOffset',0)+offsets[view.get('buffer',0)];view['buffer']=0
 for image in document.get('images',[]):
  if 'uri' not in image:continue
  uri=image.pop('uri');payload=fetch(uri);offset=append(payload)
  views=document.setdefault('bufferViews',[]);image['bufferView']=len(views);image.setdefault('mimeType',mimetypes.guess_type(uri)[0] or 'image/png');views.append({'buffer':0,'byteOffset':offset,'byteLength':len(payload)})
 document['buffers']=[{'byteLength':len(binary)}]
 encoded=json.dumps(document,ensure_ascii=False,separators=(',',':')).encode('utf8');encoded+=b' '*(-len(encoded)%4);binary.extend(b'\0'*(-len(binary)%4))
 glb=struct.pack('<4sII',b'glTF',2,12+8+len(encoded)+8+len(binary))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+struct.pack('<I4s',len(binary),b'BIN\0')+binary
 return glb,resources,document['asset'].get('copyright')

def collect(key):
 entity,path=SPECS[key];url='https://eyes.nasa.gov/assets/static/models/'+path
 glb,resources,copyright=package(url)
 destination=ROOT/'models'/f'{key}.glb';destination.parent.mkdir(exist_ok=True);pending=destination.with_suffix('.building');pending.write_bytes(glb);pending.replace(destination)
 return key,{'path':'models/'+destination.name,'source':'https://eyes.nasa.gov/apps/solar-system/#/'+entity,'download':url,'credit':copyright or 'NASA/JPL · Eyes on the Solar System','packaging':'Original glTF meshes and texture bytes embedded into one GLB; no geometry or texture edits.','resources':resources}

if __name__=='__main__':
 path=ROOT/'models.json';manifest=json.loads(path.read_text(encoding='utf8'))
 with ThreadPoolExecutor(max_workers=3) as pool:
  for future in as_completed([pool.submit(collect,key) for key in SPECS if len(sys.argv)==1 or key in sys.argv[1:]]):
   key,record=future.result();manifest[key]=record;print(key,'OK',flush=True)
 path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
