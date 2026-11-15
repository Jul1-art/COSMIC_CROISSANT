"""Build the public mission catalogue from the supplied reference PDFs."""
from pathlib import Path
import json, re, shutil, sys, unicodedata
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
OUT = ROOT / 'assets/missions'
OUT.mkdir(parents=True, exist_ok=True)

def plain(value):
    return re.sub(r'\s+', ' ', value).strip()

def slug(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', value).strip('-')

def title(file):
    s = file.stem
    s = re.sub(r'^fiche[ -]mission[ -]?', '', s, flags=re.I)
    s = re.split(r' - | — | -Fiche|–', s)[0]
    s = re.sub(r'-hardware.*', '', s, flags=re.I)
    s = s.replace('Chang_e', "Chang'e").replace('Chang-e-', "Chang'e ")
    s = re.sub(r'(?<=[A-Za-z])-(?=\d)|(?<=\d)-(?=[A-Za-z])', ' ', s)
    s = s.replace('Nancy-Grace-Roman', 'Nancy Grace Roman').replace('Mars-Pathfinder','Mars Pathfinder').replace('New-Horizons','New Horizons').replace('Parker-Solar-Probe','Parker Solar Probe').replace('Cassini-Huygens','Cassini–Huygens')
    return s[0].upper()+s[1:]

def body(file, name):
    folder = file.relative_to(SOURCE).parts[0]
    return {'Lune':'moon','Mars':'mars','Mercure':'mercury','Vénus':'venus','Terre':'earth','Soleil':'sun','Astéroïdes et comètes':'small-bodies'}.get(folder, 'saturn' if 'Cassini' in name else 'pluto' if 'Horizons' in name else 'outer' if folder.startswith('Planètes') else 'observatories')

def family(name, target, text):
    n = name.lower()
    for pattern, kind in [(r'apollo','apollo'),(r'spoutnik 1','sputnik'),(r'spoutnik 2','sputnik2'),(r'lunokhod','lunokhod'),(r'surveyor','surveyor'),(r'venera (?:[3-8])\b','venera-early'),(r'venera','venera'),(r'viking','viking'),(r'curiosity|perseverance','rover-rtg'),(r'spirit|opportunity','mer'),(r'sojourner|pathfinder','sojourner'),(r'zhurong|tianwen','zhurong'),(r'rosalind','exomars'),(r'webb','webb'),(r'roman','roman'),(r'voyager','voyager'),(r'pioneer (?:10|11)','pioneer'),(r'cassini','cassini'),(r'parker','parker'),(r'rosetta','rosetta'),(r'luna (?:16|15)\b','luna-return'),(r'luna (?:9|13)\b','luna-lander'),(r'luna','luna-orbiter'),(r'chang.e [3456]|chandrayaan','lunar-lander')]:
        if re.search(pattern,n): return kind
    return 'orbiter'

records=[]
for file in sorted(SOURCE.rglob('*.pdf')):
    name=title(file); ident=slug(name.split(' (')[0]); target=body(file,name)
    doc=fitz.open(file)
    pages=[]; facts=[]; alltext='\n'.join(p.get_text(sort=True) for p in doc)
    for pi,page in enumerate(doc):
        tables=page.find_tables().tables
        content=[]
        for table in tables:
            rows=[]
            for row in table.rows:
                rows.append([plain(page.get_textbox(fitz.Rect(c))) if c else '' for c in row.cells])
            content.append({'y':table.bbox[1],'type':'table','rows':rows})
            if pi==0 and rows and any('Champ' in c for c in rows[0]): facts=rows[1:]
        for block in page.get_text('blocks',sort=True):
            rect=fitz.Rect(block[:4]); text=block[4].strip()
            if not text or rect.y0>page.rect.height-45: continue
            if any((rect & fitz.Rect(t.bbox)).get_area()>rect.get_area()*.45 for t in tables): continue
            if 'Fiche générée selon' in text or 'Plan de fiche associé' in text: continue
            content.append({'y':rect.y0,'type':'text','text':plain(text)})
        pages.append(sorted(content,key=lambda b:b['y']))
    summary=re.search(r'Synthèse(?: hardware| exhaustive)?\s*:\s*(.*?)(?:Identité|1\.|Fiche «)',plain(alltext))
    summary=summary.group(1).strip() if summary else plain(alltext[:600])
    launch=next((r[1] for r in facts if r and 'lancement' in r[0].lower() and len(r)>1),'')
    years=re.findall(r'\b(?:19|20)\d{2}\b',launch)
    shutil.copyfile(file,OUT/f'{ident}.pdf')
    record={'id':ident,'name':name,'body':target,'family':family(name,target,alltext),'year':int(years[0]) if years else None,'summary':summary,'facts':facts,'sourceFile':file.relative_to(SOURCE).as_posix(),'pdf':f'{ident}.pdf','pages':pages}
    (OUT/f'{ident}.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
    records.append({k:v for k,v in record.items() if k not in ('pages','facts')})
(OUT/'catalog.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
print(f'Built {len(records)} mission dossiers, with original PDFs and structured tables.')
