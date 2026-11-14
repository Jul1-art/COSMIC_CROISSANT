/** Interruptible camera easing shared by overview, landing and equipment shots. */
export const cameraEase=value=>value<.5?4*value**3:1-(-2*value+2)**3/2;
export function createMissionCamera({camera,controls,now=()=>performance.now(),reducedMotion=()=>false}){
 let flight=null;
 function flyTo(position,target,{duration=1400}={}){
  if(reducedMotion()||duration<=0){camera.position.copy(position);controls.target.copy(target);controls.update();flight=null;return;}
  flight={start:now(),duration,from:camera.position.clone(),to:position.clone(),fromTarget:controls.target.clone(),toTarget:target.clone()};
 }
 return {flyTo,cancel(){flight=null;},update(time){if(!flight)return false;const progress=Math.max(0,Math.min(1,(time-flight.start)/flight.duration)),eased=cameraEase(progress);camera.position.lerpVectors(flight.from,flight.to,eased);controls.target.lerpVectors(flight.fromTarget,flight.toTarget,eased);if(progress===1)flight=null;return true;},get active(){return Boolean(flight);}};
}
