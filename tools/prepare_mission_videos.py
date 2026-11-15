"""Select verified full-length H.264 NASA editions up to Full HD, with real timing/bitrate."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, subprocess, urllib.parse, urllib.request, sys
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'

def probe(url):
    result=subprocess.run(['ffprobe','-v','error','-rw_timeout','15000000','-show_entries','format=duration,size,bit_rate:stream=width,height,codec_name,codec_type','-of','json',url],capture_output=True,text=True,check=True,timeout=25)
    data=json.loads(result.stdout);video=next(stream for stream in data['streams'] if stream['codec_type']=='video')
    return {'duration':float(data['format']['duration']),'bitrate':int(data['format']['bit_rate']),'bytes':int(data['format']['size']),'width':video['width'],'height':video['height'],'codec':video['codec_name']}

def prepare(mission):
    path=ROOT/f"{mission['id']}.media.json";media=json.loads(path.read_text(encoding='utf8'))
    for video in media.get('videos',[]):
        url='https://images-api.nasa.gov/asset/'+urllib.parse.quote(video['nasaId'])
        with urllib.request.urlopen(url,timeout=30) as response:assets=json.loads(response.read())['collection']['items']
        urls=[urllib.parse.quote(item['href'].replace('http:','https:'),safe=':/?=&%') for item in assets if item['href'].lower().endswith('.mp4')]
        original=None;chosen=None
        for suffix in ['~orig.mp4','~preview.mp4','~medium.mp4','~small.mp4','~mobile.mp4']:
            candidate=next((item for item in urls if item.endswith(suffix)),None)
            if not candidate:continue
            try:metadata=probe(candidate)
            except (subprocess.SubprocessError,ValueError,KeyError):continue
            if suffix=='~orig.mp4':original=metadata
            if metadata['codec']!='h264' or metadata['width']*metadata['height']>1920*1080:continue
            if original and abs(metadata['duration']-original['duration'])>max(1,original['duration']*.01):continue
            chosen={**metadata,'src':candidate};break
        if chosen:video.update(chosen)
        else:raise ValueError(mission['id']+' has no verified compatible full-length edition')
    path.write_text(json.dumps(media,ensure_ascii=False,indent=2),encoding='utf8')
    return mission['id'],[(video['width'],video['height'],round(video['duration'],1)) for video in media.get('videos',[])]

if __name__=='__main__':
    catalog=json.loads((ROOT/'catalog.json').read_text(encoding='utf8'))
    missions=[mission for mission in catalog if (len(sys.argv)==1 or mission['id'] in sys.argv[1:]) and json.loads((ROOT/f"{mission['id']}.media.json").read_text(encoding='utf8')).get('videos')]
    with ThreadPoolExecutor(max_workers=3) as pool:
        for result in as_completed([pool.submit(prepare,mission) for mission in missions]):print(*result.result(),flush=True)
