import {localizeMissionElement} from './mission-locale.js';
/** All current and future mission control panels share this disclosure. It
 * hides presentation only: playback, scrubbing state and the exit stay intact. */
export function makeMissionControlsCollapsible(panel){
 const heading=panel.querySelector('.atlas-mission-heading');if(!heading)return;
 const body=document.createElement('div');body.className='mission-controls-body';body.id=(panel.id||'apollo-mission-controls')+'-body';
 for(const node of [...panel.childNodes])if(node!==heading)body.append(node);panel.append(body);
 const toggle=document.createElement('button');toggle.type='button';toggle.className='mission-controls-collapse';toggle.setAttribute('aria-controls',body.id);toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Minimize controls');toggle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m7 14 5-5 5 5"/></svg>';
 heading.insertBefore(toggle,heading.lastElementChild);
 toggle.addEventListener('click',event=>{event.stopPropagation();const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',expanded?'Minimize controls':'Expand controls');body.hidden=!expanded;panel.classList.toggle('mission-controls-minimized',!expanded);});
 const locale=localizeMissionElement(panel);return {toggle,body,dispose:()=>locale.dispose()};
}
