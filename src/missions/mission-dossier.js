import {DOSSIER_TABS,renderDossierTab} from './mission-dossier-content.js';
const nav=document.querySelector('#dossier-tabs'),content=document.querySelector('#dossier-content');
nav.innerHTML=DOSSIER_TABS.map(([id,label],index)=>`<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-tab="${id}">${label}</button>`).join('');
content.innerHTML=DOSSIER_TABS.map(([id,label],index)=>`<section class="dossier-panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0" ${index?'hidden':''}>${renderDossierTab(id)}</section>`).join('');
function selectTab(id,{focus=false,write=true}={}){
 if(!DOSSIER_TABS.some(row=>row[0]===id))id='identite';
 nav.querySelectorAll('[role="tab"]').forEach(tab=>{const active=tab.dataset.tab===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
 content.querySelectorAll('[role="tabpanel"]').forEach(panel=>{panel.hidden=panel.id!==`panel-${id}`;});
 if(write)history.replaceState(null,'',`#${id}`);
}
nav.addEventListener('click',event=>{const tab=event.target.closest('[data-tab]');if(tab)selectTab(tab.dataset.tab);});
nav.addEventListener('keydown',event=>{const current=DOSSIER_TABS.findIndex(row=>row[0]===document.activeElement?.dataset.tab);if(current<0)return;let next;if(event.key==='ArrowRight')next=(current+1)%DOSSIER_TABS.length;else if(event.key==='ArrowLeft')next=(current+DOSSIER_TABS.length-1)%DOSSIER_TABS.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=DOSSIER_TABS.length-1;else return;event.preventDefault();selectTab(DOSSIER_TABS[next][0],{focus:true});});
window.addEventListener('hashchange',()=>selectTab(location.hash.slice(1),{write:false}));selectTab(location.hash.slice(1),{write:false});
const back=document.querySelector('#dossier-back');back.addEventListener('click',event=>{if(!document.referrer)return;const previous=new URL(document.referrer);if(previous.origin===location.origin&&history.length>1&&previous.pathname!==location.pathname){event.preventDefault();history.back();}});
