const number=text=>Number(text.replace(/\s/g,'').replace(',','.'));
/** Read only explicitly stated orbital altitudes; do not infer a historical state vector. */
export function archiveOrbit(record){
 for(const [label,text] of record.facts){
  if(!/orbite|orbital/i.test(label))continue;
  const match=text.match(/(\d[\d\s.,]*?)\s*(?:km)?\s*(?:\([^)]*\))?\s*[×x]\s*(\d[\d\s.,]*?)\s*km/i);
  const circular=!match&&/circulaire/i.test(text)?text.match(/(\d[\d\s.,]*?)\s*km\s*d.altitude/i):null;
  if(!match&&!circular)continue;
  const pericentreKm=number((match||circular)[1]),apocentreKm=match?number(match[2]):pericentreKm;
  if(!Number.isFinite(pericentreKm)||!Number.isFinite(apocentreKm)||pericentreKm<0||apocentreKm<pericentreKm)continue;
  const inclination=text.match(/inclinaison\s*[:~≈]?\s*(\d+(?:[.,]\d+)?)\s*°/i),period=text.match(/période\s*[:~≈]?\s*(\d+(?:[.,]\d+)?)\s*min/i);
  return {pericentreKm,apocentreKm,inclinationDeg:inclination?number(inclination[1]):/polaire/i.test(text)?90:0,inclinationKnown:Boolean(inclination)||/polaire/i.test(text),periodSeconds:period?number(period[1])*60:null,source:text};
 }return null;
}
export function archiveSite(record){
 for(const [label,text] of record.facts){
  if(!/atterrissage|alunissage|coordonnées|site|posé|destination/i.test(label))continue;
  const match=text.match(/(\d+(?:[.,]\d+)?)°\s*([NS])[^\d]+(\d+(?:[.,]\d+)?)°\s*([EOW])/);
  if(match)return {latitude:number(match[1])*(match[2]==='S'?-1:1),longitude:number(match[3])*(/[OW]/.test(match[4])?-1:1),source:text};
 }return null;
}
/** Kepler ellipse at a presentation mean anomaly. Orientation and epoch remain illustrative. */
export function archiveOrbitPosition(orbit,radiusKm,meanAnomaly){
 const a=radiusKm+(orbit.pericentreKm+orbit.apocentreKm)/2,e=(orbit.apocentreKm-orbit.pericentreKm)/(2*a);
 let eccentric=meanAnomaly;for(let i=0;i<14;i++){const step=(eccentric-e*Math.sin(eccentric)-meanAnomaly)/(1-e*Math.cos(eccentric));eccentric-=step;if(Math.abs(step)<1e-13)break;}
 const x=a*(Math.cos(eccentric)-e),y=a*Math.sqrt(1-e*e)*Math.sin(eccentric),inclination=orbit.inclinationDeg*Math.PI/180;
 return [x,y*Math.sin(inclination),-y*Math.cos(inclination)];
}
