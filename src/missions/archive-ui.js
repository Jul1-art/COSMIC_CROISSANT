import {discoverMission} from '../core/mission-discoveries.js';
import {archiveTarget,archiveLagrange} from './archive-targets.js';
import {loadJSON,asset,DESTINATIONS,escapeHTML as e} from './catalog.js';
import {archiveEvents,archiveFact} from './archive-data.js';
import {appURL} from '../core/paths.js';
import {openVideo} from './mission-ui.js';
import {revealMissionElement} from './mission-motion.js';
import {makeMissionControlsCollapsible} from './mission-controls.js';
import {localizeMissionElement} from './mission-locale.js';
import {isDistantProbe,distantEvents} from './distant-data.js';
import {createDistantReadout} from './distant-readout.js';
import {getMissionPlanet,getMissionSite} from './mission-sites.js';
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${({close:'<path d="m6 6 12 12M6 18 18 6"/>',play:'<path d="m9 5 11 7-11 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',chevron:'<path d="m7 10 5 5 5-5"/>',read:'<path d="M6 3h9l4 4v14H6Z M10 11h5m-5 4h5"/>'})[name]}</svg>`;
const button=(label,action,attributes='')=>`<button type="button" data-archive-action="${action}" ${attributes}>${label}</button>`;
let instance=null,generation=0;
export async function openArchiveMission(id,view='summary'){
 const token=++generation;
 if(instance?.record.id===id){instance.card.hidden=false;instance.stack.hidden=false;if(['explore','spacecraft','distant'].includes(view))instance.start(view==='spacecraft'?'site':view==='distant'?'orbit':'journey');return;}
 instance?.dispose();instance=null;
 const record=await loadJSON(`${id}.json`);if(token!==generation)return;discoverMission(record.id);
 if(view==='video'){openVideo(id);return;}
 if(view==='article'){location.assign(appURL(`pages/exploration.html?mission=${id}`).href);return;}
 const distant=isDistantProbe(id),events=distant?distantEvents(record,archiveEvents(record)):archiveEvents(record);if(!events.length)events.push({id:'0',date:archiveFact(record,/^Launch/i),title:record.name,text:record.summary});
 const stack=document.createElement('div');stack.className='mission-card-stack';stack.style.cssText='right:24px;top:84px;max-height:calc(100dvh - 120px)';
 const card=document.createElement('section');card.className='mission-popup';card.id='archive-mission-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','false');card.setAttribute('aria-labelledby','archive-mission-title');
 const agencyText=archiveFact(record,/agence/i).split(/[—(]/)[0].trim();const agency=/union soviétique/i.test(agencyText)?'URSS':agencyText.slice(0,35);
 card.innerHTML=`<header><h2 id="archive-mission-title">${e(record.name)}</h2><span>${e(agency)}</span>${button(icon('close'),'close','aria-label="Close mission card"')}</header><dl><div><dt>Launch</dt><dd>${e(record.year)}</dd></div><div><dt>Destination</dt><dd>${distant?'Deep space':e(archiveTarget(record)?.name||(archiveLagrange(record)?archiveLagrange(record).point+' Soleil–Terre':DESTINATIONS[record.body]))}</dd></div></dl>${button(`<span>Explore mission</span>${icon('chevron')}`,'menu','class="mission-menu-toggle" aria-expanded="false" aria-controls="archive-mission-actions"')}`;
 const actions=document.createElement('nav');actions.className='mission-actions';actions.id='archive-mission-actions';actions.hidden=true;actions.setAttribute('aria-label',`${record.name} · film et dossier`);
 actions.innerHTML=`${button(`${icon('play')}<span>Watch film</span>`,'film')}<a href="${appURL(`pages/exploration.html?mission=${id}`)}">${icon('read')}<span>Mission details</span></a>${button(`${icon('play')}<span>3D visualization</span>`,'visualize')}`;
 stack.append(card,actions);document.body.append(stack);
 let controller=null,panel=null,badge=null,starting=false,disposed=false,disclosure=null,annotations=null,badgeLocale=null;
 const cardLocale=localizeMissionElement(stack);
 const readout=distant?createDistantReadout(record,card):null;
 function report({progress=0,playing=false,status='',mode='journey',...state}={}){
  readout?.update({...state,mode});
  if(!panel)return;for(const input of panel.querySelectorAll('button,input,select'))input.disabled=false;const index=Math.min(events.length-1,Math.floor(progress)),event=events[index];
  panel.querySelector('#archive-event-title').textContent=event.title;panel.querySelector('#archive-event-text').textContent=event.text;
  panel.querySelector('#archive-time').value=progress;panel.querySelector('#archive-clock').textContent=distant&&state.time?new Date(state.time).toISOString().replace('T',' ').slice(0,19)+' UTC':event.date;
  panel.querySelector('#archive-chapter').value=String(index);panel.querySelector('[data-archive-action=play]').innerHTML=icon(playing?'pause':'play');panel.querySelector('[data-archive-action=play]').setAttribute('aria-label',playing?'Pause mission':'Play mission');
  if(status)panel.querySelector('#archive-status').textContent=status;
  if(distant){panel.dataset.distantMode=mode;panel.querySelector('.distant-mobile-metrics').textContent=readout.summary();}
  panel.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));
 }
 async function start(initialMode=null){
  if(controller){if(initialMode&&controller.active){controller.setPlaying(false);controller.setMode(initialMode);}return;}if(starting)return;starting=true;actions.hidden=false;card.querySelector('[data-archive-action=menu]').setAttribute('aria-expanded','true');
  window.dispatchEvent(new CustomEvent('relic-sputnik-command',{detail:{action:'stop'}}));
  panel=document.createElement('section');panel.className='atlas-mission-controls';panel.setAttribute('aria-label',`${record.name} · reconstruction 3D`);
  panel.innerHTML=`<div class="atlas-mission-heading"><div><span>${e(record.name.toUpperCase())}</span><h2 id="archive-event-title">${e(events[0].title)}</h2></div>${button(icon('close'),'exit','aria-label="Exit reconstruction"')}</div><p id="archive-event-text">${e(events[0].text)}</p><div class="atlas-mission-views">${button('Mission overview','journey','data-view="journey" aria-pressed="true"')}${button('Around the destination','orbit','data-view="orbit" aria-pressed="false"')}${button('Spacecraft and instruments','site','data-view="site" aria-pressed="false"')}${button('Reset camera','reset')}</div><div class="atlas-mission-transport">${button(icon('play'),'play','aria-label="Play mission"')}<label class="mission-sr-only" for="archive-time">Mission position</label><input id="archive-time" type="range" min="0" max="${Math.max(1,events.length-1)}" step="0.001" value="0"><label class="mission-sr-only" for="archive-speed">Playback speed</label><select id="archive-speed"><option value=".5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option><option value="4">×4</option></select></div><div class="atlas-mission-meta"><output id="archive-clock">${e(events[0].date)}</output><label class="mission-sr-only" for="archive-chapter">Mission chapter</label><select id="archive-chapter">${events.map((ev,i)=>`<option value="${i}">${e(ev.title)}</option>`).join('')}</select></div><small id="archive-status" role="status">Reconstruction pédagogique · jalons de la fiche mission · préparation de l’engin…</small>`;
  if(distant){panel.querySelector('[data-view=journey]').textContent='Journey from Earth';panel.querySelector('[data-view=orbit]').textContent='Deep-space position';document.body.classList.add('distant-mission-active');const compact=document.createElement('p');compact.className='distant-mobile-metrics';panel.querySelector('#archive-event-text').after(compact);}
  badge=document.createElement('div');badge.className='mission-free-badge archive-mission-badge';badge.innerHTML=`${button(`<span class="archive-mission-name">${e(record.name)}</span> <span class="mission-menu-caption">Menu</span>${icon('chevron')}`,'summary','aria-expanded="true" aria-controls="archive-mission-card"')}<span>FREE CAMERA</span><small>Drag to rotate · Right-drag to pan · Scroll to zoom</small>`;
  annotations=document.createElement('div');annotations.className='mission-annotations';for(const id of ['target','craft']){const label=document.createElement('span');label.className='mission-point-label';label.dataset.archivePoint=id;label.hidden=true;annotations.append(label);}document.body.append(panel,badge,annotations);window.addEventListener('relic-mission-annotations',updateAnnotations);document.body.classList.add('mission-exploring');panel.addEventListener('click',action);badge.addEventListener('click',action);
  panel.querySelector('#archive-time').oninput=event=>{const value=Number(event.target.value);controller?.setPlaying(false);controller?.setProgress(value);};
  panel.querySelector('#archive-speed').onchange=event=>controller?.setSpeed(Number(event.target.value));
  panel.querySelector('#archive-chapter').onchange=event=>{const value=Number(event.target.value);controller?.setPlaying(false);controller?.setProgress(value);};
  window.dispatchEvent(new CustomEvent('relic-archive-start',{detail:{record,events,initialMode,onState:report,connect:next=>{if(disposed){next.dispose();return;}controller=next;starting=false;}}}));
  disclosure=makeMissionControlsCollapsible(panel);for(const input of panel.querySelectorAll('button,input,select'))if(input.dataset.archiveAction!=='exit'&&!input.classList.contains('mission-controls-collapse'))input.disabled=true;badgeLocale=localizeMissionElement(badge);
  if(distant&&initialMode!=='journey'&&matchMedia('(max-width:650px)').matches){stack.hidden=true;badge.querySelector('button').setAttribute('aria-expanded','false');}
  revealMissionElement(panel,{duration:320,distance:8});revealMissionElement(actions,{duration:240,distance:5});
 }
 function updateAnnotations(event){if(!annotations)return;for(const point of event.detail)if(![...annotations.children].some(node=>node.dataset.archivePoint===point.id)){const label=document.createElement('span');label.className='mission-point-label';label.dataset.archivePoint=point.id;label.hidden=true;annotations.append(label);}for(const node of annotations.children){const point=event.detail.find(row=>row.id===node.dataset.archivePoint);node.hidden=!point?.visible;if(point?.visible){node.textContent=point.text;node.style.left=Math.max(0,Math.min(point.x,innerWidth-node.offsetWidth-18)).toFixed(1)+'px';node.style.top=point.y.toFixed(1)+'px';}}}
 function action(event){const target=event.target.closest('[data-archive-action]');if(!target)return;const key=target.dataset.archiveAction;
  if(key==='close'||key==='summary'){stack.hidden=!stack.hidden;if(badge)badge.querySelector('button').setAttribute('aria-expanded',String(!stack.hidden));return;}
  if(key==='menu'){const expanded=target.getAttribute('aria-expanded')!=='true';target.setAttribute('aria-expanded',String(expanded));actions.hidden=!expanded;if(expanded&&!distant){const planet=getMissionPlanet(record.id)||(['moon','mars'].includes(record.body)?record.body:null);if(planet==='moon'||planet==='mars'){const site=getMissionSite(record.id);window.dispatchEvent(new CustomEvent('relic-mission-locate',{detail:{id:record.id,body:planet,...site}}));}else start();}return;}
  if(key==='visualize'){const planet=getMissionPlanet(record.id)||(['moon','mars'].includes(record.body)?record.body:null);if(planet==='moon'||planet==='mars'){const site=getMissionSite(record.id);window.dispatchEvent(new CustomEvent('relic-mission-locate',{detail:{id:record.id,body:planet,...site}}));return;}if(controller){controller.setMode('journey');controller.setPlaying(true);}else start('journey');return;}
  if(key==='film'){controller?.setPlaying(false);openVideo(id);return;}
  if(key==='exit'){controller?.stop();dispose();return;}
  if(key==='play'){controller?.setPlaying(!controller.playing);return;}
  if(key==='reset'){controller?.reset();return;}
  if(['journey','orbit','site'].includes(key))controller?.setMode(key);
 }
 card.addEventListener('click',action);actions.addEventListener('click',action);
 function escape(event){if(event.key!=='Escape'||event.defaultPrevented||document.querySelector('.mission-shared-film')||event.target.closest?.('input,select,textarea'))return;if(!stack.hidden)stack.hidden=true;else{controller?.stop();dispose();}event.preventDefault();}
 document.addEventListener('keydown',escape);
 function ended(event){if(event.detail?.id===id)dispose();}
 window.addEventListener('relic-archive-ended',ended);
 function dispose(){if(disposed)return;disposed=true;readout?.dispose();disclosure?.dispose();badgeLocale?.dispose();cardLocale.dispose();controller?.dispose();stack.remove();panel?.remove();badge?.remove();annotations?.remove();window.removeEventListener('relic-mission-annotations',updateAnnotations);document.body.classList.remove('mission-exploring','distant-mission-active');document.removeEventListener('keydown',escape);window.removeEventListener('relic-archive-ended',ended);if(instance?.record.id===id)instance=null;}
 instance={record,card,stack,start,dispose};revealMissionElement(card,{duration:220,distance:5});if(['explore','spacecraft','distant'].includes(view))start(view==='spacecraft'?'site':view==='distant'?'orbit':null);
}
