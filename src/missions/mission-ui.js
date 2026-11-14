import {openSputnik} from './sputnik.js';
import {APOLLO_11,MISSIONS,EVENTS,START,END,eventTime,missionState,formatUTC} from './apollo11-data.js';
import {PIN_SVG} from './mission-icons.js';
import {revealMissionElement,reducedMissionMotion} from './mission-motion.js';
import {createPrologue} from '../../intro/prologue-v8.js';
import {appURL} from '../core/paths.js';
export {PIN_SVG};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${({chevron:'<path d="m7 10 5 5 5-5"/>',play:'<path d="m9 5 11 7-11 7Z"/>',read:'<path d="M6 3h9l4 4v14H6Z M10 11h5m-5 4h5"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',pause:'<path d="M8 5v14M16 5v14"/>'})[name]||''}</svg>`;
const button=(label,action,attributes='')=>`<button type="button" data-mission-action="${action}" ${attributes}>${label}</button>`;
let installed=false,popup,actions,panel,freeBadge,annotations,explorer,film,filmHost,restoreFocus,anchor,launchpadStack;
const pauseAtlas=active=>window.dispatchEvent(new CustomEvent('relic-navigation-state',{detail:{active}}));
function positionPopup(){
 if(!popup)return;
 if(launchpadStack&&!launchpadStack.hidden){const top=innerHeight<420?12:84;launchpadStack.style.left=`${Math.max(12,innerWidth-launchpadStack.offsetWidth-(innerWidth<=650?12:24))}px`;launchpadStack.style.top=`${top}px`;launchpadStack.style.maxHeight=`${Math.max(100,innerHeight-top-(innerWidth<=650?100:42))}px`;return;}
 if(popup.hidden)return;
 const width=popup.offsetWidth,height=popup.offsetHeight+(actions.hidden?0:actions.offsetHeight+8);
 const left=explorer?innerWidth-width-24:(anchor?.x??innerWidth/2)-width/2;
 const top=explorer?84:(anchor?.y??innerHeight/2)-height-48;
 popup.style.left=`${Math.max(12,Math.min(innerWidth-width-12,left))}px`;
 popup.style.top=`${Math.max(innerHeight<420?12:72,Math.min(innerHeight-height-16,top))}px`;
 actions.style.left=popup.style.left;actions.style.top=`${parseFloat(popup.style.top)+popup.offsetHeight+8}px`;
}
function closePopup({focus=false}={}){if(!popup)return;popup.hidden=actions.hidden=true;popup.querySelector('[data-mission-action="menu"]').setAttribute('aria-expanded','false');if(focus){const target=freeBadge?.querySelector('[data-mission-action="summary"]')||restoreFocus;if(target?.isConnected)target.focus({preventScroll:true});}}
function showPopup(nextAnchor){anchor=nextAnchor||anchor;restoreFocus=document.activeElement;popup.hidden=false;const expanded=Boolean(explorer);popup.querySelector('[data-mission-action="menu"]').setAttribute('aria-expanded',String(expanded));actions.hidden=!expanded;positionPopup();requestAnimationFrame(positionPopup);revealMissionElement(popup,{duration:220,distance:5});popup.querySelector('[data-mission-action="menu"]').focus({preventScroll:true});}
function updateTime(time,playing,meta){
 if(!panel)return;const state=missionState(time);
 if(freeBadge&&meta?.mode)freeBadge.querySelector(':scope>span').textContent=meta.mode==='orbit'?'CAMÉRA LIBRE · LUNE':'CAMÉRA LIBRE';
 if(meta?.method)panel.querySelector('#mission-status').textContent=meta.method;
 if(meta?.vehicle){const key=panel.querySelector('#mission-vehicle-key');key.textContent=meta.vehicle;key.disabled=!meta.vehicle.includes('Saturn V');}
 panel.querySelector('#mission-time-slider').value=state.time;panel.querySelector('#mission-clock').textContent=formatUTC(state.time);
 panel.querySelector('#mission-event-title').textContent=state.event.title;panel.querySelector('#mission-event-text').textContent=state.event.text;
 panel.querySelector('#mission-chapter').value=state.event.id;
 const play=panel.querySelector('[data-mission-action="play"]');play.innerHTML=icon(playing?'pause':'play');play.setAttribute('aria-label',playing?'Mettre en pause':'Lire la mission');play.setAttribute('aria-pressed',String(playing));
}
function startMission(){
 if(explorer)return;
 panel=document.createElement('section');panel.className='atlas-mission-controls';panel.setAttribute('aria-label','Reconstitution Apollo 11');
 panel.innerHTML=`<div class="atlas-mission-heading"><div><span>APOLLO 11</span><h2 id="mission-event-title">Décollage</h2></div>${button(icon('close'),'exit','aria-label="Quitter la reconstitution"')}</div><p id="mission-event-text"></p><button type="button" class="atlas-mission-key" id="mission-vehicle-key" data-mission-action="launchpad" aria-label="Saturn V · Voir le pas de tir LC-39A en 3D">● Saturn V · Apollo 11 ↗</button><div class="atlas-mission-views">${button('Terre–Lune','journey','aria-pressed="true"')}${button('Orbite lunaire','orbit','aria-pressed="false"')}${button('Site d’alunissage','site','aria-pressed="false"')}${button('Recentrer','reset')}</div><div class="atlas-mission-transport">${button(icon('play'),'play','aria-label="Lire la mission" aria-pressed="false"')}<label class="mission-sr-only" for="mission-time-slider">Date de la mission</label><input id="mission-time-slider" type="range" min="${START}" max="${END}" step="1000" value="${START}"><label class="mission-sr-only" for="mission-speed">Vitesse de lecture</label><select id="mission-speed"><option value="1">Temps réel</option><option value="10">10 s / s</option><option value="60">1 min / s</option><option value="600">10 min / s</option><option value="3600" selected>1 h / s</option><option value="21600">6 h / s</option><option value="86400">1 j / s</option></select></div><div class="atlas-mission-meta"><output id="mission-clock"></output><label class="mission-sr-only" for="mission-chapter">Étape de la mission</label><select id="mission-chapter">${EVENTS.map(row=>`<option value="${row.id}">${row.title}</option>`).join('')}</select></div><small id="mission-status" role="status">Reconstruction physique · jalons NASA et éphémérides JPL</small><button type="button" data-mission-action="retry" hidden>Réessayer</button>`;
 freeBadge=document.createElement('div');freeBadge.className='mission-free-badge';freeBadge.innerHTML='<button type="button" data-mission-action="summary" aria-controls="mission-popup" aria-label="Ouvrir la carte et le menu Apollo 11">APOLLO 11 <span aria-hidden="true">⌄</span></button><span>CAMÉRA LIBRE</span><small>Glisser pour tourner · Clic droit pour déplacer · Molette pour avancer</small>';
 annotations=document.createElement('div');annotations.className='mission-annotations';annotations.setAttribute('aria-label','Repères de la reconstitution');
 for(const id of ['earth','moon','columbia','eagle']){const label=document.createElement(id==='columbia'?'button':'span');label.className='mission-point-label';label.dataset.point=id;label.hidden=true;if(id==='columbia'){label.type='button';label.dataset.missionAction='launchpad';label.setAttribute('aria-label','Saturn V · Voir le pas de tir LC-39A en 3D');}else label.setAttribute('aria-hidden','true');annotations.append(label);}
 document.body.append(panel,freeBadge,annotations);panel.addEventListener('click',handleAction);freeBadge.addEventListener('click',handleAction);annotations.addEventListener('click',handleAction);document.body.classList.add('mission-exploring');
 window.dispatchEvent(new CustomEvent('relic-mission-start',{detail:{connect:controller=>{explorer=controller;updateTime(controller.time,controller.playing);}}}));
 if(!explorer){panel.remove();panel=null;document.body.classList.remove('mission-exploring');return;}
 panel.querySelector('#mission-time-slider').addEventListener('input',event=>{const time=Number(event.target.value);explorer.setPlaying(false);explorer.setTime(time);});
 panel.querySelector('#mission-speed').addEventListener('change',event=>explorer.setSpeed(Number(event.target.value)));
 panel.querySelector('#mission-chapter').addEventListener('change',event=>{const time=eventTime(event.target.value);explorer.setPlaying(false);explorer.setTime(time);});
 if(popup.hidden)showPopup();positionPopup();revealMissionElement(panel,{duration:320,distance:8});
}
function endMission(){explorer=null;panel?.remove();panel=null;freeBadge?.remove();freeBadge=null;annotations?.remove();annotations=null;document.body.classList.remove('mission-exploring');closePopup();}
export function openVideo(id='apollo-11'){
 const sputnik=id==='sputnik-1',media=sputnik?{hls:appURL('assets/missions/sputnik-1/film/index.m3u8').href,duration:113.27,bitrate:535000,poster:appURL('assets/missions/sputnik-1/launch.jpg').href,endCard:false,captions:{fr:[],en:[]}}:{hls:appURL(APOLLO_11.film.path).href,duration:APOLLO_11.film.duration,poster:appURL('assets/missions/apollo-11/launch.jpg').href,endCard:false};
 if(filmHost)return;const returnFocus=document.activeElement;explorer?.setPlaying(false);pauseAtlas(true);
 const host=document.createElement('section');host.className='intro mission-shared-film hidden';filmHost=host;document.body.append(host);
 film=createPrologue({element:host,idPrefix:sputnik?'sputnik-':'apollo-',getLanguage:()=> 'fr',reducedMotion:reducedMissionMotion,
  media,
  labels:{introduction:sputnik?'Spoutnik 1 · La mission en images':'Apollo 11 · Le film NASA',enter:'Retour à la mission',ready:sputnik?'Spoutnik 1 · Archives et récit en images · 1 min 53':'Apollo 11 · Archives NASA · 31 min',unavailable:'Le film n’a pas pu être chargé.'},
  onClose(){const instance=film;film=null;filmHost=null;pauseAtlas(false);setTimeout(()=>{instance?.dispose();host.remove();},650);positionPopup();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
 });
 film.start();host.querySelector('.prologue-language').hidden=true;
 const close=document.createElement('button');close.type='button';close.className='mission-film-close';close.innerHTML=icon('close');close.setAttribute('aria-label','Fermer le film et revenir à la mission');close.addEventListener('click',()=>film?.finish());host.append(close);
 host.requestFullscreen?.().catch(()=>{});host.querySelector('.prologue-play-film').click();
}
function handleAction(event){
 const target=event.target.closest('[data-mission-action]');if(!target)return;event.preventDefault();const action=target.dataset.missionAction;
 if(action==='launchpad'){window.dispatchEvent(new CustomEvent('relic-launchpad-command',{detail:{action:'open'}}));return;}
 if(action==='summary'){showPopup();return;}
 if(action==='close-popup'){closePopup({focus:true});return;}
 if(action==='menu'){const expanded=target.getAttribute('aria-expanded')!=='true';target.setAttribute('aria-expanded',String(expanded));actions.hidden=!expanded;if(expanded){startMission();revealMissionElement(actions,{duration:240,distance:5});}positionPopup();return;}
 if(action==='retry'){void explorer?.start();return;}
 if(action==='video'){openVideo();return;}if(action==='exit'){if(explorer?.active||explorer?.starting)explorer.stop();else endMission();return;}
 if(!explorer)return;
 if(action==='play'){if(explorer.time>=END)explorer.setTime(START);explorer.setPlaying(!explorer.playing);}
 if(action==='reset')explorer.reset();
 if(['journey','orbit','site'].includes(action)){explorer.setMode(action);panel.querySelectorAll('.atlas-mission-views button').forEach(node=>{if(node.dataset.missionAction!=='reset')node.setAttribute('aria-pressed',String(node===target));});}
}
export function installMissionUI(){
 if(installed)return;installed=true;
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./missions.css',import.meta.url).href;document.head.append(sheet);
 popup=document.createElement('section');popup.className='mission-popup';popup.id='mission-popup';popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');popup.setAttribute('aria-labelledby','mission-popup-title');
 popup.innerHTML=`<header><h2 id="mission-popup-title">Apollo 11</h2><span>NASA</span>${button(icon('close'),'close-popup','aria-label="Fermer la carte de mission"')}</header><dl><div><dt>Alunissage</dt><dd>20 juillet 1969</dd></div><div><dt>Site</dt><dd>Mer de la Tranquillité</dd></div></dl>${button(`<span>Explorer la mission</span>${icon('chevron')}`,'menu','class="mission-menu-toggle" aria-expanded="false" aria-controls="mission-actions"')}`;
 actions=document.createElement('nav');actions.id='mission-actions';actions.className='mission-actions';actions.hidden=true;actions.setAttribute('aria-label','Apollo 11 · vidéo et dossier');
 actions.innerHTML=`${button(`${icon('play')}<span>Voir la vidéo</span>`,'video')}<a href="${appURL('pages/mission.html?mission=apollo-11').href}">${icon('read')}<span>Les détails de la mission</span></a>`;
 document.body.append(popup,actions);popup.addEventListener('click',handleAction);actions.addEventListener('click',handleAction);
 const launchpad=document.createElement('section');launchpad.id='mission-launchpad';launchpad.className='mission-popup mission-launchpad';launchpad.hidden=true;launchpad.setAttribute('aria-label','Pas de tir Apollo 11');
 launchpad.innerHTML=`<header><h2>LC-39A</h2><span>KENNEDY SPACE CENTER</span></header><p>Pas de tir d’Apollo 11 · 16 juillet 1969</p><p class="launchpad-source" role="status" aria-live="polite"></p><small>Imagerie 3D actuelle du site. Les installations de 1969 et Saturn V ne sont pas reconstituées par ces tuiles.</small><button type="button" class="mission-menu-toggle" data-launchpad="close">← Retour à la mission</button><button type="button" class="mission-menu-toggle" data-launchpad="retry" hidden>Réessayer les tuiles 3D</button>`;
 launchpadStack=document.createElement('div');launchpadStack.className='mission-card-stack';launchpadStack.hidden=true;document.body.append(launchpadStack,launchpad);launchpad.addEventListener('click',event=>{const action=event.target.closest('[data-launchpad]')?.dataset.launchpad;if(action)window.dispatchEvent(new CustomEvent('relic-launchpad-command',{detail:{action}}));});
 window.addEventListener('relic-launchpad-state',event=>{const {active,status}=event.detail;if(active&&launchpadStack.hidden){if(popup.hidden)showPopup();launchpadStack.append(popup,actions,launchpad);launchpadStack.hidden=false;}else if(!active&&!launchpadStack.hidden){document.body.append(popup,actions,launchpad);launchpadStack.hidden=true;}launchpad.hidden=!active;positionPopup();launchpad.querySelector('.launchpad-source').textContent=status==='ready'?'Google Photorealistic 3D Tiles · Cesium ion':status==='streaming'?'Google 3D · Cesium ion · détails en chargement':status==='error'?'Les tuiles 3D sont indisponibles pour cette vue.':'Chargement des tuiles 3D Cesium ion…';launchpad.querySelector('[data-launchpad="retry"]').hidden=status!=='error';});
 window.addEventListener('relic-mission-video',event=>{if(event.detail?.id==='sputnik-1')openVideo('sputnik-1');});
 window.addEventListener('relic-mission-open',event=>openMission(event.detail?.id,'summary',event.detail?.anchor));
 window.addEventListener('relic-mission-anchor',event=>{if(!popup.hidden&&!explorer&&event.detail?.id==='apollo-11'){anchor=event.detail.anchor;positionPopup();}});
 window.addEventListener('relic-mission-time',event=>updateTime(event.detail.time,event.detail.playing,event.detail.meta));
 window.addEventListener('relic-mission-annotations',event=>{if(!annotations)return;annotations.querySelectorAll('[data-point]').forEach(node=>{const label=event.detail.find(row=>row.id===node.dataset.point);node.hidden=!label?.visible;if(node.tagName==='BUTTON'){node.disabled=label?.text!=='Saturn V';node.tabIndex=node.disabled?-1:0;}if(label?.visible){if(node.textContent!==label.text)node.textContent=label.text;node.style.left=label.x.toFixed(1)+'px';node.style.top=label.y.toFixed(1)+'px';}});});
 window.addEventListener('relic-mission-status',event=>{
  if(!panel)return;const {status,message}=event.detail,disabled=['loading','error'].includes(status);
  panel.setAttribute('aria-busy',String(status==='loading'));
  panel.querySelectorAll('button,input,select').forEach(node=>{if(!['exit','retry'].includes(node.dataset.missionAction))node.disabled=disabled;});
  panel.querySelector('[data-mission-action="retry"]').hidden=status!=='error';
  if(message)panel.querySelector('#mission-status').textContent=message;
 });
 window.addEventListener('relic-mission-ended',endMission);window.addEventListener('resize',()=>{positionPopup();requestAnimationFrame(positionPopup);});
 // Keep the mission card pinned while the user operates the scene or timeline.
 // Closing it is an explicit action (close button, Escape, or leaving the mission).
 document.addEventListener('keydown',event=>{if(event.key!=='Escape'||filmHost||event.defaultPrevented||event.target.closest?.('input,select,textarea,[contenteditable=true],[role=listbox]'))return;if(document.body.dataset.missionLaunchpad==='active'){window.dispatchEvent(new CustomEvent('relic-launchpad-command',{detail:{action:'close'}}));event.preventDefault();return;}if(!popup.hidden){closePopup({focus:true});event.preventDefault();}else if(explorer){if(explorer.active||explorer.starting)explorer.stop();else endMission();event.preventDefault();}});
 window.addEventListener('pagehide',event=>{film?.dispose();if(!event.persisted)explorer?.stop(false);});
 const query=new URL(location.href).searchParams;if(query.get('mission')==='apollo-11')queueMicrotask(()=>openMission('apollo-11',query.get('missionView')));
}
export function openMission(id,view='summary',nextAnchor){
 if(id==='sputnik-1'){installMissionUI();closePopup();openSputnik(nextAnchor);return;}
 if(!MISSIONS.has(id))return;installMissionUI();
 if(view==='article'){location.assign(appURL('pages/mission.html?mission=apollo-11').href);return;}
 if(view==='video'){openVideo();return;}if(view==='explore'){startMission();return;}showPopup(nextAnchor);
}
