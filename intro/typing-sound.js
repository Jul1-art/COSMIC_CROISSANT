/** Quiet synthesized key taps. Audio starts only after a real user gesture. */
export function createTypingSound(view=window){
 let context,buffer,last=-Infinity,muted=false,disposed=false;
 function unlock(){if(disposed||muted)return;try{const AudioContext=view.AudioContext||view.webkitAudioContext;if(!AudioContext)return;context??=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{}}
 function tap(){if(disposed||muted||context?.state!=='running'||context.currentTime-last<.035)return;last=context.currentTime;
  try{if(!buffer){buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.022),context.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(context.sampleRate*.003));}
   const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;source.playbackRate.value=.85+Math.random()*.3;filter.type='bandpass';filter.frequency.value=1600;filter.Q.value=.6;gain.gain.value=.13;source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
  }catch{}
 }
 return {unlock,tap,get muted(){return muted;},toggle(){muted=!muted;if(!muted)unlock();return muted;},dispose(){disposed=true;if(context)void context.close().catch(()=>{});}};
}
