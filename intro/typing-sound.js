/** Soft, dry key presses, with rounded attacks and a quiet key-release layer.
 * No sharp band-pass hiss. Audio starts only after a real user gesture. */
export function createTypingSound(view=window){
 let context,buffers,last=-Infinity,disposed=false,index=0;
 function unlock(){if(disposed)return;try{const AudioContext=view.AudioContext||view.webkitAudioContext;if(!AudioContext)return;context??=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{}}
 function prepare(){
  buffers=Array.from({length:4},(_,variant)=>{
   const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.045),context.sampleRate),data=buffer.getChannelData(0);
   const alpha=1-Math.exp(-2*Math.PI*(950+variant*120)/context.sampleRate);let first=0,second=0,dc=0,peak=0;
   for(let i=0;i<data.length;i++){
    const t=i/context.sampleRate;first+=alpha*(Math.random()*2-1-first);second+=alpha*(first-second);dc+=.004*(second-dc);
    const press=(1-Math.exp(-t/.0009))*Math.exp(-t/.0045),release=t>.013?(1-Math.exp(-(t-.013)/.0012))*Math.exp(-(t-.013)/.0035)*.22:0;
    data[i]=(second-dc)*(press+release);peak=Math.max(peak,Math.abs(data[i]));
   }
   if(peak)for(let i=0;i<data.length;i++)data[i]*=.5/peak;
   return buffer;
  });
 }
 function tap(){if(disposed||context?.state!=='running'||context.currentTime-last<.055)return;last=context.currentTime;
  try{if(!buffers)prepare();const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers[index++%buffers.length];source.playbackRate.value=.98+Math.random()*.04;gain.gain.value=.04;source.connect(gain);gain.connect(context.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();}catch{}
 }
 return {unlock,tap,dispose(){disposed=true;if(context)void context.close().catch(()=>{});}};
}
