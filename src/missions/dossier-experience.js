import {getLanguage,setLanguage,onLanguageChange} from '../atlas/atlas-live.js?v=3';
import {DOSSIER_TABS} from './mission-dossier-content.js';
import {reducedMissionMotion} from './mission-motion.js';
import {localizeMissionElement,missionText} from './mission-locale.js';
/** Shared policies for every mission: locale, top-of-page navigation, no brief
 * links/footer, accessible chapters/images, and an isolated film player. */
export function mountDossier({renderTab}){
 const nav=document.querySelector('#dossier-tabs'),content=document.querySelector('#dossier-content'),reduced=()=>reducedMissionMotion();
 let current='',transition=null,frame=0,contentLocale=null,observer;
 history.scrollRestoration='manual';
 document.querySelectorAll('body>footer,.dossier-footer,a[href*="fiche-mission.pdf"]').forEach(node=>node.remove());
 const bar=document.createElement('div');bar.className='dossier-reading-progress';bar.setAttribute('aria-hidden','true');document.body.prepend(bar);
 const top=document.createElement('button');top.type='button';top.className='dossier-back-top';top.textContent='↑';top.setAttribute('aria-label','Back to top');top.hidden=true;top.onclick=()=>window.scrollTo({top:0,behavior:reduced()?'instant':'smooth'});document.body.append(top);localizeMissionElement(top);
 const lightbox=document.createElement('dialog');lightbox.className='dossier-lightbox';lightbox.setAttribute('aria-label','Archive photograph');lightbox.innerHTML='<button type="button" aria-label="Close photograph">×</button><img alt=""><p></p>';document.body.append(lightbox);localizeMissionElement(lightbox);let opener=null,overflow='';
 lightbox.querySelector('button').onclick=()=>lightbox.close();lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});lightbox.addEventListener('close',()=>{document.body.style.overflow=overflow;opener?.focus({preventScroll:true});});
 function setupImages(root){for(const img of root.querySelectorAll('.dossier-photo>img,.dossier-hero-photo>img,.dossier-photo>a>img')){
  const button=document.createElement('button');button.type='button';button.className='dossier-photo-expand';button.setAttribute('aria-label','Enlarge photograph: '+img.alt);
  const old=img.parentElement.tagName==='A'?img.parentElement:img;old.before(button);button.append(img);if(old!==img)old.remove();const cue=document.createElement('span');cue.className='dossier-image-cue';cue.textContent='View image ↗';button.append(cue);
  button.onclick=()=>{opener=button;overflow=document.body.style.overflow;document.body.style.overflow='hidden';const large=lightbox.querySelector('img');large.src=img.currentSrc||img.src;large.alt=img.alt;lightbox.querySelector('p').textContent=img.closest('figure').querySelector('figcaption')?.textContent||img.alt;lightbox.showModal();if(!reduced())lightbox.animate([{opacity:0},{opacity:1}],{duration:180});};img.addEventListener('load',schedule,{once:true});
 }}
 const paths={'↗':'M6 18 18 6M6 6h12v12','→':'M4 12h16m-6-6 6 6-6 6','←':'M20 12H4m6-6-6 6 6 6','↑':'M12 20V4m-6 6 6-6 6 6','↓':'M12 4v16m-6-6 6 6 6-6'};
 function icons(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];let node;while(node=walker.nextNode())if(!node.parentElement.closest('script,style')&&/[↗→←↑↓]/.test(node.textContent))nodes.push(node);
  for(const text of nodes){const fragment=document.createDocumentFragment();for(const part of text.textContent.split(/([↗→←↑↓])/)){if(!paths[part]){fragment.append(document.createTextNode(part));continue;}const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','dossier-arrow');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[part]);svg.append(path);fragment.append(svg);}text.replaceWith(fragment);}
 }
 function progress(){frame=0;const max=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${max>0?Math.max(0,Math.min(1,scrollY/max)):0})`;top.hidden=scrollY<600;}
 function schedule(){if(!frame)frame=requestAnimationFrame(progress);}
 function cursorPosition(){const active=nav.querySelector('[aria-selected=true]'),cursor=nav.querySelector('.dossier-tab-cursor');if(active&&cursor){cursor.style.left=active.offsetLeft+'px';cursor.style.width=active.offsetWidth+'px';}}
 function normalize(){
  content.querySelectorAll('a[href*="fiche-mission.pdf"],.dossier-footer').forEach(node=>node.remove());
  for(const panel of content.querySelectorAll('[role=tabpanel]')){
   if(!panel.querySelector('.dossier-section-heading')){const h=panel.querySelector(':scope>h2');if(h){const head=document.createElement('header');head.className='dossier-section-heading';const kicker=panel.querySelector(':scope>.dossier-kicker'),intro=h.nextElementSibling;h.before(head);if(kicker)head.append(kicker);head.append(h);if(intro?.tagName==='P')head.append(intro);}}
   panel.querySelectorAll(':scope>h3').forEach(h=>h.classList.add('dossier-text-heading'));
  }
  for(const li of content.querySelectorAll('.dossier-timeline li'))if(!li.querySelector(':scope>div')){const body=document.createElement('div');for(const node of [...li.children])if(node.tagName!=='TIME')body.append(node);li.append(body);}
  for(const [i,li]of [...content.querySelectorAll('.dossier-timeline li')].entries())if(!li.querySelector('.dossier-timeline-index')){const n=document.createElement('span');n.className='dossier-timeline-index';n.textContent=String(i+1).padStart(2,'0');li.prepend(n);}
  for(const row of content.querySelectorAll('.dossier-crew>div')){const article=document.createElement('article');article.innerHTML=row.innerHTML;row.replaceWith(article);}
 }
 function select(id,{focus=false,write=true}={}){
  if(!DOSSIER_TABS.some(([key])=>key===id))id='identite';const changed=current!==id;current=id;
  nav.querySelectorAll('[role=tab]').forEach(tab=>{const active=tab.dataset.tab===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus({preventScroll:true});});
  content.querySelectorAll('[role=tabpanel]').forEach(panel=>panel.hidden=panel.id!=='panel-'+id);
  transition?.cancel();if(changed&&!reduced())transition=document.querySelector('#panel-'+id).animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:300});
  cursorPosition();const active=nav.querySelector('[aria-selected=true]');if(active)nav.scrollTo({left:Math.max(0,active.offsetLeft-(nav.clientWidth-active.offsetWidth)/2),behavior:'instant'});
  if(write)history.replaceState(null,'','#'+id);window.scrollTo({top:0,behavior:'instant'});schedule();
 }
 function render(){
  const language=getLanguage(),keep=current||location.hash.slice(1);contentLocale?.dispose();observer?.disconnect();
  nav.innerHTML=DOSSIER_TABS.map(([id,label],i)=>`<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="false" tabindex="-1" data-tab="${id}"><span aria-hidden="true">0${i+1}</span>${missionText(label,language)}</button>`).join('')+'<span class="dossier-tab-cursor" aria-hidden="true"></span>';
  content.innerHTML=DOSSIER_TABS.map(([id],i)=>`<section class="dossier-panel" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" tabindex="0" hidden>${renderTab(id,language)}<nav class="dossier-chapter-end" aria-label="Continue reading"><span>0${i+1} / 05</span><button type="button" data-tab="${DOSSIER_TABS[(i+1)%5][0]}">${i===4?'Back to mission profile':'Next: '+DOSSIER_TABS[i+1][1]} <span aria-hidden="true">→</span></button></nav></section>`).join('');
  normalize();setupImages(content);icons(content);contentLocale=localizeMissionElement(content);
  if(!reduced()&&'IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.classList.add('is-revealed');observer.unobserve(e.target);}},{threshold:.06});content.querySelectorAll('.dossier-photo,.dossier-hardware,.dossier-facts>div,.dossier-source-list>a,.dossier-timeline li,.dossier-crew article').forEach(node=>{node.classList.add('dossier-reveal');observer.observe(node);});}
  const name=missionText(document.body.dataset.mission==='sputnik-1'?'Sputnik 1':'Apollo 11');nav.setAttribute('aria-label',name+(language==='fr'?' · rubriques de la mission':' mission chapters'));document.title=name+' — '+(language==='fr'?'Dossier de mission':'Mission archive')+' · RELIC';toggle.textContent=language==='fr'?'FR / EN':'EN / FR';toggle.setAttribute('aria-label',language==='fr'?'Passer en anglais':'Switch to French');select(keep,{write:false});
 }
 const toggle=document.createElement('button');toggle.type='button';toggle.className='dossier-language';toggle.onclick=()=>setLanguage(getLanguage()==='fr'?'en':'fr');document.querySelector('.dossier-header').append(toggle);
 setupImages(document);icons(document);localizeMissionElement(document.querySelector('.dossier-skip'));const headerLocale=localizeMissionElement(document.querySelector('.dossier-header')),heroLocale=localizeMissionElement(document.querySelector('.dossier-hero')),noteLocale=localizeMissionElement(document.querySelector('.dossier-mission-note'));
 const unsubscribe=onLanguageChange(render);
 if(!reduced())document.querySelectorAll('.dossier-hero-copy>*,.dossier-hero-photo').forEach((node,i)=>node.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:i*65,fill:'backwards'}));
 document.addEventListener('click',event=>{const tab=event.target.closest('[data-tab]');if(tab)select(tab.dataset.tab);});
 nav.addEventListener('keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;const i=DOSSIER_TABS.findIndex(([id])=>id===document.activeElement?.dataset.tab);if(i<0)return;event.preventDefault();const n=event.key==='Home'?0:event.key==='End'?4:(i+(event.key==='ArrowRight'?1:4))%5;select(DOSSIER_TABS[n][0],{focus:true});});
 window.addEventListener('hashchange',()=>select(location.hash.slice(1),{write:false}));window.addEventListener('resize',()=>{cursorPosition();schedule();});window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('pageshow',()=>window.scrollTo({top:0,behavior:'instant'}));document.fonts?.ready.then(cursorPosition);
 document.addEventListener('click',async event=>{const play=event.target.closest('[data-dossier-film],[data-sputnik-film]');if(!play)return;play.disabled=true;try{const {openVideo}=await import('./mission-ui.js');await openVideo(document.body.dataset.mission||'apollo-11');}finally{play.disabled=false;}});
 document.querySelector('#dossier-back')?.addEventListener('click',event=>{if(!document.referrer)return;const previous=new URL(document.referrer);if(previous.origin===location.origin&&previous.pathname!==location.pathname&&history.length>1){event.preventDefault();history.back();}});
 window.addEventListener('pagehide',event=>{if(!event.persisted){observer?.disconnect();contentLocale?.dispose();headerLocale.dispose();heroLocale.dispose();noteLocale.dispose();unsubscribe();transition?.cancel();cancelAnimationFrame(frame);if(lightbox.open)lightbox.close();}});
}
