import {Line2} from '../../vendor/three-addons/lines/Line2.js';
import {LineGeometry} from '../../vendor/three-addons/lines/LineGeometry.js';
import {LineMaterial} from '../../vendor/three-addons/lines/LineMaterial.js';
/** Screen-space antialiased strokes, independent of zoom and device ratio. */
export function createFlightLine({name,opacity}){
 const geometry=new LineGeometry(),material=new LineMaterial({color:0xffffff,linewidth:opacity>.5?1.65:1.1,opacity,transparent:true,depthWrite:false,alphaToCoverage:true});
 const line=new Line2(geometry,material);line.name=name;line.frustumCulled=false;line.onBeforeRender=renderer=>renderer.getSize(material.resolution);let count=0;
 line.userData.write=points=>{
  if(points.length!==count){const values=points.flatMap(p=>[p.x,p.y,p.z]);geometry.setPositions(values);count=points.length;}
  else{
   const buffer=geometry.attributes.instanceStart.data,array=buffer.array;
   for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],offset=i*6;array[offset]=a.x;array[offset+1]=a.y;array[offset+2]=a.z;array[offset+3]=b.x;array[offset+4]=b.y;array[offset+5]=b.z;}
   buffer.needsUpdate=true;geometry.computeBoundingSphere();
  }
  geometry.instanceCount=Math.max(0,points.length-1);
 };
 line.userData.reveal=points=>{geometry.instanceCount=Math.max(0,Math.min(count,points)-1);};
 return line;
}
