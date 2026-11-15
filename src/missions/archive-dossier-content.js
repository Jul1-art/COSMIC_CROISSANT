import {archiveSections,archiveEvents,archiveFact,isArchiveDatedTable} from './archive-data.js';
import {asset,escapeHTML as e} from './catalog.js';
const headings={identite:['01','LA MISSION','Une mission dans son époque.'],inventaire:['02','LE MATÉRIEL','Ce que le voyage a laissé.'],chronologie:['03','LE JOURNAL DE MISSION','Les jalons de l’exploration.'],science:['04','AU-DELÀ DU VOYAGE','La mission et son héritage.'],sources:['05','LES DOCUMENTS','Revenir aux sources.']};
export function archivePhoto(image){return `<figure class="dossier-photo"><img src="${asset(image.src)}" alt="${e(image.title)}" loading="lazy" decoding="async"><figcaption><span>${e(image.title)} · ${e(image.credit)}${image.license?' · '+e(image.license):''}${image.context?' · '+e(image.context):''}</span><a href="${e(image.source)}" target="_blank" rel="noopener noreferrer">Archive originale ↗</a></figcaption></figure>`;}
function table(rows){return `<div class="mission-table-wrap"><table class="mission-source-table"><thead><tr>${rows[0].map(cell=>`<th scope="col">${e(cell)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${row.map(cell=>`<td>${e(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
function text(block){return block.text.length<180&&/^(?:[A-G][.)]|\d+[.)])/.test(block.text)?`<h3 class="mission-text-heading">${e(block.text)}</h3>`:`<p>${e(block.text)}</p>`;}
function inventory(blocks){let number=0;return blocks.map(block=>{
 if(block.type==='text')return text(block);
 if(block.rows[0].length<3)return table(block.rows);
 return `<div class="dossier-hardware-grid">${block.rows.slice(1).filter(row=>row.some(Boolean)).map(row=>`<article class="dossier-hardware"><div class="dossier-hardware-top"><span class="dossier-item-number">${String(++number).padStart(2,'0')}</span><span class="dossier-hardware-status">${e(row.length>=4?row[2]:'')}</span></div><h4>${e(row[0])}</h4><p class="dossier-hardware-mass">${e(row[1])}</p><p>${e(row.slice(row.length>=4?3:2).join(' · '))}</p></article>`).join('')}</div>`;
 }).join('');}
export function renderArchiveDossierTab(record,media,id){
 const sections=archiveSections(record),[number,label,title]=headings[id],agency=archiveFact(record,/agence/i);
 const heading=`<header class="dossier-section-heading"><p class="dossier-kicker">${number} / ${label}</p><h2>${title}</h2><p>${e(record.name)}${agency?' · '+e(agency):''}</p></header>`;
 if(id==='identite')return heading+`<dl class="dossier-facts">${record.facts.map(row=>`<div><dt>${e(row[0])}</dt><dd>${e(row.slice(1).join(' · '))}</dd></div>`).join('')}</dl>`+(media.images?.[1]?archivePhoto(media.images[1]):'')+`<div class="dossier-prose"><p>${e(record.summary)}</p></div>`;
 if(id==='inventaire')return heading+inventory(sections.inventaire);
 if(id==='chronologie'){
  const events=archiveEvents(record);let cursor=0;
  return heading+sections.chronologie.map(block=>{
   if(!isArchiveDatedTable(block))return `<div class="dossier-prose">${block.type==='table'?table(block.rows):text(block)}</div>`;
   const rows=block.rows.slice(1).filter(row=>row.length>1&&row[0]&&row[1]);
   return `<ol class="dossier-timeline">${rows.map(()=>{const index=cursor++,event=events[index];return `<li><span class="dossier-timeline-index">${String(index+1).padStart(2,'0')}</span><time>${e(event.date)}</time><div><h3>${e(event.title)}</h3>${event.text!==event.title?`<p>${e(event.text)}</p>`:''}</div></li>`;}).join('')}</ol>`;
  }).join('');
 }
 const prose=`<div class="dossier-prose">${sections[id].map(block=>block.type==='table'?table(block.rows):text(block)).join('')}</div>`;
 if(id==='science')return heading+prose+(media.images?.[2]?archivePhoto(media.images[2]):'');
 const archives=[...(media.images||[]).map(image=>({...image,kind:'ARCHIVE PHOTOGRAPHIQUE'})),...(media.videos||[]).map(video=>({...video,kind:'VIDÉO DE LA MISSION'})),...(media.models||[]).map(model=>({...model,kind:'MODÈLE 3D / NASA'}))];
 return heading+prose+`<div class="dossier-source-list">${archives.map(archive=>`<a href="${e(archive.source)}" target="_blank" rel="noopener noreferrer"><span>${archive.kind}</span><strong>${e(archive.title)}</strong><small>${e(archive.credit)}${archive.license?' · '+e(archive.license):''}</small><i aria-hidden="true">↗</i></a>`).join('')}</div>`+(media.images?.[0]?archivePhoto(media.images[0]):'');
}
