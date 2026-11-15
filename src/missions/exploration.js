import {renderArchiveDossierTab} from './archive-dossier-content.js';
import {archiveHeadline,archiveEvents} from './archive-data.js';
import {appURL} from '../core/paths.js';
import {loadJSON,asset,escapeHTML as e,DESTINATIONS,missionURL} from './catalog.js';
import {mountDossier} from './dossier-experience.js';
import {archiveModelSources} from './archive-model-resources.js';
import {archiveTarget} from './archive-targets.js';
import {getMissionPlanet,getMissionSite} from './mission-sites.js';

const tabs=[['identite','La mission'],['inventaire','Matériel & instruments'],['chronologie','Chronologie'],['science','Science & héritage'],['sources','Sources & archives']];
let mission,media;
async function showFilm(){
 const {openVideo}=await import('./mission-ui.js');
 await openVideo(mission.id);
}
function show3D(){
 const planet=getMissionPlanet(mission.id)||(['moon','mars'].includes(mission.body)?mission.body:null);
 const site=getMissionSite(mission.id);
 if(planet==='moon'||planet==='mars'){
  const params=new URLSearchParams();
  params.set('body',planet);
  params.set('mission',mission.id);
  if(site&&Number.isFinite(site.lat)&&Number.isFinite(site.lon)){
   params.set('lat',String(site.lat));
   params.set('lon',String(site.lon));
  }
  location.assign(appURL(`index.html?${params.toString()}`).href);
  return;
 }
 location.assign(appURL(`index.html?mission=${encodeURIComponent(mission.id)}&missionView=explore`).href);
}

try{
 const id=new URLSearchParams(location.search).get('mission');
 if(!id||!/^[a-z0-9-]+$/.test(id))throw new Error('Choisissez une mission depuis le catalogue.');
 [mission,media]=await Promise.all([loadJSON(`${id}.json`),loadJSON(`${id}.media.json`).catch(()=>({images:[],videos:[]}))]);
 media.models=archiveModelSources(mission,await loadJSON('models.json').catch(()=>({})),archiveTarget(mission));
 document.title=`${mission.name} — Archive de mission · RELIC`;document.body.dataset.mission=mission.id;
 const index=await loadJSON('catalog.json');
 const fact=pattern=>mission.facts.find(r=>pattern.test(r[0]))?.[1]||'';
 const agency=fact(/agence|institution/i),launch=fact(/lancement/i);
 const shortSummary=mission.summary.split(/\s*[·•]\s*/)[0];
 const heroImage=media.images?.[0];
 const fallback=appURL('assets/'+({moon:'moon-wac-8k.webp',mars:'mars-viking-global.webp',venus:'venus-scope.webp',mercury:'mercury-scope.webp',earth:'earth-blue-marble-4k.webp',sun:'sun-scope.webp',saturn:'saturn-scope.webp'}[mission.body]||'jupiter-scope.webp'));
 const ordinal=index.findIndex(m=>m.id===id)+1;
 document.querySelector('#mission-root').innerHTML=`<section class="dossier-hero"><div class="dossier-hero-copy"><p class="dossier-archive-label"><span></span> ARCHIVE ${String(ordinal).padStart(3,'0')} / ${e(DESTINATIONS[mission.body]).toUpperCase()}</p><h1>${e(mission.name)}</h1><p class="dossier-hero-headline">${e(archiveHeadline(mission))}</p><p class="dossier-subtitle">${e(launch||agency)}</p><p class="dossier-introduction mission-summary">${e(shortSummary)}</p><div class="dossier-hero-actions"><button type="button" class="dossier-primary" id="mission-film">Voir le film <span aria-hidden="true">↗</span></button><button type="button" class="dossier-secondary" id="mission-3d">Explorer en 3D <span aria-hidden="true">↗</span></button></div><div class="dossier-hero-facts"><div><strong>${mission.year||'—'}</strong><span>Lancement</span></div><div><strong>${archiveEvents(mission).length}</strong><span>Étapes clés</span></div><div><strong>${(media.images||[]).length}</strong><span>Archives photographiques</span></div></div></div><figure class="dossier-hero-photo"><img src="${heroImage?asset(heroImage.src):fallback}" alt="${e(heroImage?.title||'Vue de la destination de la mission')}" fetchpriority="high" width="1200" height="960"><figcaption>${e(heroImage?heroImage.title+' · '+heroImage.credit+(heroImage.license?' · '+heroImage.license:'')+(heroImage.context?' · '+heroImage.context:''):'La destination de la mission · contexte planétaire / NASA')}</figcaption><span class="dossier-photo-tag" aria-hidden="true">${e(mission.year||'RELIC')} / ${e(agency.split(/[—(/]/)[0].trim())}</span></figure></section><div class="dossier-mission-note"><span>STATUT DE LA MISSION</span><p>${e(fact(/^statut/i)||shortSummary)}</p><span aria-hidden="true">↓</span></div>`;
 document.querySelector('#mission-film').onclick=showFilm;document.querySelector('#mission-3d').onclick=show3D;
 document.querySelector('#mission-original').href=asset(mission.pdf);
 mountDossier({missionName:mission.name,renderTab:(key,language)=>renderArchiveDossierTab(mission,media,key,language)});
 document.querySelector('#dossier-tabs').hidden=false;document.querySelector('#mission-loading').remove();
 const ordered=[...index].sort((a,b)=>a.name.localeCompare(b.name,'fr',{numeric:true})),at=ordered.findIndex(m=>m.id===id),neighbours=document.createElement('nav');neighbours.className='mission-neighbours';neighbours.setAttribute('aria-label','Autres missions');
 for(const [m,label] of [[ordered[(at-1+ordered.length)%ordered.length],'MISSION PRÉCÉDENTE'],[ordered[(at+1)%ordered.length],'MISSION SUIVANTE']]){const a=document.createElement('a');a.href=missionURL(m.id);a.innerHTML=`<small>${label}</small>${e(m.name)} ↗`;neighbours.append(a);}document.querySelector('#dossier-content').after(neighbours);
 if(new URLSearchParams(location.search).get('view')==='3d')show3D();
}catch(error){document.querySelector('#mission-loading').innerHTML=`<p>${e(error.message)}</p><a href="missions.html">Ouvrir le catalogue des missions →</a>`;}
