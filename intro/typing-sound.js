/** Real keyboard recording by Dustin_Davis, CC0. See assets/typing/provenance.json.
 * The small local copy avoids a third-party request during playback. */
const RECORDING=new URL('./assets/typing/keyboard-keys.wav',import.meta.url);
const KEY_COUNT=8;
export function createTypingSound(view=window){
 let context,buffer,decoding,last=-Infinity,disposed=false,index=0;
 const request=new AbortController();
 const recording=view.fetch(RECORDING,{signal:request.signal}).then(response=>response.ok?response.arrayBuffer():null).catch(()=>null);
 function unlock(){
  if(disposed)return;
  try{
   const AudioContext=view.AudioContext||view.webkitAudioContext;if(!AudioContext)return;context??=new AudioContext();
   if(context.state==='suspended')void context.resume().catch(()=>{});
   decoding??=recording.then(async bytes=>{if(!bytes||disposed)return;const decoded=await context.decodeAudioData(bytes);if(!disposed)buffer=decoded;}).catch(()=>{});
  }catch{}
 }
 function tap(){
  if(disposed||!buffer||context?.state!=='running'||context.currentTime-last<.065)return;last=context.currentTime;
  try{
   const source=context.createBufferSource(),gain=context.createGain(),duration=buffer.duration/KEY_COUNT;
   source.buffer=buffer;gain.gain.value=.16;source.connect(gain);gain.connect(context.destination);
   source.onended=()=>{source.disconnect();gain.disconnect();};source.start(0,index++%KEY_COUNT*duration,duration);
  }catch{}
 }
 return {unlock,tap,dispose(){disposed=true;request.abort();if(context)void context.close().catch(()=>{});}};
}
