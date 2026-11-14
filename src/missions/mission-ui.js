import {APOLLO_11,MISSIONS,EVENTS,START,END,eventTime,missionState,formatUTC} from './apollo11-data.js';
import {PIN_SVG} from './mission-icons.js';
import {revealMissionElement,reducedMissionMotion} from './mission-motion.js';
import {createPrologue} from '../../intro/prologue-v8.js';
import {appURL} from '../core/paths.js';
export {PIN_SVG};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${({chevron:'<path d="m7 10 5 5 5-5"/>',play:'<path d="m9 5 11 7-11 7Z"/>',read:'<path d="M6 3h9l4 4v14H6Z M10 11h5m-5 4h5"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',pause:'<path d="M8 5v14M16 5v14"/>'})[name]||''}</svg>`;
const button=(label,action,attributes='')=>`<button type="button" data-mission-action="${action}" ${attributes}>${label}</button>`;
let installed=false,popup,actions,panel,explorer,film,filmHost,restoreFocus,anchor;
const pauseAtlas=active=>window.dispatchEvent(new CustomEvent('relic-navigation-state',{detail:{active}}));
function positionPopup(){
 if(!popup||popup.hidden)return;
 const width=popup.offsetWidth,height=popup.offsetHeight+(actions.hidden?0:actions.offsetHeight+8);
 const left=explorer?innerWidth-width-24:(anchor?.x??innerWidth/2)-width/2;
 const top=explorer?84:(anchor?.y??innerHeight/2)-height-48;
 popup.style.left=`${Math.max(12,Math.min(innerWidth-width-12,left))}px`;
 popup.style.top=`${Math.max(72,Math.min(innerHeight-height-16,top))}px`;
 actions.style.left=popup.style.left;actions.style.top=`${parseFloat(popup.style.top)+popup.offsetHeight+8}px`;
}
function closePopup({focus=false}={}){if(!popup)return;popup.hidden=actions.hidden=true;popup.querySelector('[data-mission-action="menu"]').setAttribute('aria-expanded','false');if(focus&&restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});}
function showPopup(nextAnchor){anchor=nextAnchor||anchor;restoreFocus=document.activeElement;popup.hidden=false;positionPopup();requestAnimationFrame(positionPopup);revealMissionElement(popup,{duration:220,distance:5});popup.querySelector('[data-mission-action="menu"]').focus({preventScroll:true});}
function updateTime(time,playing){
 if(!panel)return;const state=missionState(time);
 panel.querySelector('#mission-time-slider').value=state.time;panel.querySelector('#mission-clock').textContent=formatUTC(state.time);
 panel.querySelector('#mission-event-title').textContent=state.event.title;panel.querySelector('#mission-event-text').textContent=state.event.text;
 panel.querySelector('#mission-chapter').value=state.event.id;
 const play=panel.querySelector('[data-mission-action="play"]');play.innerHTML=icon(playing?'pause':'play');play.setAttribute('aria-label',playing?'Mettre en pause':'Lire la mission');play.setAttribute('aria-pressed',String(playing));
}
function startMission(){
 if(explorer)return;
 panel=document.createElement('section');panel.className='atlas-mission-controls';panel.setAttribute('aria-label','Reconstitution Apollo 11');
 panel.innerHTML=`<div class="atlas-mission-heading"><div><span>APOLLO 11</span><h2 id="mission-event-title">Décollage</h2></div>${button(icon('close'),'exit','aria-label="Quitter la reconstitution"')}</div><p id="mission-event-text"></p><div class="atlas-mission-views">${button('Terre–Lune','journey','aria-pressed="true"')}${button('Site d’alunissage','site','aria-pressed="false"')}${button('Recentrer','reset')}</div><div class="atlas-mission-transport">${button(icon('play'),'play','aria-label="Lire la mission" aria-pressed="false"')}<label class="mission-sr-only" for="mission-time-slider">Date de la mission</label><input id="mission-time-slider" type="range" min="${START}" max="${END}" step="1000" value="${START}"><label class="mission-sr-only" for="mission-speed">Vitesse de lecture</label><select id="mission-speed"><option value="3600">1 h / s</option><option value="21600" selected>6 h / s</option><option value="86400">1 j / s</option></select></div><div class="atlas-mission-meta"><output id="mission-clock"></output><label class="mission-sr-only" for="mission-chapter">Étape de la mission</label><select id="mission-chapter">${EVENTS.map(row=>`<option value="${row.id}">${row.title}</option>`).join('')}</select></div><small>Dates historiques · trajectoire schématique · matériel agrandi sur le site</small>`;
 document.body.append(panel);panel.addEventListener('click',handleAction);document.body.classList.add('mission-exploring');
 window.dispatchEvent(new CustomEvent('relic-mission-start',{detail:{connect:controller=>{explorer=controller;updateTime(controller.time,controller.playing);}}}));
 if(!explorer){panel.remove();panel=null;document.body.classList.remove('mission-exploring');return;}
 panel.querySelector('#mission-time-slider').addEventListener('input',event=>{const time=Number(event.target.value);explorer.setPlaying(false);explorer.setTime(time);});
 panel.querySelector('#mission-speed').addEventListener('change',event=>explorer.setSpeed(Number(event.target.value)));
 panel.querySelector('#mission-chapter').addEventListener('change',event=>{const time=eventTime(event.target.value);explorer.setPlaying(false);explorer.setTime(time);});
 positionPopup();revealMissionElement(panel,{duration:320,distance:8});
}
function endMission(){explorer=null;panel?.remove();panel=null;document.body.classList.remove('mission-exploring');closePopup();}
function openVideo(){
 if(filmHost)return;closePopup();explorer?.setPlaying(false);pauseAtlas(true);
 const host=document.createElement('section');host.className='intro mission-shared-film hidden';filmHost=host;document.body.append(host);
 film=createPrologue({element:host,idPrefix:'apollo-',getLanguage:()=> 'fr',reducedMotion:reducedMissionMotion,
  media:{hls:appURL(APOLLO_11.film.path).href,duration:APOLLO_11.film.duration,poster:appURL('assets/missions/apollo-11/launch.jpg').href,endCard:false},
  labels:{introduction:'Apollo 11 · Le film NASA',enter:'Retour à la mission',ready:'Apollo 11 · Archives NASA · 31 min',unavailable:'Le film NASA n’a pas pu être chargé.'},
  onClose(){const instance=film;film=null;filmHost=null;pauseAtlas(false);setTimeout(()=>{instance?.dispose();host.remove();},650);if(restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});}
 });
 film.start();host.querySelector('.prologue-language').hidden=true;
 const close=document.createElement('button');close.type='button';close.className='mission-film-close';close.innerHTML=icon('close');close.setAttribute('aria-label','Fermer le film et revenir à la mission');close.addEventListener('click',()=>film?.finish());host.append(close);
 host.requestFullscreen?.().catch(()=>{});host.querySelector('.prologue-play-film').click();
}
function handleAction(event){
 const target=event.target.closest('[data-mission-action]');if(!target)return;event.preventDefault();const action=target.dataset.missionAction;
 if(action==='close-popup'){closePopup({focus:true});return;}
 if(action==='menu'){const expanded=target.getAttribute('aria-expanded')!=='true';target.setAttribute('aria-expanded',String(expanded));actions.hidden=!expanded;if(expanded){startMission();revealMissionElement(actions,{duration:240,distance:5});}positionPopup();return;}
 if(action==='video'){openVideo();return;}if(action==='exit'){explorer?.stop();return;}
 if(!explorer)return;
 if(action==='play'){if(explorer.time>=END)explorer.setTime(START);explorer.setPlaying(!explorer.playing);}
 if(action==='reset')explorer.reset();
 if(['journey','site'].includes(action)){explorer.setMode(action);panel.querySelectorAll('.atlas-mission-views button').forEach(node=>{if(node.dataset.missionAction!=='reset')node.setAttribute('aria-pressed',String(node===target));});}
}
export function installMissionUI(){
 if(installed)return;installed=true;
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./missions.css',import.meta.url).href;document.head.append(sheet);
 popup=document.createElement('section');popup.className='mission-popup';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');popup.setAttribute('aria-labelledby','mission-popup-title');
 popup.innerHTML=`<header><h2 id="mission-popup-title">Apollo 11</h2><span>NASA</span>${button(icon('close'),'close-popup','aria-label="Fermer la carte de mission"')}</header><dl><div><dt>Alunissage</dt><dd>20 juillet 1969</dd></div><div><dt>Site</dt><dd>Mer de la Tranquillité</dd></div></dl>${button(`<span>Explorer la mission</span>${icon('chevron')}`,'menu','class="mission-menu-toggle" aria-expanded="false" aria-controls="mission-actions"')}`;
 actions=document.createElement('nav');actions.id='mission-actions';actions.className='mission-actions';actions.hidden=true;actions.setAttribute('aria-label','Apollo 11 · vidéo et dossier');
 actions.innerHTML=`${button(`${icon('play')}<span>Voir la vidéo</span>`,'video')}<a href="${appURL('pages/mission.html?mission=apollo-11').href}">${icon('read')}<span>Les détails de la mission</span></a>`;
 document.body.append(popup,actions);popup.addEventListener('click',handleAction);actions.addEventListener('click',handleAction);
 window.addEventListener('relic-mission-open',event=>openMission(event.detail?.id,'summary',event.detail?.anchor));
 window.addEventListener('relic-mission-anchor',event=>{if(!popup.hidden&&!explorer&&event.detail?.id==='apollo-11'){anchor=event.detail.anchor;positionPopup();}});
 window.addEventListener('relic-mission-time',event=>updateTime(event.detail.time,event.detail.playing));
 window.addEventListener('relic-mission-ended',endMission);window.addEventListener('resize',positionPopup);
 document.addEventListener('pointerdown',event=>{if(!popup.hidden&&!popup.contains(event.target)&&!actions.contains(event.target)&&!event.target.closest('.mission-marker'))closePopup();});
 document.addEventListener('keydown',event=>{if(event.key!=='Escape'||filmHost)return;if(!popup.hidden){closePopup({focus:true});event.preventDefault();}else if(explorer){explorer.stop();event.preventDefault();}});
 window.addEventListener('pagehide',event=>{film?.dispose();if(!event.persisted)explorer?.stop(false);});
 const query=new URL(location.href).searchParams;if(query.get('mission')==='apollo-11')queueMicrotask(()=>openMission('apollo-11',query.get('missionView')));
}
export function openMission(id,view='summary',nextAnchor){
 if(!MISSIONS.has(id))return;installMissionUI();
 if(view==='article'){location.assign(appURL('pages/mission.html?mission=apollo-11').href);return;}
 if(view==='video'){openVideo();return;}if(view==='explore'){startMission();return;}showPopup(nextAnchor);
}
