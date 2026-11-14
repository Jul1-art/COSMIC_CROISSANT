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
   out=work/(name+'.mp4');filt='scale=1280:564:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(564-ih)/2:black,setsar=1,'+overlay(name,title,body,'Exhibition mockup · NASA, 1975 · RELIC visual dossier' if file=='satellite.jpg' else 'Exhibition model · NASA History · RELIC visual dossier' if file=='model.jpg' else 'Historical archives / NASA History · RELIC visual dossier')+f',fade=t=in:d=0.4,fade=t=out:st={seconds-.4}:d=0.4'
   run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-i',str(ASSETS/file),'-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',str(seconds),'-vf',filt,'-r','24','-c:v','libx264','-preset','veryfast','-crf','22','-g','48','-keyint_min','48','-sc_threshold','0','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','48000','-ac','2',str(out)])
   segments.append(out);chapters.append({'start':clock,'title':title,'source':file});clock+=duration(out)
  photo('intro','satellite.jpg',12,'Sputnik 1 · The first artificial satellite','4 October 1957 — 4 January 1958 · USSR / PS-1')
  photo('preparations','preparations.jpg',12,'01 / Preparing an 83.6 kg satellite','A 58 cm sphere, four antennas and two radio frequencies.')
  photo('launch','launch.jpg',10,'02 / Baikonur · 4 October 1957','19:28:34 UTC: liftoff aboard a launch vehicle derived from the R-7.')
  out=work/'newsreel.mp4';filt='scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,setsar=1,drawbox=x=0:y=0:w=iw:h=76:color=black@0.85:t=fill,'+f"drawtext=fontfile={FONT}:textfile={text('archive-title','03 / Newsreel · 7 October 1957 · Universal-International')}:fontsize=21:fontcolor=white:x=30:y=14,"+f"drawtext=fontfile={FONT}:textfile={text('archive-context','Generic animations reused from Vanguard; these are not images of Sputnik in flight.')}:fontsize=15:fontcolor=white:x=30:y=46"
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(archive),'-vf',filt,'-r','24','-c:v','libx264','-preset','veryfast','-crf','22','-g','48','-keyint_min','48','-sc_threshold','0','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-ar','48000','-ac','2',str(out)])
  segments.append(out);chapters.append({'start':clock,'title':'03 / Newsreel archive · 7 October 1957','source':ARCHIVE});clock+=duration(out)
  photo('orbit','model.jpg',12,'04 / A signal around Earth','Initial orbit: 215 × 939 km · radio transmissions until 26 October 1957.')
  photo('return','satellite.jpg',10,'05 / Hardware lost to the atmosphere','2 December: core-stage reentry. 4 January 1958: the satellite reenters.')
  photo('legacy','explorer.jpg',12,'06 / The beginning of the Space Age','1958: Explorer 1 and the creation of NASA. No Sputnik 1 hardware remains in orbit.')
  listing=work/'concat.txt';listing.write_text(''.join(f"file '{p}'\n" for p in segments));dest=ASSETS/'film.mp4'
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(dest)])
  film_dir=ASSETS/'film-en';film_dir.mkdir(exist_ok=True)
  run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(dest),'-c','copy','-hls_time','4','-hls_playlist_type','vod','-hls_segment_filename',str(film_dir/'segment-%03d.ts'),str(film_dir/'index.m3u8')])
  manifest={'title':'Sputnik 1 · The mission in pictures','duration':duration(dest),'chapters':chapters,'archive':{'page':'https://archive.org/details/1957-10-07_New_Moon','download':ARCHIVE,'title':'New Moon. Reds Launch First Space Satellite, 1957/10/07','license':'https://creativecommons.org/publicdomain/mark/1.0/','sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'context':'Partial Universal newsreel, preserved in full with its original English sound. Its animation was reused from a Vanguard story; it is not measured Sputnik flight imagery.'},'photos':'photos.json','missionFacts':'fiche-mission.pdf','editorialNote':'Photo essay with a contemporary archival newsreel; no invented on-board footage, orbital decay imagery, or recovered flight hardware. Museum models are explicitly identified in the dossier.','masterSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'playlist':'film-en/index.m3u8','segments':[{'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(film_dir.glob('*.ts'))]}
  size=sum(p.stat().st_size for p in film_dir.iterdir());dest.unlink()
  (ASSETS/'film.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(f'Film ready: {manifest["duration"]:.2f}s, {size} bytes')
if __name__=='__main__':build()
