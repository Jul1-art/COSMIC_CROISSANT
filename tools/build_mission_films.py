"""Create short, attributed silent documentaries from archival stills and dossiers.

These are labelled photo documentaries, never original moving-image footage.
Existing NASA films remain the first choice in the player.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import json,re,subprocess,textwrap,hashlib
from PIL import Image,ImageDraw,ImageFont,ImageOps,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/missions'
WORK=ROOT/'output/mission-film-work'
WORK.mkdir(parents=True,exist_ok=True)
FONT=Path('C:/Windows/Fonts/segoeui.ttf')
BOLD=Path('C:/Windows/Fonts/seguisb.ttf')
def font(size,bold=False):return ImageFont.truetype(str(BOLD if bold else FONT),size)
def wrap(draw,text,width,f):
 lines=[];current=''
 for word in text.split():
  candidate=(current+' '+word).strip()
  if draw.textlength(candidate,font=f)>width and current:lines.append(current);current=word
  else:current=candidate
 if current:lines.append(current)
 return lines
def slide(m,media,number,title,text):
 canvas=Image.new('RGB',(960,540),'#080808')
 images=media.get('images',[])
 if images:
  image=images[number%len(images)]
  try:
   with Image.open(ASSETS/image['src']) as original:
    picture=ImageOps.fit(original.convert('RGB'),(460,540),method=Image.Resampling.LANCZOS)
   canvas.paste(picture,(500,0))
  except Exception:pass
  veil=Image.new('RGBA',canvas.size)
  vd=ImageDraw.Draw(veil)
  for x in range(500,960):vd.line((x,0,x,540),fill=(0,0,0,int(90*(960-x)/460)))
  canvas=Image.alpha_composite(canvas.convert('RGBA'),veil).convert('RGB')
 d=ImageDraw.Draw(canvas)
 d.text((40,32),'RELIC  /  ARCHIVES DE MISSION',font=font(11),fill='#acacac')
 d.line((40,65,460,65),fill='#3a3a3a')
 d.text((40,92),f'0{number+1} / {title.upper()}',font=font(11),fill='#aaa')
 y=126
 for line in wrap(d,m['name'],420,font(38,True))[:3]:d.text((38,y),line,font=font(38,True),fill='white');y+=46
 y+=24
 for line in wrap(d,text,405,font(19))[:8]:d.text((40,y),line,font=font(19),fill='#d2d2d2');y+=28
 d.rectangle((0,466,960,540),fill='#080808')
 d.line((40,467,920,467),fill='#343434')
 credit='Photographies : '+(' · '.join(dict.fromkeys(i['credit'] for i in images)) if images else 'voir dossier')
 for j,line in enumerate(wrap(d,credit,875,font(10))[:2]):d.text((40,478+j*13),line,font=font(10),fill='#aaa')
 d.text((40,516),'Montage documentaire muet · Textes : fiche fournie · Références et licences dans le dossier RELIC',font=font(10),fill='#888')
 dest=WORK/m['id']/f'{number:02}.jpg';dest.parent.mkdir(parents=True,exist_ok=True);canvas.save(dest,quality=94)
 return dest
def build(entry):
 m=json.loads((ASSETS/f'{entry["id"]}.json').read_text(encoding='utf8'))
 path=ASSETS/f'{m["id"]}.media.json';media=json.loads(path.read_text(encoding='utf8'))
 if not media.get('images'):return m['id'],'missing images'
 films=ASSETS/'films';films.mkdir(exist_ok=True);dest=films/f'{m["id"]}.mp4'
 facts=m['facts']
 get=lambda pattern:next((r[1] for r in facts if len(r)>1 and re.search(pattern,r[0],re.I)),'')
 events=[];in_timeline=False
 for page in m['pages']:
  for b in page:
   if b['type']=='text' and 'Chronologie' in b['text']:in_timeline=True
   elif b['type']=='text' and in_timeline and re.search(r'Science|Apports scientifiques|Sources',b['text']):in_timeline=False
   elif b['type']=='table' and in_timeline and re.match(r'^Date\b',b['rows'][0][0],re.I):events.extend(b['rows'][1:])
 summary=m['summary'].split(' · ')[0].split(' • ')[0]
 scenes=[('La mission',summary),('Le départ',get(r'^Lancement') or summary),('Un jalon',(' — '.join(events[len(events)//2]) if events else get(r'Statut|Résultat|Objectif')) or summary),('Les traces',get(r'Statut|Résultat') or summary)]
 fingerprint=hashlib.sha256(json.dumps({'scenes':scenes,'images':media['images']},ensure_ascii=False,sort_keys=True).encode('utf8')).hexdigest()
 if not dest.exists() or media.get('documentary',{}).get('fingerprint')!=fingerprint:
  pictures=[slide(m,media,i,title,text) for i,(title,text) in enumerate(scenes)]
  command=['ffmpeg','-hide_banner','-loglevel','error','-y']
  for picture in pictures:command+=['-loop','1','-t','6','-i',str(picture)]
  filters=';'.join(f'[{i}:v]scale=1008:568,crop=960:540:x=\'24+12*sin(t/6)\':y=14,setsar=1,fps=24,fade=t=in:st=0:d=0.4,fade=t=out:st=5.6:d=0.4[v{i}]' for i in range(4))
  filters+=';'+''.join(f'[v{i}]' for i in range(4))+'concat=n=4:v=1:a=0[out]'
  pending=dest.with_name(dest.stem+'.building.mp4')
  command+=['-filter_complex',filters,'-map','[out]','-c:v','libx264','-preset','veryfast','-crf','25','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',str(pending)]
  subprocess.run(command,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
  pending.replace(dest)
 media['documentary']={'src':'films/'+dest.name,'local':True,'title':m['name']+' · Film documentaire en photographies (24 s, muet)','credit':'RELIC / archives photographiques créditées dans ce dossier','duration':24,'source':m['pdf'],'fingerprint':fingerprint}
 path.write_text(json.dumps(media,ensure_ascii=False,indent=2),encoding='utf8')
 return m['id'],'film ready'
if __name__=='__main__':
 catalog=json.loads((ASSETS/'catalog.json').read_text(encoding='utf8'))
 with ThreadPoolExecutor(max_workers=2) as pool:
  for future in as_completed([pool.submit(build,m) for m in catalog]):
   try:print(*future.result(),flush=True)
   except Exception as e:print('ERROR',e,flush=True)
