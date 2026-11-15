import {appURL} from '../core/paths.js';
export const DESTINATIONS={moon:'Lune',mars:'Mars',venus:'Vénus',mercury:'Mercure',earth:'Terre',sun:'Soleil','small-bodies':'Astéroïdes & comètes',outer:'Planètes lointaines',saturn:'Saturne',pluto:'Pluton',observatories:'Observatoires'};
export const missionURL=id=>appURL(id==='apollo-11'?'pages/mission.html?mission=apollo-11':id==='spoutnik-1'?'pages/sputnik.html':`pages/exploration.html?mission=${encodeURIComponent(id)}`).href;
export const escapeHTML=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const asset=path=>appURL(`assets/missions/${path}`).href;
export const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export async function loadJSON(path){const r=await fetch(asset(path));if(!r.ok)throw new Error(`Archive indisponible (${r.status})`);return r.json();}

if(typeof document!=='undefined'&&document.querySelector('#mission-grid')){
 let missions=[],filter='all';const grid=document.querySelector('#mission-grid'),search=document.querySelector('#mission-search'),sort=document.querySelector('#mission-sort');
 const media=new Map();let generation=0;
 function render(){
  const token=++generation,q=normalize(search.value.trim());
  const filtered=missions.filter(m=>(filter==='all'||m.body===filter)&&normalize(`${m.name} ${DESTINATIONS[m.body]} ${m.year||''}`).includes(q)).sort((a,b)=>sort.value==='year'?(a.year??9999)-(b.year??9999)||a.name.localeCompare(b.name,'fr',{numeric:true}):a.name.localeCompare(b.name,'fr',{numeric:true}));
  document.querySelector('#mission-count').textContent=`${filtered.length} mission${filtered.length>1?'s':''} / ${missions.length}`;
  grid.replaceChildren();
  if(!filtered.length){const p=document.createElement('p');p.className='catalog-empty';p.textContent='Aucune mission ne correspond. Essayez un autre nom ou une autre destination.';grid.append(p);return;}
  for(const [i,m] of filtered.entries()){
   const a=document.createElement('a');a.className='catalog-card';a.href=missionURL(m.id);a.setAttribute('aria-label',`Découvrir ${m.name}`);
   const fallback={moon:'moon-wac-8k.webp',mars:'mars-viking-global.webp',venus:'venus-scope.webp',mercury:'mercury-scope.webp',earth:'earth-blue-marble-4k.webp',sun:'sun-scope.webp',outer:'jupiter-scope.webp',saturn:'saturn-scope.webp',pluto:'missions/archives/new-horizons-nasa-PIA09234.jpg'}[m.body]||'saturn-scope.webp';
   a.innerHTML=`<div class="catalog-card-image"><img src="${appURL('assets/'+fallback)}" alt="" loading="lazy" decoding="async"><span>${escapeHTML(DESTINATIONS[m.body])}</span><span class="catalog-card-arrow" aria-hidden="true">↗</span></div><div class="catalog-card-copy"><p class="dossier-kicker">${m.year||'EXPLORATION'} <span>/ ${String(i+1).padStart(2,'0')}</span></p><h2>${escapeHTML(m.name)}</h2><p>${escapeHTML(m.summary.replace(/^Analyse (?:technique et historique détaillée|complète|exhaustive).*?(?=de |du |des )/,''))}</p><small>EXPLORER LA MISSION <span aria-hidden="true">→</span></small></div>`;
   grid.append(a);
   if(!media.has(m.id))media.set(m.id,loadJSON(`${m.id}.media.json`).catch(()=>null));
   media.get(m.id).then(data=>{if(token!==generation||!a.isConnected)return;const archive=data?.images?.[0];if(archive){const img=a.querySelector('img');img.src=asset(archive.src);img.alt=archive.title;}});
  }
 }
 try{
  missions=await loadJSON('catalog.json');document.querySelector('#catalog-total').textContent=missions.length;
  const filters=document.querySelector('#mission-filters');
  for(const [id,label] of [['all','Toutes'],...Object.entries(DESTINATIONS).filter(([id])=>missions.some(m=>m.body===id))]){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',String(id==='all'));b.onclick=()=>{filter=id;for(const other of filters.children)other.setAttribute('aria-pressed',String(other===b));render();};filters.append(b);}
  const requested=new URLSearchParams(location.search).get('body');if(requested&&Object.hasOwn(DESTINATIONS,requested)){filter=requested;[...filters.children].forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===DESTINATIONS[requested])));}
  search.addEventListener('input',render);sort.addEventListener('change',render);render();
 }catch(error){document.querySelector('#mission-count').textContent='Archives indisponibles';const e=document.querySelector('#catalog-error');e.hidden=false;e.textContent=error.message+' · Rechargez la page pour réessayer.';}
}
