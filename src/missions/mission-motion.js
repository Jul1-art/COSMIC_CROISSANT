export function reducedMissionMotion(){return document.documentElement.dataset.motion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches;}
export function revealMissionElement(element,{delay=0,duration=420,distance=12}={}){
 if(!element||reducedMissionMotion())return;
 return element.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],{duration,delay,easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'});
}
export async function dismissMissionElement(element){
 if(!element||reducedMissionMotion()||document.hidden)return;
 let timer;const transition=element.animate([{opacity:1},{opacity:0,transform:'translateY(6px)'}],{duration:240,easing:'ease-in',fill:'forwards'});
 try{await Promise.race([transition.finished,new Promise(resolve=>{timer=setTimeout(resolve,340);})]);}catch{}finally{clearTimeout(timer);transition.cancel();}
}
