"""Validate the complete supplied mission corpus and locally shipped media."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, subprocess, struct
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]/'assets/missions'

def verify(record):
    ident=record['id']
    data=json.loads((ROOT/f'{ident}.json').read_text(encoding='utf8'))
    media=json.loads((ROOT/f'{ident}.media.json').read_text(encoding='utf8'))
    assert data['id']==ident and data['name']==record['name'],ident
    assert (ROOT/data['pdf']).read_bytes().startswith(b'%PDF-'),ident+' PDF'
    for image in media['images']:
        assert image.get('credit') and image.get('source'),ident+' missing image provenance'
        with Image.open(ROOT/image['src']) as picture:
            picture.verify()
    film=ROOT/media['documentary']['src']
    result=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)],capture_output=True,text=True,check=True)
    probe=json.loads(result.stdout)
    video=next(stream for stream in probe['streams'] if stream['codec_type']=='video')
    assert video['codec_name']=='h264' and video['pix_fmt'] in ['yuv420p','yuvj420p'],ident+' browser video compatibility'
    assert abs(float(probe['format']['duration'])-media['documentary']['duration'])<.1,ident+' film duration'
    return ident

def main():
    catalog=json.loads((ROOT/'catalog.json').read_text(encoding='utf8'))
    with ThreadPoolExecutor(max_workers=4) as pool:
        verified=list(pool.map(verify,catalog))
    models=json.loads((ROOT/'models.json').read_text(encoding='utf8'))
    for key,model in models.items():
        path=ROOT/model['path']
        with path.open('rb') as handle:
            magic,version,length=struct.unpack('<4sII',handle.read(12))
        assert magic==b'glTF' and version==2 and length==path.stat().st_size,key+' GLB integrity'
        assert model.get('source'),key+' missing model source'
    print(f'{len(verified)} dossiers: PDFs, attributed images and H.264 films verified; {len(models)} sourced GLB models verified.')

if __name__=='__main__':
    main()
