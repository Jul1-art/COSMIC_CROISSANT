/** Target identity is mission-specific; presentation geometry never substitutes another body. */
export function archiveTarget(record){
 if(record.id==='hera')return {id:'didymos',name:'Didymos–Dimorphos',radiusKm:.39,axes:[1,1,1],secondary:{name:'Dimorphos',radiusKm:.0755,separationKm:1.2},source:'https://www.esa.int/Space_Safety/Hera/A_hitchhiker_s_guide_to_Hera_s_target_asteroids',note:'Volumes simplifiés : Didymos, diamètre 780 m ; Dimorphos, diamètre 151 m. Orientation du système illustrative.'};
 if(record.id==='near-shoemaker')return {id:'eros',name:'(433) Éros',radiusKm:17.2,axes:[1,5.6/17.2,5.6/17.2],source:'https://neo.ssa.esa.int/documents/20126/0/NEA%2BChronology%2Bv118.0%2BAug-01-2021.pdf/c5ebc344-b84d-2bfe-29fd-5cf1d60421a2?t=1627903244411',note:'Enveloppe ellipsoïdale simplifiée de 34,4 × 11,2 × 11,2 km ; relief et orientation non reconstitués.'};
 if(record.id==='new-horizons')return {id:'pluto',name:'Pluton',radiusKm:1188.3,axes:[1,1,1],source:'https://science.nasa.gov/dwarf-planets/pluto/facts/',note:'Globe de contexte de Pluton. Le trajet du survol et sa phase ne sont pas une télémétrie historique.'};
 return null;
}
export function archiveLagrange(record){
 if(!['ace','soho','james-webb','nancy-grace-roman'].includes(record.id))return null;
 const text=record.facts.filter(row=>/orbite|orbital/i.test(row[0])).map(row=>row[1]).join(' '),point=text.match(/\bL([12])\b/),distance=text.match(/(\d+(?:[.,]\d+)?)\s*million(?:s)?\s*de\s*km/i);
 if(!point||!distance)return null;
 return {point:'L'+point[1],distanceKm:Number(distance[1].replace(',','.'))*1e6,sunward:point[1]==='1',source:text};
}
