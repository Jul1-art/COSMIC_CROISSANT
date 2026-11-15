/** Explicit deployed dimensions from the supplied inventory, never from launch debris. */
export function archiveVehicleSize(record){
 if(record.id==='mars-pathfinder')return {nativeMetres:true,source:'https://science.nasa.gov/mission/mars-pathfinder/'};
 if(record.id==='curiosity')return {heightMetres:2.2,source:'https://www.jpl.nasa.gov/news/press_kits/MSLLanding.pdf'};
 if(record.id==='perseverance')return {heightMetres:2.2,source:'https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/mission/spacecraft/perseverance_rover/'};
 if(record.id==='sojourner')return {heightMetres:.3,source:'https://science.nasa.gov/mission/mars-pathfinder/'};
 if(['spirit','opportunity'].includes(record.id))return {heightMetres:1.5,source:'https://science.nasa.gov/mission/mer-spirit/'};
 const rows=record.pages.flat().filter(block=>block.type==='table').flatMap(block=>block.rows.slice(1));
 if(record.id==='james-webb'){
  const row=rows.find(row=>/bouclier thermique multicouche/i.test(row[0]));
  const source=row?.join(' '),match=source?.match(/(\d+(?:[.,]\d+)?)\s*m\s*×\s*(\d+(?:[.,]\d+)?)\s*m/);
  if(match)return {extentMetres:Math.max(...match.slice(1).map(value=>Number(value.replace(',','.')))),source};
 }
 if(record.id==='hera'){
  const row=rows.find(row=>/sonde spatiale Hera/i.test(row[0]));
  const source=row?.join(' '),match=source?.match(/(\d+(?:[.,]\d+)?)\s*m\s*d.envergure/);
  if(match)return {extentMetres:Number(match[1].replace(',','.')),source};
 }
 return null;
}
