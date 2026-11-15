import {loadJSON} from './catalog.js';
const EFFECTIVE_LEAPS=['1972-07-01','1973-01-01','1974-01-01','1975-01-01','1976-01-01','1977-01-01','1978-01-01','1979-01-01','1980-01-01','1981-07-01','1982-07-01','1983-07-01','1985-07-01','1988-01-01','1990-01-01','1991-01-01','1992-07-01','1993-07-01','1994-07-01','1996-01-01','1997-07-01','1999-01-01','2006-01-01','2009-01-01','2012-07-01','2015-07-01','2017-01-01'].map(date=>Date.parse(date+'T00:00:00Z'));
/** Match the time convention of the published NASA visualization packets. */
export function eyesEphemerisTime(utcMilliseconds){return utcMilliseconds/1000-946727957.816+EFFECTIVE_LEAPS.filter(time=>utcMilliseconds>=time).length;}
const epsilon=23.439291111*Math.PI/180;
export const eyesToEcliptic=([x,y,z])=>[x,Math.cos(epsilon)*y+Math.sin(epsilon)*z,-Math.sin(epsilon)*y+Math.cos(epsilon)*z];
const mix=(a,b,fraction)=>a.map((value,index)=>value+(b[index]-value)*fraction);
function rotate([vx,vy,vz],[w,x,y,z]){const tx=2*(y*vz-z*vy),ty=2*(z*vx-x*vz),tz=2*(x*vy-y*vx);return [vx+w*tx+y*tz-z*ty,vy+w*ty+z*tx-x*tz,vz+w*tz+x*ty-y*tx];}
export function projectEyesOrbit(row,time){
 const [epoch,a,e,motion,initial,...orientation]=row;let mean=initial+motion*(time-epoch),position,velocity;
 if(e<1){
  mean=((mean+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;let eccentric=e<.8?mean:Math.sign(mean||1)*Math.PI;
  for(let step=0;step<40;step++){const delta=(eccentric-e*Math.sin(eccentric)-mean)/(1-e*Math.cos(eccentric));eccentric-=delta;if(Math.abs(delta)<1e-13)break;}
  const radius=a*(1-e*Math.cos(eccentric)),rate=motion*a*a/radius,root=Math.sqrt(1-e*e);
  position=[a*(Math.cos(eccentric)-e),a*root*Math.sin(eccentric),0];velocity=[-rate*Math.sin(eccentric),rate*root*Math.cos(eccentric),0];
 }else{
  if(e===1)return null;const magnitude=Math.abs(mean);let low=0,high=Math.max(1,Math.asinh(magnitude/e)+1);
  while(e*Math.sinh(high)-high<magnitude&&high<350)high*=2;
  for(let step=0;step<80;step++){const middle=(low+high)/2;if(e*Math.sinh(middle)-middle<magnitude)low=middle;else high=middle;}
  const eccentric=Math.sign(mean||1)*(low+high)/2,radius=a*(e*Math.cosh(eccentric)-1),rate=motion*a*a/radius,root=Math.sqrt(e*e-1);
  position=[a*(e-Math.cosh(eccentric)),a*root*Math.sinh(eccentric),0];velocity=[-rate*Math.sinh(eccentric),rate*root*Math.cosh(eccentric),0];
 }
 return {position:rotate(position,orientation),velocity:rotate(velocity,orientation)};
}
function interval(rows,time){let low=0,high=rows.length-1;if(high<1||time<rows[0][0]||time>rows[high][0])return null;while(high-low>1){const middle=(low+high)>>1;if(rows[middle][0]<=time)low=middle;else high=middle;}return [rows[low],rows[high]];}
export function sampleEyesEntity(entity,utcMilliseconds){
 const time=eyesEphemerisTime(utcMilliseconds);let parent=null;for(const [start,id] of entity.parents)if(time>=start)parent=id;else break;if(!parent)return null;
 for(const dataset of [...entity.datasets].reverse()){
  // Some encounters have overlapping numerical coverage in different parent frames.
  const explicitParent=dataset.url.match(/\/(sun|earth|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune)\//)?.[1];if(explicitParent&&explicitParent!==parent)continue;
  const pair=interval(dataset.points,time);if(!pair)continue;const [a,b]=pair,dt=b[0]-a[0];if(!(dt>0))continue;
  const fraction=(time-a[0])/dt;let position,velocity,envelopeKm=null;
  if(dataset.kind==='orb'){
   const first=projectEyesOrbit(a,time),second=projectEyesOrbit(b,time);if(!first||!second)continue;
   position=mix(first.position,second.position,fraction);velocity=mix(first.velocity,second.velocity,fraction);
   if(a[2]<1&&b[2]<1)envelopeKm=Math.max(a[1]*(1+a[2]),b[1]*(1+b[2]));
  }else if(dataset.kind==='lin'){
   position=mix(a.slice(1,4),b.slice(1,4),fraction);velocity=a.slice(1,4).map((value,index)=>(b[index+1]-value)/dt);
  }else if(dataset.kind==='pos'){
   const f=fraction,f2=f*f,f3=f2*f;position=[];velocity=[];
   for(let axis=1;axis<=3;axis++){
    position.push((2*f3-3*f2+1)*a[axis]+(f3-2*f2+f)*dt*a[axis+3]+(-2*f3+3*f2)*b[axis]+(f3-f2)*dt*b[axis+3]);
    velocity.push(((6*f2-6*f)*a[axis]+(3*f2-4*f+1)*dt*a[axis+3]+(-6*f2+6*f)*b[axis]+(3*f2-2*f)*dt*b[axis+3])/dt);
   }
  }else continue;
  position=eyesToEcliptic(position);velocity=eyesToEcliptic(velocity);if(!position.concat(velocity).every(Number.isFinite))continue;
  return {entity:entity.id,name:entity.name,model:entity.model,parent,positionKm:position,velocityKmS:velocity,rangeKm:Math.hypot(...position),envelopeKm,gm:dataset.header?.gm2,source:entity.source,et:time};
 }return null;
}
let catalogPromise;
export async function loadMissionEphemeris(id){
 const catalog=await(catalogPromise??=loadJSON('ephemerides/catalog.json'));if(!catalog[id])return null;
 const data=await loadJSON(catalog[id]);if(data.version!==1||data.positionUnits!=='km'||data.frame!=='NASA Eyes J2000 equatorial, parent-relative')throw new Error('Unsupported published ephemeris frame');return data;
}
