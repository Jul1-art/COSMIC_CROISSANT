import {discoverMission} from '../core/mission-discoveries.js';
import {getMissionFilm,ensureMissionFilm} from './mission-films.js';
import {localizeMissionElement,missionLanguage,missionText} from './mission-locale.js';
import {makeMissionControlsCollapsible} from './mission-controls.js';
import {openSputnik} from './sputnik.js';
import {APOLLO_11,MISSIONS,EVENTS,START,END,eventTime,missionState,formatUTC} from './apollo11-data.js';
import {PIN_SVG} from './mission-icons.js';
import {revealMissionElement,reducedMissionMotion} from './mission-motion.js';
import {createPrologue,ensurePrologueStyles} from '../../intro/prologue-v8.js';
import {appURL} from '../core/paths.js';
export {PIN_SVG};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${({chevron:'<path d="m7 10 5 5 5-5"/>',play:'<path d="m9 5 11 7-11 7Z"/>',read:'<path d="M6 3h9l4 4v14H6Z M10 11h5m-5 4h5"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',pause:'<path d="M8 5v14M16 5v14"/>'})[name]||''}</svg>`;
const button=(label,action,attributes='')=>`<button type="button" data-mission-action="${action}" ${attributes}>${label}</button>`;
let installed=false,popup,actions,panel,freeBadge,annotations,explorer,film,filmHost,restoreFocus,anchor,launchpadStack,launchpadCard,panelDisclosure,badgeLocale,annotationsLocale;
const pauseAtlas=active=>window.dispatchEvent(new CustomEvent('relic-navigation-state',{detail:{active}}));
function positionPopup(){
 if(!popup||!launchpadStack)return;
 launchpadStack.hidden=popup.hidden&&launchpadCard.hidden;
 const top=innerHeight<420?12:84;
 launchpadStack.style.right=`${innerWidth<=650?12:24}px`;
 launchpadStack.style.left='auto';launchpadStack.style.top=`${top}px`;
 launchpadStack.style.maxHeight=`${Math.max(100,innerHeight-top-(innerWidth<=650?100:42))}px`;
}

function closePopup({focus=false}={}){if(!popup)return;popup.hidden=actions.hidden=true;popup.querySelector('[data-mission-action="menu"]').setAttribute('aria-expanded','false');freeBadge?.querySelector('[data-mission-action="summary"]')?.setAttribute('aria-expanded','false');positionPopup();if(focus){const target=freeBadge?.querySelector('[data-mission-action="summary"]')||restoreFocus;if(target?.isConnected)target.focus({preventScroll:true});}}
function showPopup(nextAnchor){freeBadge?.querySelector('[data-mission-action="summary"]')?.setAttribute('aria-expanded','true');anchor=nextAnchor||anchor;restoreFocus=document.activeElement;popup.hidden=false;const expanded=Boolean(explorer);popup.querySelector('[data-mission-action="menu"]').setAttribute('aria-expanded',String(expanded));actions.hidden=!expanded;positionPopup();requestAnimationFrame(positionPopup);revealMissionElement(popup,{duration:220,distance:5});popup.querySelector('[data-mission-action="menu"]').focus({preventScroll:true});}
function updateTime(time,playing,meta){
 if(!panel)return;const state=missionState(time);
 if(freeBadge&&meta?.mode)freeBadge.querySelector(':scope>span').textContent=meta.mode==='orbit'?'FREE CAMERA · MOON':'FREE CAMERA';
 if(meta?.method)panel.querySelector('#mission-status').textContent=meta.method;
 if(meta?.vehicle){const key=panel.querySelector('#mission-vehicle-key');key.textContent=meta.vehicle;key.disabled=!meta.vehicle.includes('Saturn V');}
 panel.querySelector('#mission-time-slider').value=state.time;panel.querySelector('#mission-clock').textContent=formatUTC(state.time);
 panel.querySelector('#mission-event-title').textContent=state.event.title;panel.querySelector('#mission-event-text').textContent=state.event.text;
 panel.querySelector('#mission-chapter').value=state.event.id;
 const play=panel.querySelector('[data-mission-action="play"]');play.innerHTML=icon(playing?'pause':'play');play.setAttribute('aria-label',playing?'Pause playback':'Play mission');play.setAttribute('aria-pressed',String(playing));
}
function startMission(){
 if(explorer)return;
 panel=document.createElement('section');panel.className='atlas-mission-controls';panel.setAttribute('aria-label','Apollo 11 reconstruction');
 panel.innerHTML=`<div class="atlas-mission-heading"><div><span>APOLLO 11</span><h2 id="mission-event-title">Liftoff</h2></div>${button(icon('close'),'exit','aria-label="Exit reconstruction"')}</div><p id="mission-event-text"></p><button type="button" class="atlas-mission-key" id="mission-vehicle-key" data-mission-action="launchpad" aria-label="Saturn V · View Launch Complex 39A in 3D">● Saturn V · Apollo 11 ↗</button><div class="atlas-mission-views">${button('Earth–Moon','journey','aria-pressed="true"')}${button('Lunar orbit','orbit','aria-pressed="false"')}${button('Landing site','site','aria-pressed="false"')}${button('Recenter','reset')}</div><div class="atlas-mission-transport">${button(icon('play'),'play','aria-label="Play mission" aria-pressed="false"')}<label class="mission-sr-only" for="mission-time-slider">Mission date</label><input id="mission-time-slider" type="range" min="${START}" max="${END}" step="1000" value="${START}"><label class="mission-sr-only" for="mission-speed">Playback speed</label><select id="mission-speed"><option value="1">Real time</option><option value="10">10 s / s</option><option value="60">1 min / s</option><option value="600">10 min / s</option><option value="3600" selected>1 h / s</option><option value="21600">6 h / s</option><option value="86400">1 day / s</option></select></div><div class="atlas-mission-meta"><output id="mission-clock"></output><label class="mission-sr-only" for="mission-chapter">Mission chapter</label><select id="mission-chapter">${EVENTS.map(row=>`<option value="${row.id}">${row.title}</option>`).join('')}</select></div><small id="mission-status" role="status">Physical reconstruction · NASA milestones and JPL ephemerides</small><button type="button" data-mission-action="retry" hidden>Retry</button>`;
 freeBadge=document.createElement('div');freeBadge.className='mission-free-badge';freeBadge.innerHTML='<button type="button" data-mission-action="summary" aria-controls="mission-popup" aria-label="Open the Apollo 11 mission menu" aria-expanded="true">Apollo 11 <span class="mission-menu-caption">Menu</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></button><span>FREE CAMERA</span><small>Drag to orbit · Right-drag to pan · Scroll to zoom</small>';
 annotations=document.createElement('div');annotations.className='mission-annotations';annotations.setAttribute('aria-label','Reconstruction labels');
 for(const id of ['earth','moon','columbia','eagle']){const label=document.createElement(id==='columbia'?'button':'span');label.className='mission-point-label';label.dataset.point=id;label.hidden=true;if(id==='columbia'){label.type='button';label.dataset.missionAction='launchpad';label.setAttribute('aria-label','Saturn V · View Launch Complex 39A in 3D');}else label.setAttribute('aria-hidden','true');annotations.append(label);}
 panelDisclosure=makeMissionControlsCollapsible(panel);badgeLocale=localizeMissionElement(freeBadge);annotationsLocale=localizeMissionElement(annotations);
 document.body.append(panel,freeBadge,annotations);panel.addEventListener('click',handleAction);freeBadge.addEventListener('click',handleAction);annotations.addEventListener('click',handleAction);document.body.classList.add('mission-exploring');
 window.dispatchEvent(new CustomEvent('relic-mission-start',{detail:{connect:controller=>{explorer=controller;updateTime(controller.time,controller.playing);}}}));
 if(!explorer){panel.remove();panel=null;document.body.classList.remove('mission-exploring');return;}
 panel.querySelector('#mission-time-slider').addEventListener('input',event=>{const time=Number(event.target.value);explorer.setPlaying(false);explorer.setTime(time);});
 panel.querySelector('#mission-speed').addEventListener('change',event=>explorer.setSpeed(Number(event.target.value)));
 panel.querySelector('#mission-chapter').addEventListener('change',event=>{const time=eventTime(event.target.value);explorer.setPlaying(false);explorer.setTime(time);});
 if(popup.hidden)showPopup();positionPopup();revealMissionElement(panel,{duration:320,distance:8});
}
function endMission(){panelDisclosure?.dispose();badgeLocale?.dispose();annotationsLocale?.dispose();explorer=null;panel?.remove();panel=null;freeBadge?.remove();freeBadge=null;annotations?.remove();annotations=null;document.body.classList.remove('mission-exploring');closePopup();}
export async function openVideo(id='apollo-11'){
 if(filmHost)return;
 const definition=getMissionFilm(id)||await ensureMissionFilm(id);if(!definition||filmHost)return;discoverMission(id);const media=definition.media;
 const returnFocus=document.activeElement,overflow=document.body.style.overflow;explorer?.setPlaying(false);pauseAtlas(true);
 const host=document.createElement('section');host.className='intro mission-shared-film';host.style.cssText='position:fixed;inset:0;width:100%;height:100dvh;z-index:11000;background:#000;color:#fff;isolation:isolate;';filmHost=host;document.body.style.overflow='hidden';document.body.append(host);let instance=null,closed=false;
 function closeFilm(){if(closed)return;closed=true;if(filmHost===host){film=null;filmHost=null;}if(document.fullscreenElement===host)document.exitFullscreen?.().catch(()=>{});document.body.style.overflow=overflow;pauseAtlas(false);setTimeout(()=>{instance?.dispose();host.remove();},650);positionPopup();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
 const close=document.createElement('button');close.type='button';close.className='mission-film-close';close.innerHTML=icon('close');close.style.cssText='position:absolute;z-index:20;top:24px;right:24px;width:36px;height:36px;border:1px solid #ffffff60;border-radius:50%;background:#000b;color:#fff;';close.setAttribute('aria-label',missionText('Close the film and return to the mission'));close.onclick=()=>instance?instance.finish():closeFilm();host.append(close);
 host.requestFullscreen?.().catch(()=>{});
 try{await ensurePrologueStyles(document);if(closed)return;
  instance=createPrologue({element:host,idPrefix:definition.prefix||id+'-',getLanguage:missionLanguage,reducedMotion:reducedMissionMotion,media,
   labels:{introduction:missionText(definition.title),enter:missionText('Back to mission'),ready:missionText(definition.ready),unavailable:missionText('The film could not be loaded.')},onClose:closeFilm});
  film=instance;instance.start();host.querySelector('.prologue-language').hidden=true;host.append(close);host.querySelector('.prologue-play-film').click();
 }catch{if(closed)return;const status=document.createElement('p');status.setAttribute('role','alert');status.textContent=missionText('The film could not be loaded.');status.style.cssText='position:absolute;inset:45% 20px auto;text-align:center;font:16px system-ui;';host.append(status);}
}

function handleAction(event){
 const target=event.target.closest('[data-mission-action]');if(!target)return;event.preventDefault();const action=target.dataset.missionAction;
 if(action==='launchpad'){window.dispatchEvent(new CustomEvent('relic-launchpad-command',{detail:{action:'open'}}));return;}
 if(action==='summary'){if(popup.hidden)showPopup();else closePopup({focus:true});return;}
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
 popup.innerHTML=`<header><h2 id="mission-popup-title">Apollo 11</h2><span>NASA</span>${button(icon('close'),'close-popup','aria-label="Close mission card"')}</header><dl><div><dt>Lunar landing</dt><dd>20 July 1969</dd></div><div><dt>Site</dt><dd>Sea of Tranquility</dd></div></dl>${button(`<span>Explore mission</span>${icon('chevron')}`,'menu','class="mission-menu-toggle" aria-expanded="false" aria-controls="mission-actions"')}`;
 actions=document.createElement('nav');actions.id='mission-actions';actions.className='mission-actions';actions.hidden=true;actions.setAttribute('aria-label','Apollo 11 · film and dossier');
 actions.innerHTML=`${button(`${icon('play')}<span>Watch film</span>`,'video')}<a href="${appURL('pages/mission.html?mission=apollo-11').href}">${icon('read')}<span>Mission details</span></a>`;
 document.body.append(popup,actions);popup.addEventListener('click',handleAction);actions.addEventListener('click',handleAction);
 const launchpad=document.createElement('section');launchpadCard=launchpad;launchpad.id='mission-launchpad';launchpad.className='mission-popup mission-launchpad';launchpad.hidden=true;launchpad.setAttribute('aria-label','Apollo 11 launch site');
 launchpad.innerHTML=`<header><h2>LC-39A</h2><span>KENNEDY SPACE CENTER</span></header><p>Apollo 11 launch site · 16 July 1969</p><p class="launchpad-source" role="status" aria-live="polite"></p><small>Present-day 3D imagery. These tiles do not reconstruct the 1969 facilities or Saturn V.</small><button type="button" class="mission-menu-toggle" data-launchpad="close">← Back to mission</button><button type="button" class="mission-menu-toggle" data-launchpad="retry" hidden>Retry 3D tiles</button>`;
 launchpadStack=document.createElement('div');launchpadStack.className='mission-card-stack';launchpadStack.hidden=true;launchpadStack.append(popup,actions,launchpad);document.body.append(launchpadStack);launchpad.addEventListener('click',event=>{const action=event.target.closest('[data-launchpad]')?.dataset.launchpad;if(action)window.dispatchEvent(new CustomEvent('relic-launchpad-command',{detail:{action}}));});
 window.addEventListener('relic-launchpad-state',event=>{const {active,status}=event.detail;if(active&&popup.hidden)showPopup();launchpad.hidden=!active;positionPopup();launchpad.querySelector('.launchpad-source').textContent=status==='ready'?'Google Photorealistic 3D Tiles · Cesium ion':status==='streaming'?'Google 3D · Cesium ion · loading detail':status==='error'?'3D tiles are unavailable for this view.':'Loading Cesium ion 3D tiles…';launchpad.querySelector('[data-launchpad="retry"]').hidden=status!=='error';});
 window.addEventListener('relic-mission-video',event=>{if(getMissionFilm(event.detail?.id))openVideo(event.detail.id);});
 window.addEventListener('relic-mission-open',event=>openMission(event.detail?.id,'summary',event.detail?.anchor));
 window.addEventListener('relic-mission-anchor',event=>{if(!popup.hidden&&!explorer&&event.detail?.id==='apollo-11'){anchor=event.detail.anchor;positionPopup();}});
 window.addEventListener('relic-mission-time',event=>updateTime(event.detail.time,event.detail.playing,event.detail.meta));
 window.addEventListener('relic-mission-annotations',event=>{if(!annotations)return;annotations.querySelectorAll('[data-point]').forEach(node=>{const label=event.detail.find(row=>row.id===node.dataset.point);node.hidden=!label?.visible;if(node.tagName==='BUTTON'){node.disabled=label?.text!=='Saturn V';node.tabIndex=node.disabled?-1:0;}if(label?.visible){if(node.textContent!==label.text)node.textContent=label.text;node.style.left=label.x.toFixed(1)+'px';node.style.top=label.y.toFixed(1)+'px';}});});
 window.addEventListener('relic-mission-status',event=>{
  if(!panel)return;const {status,message}=event.detail,disabled=['loading','error'].includes(status);
  panel.setAttribute('aria-busy',String(status==='loading'));
  panel.querySelectorAll('button,input,select').forEach(node=>{if(!['exit','retry'].includes(node.dataset.missionAction)&&!node.classList.contains('mission-controls-collapse'))node.disabled=disabled;});
  panel.querySelector('[data-mission-action="retry"]').hidden=status!=='error';
  if(message)panel.querySelector('#mission-status').textContent=message;
 });
 window.addEventListener('relic-mission-ended',endMission);window.addEventListener('resize',()=>{positionPopup();requestAnimationFrame(positionPopup);});
 // Keep the mission card pinned while the user operates the scene or timeline.
 // Closing it is an explicit action (close button, Escape, or leaving the mission).
 document.addEventListener('keydown',event=>{if(event.key!=='Escape'||filmHost||event.defaultPrevented||event.target.closest?.('input,select,textarea,[contenteditable=true],[role=listbox]'))return;if(document.body.dataset.missionLaunchpad==='active'){window.dispatchEvent(new CustomEvent('relic-launchpad-command',{detail:{action:'close'}}));event.preventDefault();return;}if(!popup.hidden){closePopup({focus:true});event.preventDefault();}else if(explorer){if(explorer.active||explorer.starting)explorer.stop();else endMission();event.preventDefault();}});
 window.addEventListener('pagehide',event=>{film?.dispose();if(!event.persisted)explorer?.stop(false);});
 const query=new URL(location.href).searchParams;if(query.get('mission'))queueMicrotask(()=>openMission(query.get('mission'),query.get('missionView')||'summary'));
}
export function openMission(id,view='summary',nextAnchor){
 if(id==='sputnik-1'){installMissionUI();closePopup();openSputnik(nextAnchor);return;}
 if(!MISSIONS.has(id)){if(/^[a-z0-9-]+$/.test(id||'')){installMissionUI();closePopup();void import('./archive-ui.js').then(module=>module.openArchiveMission(id,view));}return;}discoverMission(id);installMissionUI();
 if(view==='article'){location.assign(appURL('pages/mission.html?mission=apollo-11').href);return;}
 if(view==='video'){openVideo();return;}if(view==='explore'){startMission();return;}showPopup(nextAnchor);
}
