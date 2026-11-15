"""Normalize dossier metadata and preserve all extracted source content."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]/'assets/missions'
catalog=json.loads((ROOT/'catalog.json').read_text(encoding='utf8'))
for entry in catalog:
 path=ROOT/f'{entry["id"]}.json'
 record=json.loads(path.read_text(encoding='utf8'))
 if not record['facts']:
  for block in record['pages'][0]:
   if block['type']=='table' and any('lancement' in row[0].lower() for row in block['rows'][1:] if row):
    record['facts']=block['rows'][1:];break
 if not record['year']:
  launch=next((row[1] for row in record['facts'] if len(row)>1 and row[0].lower().startswith('lancement')),'')
  years=re.findall(r'\b(?:19|20)\d{2}\b',launch)
  if years:record['year']=int(years[0])
 if record['id']=='lro':record['family']='orbiter'
 for key in entry:entry[key]=record[key]
 path.write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
(ROOT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2),encoding='utf8')
print('Normalized',len(catalog),'missions; missing years:',[r['id'] for r in catalog if not r['year']])
