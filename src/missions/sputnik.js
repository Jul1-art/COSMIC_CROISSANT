import {localizeMissionElement} from './mission-locale.js';
import {makeMissionControlsCollapsible} from './mission-controls.js';
import {appURL} from '../core/paths.js';
import {ORBIT_DURATION} from './sputnik-orbit-math.js';
export const SPUTNIK={id:'sputnik-1',name:'Sputnik 1',site:{latitude:45.9203,longitude:63.3422},body:'earth'};
const chevron='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
const command=(action,value)=>window.dispatchEvent(new CustomEvent('relic-sputnik-command',{detail:{action,value}}));
let card,panel,active=false;
const elapsed=t=>`${Math.floor(t/3600).toString().padStart(2,'0')}:${Math.floor(t/60%60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
function position(){if(!card||card.hidden)return;card.style.left=Math.max(12,innerWidth-card.offsetWidth-24)+'px';card.style.top=(innerHeight<420?12:84)+'px';}
function update(state){
 active=Boolean(state.active);panel.hidden=!active;panel.setAttribute('aria-busy','false');
 if(!active){card.querySelector('[data-sputnik="explore"]').setAttribute('aria-expanded','false');card.querySelector('nav').hidden=true;return;}
 panel.querySelector('[data-sputnik="play"]').textContent=state.playing?'Pause':'Play';panel.querySelector('[data-sputnik="play"]').setAttribute('aria-label',state.playing?'Pause reconstruction':'Play reconstruction');
 panel.querySelector('[data-sputnik="seek"]').value=state.seconds;panel.querySelector('[data-sputnik="speed"]').value=state.speed;
 panel.querySelector('output').textContent=`T+${elapsed(state.seconds)} · ${state.altitudeKm.toFixed(0)} km · ${state.speedKmS.toFixed(2)} km/s`;
}
function install(){
 card=document.createElement('section');card.id='sputnik-card';card.className='mission-popup sputnik-card';card.setAttribute('role','dialog');card.setAttribute('aria-modal','false');card.setAttribute('aria-labelledby','sputnik-card-title');
 card.innerHTML=`<header><h2 id="sputnik-card-title">Sputnik 1</h2><span>USSR</span><button type="button" data-sputnik="close" aria-label="Close Sputnik 1 mission card">×</button></header><dl><div><dt>Launch</dt><dd>4 October 1957</dd></div><div><dt>Mass</dt><dd>83.6 kg</dd></div><div><dt>Status</dt><dd>Destroyed on 4 January 1958</dd></div></dl><button type="button" class="mission-menu-toggle" data-sputnik="explore" aria-expanded="false" aria-controls="sputnik-card-actions"><span>Explore mission</span>${chevron}</button><nav id="sputnik-card-actions" class="sputnik-card-actions" aria-label="Sputnik 1 · film and dossier" hidden><button type="button" data-sputnik="video"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg><span>Watch film</span></button><a href="${appURL('pages/sputnik.html').href}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 3h9l4 4v14H6Z M10 11h5m-5 4h5"/></svg><span>Mission details</span><svg class="sputnik-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a></nav>`;
 panel=document.createElement('section');panel.id='sputnik-orbit-controls';panel.className='atlas-mission-controls sputnik-orbit-controls';panel.hidden=true;panel.setAttribute('aria-label','Sputnik 1 orbital reconstruction');
 panel.innerHTML=`<header class="atlas-mission-heading"><div><span>4 OCTOBER 1957 / INITIAL ORBIT</span><h2>Sputnik 1</h2></div><button type="button" data-sputnik="stop" aria-label="Exit Sputnik reconstruction">×</button></header><p>215 × 939 km · inclination 65.1°<br>A point in orbit, in the existing Earth view.</p><div class="atlas-mission-views"><button type="button" data-sputnik="frame">Frame the orbit</button><button type="button" data-sputnik="restart">Restart</button></div><div class="atlas-mission-transport"><button type="button" data-sputnik="play">Pause</button><label class="mission-sr-only" for="sputnik-time">Elapsed reconstruction time</label><input id="sputnik-time" type="range" data-sputnik="seek" min="0" max="${ORBIT_DURATION}" step="1" value="0"></div><div class="atlas-mission-meta"><output aria-label="Elapsed time, altitude and speed">T+00:00:00</output><label>Speed <select data-sputnik="speed"><option value="1">×1</option><option value="30">×30</option><option value="120" selected>×120</option><option value="600">×600</option></select></label></div><small>Calculated Keplerian reconstruction · three revolutions of the initial orbit. Illustrative orientation and phase. Does not reproduce launch or orbital decay to January 1958.</small>`;
 makeMissionControlsCollapsible(panel);localizeMissionElement(card);document.body.append(card,panel);
 card.addEventListener('click',event=>{const action=event.target.closest('[data-sputnik]')?.dataset.sputnik;if(action==='close')card.hidden=true;if(action==='video'){command('pause');window.dispatchEvent(new CustomEvent('relic-mission-video',{detail:{id:'sputnik-1'}}));}
  if(action==='explore'){const button=card.querySelector('[data-sputnik="explore"]'),open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));card.querySelector('nav').hidden=!open;if(open)command('start');position();}});
 panel.addEventListener('click',event=>{const action=event.target.closest('[data-sputnik]')?.dataset.sputnik;if(['stop','play','frame'].includes(action))command(action);if(action==='restart')command('seek',0);});
 panel.querySelector('[data-sputnik="seek"]').addEventListener('input',event=>command('seek',Number(event.target.value)));
 panel.querySelector('select').addEventListener('change',event=>command('speed',Number(event.target.value)));
 window.addEventListener('relic-sputnik-state',event=>update(event.detail));
 window.addEventListener('relic-sputnik-ended',()=>{active=false;panel.hidden=true;card.hidden=true;card.querySelector('nav').hidden=true;card.querySelector('[data-sputnik="explore"]').setAttribute('aria-expanded','false');});
 window.addEventListener('resize',position);
 document.addEventListener('keydown',event=>{if(event.key!=='Escape'||event.defaultPrevented||document.querySelector('.mission-shared-film')||event.target.closest?.('input,select,textarea'))return;if(!card.hidden){card.hidden=true;event.preventDefault();}else if(active){command('stop');event.preventDefault();}});
}
export function openSputnik(){if(!card)install();card.hidden=false;position();}
