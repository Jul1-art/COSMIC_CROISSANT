import {DOSSIER_TABS} from './mission-dossier-content.js';
import {reducedMissionMotion} from './mission-motion.js';
/** Shared, keyboard-accessible archive reader for every mission dossier. */
export function mountDossier({renderTab}){
 const nav=document.querySelector('#dossier-tabs'),content=document.querySelector('#dossier-content');
 const reduced=()=>reducedMissionMotion();let current='',transition=null,frame=0;
 nav.innerHTML=DOSSIER_TABS.map(([id,label],i)=>`<button type="button" role="tab" id="tab-${id}" aria-controls="panel-${id}" aria-selected="false" tabindex="-1" data-tab="${id}"><span aria-hidden="true">0${i+1}</span>${label}</button>`).join('');
 const cursor=document.createElement('span');cursor.className='dossier-tab-cursor';cursor.setAttribute('aria-hidden','true');nav.append(cursor);
 content.innerHTML=DOSSIER_TABS.map(([id],i)=>`<section class="dossier-panel" role="tabpanel" id="panel-${id}" aria-labelledby="tab-${id}" tabindex="0" hidden>${renderTab(id)}<nav class="dossier-chapter-end" aria-label="Continue reading"><span>0${i+1} / 05</span><button type="button" data-tab="${DOSSIER_TABS[(i+1)%5][0]}">${i===4?'Back to mission profile':'Next: '+DOSSIER_TABS[i+1][1]} <span aria-hidden="true">→</span></button></nav></section>`).join('');
 function cursorPosition(){const tab=nav.querySelector('[aria-selected="true"]');if(tab){cursor.style.left=tab.offsetLeft+'px';cursor.style.width=tab.offsetWidth+'px';}}
 function progress(){frame=0;const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.dossier-reading-progress').style.transform=`scaleX(${max>0?Math.max(0,Math.min(1,scrollY/max)):0})`;document.querySelector('.dossier-back-top').hidden=scrollY<600;}
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(progress);};
 function select(id,{focus=false,write=true}={}){
  if(!DOSSIER_TABS.some(([key])=>key===id))id='identite';const changed=current!==id;current=id;
  nav.querySelectorAll('[role=tab]').forEach(tab=>{const active=tab.dataset.tab===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();});
  content.querySelectorAll('[role=tabpanel]').forEach(panel=>panel.hidden=panel.id!=='panel-'+id);
  transition?.cancel();if(changed&&!reduced())transition=document.querySelector('#panel-'+id).animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'cubic-bezier(.2,.65,.3,1)'});
  cursorPosition();const activeTab=nav.querySelector('[aria-selected=true]');if(activeTab)nav.scrollTo({left:Math.max(0,activeTab.offsetLeft-(nav.clientWidth-activeTab.offsetWidth)/2),behavior:reduced()?'auto':'smooth'});
  if(write){history.replaceState(null,'','#'+id);if(scrollY>nav.offsetTop)window.scrollTo({top:nav.offsetTop,behavior:reduced()?'auto':'smooth'});}schedule();
 }
 document.addEventListener('click',event=>{const tab=event.target.closest('[data-tab]');if(tab)select(tab.dataset.tab);});
 nav.addEventListener('keydown',event=>{const keys=['ArrowRight','ArrowLeft','Home','End'];if(!keys.includes(event.key))return;const i=DOSSIER_TABS.findIndex(([id])=>id===document.activeElement?.dataset.tab);if(i<0)return;event.preventDefault();const n=event.key==='Home'?0:event.key==='End'?4:(i+(event.key==='ArrowRight'?1:4))%5;select(DOSSIER_TABS[n][0],{focus:true});});
 window.addEventListener('hashchange',()=>select(location.hash.slice(1),{write:false}));
 window.addEventListener('resize',()=>{cursorPosition();schedule();});window.addEventListener('scroll',schedule,{passive:true});document.fonts?.ready.then(cursorPosition);
 const bar=document.createElement('div');bar.className='dossier-reading-progress';bar.setAttribute('aria-hidden','true');document.body.prepend(bar);
 const top=document.createElement('button');top.type='button';top.className='dossier-back-top';top.textContent='↑';top.setAttribute('aria-label','Back to top');top.hidden=true;top.onclick=()=>window.scrollTo({top:0,behavior:reduced()?'auto':'smooth'});document.body.append(top);
 // Reusable image viewer: archive links remain in the visible captions.
 const lightbox=document.createElement('dialog');lightbox.className='dossier-lightbox';lightbox.setAttribute('aria-label','Archive photograph');lightbox.innerHTML='<button type="button" aria-label="Close photograph">×</button><img alt=""><p></p>';document.body.append(lightbox);let opener=null,overflow='';
 function close(){lightbox.close();}
 lightbox.querySelector('button').onclick=close;lightbox.addEventListener('click',event=>{if(event.target===lightbox)close();});lightbox.addEventListener('close',()=>{document.body.style.overflow=overflow;opener?.focus({preventScroll:true});});
 document.querySelectorAll('.dossier-photo>img,.dossier-hero-photo>img').forEach(img=>{
  const button=document.createElement('button');button.type='button';button.className='dossier-photo-expand';button.setAttribute('aria-label','Enlarge photograph: '+img.alt);img.before(button);button.append(img);const cue=document.createElement('span');cue.className='dossier-image-cue';cue.textContent='View image ↗';button.append(cue);
  button.onclick=()=>{opener=button;overflow=document.body.style.overflow;document.body.style.overflow='hidden';const large=lightbox.querySelector('img');large.src=img.currentSrc||img.src;large.alt=img.alt;lightbox.querySelector('p').textContent=img.closest('figure').querySelector('figcaption')?.textContent||img.alt;lightbox.showModal();if(!reduced())lightbox.animate([{opacity:0},{opacity:1}],{duration:180});};
  img.addEventListener('load',schedule,{once:true});
 });
 let observer;
 if(!reduced()&&'IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}},{threshold:.06});document.querySelectorAll('.dossier-photo,.dossier-hardware,.dossier-facts>div,.dossier-source-list>a,.dossier-timeline li,.dossier-crew article').forEach(node=>{node.classList.add('dossier-reveal');observer.observe(node);});
  document.querySelectorAll('.dossier-hero-copy>*,.dossier-hero-photo').forEach((node,i)=>node.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:700,delay:i*65,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards'}));
 }
 document.addEventListener('click',async event=>{const play=event.target.closest('[data-dossier-film],[data-sputnik-film]');if(!play)return;play.disabled=true;try{const {openVideo}=await import('./mission-ui.js');openVideo(document.body.dataset.mission||'apollo-11');}finally{play.disabled=false;}});
 document.querySelector('#dossier-back')?.addEventListener('click',event=>{if(!document.referrer)return;const previous=new URL(document.referrer);if(previous.origin===location.origin&&previous.pathname!==location.pathname&&history.length>1){event.preventDefault();history.back();}});
 window.addEventListener('pagehide',event=>{if(!event.persisted){observer?.disconnect();transition?.cancel();cancelAnimationFrame(frame);if(lightbox.open)lightbox.close();}});
 // Use vector arrows rather than font glyphs, including in the archive links.
 const paths={'↗':'M6 18 18 6M6 6h12v12','→':'M4 12h16m-6-6 6 6-6 6','←':'M20 12H4m6-6-6 6 6 6','↑':'M12 20V4m-6 6 6-6 6 6','↓':'M12 4v16m-6-6 6 6 6-6'};
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),textNodes=[];let node;
 while(node=walker.nextNode())if(!node.parentElement.closest('script,style')&&/[↗→←↑↓]/.test(node.textContent))textNodes.push(node);
 for(const text of textNodes){const fragment=document.createDocumentFragment();for(const part of text.textContent.split(/([↗→←↑↓])/)){if(!paths[part]){fragment.append(document.createTextNode(part));continue;}const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','dossier-arrow');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[part]);svg.append(path);fragment.append(svg);}text.replaceWith(fragment);}
 select(location.hash.slice(1),{write:false});
}
