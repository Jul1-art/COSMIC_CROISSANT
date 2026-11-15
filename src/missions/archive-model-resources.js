/** One identity mapping for rendering and visible attribution. */
export function archiveModelKey(record){
 const keys={'mariner-2':'mariner','stereo':'stereo-a','exomars':'tgo','nancy-grace-roman':'roman','2001-mars-odyssey':'mars-odyssey','james-webb':'webb','near-shoemaker':'near','rosetta-philae':'rosetta','mars-reconnaissance-orbiter':'mro','parker-solar-probe':'parker','cassinihuygens':'cassini'};
 return keys[record.id]||(record.id.startsWith('voyager')?'voyager':record.id.startsWith('pioneer-1')?'pioneer':record.id.startsWith('viking')?'viking':['spirit','opportunity'].includes(record.id)?'mer':record.id);
}
export function archiveModelSources(record,manifest,target){
 const sources=[];
 if(record.family==='apollo'&&record.id!=='apollo-13')sources.push({title:'Module lunaire Apollo',source:'https://science.nasa.gov/3d-resources/apollo-lunar-module/',credit:'NASA / Michael D. Carbajal'});
 else {const resource=manifest[archiveModelKey(record)];if(resource)sources.push({...resource,title:record.name+' · véhicule'});}
 const body=target&&manifest[target.id];if(body)sources.push({...body,title:target.name+' · corps céleste'});
 return sources;
}
