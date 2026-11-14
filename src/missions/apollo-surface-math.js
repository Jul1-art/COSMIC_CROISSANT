const RAD=Math.PI/180;
/** Decode the measured NAC grid using its geographic footprint, not the legacy
 * catalogue's Earth-derived widthKm field. All results are local lunar metres. */
export function createSurfaceSampler({grid,values,site,latitude,longitude,radiusMeters=1737400}){
 if(!Number.isInteger(grid)||grid<2||values.length!==grid*grid)throw new Error('Invalid lunar terrain grid');
 const [west,south,east,north]=site.bounds,metersLat=radiusMeters*RAD,metersLon=metersLat*Math.cos(latitude*RAD);
 const bounds=[(west-longitude)*metersLon,-(north-latitude)*metersLat,(east-longitude)*metersLon,-(south-latitude)*metersLat];
 function raw(x,z){
  const u=Math.max(0,Math.min(grid-1,(x-bounds[0])/(bounds[2]-bounds[0])*(grid-1))),v=Math.max(0,Math.min(grid-1,(z-bounds[1])/(bounds[3]-bounds[1])*(grid-1)));
  const i=Math.min(grid-2,Math.floor(u)),j=Math.min(grid-2,Math.floor(v)),a=u-i,b=v-j;
  const encoded=(1-b)*((1-a)*values[j*grid+i]+a*values[j*grid+i+1])+b*((1-a)*values[(j+1)*grid+i]+a*values[(j+1)*grid+i+1]);
  return site.minMeters+encoded/65535*(site.maxMeters-site.minMeters);
 }
 const zero=raw(0,0),curvature=(x,z)=>-(x*x+z*z)/(2*radiusMeters);
 function height(x,z){
  const inside=x>=bounds[0]&&x<=bounds[2]&&z>=bounds[1]&&z<=bounds[3];
  if(inside)return raw(x,z)-zero+curvature(x,z);
  const outside=Math.max(bounds[0]-x,x-bounds[2],bounds[1]-z,z-bounds[3],0),fade=Math.max(0,1-outside/3000);
  return (raw(x,z)-zero)*fade+curvature(x,z);
 }
 return {bounds,height,curvature,zero,metersLat,metersLon};
}
