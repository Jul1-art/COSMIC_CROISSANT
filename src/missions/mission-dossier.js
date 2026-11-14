import {revealMissionElement,reducedMissionMotion} from './mission-motion.js';
import {DOSSIER_TABS,renderDossierTab} from './mission-dossier-content.js';
const nav=document.querySelector('#dossier-tabs'),content=document.querySelector('#dossier-content');
nav.innerHTML=DOSSIER_TABS.map(([id,label],index)=>`<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-tab="${id}">${label}</button>`).join('');
const cursor=document.createElement('span');cursor.className='dossier-tab-cursor';cursor.setAttribute('aria-hidden','true');nav.append(cursor);
content.innerHTML=DOSSIER_TABS.map(([id,label],index)=>`<section class="dossier-panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0" ${index?'hidden':''}>${renderDossierTab(id)}</section>`).join('');
function selectTab(id,{focus=false,write=true}={}){
 if(!DOSSIER_TABS.some(row=>row[0]===id))id='identite';
 nav.querySelectorAll('[role="tab"]').forEach(tab=>{const active=tab.dataset.tab===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
 content.querySelectorAll('[role="tabpanel"]').forEach(panel=>{panel.hidden=panel.id!==`panel-${id}`;});
 const activeTab=nav.querySelector('[aria-selected="true"]');if(activeTab){cursor.style.left=activeTab.offsetLeft+'px';cursor.style.width=activeTab.offsetWidth+'px';}
 const panel=content.querySelector(`#panel-${id}`);revealMissionElement(panel,{duration:440,distance:10});if(write&&scrollY>nav.offsetTop-80)content.scrollIntoView({block:'start',behavior:reducedMissionMotion()?'auto':'smooth'});
 if(write)history.replaceState(null,'',`#${id}`);
}
nav.addEventListener('click',event=>{const tab=event.target.closest('[data-tab]');if(tab)selectTab(tab.dataset.tab);});
nav.addEventListener('keydown',event=>{const current=DOSSIER_TABS.findIndex(row=>row[0]===document.activeElement?.dataset.tab);if(current<0)return;let next;if(event.key==='ArrowRight')next=(current+1)%DOSSIER_TABS.length;else if(event.key==='ArrowLeft')next=(current+DOSSIER_TABS.length-1)%DOSSIER_TABS.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=DOSSIER_TABS.length-1;else return;event.preventDefault();selectTab(DOSSIER_TABS[next][0],{focus:true});});
window.addEventListener('hashchange',()=>selectTab(location.hash.slice(1),{write:false}));selectTab(location.hash.slice(1),{write:false});
const back=document.querySelector('#dossier-back');back.addEventListener('click',event=>{if(!document.referrer)return;const previous=new URL(document.referrer);if(previous.origin===location.origin&&history.length>1&&previous.pathname!==location.pathname){event.preventDefault();history.back();}});

window.addEventListener('resize',()=>{const active=nav.querySelector('[aria-selected="true"]');if(active){cursor.style.left=active.offsetLeft+'px';cursor.style.width=active.offsetWidth+'px';}});
for(const [i,node] of [...document.querySelectorAll('.dossier-header,.dossier-hero-copy>*,.dossier-tabs')].entries())revealMissionElement(node,{delay:60+i*70,duration:800,distance:14});
if(!reducedMissionMotion()&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}},{threshold:.08});document.querySelectorAll('.dossier-photo,.dossier-hardware,.dossier-facts>div,.dossier-source-list>a,.dossier-timeline li').forEach(node=>{node.classList.add('dossier-reveal');observer.observe(node);});window.addEventListener('pagehide',event=>{if(!event.persisted)observer.disconnect();});}
document.querySelector('.dossier-jump')?.addEventListener('click',event=>{event.preventDefault();selectTab('identite');nav.scrollIntoView({block:'start',behavior:reducedMissionMotion()?'auto':'smooth'});});
document.fonts?.ready.then(()=>{const active=nav.querySelector('[aria-selected="true"]');if(active){cursor.style.left=active.offsetLeft+'px';cursor.style.width=active.offsetWidth+'px';}});
