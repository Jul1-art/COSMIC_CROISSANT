/** Dynamic, local-browser speech for names and new tour explanations. */
export function createSpaceySpeech(view=window){
 let owned=false;
 function stop(){if(owned)view.speechSynthesis?.cancel();owned=false;}
 return {stop,speak(text,language='en'){
  stop();if(!view.speechSynthesis||!view.SpeechSynthesisUtterance)return false;
  const line=new view.SpeechSynthesisUtterance(text);line.lang=language==='fr'?'fr-FR':'en-US';line.rate=.96;
  const voice=view.speechSynthesis.getVoices().find(voice=>voice.lang.toLowerCase().startsWith(language));if(voice)line.voice=voice;
  owned=true;line.onend=line.onerror=()=>{owned=false;};view.speechSynthesis.speak(line);return true;
 }};
}
