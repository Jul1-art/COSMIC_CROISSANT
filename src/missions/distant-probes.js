import {openMission} from './mission-ui.js';
import {getLanguage, onLanguageChange} from '../atlas/atlas-live.js?v=3';
import {DISTANT_PROBES} from './distant-data.js';
export {DISTANT_PROBES} from './distant-data.js';

// NASA lists these five spacecraft on solar escape trajectories. Only the
// Voyagers have a confirmed heliopause crossing; no live position is implied.

export function createDistantProbeMenu() {
  const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./distant-probes.css',import.meta.url).href;document.head.append(link);
  const root=document.createElement('aside');root.className='distant-probes';root.hidden=true;
  root.innerHTML=`<section class="distant-probes-module"><button type="button" class="distant-probes-toggle" aria-expanded="false" aria-controls="distant-probes-list"><span class="distant-probes-title"></span><span class="panel-divider"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button><div id="distant-probes-list" hidden><p class="distant-probes-intro"></p><div class="distant-probes-entries"></div><a class="distant-probes-source" href="https://science.nasa.gov/mission/voyager/frequently-asked-questions/" target="_blank" rel="noopener">NASA ↗</a></div></section>`;
  document.body.append(root);
  const toggle=root.querySelector('.distant-probes-toggle'),list=root.querySelector('#distant-probes-list'),entries=root.querySelector('.distant-probes-entries');
  function expand(value){toggle.setAttribute('aria-expanded',String(value));list.hidden=!value;root.classList.toggle('is-expanded',value);}
  const buttons=DISTANT_PROBES.map(probe=>{
    const button=document.createElement('button');button.type='button';button.className='distant-probe';button.dataset.probeId=probe.id;
    button.innerHTML=`<span><strong>${probe.name}</strong><small></small></span><span class="distant-probe-arrow" aria-hidden="true">↗</span>`;
    button.addEventListener('click',()=>{expand(false);openMission(probe.id,'distant');});entries.append(button);return button;
  });
  function localize(){
    const fr=getLanguage()==='fr';root.setAttribute('aria-label',fr?'Sondes lointaines':'Distant probes');
    root.querySelector('.distant-probes-title').textContent=fr?'Sondes lointaines':'Distant probes';
    root.querySelector('.distant-probes-intro').textContent=fr?'Cinq sondes en route vers les étoiles. Explorez leurs instruments en 3D.':'Five spacecraft headed for the stars. Explore their instruments in 3D.';
    buttons.forEach((button,i)=>{const probe=DISTANT_PROBES[i];button.querySelector('small').textContent=`${probe.year} · ${probe.interstellar?(fr?'Espace interstellaire':'Interstellar space'):(fr?'Trajectoire d’échappement':'Solar escape trajectory')}`;button.setAttribute('aria-label',`${probe.name} · ${fr?'Explorer la sonde en 3D':'Explore spacecraft in 3D'}`);});
  }
  toggle.addEventListener('click',()=>expand(list.hidden));
  function outside(event){if(!root.contains(event.target))expand(false);}
  function escape(event){if(event.key==='Escape'&&!list.hidden){expand(false);toggle.focus();event.stopPropagation();event.preventDefault();}}
  document.addEventListener('pointerdown',outside);root.addEventListener('keydown',escape);
  const stopLanguage=onLanguageChange(localize);localize();
  return {
    update({overview,mission=false,film=false,launchpad=false}){const visible=overview&&!mission&&!film&&!launchpad;if(root.hidden===visible){root.hidden=!visible;if(!visible)expand(false);}},
    dispose(){stopLanguage?.();document.removeEventListener('pointerdown',outside);root.remove();link.remove();}
  };
}
