/** Historical data stay in kilometres and seconds. Rendering scale is applied
 * only at the atlas boundary, never inside the trajectory or orbit maths. */
export const EARTH_RADIUS_KM=6371;
export const MOON_RADIUS_KM=1737.4;
export const ECLIPTIC_OBLIQUITY=23.439291111*Math.PI/180;
const c=Math.cos(ECLIPTIC_OBLIQUITY),s=Math.sin(ECLIPTIC_OBLIQUITY);
export function inertialToScene([x,y,z]){return [x,-s*y+c*z,-c*y-s*z];}
// Body meshes use x = prime meridian, y = north, -z = east.
export function bodyToMesh([x,y,z]){return [x,z,-y];}
export function findInterval(rows,time){let lo=0,hi=rows.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(rows[mid][0]<=time)lo=mid;else hi=mid;}return lo;}
export function sampleState(rows,time){
 if(!rows?.length||!Number.isFinite(time))return null;
 const t=Math.max(rows[0][0],Math.min(rows.at(-1)[0],time)),i=findInterval(rows,t),a=rows[i],b=rows[i+1]||a,h=b[0]-a[0];
 if(!h)return {position:a.slice(1,4),velocity:a.slice(4,7)};
 const u=(t-a[0])/h,u2=u*u,u3=u2*u,position=[],velocity=[];
 for(let k=1;k<=3;k++){
  position.push((2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*h*a[k+3]+(-2*u3+3*u2)*b[k]+(u3-u2)*h*b[k+3]);
  velocity.push(((6*u2-6*u)*a[k]+(3*u2-4*u+1)*h*a[k+3]+(-6*u2+6*u)*b[k]+(3*u2-2*u)*h*b[k+3])/h);
 }
 return {position,velocity};
}
export function validateFlightData(data){
 const valid=rows=>Array.isArray(rows)&&rows.length>1&&rows.every((row,i)=>row.length===7&&row.every(Number.isFinite)&&(!i||row[0]>rows[i-1][0]));
 if(data?.version!==1||data.frame!=='geocentric J2000 equatorial / ICRF'||data.units?.position!=='km'||data.units?.velocity!=='km/s'||!Number.isFinite(Date.parse(data.epochUTC)))return false;
 if(!valid(data.ephemeris?.moon)||!valid(data.ephemeris?.sun))return false;
 if(!['stack','columbia','eagle','discarded-eagle'].every(key=>valid(data.tracks?.[key]?.states)))return false;
 if(!Array.isArray(data.orientations)||data.orientations.length<2||!data.orientations.every((row,i)=>row.length===9&&row.every(Number.isFinite)&&(!i||row[0]>data.orientations[i-1][0])))return false;
 return ['earthGM','moonGM','moonSurfaceRadiusKm'].every(key=>Number.isFinite(data.gravity?.[key])&&data.gravity[key]>0);
}
export async function loadFlightData({signal}={}){
 const controller=new AbortController(),cancel=()=>controller.abort(),timer=setTimeout(cancel,20000);
 if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
 try{
  const response=await fetch(new URL('../../assets/missions/apollo-11/trajectory.json',import.meta.url),{signal:controller.signal,cache:'force-cache'});
  if(!response.ok)throw new Error('Trajectory data is unavailable.');
  const data=await response.json();if(!validateFlightData(data))throw new Error('The trajectory data is invalid.');return data;
 }catch(error){if(controller.signal.aborted&&!signal?.aborted)throw new Error('Loading timed out. Please try again.');throw error;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}

const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/** Osculating lunar ellipse from the current inertial r,v, not a decorative ring.
 * It is an instantaneous gravitational orbit guide, not predicted telemetry. */
export function lunarOrbit(state,moon,mu,segments=360){
 if(!state||!moon)return [];
 const r=subtract(state.position,moon.position),v=subtract(state.velocity,moon.velocity),radius=Math.hypot(...r),h=cross(r,v),hl=Math.hypot(...h);
 if(!(radius>0&&hl>0))return [];
 const vxh=cross(v,h),ecc=vxh.map((x,i)=>x/mu-r[i]/radius),e=Math.hypot(...ecc);if(!(e>=0&&e<1))return [];
 const p=hl*hl/mu,P=e>1e-8?ecc.map(x=>x/e):r.map(x=>x/radius),H=h.map(x=>x/hl),Q=cross(H,P);
 return Array.from({length:segments+1},(_,i)=>{const a=i/segments*Math.PI*2,d=p/(1+e*Math.cos(a));return P.map((x,j)=>d*(x*Math.cos(a)+Q[j]*Math.sin(a)));});
}
export function flightState(data,time){
 const seconds=(time-Date.parse(data.epochUTC))/1000,undock=data.tracks.eagle.states[0][0],dock=data.tracks.eagle.states.at(-1)[0],discarded=data.tracks['discarded-eagle'].states;
 const attached=seconds<undock||(seconds>=dock&&seconds<discarded[0][0]);
 const columbia=sampleState((seconds<undock?data.tracks.stack:data.tracks.columbia).states,seconds);
 let eagle=null;
 if(seconds>=undock&&seconds<dock)eagle=sampleState(data.tracks.eagle.states,seconds);
 else if(seconds>=discarded[0][0]&&seconds<=discarded.at(-1)[0])eagle=sampleState(discarded,seconds);
 return {seconds,columbia,eagle,attached,moon:sampleState(data.ephemeris.moon,seconds)};
}
