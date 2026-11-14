"""Build the short Sputnik visual dossier from credited photos and a PD newsreel.
Requires ffmpeg/ffprobe; originals stay in the temporary build directory.
"""
from pathlib import Path
import hashlib,json,subprocess,tempfile,urllib.request
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/missions/sputnik-1'
ARCHIVE='https://archive.org/download/1957-10-07_New_Moon/1957-10-07_New_Moon.mp4'
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL)
def duration(path):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)]))
def build():
 with tempfile.TemporaryDirectory(prefix='sputnik-film-') as temp:
  work=Path(temp);archive=work/'archive.mp4';urllib.request.urlretrieve(ARCHIVE,archive)
  segments=[];chapters=[];clock=0
  def text(name,value):p=work/(name+'.txt');p.write_text(value);return p
  def overlay(name,title,body,credit):
   return ','.join(['drawbox=x=0:y=564:w=iw:h=156:color=black@0.92:t=fill',f"drawtext=fontfile={FONT}:textfile={text(name+'-title',title)}:fontsize=30:fontcolor=white:x=42:y=582",f"drawtext=fontfile={FONT}:textfile={text(name+'-body',body)}:fontsize=19:fontcolor=white:x=42:y=628",f"drawtext=fontfile={FONT}:textfile={text(name+'-credit',credit)}:fontsize=13:fontcolor=0xaaaaaa:x=42:y=680"])
  def photo(name,file,seconds,title,body):
   nonlocal clock
   out=work/(name+'.mp4');filt='scale=1280:564:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(564-ih)/2:black,setsar=1,'+overlay(name,title,body,'Maquette d’exposition · NASA, 1975 · Dossier visuel RELIC' if file=='satellite.jpg' else 'Modèle d’exposition · NASA History · Dossier visuel RELIC' if file=='model.jpg' else 'Archives historiques / NASA History · Dossier visuel RELIC')+f',fade=t=in:d=0.4,fade=t=out:st={seconds-.4}:d=0.4'
   run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-i',str(ASSETS/file),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',str(seconds),'-vf',filt,'-r','24','-c:v','libx264','-preset','veryfast','-crf','22','-g','48','-keyint_min','48','-sc_threshold','0','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','48000','-ac','2',str(out)])
   segments.append(out);chapters.append({'start':clock,'title':title,'source':file});clock+=duration(out)
  photo('intro','satellite.jpg',12,'Spoutnik 1 · Le premier satellite artificiel','4 octobre 1957 — 4 janvier 1958 · URSS / PS-1')
  photo('preparations','preparations.jpg',12,'01 / Préparer un objet de 83,6 kg','Une sphère de 58 cm, quatre antennes et deux fréquences radio.')
  photo('launch','launch.jpg',10,'02 / Baïkonour · 4 octobre 1957','19 h 28 min 34 s UTC : lancement par une fusée dérivée de la R-7.')
  out=work/'newsreel.mp4';filt='scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,drawbox=x=0:y=0:w=iw:h=76:color=black@0.85:t=fill,'+f"drawtext=fontfile={FONT}:textfile={text('archive-title','03 / Actualités du 7 octobre 1957 · Universal-International')}:fontsize=21:fontcolor=white:x=30:y=14,"+f"drawtext=fontfile={FONT}:textfile={text('archive-context','Animations génériques réutilisées de Vanguard ; ce ne sont pas des images du vol de Spoutnik.')}:fontsize=15:fontcolor=white:x=30:y=46"
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(archive),'-vf',filt,'-r','24','-c:v','libx264','-preset','veryfast','-crf','22','-g','48','-keyint_min','48','-sc_threshold','0','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','48000','-ac','2',str(out)])
  segments.append(out);chapters.append({'start':clock,'title':'03 / Archives filmées · 7 octobre 1957','source':ARCHIVE});clock+=duration(out)
  photo('orbit','model.jpg',12,'04 / Un signal autour de la Terre','Orbite initiale : 215 × 939 km · émissions jusqu’au 26 octobre 1957.')
  photo('return','satellite.jpg',10,'05 / Le matériel disparaît dans l’atmosphère','2 décembre : rentrée de l’étage central. 4 janvier 1958 : fin du satellite.')
  photo('legacy','explorer.jpg',12,'06 / Le début de l’ère spatiale','1958 : Explorer 1 et la création de la NASA. Aucun élément de Spoutnik 1 ne reste en orbite.')
  listing=work/'concat.txt';listing.write_text(''.join(f"file '{p}'\n" for p in segments));dest=ASSETS/'film.mp4'
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(dest)])
  film_dir=ASSETS/'film';film_dir.mkdir(exist_ok=True)
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(dest),'-c','copy','-hls_time','4','-hls_playlist_type','vod','-hls_segment_filename',str(film_dir/'segment-%03d.ts'),str(film_dir/'index.m3u8')])
  manifest={'title':'Spoutnik 1 · La mission en images','duration':duration(dest),'chapters':chapters,'archive':{'page':'https://archive.org/details/1957-10-07_New_Moon','download':ARCHIVE,'title':'New Moon. Reds Launch First Space Satellite, 1957/10/07','license':'https://creativecommons.org/publicdomain/mark/1.0/','sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'context':'Partial Universal newsreel, preserved in full with its original English sound. Its animation was reused from a Vanguard story; it is not measured Sputnik flight imagery.'},'photos':'photos.json','missionFacts':'fiche-mission.pdf','editorialNote':'Photo essay with a contemporary archival newsreel; no invented on-board footage, orbital decay imagery, or recovered flight hardware. Museum models are explicitly identified in the dossier.','masterSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'playlist':'film/index.m3u8','segments':[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(film_dir.glob('*.ts'))]}
  size=sum(p.stat().st_size for p in film_dir.iterdir());dest.unlink()
  (ASSETS/'film.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(f'Film ready: {manifest["duration"]:.2f}s, {size} bytes')
if __name__=='__main__':build()
