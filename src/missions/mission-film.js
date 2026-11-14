import Hls from '../../intro/assets/vendor/hls.full.mjs';
import {APOLLO_11} from './apollo11-data.js';
import {appURL} from '../core/paths.js';
/** One continuous, locally hosted programme: NASA's JFK archive followed by
 * the complete HQ-194 documentary, with transport leaders and unrelated extras removed. */
export function createMissionFilm(dialog){
 const player=dialog.querySelector('#mission-film-player'),chapters=dialog.querySelector('#mission-film-chapters'),status=dialog.querySelector('#mission-film-status');
 player.innerHTML=`<video controls playsinline preload="metadata" poster="${appURL('assets/missions/apollo-11/launch.jpg').href}" aria-label="Film complet Apollo 11, de JFK au retour sur Terre"></video>`;
 const video=player.querySelector('video'),source=appURL(APOLLO_11.film.path).href;let hls=null,disposed=false;
 chapters.innerHTML='<button type="button" data-film-time="0">01 · Le discours de JFK</button><button type="button" data-film-time="125.736">02 · La mission complète et le retour</button>';
 status.innerHTML=`Un film continu : discours de JFK, préparatifs, décollage, voyage, alunissage, sortie lunaire et retour sur Terre. <a href="${APOLLO_11.film.source}" target="_blank" rel="noopener noreferrer">Film original NASA ↗</a>`;
 const failure=()=>{status.innerHTML=`Le film n’a pas pu être chargé. <a href="${APOLLO_11.film.source}" target="_blank" rel="noopener noreferrer">Ouvrir le documentaire sur le site NASA ↗</a> · <a href="${APOLLO_11.film.jfkSource}" target="_blank" rel="noopener noreferrer">Discours de JFK ↗</a>`;};
 if(video.canPlayType('application/vnd.apple.mpegurl'))video.src=source;
 else if(Hls.isSupported()){hls=new Hls({enableWorker:false,maxBufferLength:24,maxMaxBufferLength:40,maxBufferSize:24*1024*1024,backBufferLength:12});hls.loadSource(source);hls.attachMedia(video);hls.on(Hls.Events.ERROR,(_event,data)=>{if(data.fatal&&!disposed)failure();});}
 else failure();
 const seek=event=>{const button=event.target.closest('[data-film-time]');if(!button)return;const go=()=>{video.currentTime=Number(button.dataset.filmTime);video.play().catch(()=>{});};if(video.readyState>=1)go();else video.addEventListener('loadedmetadata',go,{once:true});};
 chapters.addEventListener('click',seek);video.addEventListener('error',failure);
 const pause=()=>{if(document.hidden)video.pause();};document.addEventListener('visibilitychange',pause);
 dialog.addEventListener('mission-film-dispose',()=>{disposed=true;video.pause();hls?.destroy();video.removeAttribute('src');video.load();chapters.removeEventListener('click',seek);document.removeEventListener('visibilitychange',pause);},{once:true});
 return {video,get hls(){return hls;}};
}
