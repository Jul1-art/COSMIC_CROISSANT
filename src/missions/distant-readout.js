import {lightDayCountdown,LIGHT_DAY_KM,VOYAGER_LIGHT_DAY_AT,VOYAGER_MILESTONE_SOURCE} from './distant-data.js';
import {missionLanguage} from './mission-locale.js';
import {AU_KM} from '../atlas/solar-scale.js';

export function createDistantReadout(record,card){
 const root=document.createElement('section');root.className='distant-readout';root.setAttribute('aria-label','Spacecraft distance');
 root.innerHTML='<dl><div><dt data-range-label></dt><dd data-earth-distance>—</dd></div><div><dt data-sun-label></dt><dd data-sun-distance>—</dd></div><div><dt data-light-label></dt><dd data-light-time>—</dd></div></dl><small data-distance-epoch></small>';
 const milestone=record.id==='voyager-1'?document.createElement('div'):null;
 if(milestone){milestone.className='voyager-light-day';milestone.innerHTML=`<strong></strong><output aria-live="off"></output><small></small><a href="${VOYAGER_MILESTONE_SOURCE}" target="_blank" rel="noopener">NASA ↗</a>`;root.append(milestone);}
 card.querySelector('dl').after(root);
 let metrics=null,mode='orbit';
 function refresh(){
  const fr=missionLanguage()==='fr',locale=fr?'fr-FR':'en-US',format=(n,max=0)=>new Intl.NumberFormat(locale,{maximumFractionDigits:max}).format(n);
  root.querySelector('[data-range-label]').textContent=fr?'Distance à la Terre':'Distance to Earth';root.querySelector('[data-sun-label]').textContent=fr?'Distance au Soleil':'Distance to Sun';root.querySelector('[data-light-label]').textContent=fr?'Signal · aller simple':'Signal · one way';
  if(metrics){root.querySelector('[data-earth-distance]').textContent=format(metrics.earthKm)+' km';root.querySelector('[data-sun-distance]').textContent=format(metrics.sunKm/AU_KM,2)+(fr?' UA':' AU');
   const seconds=Math.round(metrics.lightSeconds);root.querySelector('[data-light-time]').textContent=`${Math.floor(seconds/3600)} h ${String(Math.floor(seconds/60)%60).padStart(2,'0')} min ${String(seconds%60).padStart(2,'0')} s`;
   root.querySelector('[data-distance-epoch]').textContent=(mode==='journey'?(fr?'Date du voyage':'Journey date'):(fr?'Éphéméride JPL':'JPL ephemeris'))+' · '+new Date(metrics.time).toLocaleString(locale,{timeZone:'UTC',dateStyle:'medium',timeStyle:'medium'})+' UTC';
  }
  if(milestone){const remaining=lightDayCountdown(),pad=n=>String(n).padStart(2,'0');milestone.querySelector('strong').textContent=fr?'Voyager 1 · un jour-lumière':'Voyager 1 · one light-day';
   milestone.querySelector('output').textContent=remaining.reached?(fr?'Cap atteint':'Milestone reached'):`${remaining.days}${fr?'j':'d'} ${pad(remaining.hours)}h ${pad(remaining.minutes)}m ${pad(remaining.seconds)}s`;
   milestone.querySelector('small').textContent=new Date(VOYAGER_LIGHT_DAY_AT).toLocaleString(locale,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',timeZoneName:'short'})+' · '+format(LIGHT_DAY_KM)+' km';milestone.title=fr?'Instant annoncé par la NASA : 18 novembre 2026, 10:16:07 UTC.':'NASA milestone: 18 November 2026, 10:16:07 UTC.';
  }
 }
 const language=new MutationObserver(refresh);language.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 const timer=setInterval(refresh,1000);refresh();
 return {update(state){if(state.metrics)metrics=state.metrics;if(state.mode)mode=state.mode;refresh();},summary(){
  if(!metrics)return '';const fr=missionLanguage()==='fr',format=new Intl.NumberFormat(fr?'fr-FR':'en-US');let text=format.format(Math.round(metrics.earthKm))+(fr?' km de la Terre':' km from Earth');
  if(milestone){const count=lightDayCountdown();text+=' · '+(count.reached?(fr?'Un jour-lumière : cap atteint':'One light-day: reached'):(fr?'18 nov. · un jour-lumière dans ':'18 Nov · one light-day in ')+`${count.days}${fr?'j':'d'} ${String(count.hours).padStart(2,'0')}h ${String(count.minutes).padStart(2,'0')}m ${String(count.seconds).padStart(2,'0')}s`);}
  return text;
 },dispose(){clearInterval(timer);language.disconnect();root.remove();}};
}
