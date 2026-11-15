/** Real keyboard recording by Dustin_Davis, CC0. See assets/typing/provenance.json.
 * The small local copy avoids a third-party request during playback. */
const RECORDING=new URL('./assets/typing/keyboard-keys.wav',import.meta.url);
const KEY_COUNT=8;
export function createTypingSound(view=window){
 let context,buffer,decoding,tone,master,last=-Infinity,disposed=false,index=0;
 const request=new AbortController();
 const recording=view.fetch(RECORDING,{signal:request.signal}).then(response=>response.ok?response.arrayBuffer():null).catch(()=>null);
 function unlock(){
  if(disposed)return;
  try{
   const AudioContext=view.AudioContext||view.webkitAudioContext;if(!AudioContext)return;context??=new AudioContext();
   if(context.state==='suspended')void context.resume().catch(()=>{});
   if(!tone){
    tone=context.createBiquadFilter();tone.type='highpass';tone.frequency.value=90;tone.Q.value=.707;
    const soften=context.createBiquadFilter();soften.type='lowpass';soften.frequency.value=6500;soften.Q.value=.707;
    master=context.createGain();master.gain.value=.4;tone.connect(soften);soften.connect(master);master.connect(context.destination);
   }
   decoding??=recording.then(async bytes=>{if(!bytes||disposed)return;const decoded=await context.decodeAudioData(bytes);if(!disposed)buffer=decoded;}).catch(()=>{});
  }catch{}
 }
 function tap(){
  if(disposed||!buffer||context?.state!=='running'||context.currentTime-last<.065)return;last=context.currentTime;
  try{
   const source=context.createBufferSource(),duration=buffer.duration/KEY_COUNT;
   // Alternate the actual recorded keys without repeating the preceding one.
   index=(index+1+Math.floor(Math.random()*(KEY_COUNT-1)))%KEY_COUNT;
   source.buffer=buffer;source.connect(tone);
   source.onended=()=>source.disconnect();source.start(0,index*duration,duration);
  }catch{}
 }
 return {unlock,tap,dispose(){disposed=true;request.abort();if(context)void context.close().catch(()=>{});}};
}
