/** Shared source interpretation. PDF contents are data, never executable markup. */
export const ARCHIVE_TABS=[['identite','La mission'],['inventaire','Matériel & instruments'],['chronologie','Chronologie'],['science','Science & héritage'],['sources','Sources & archives']];
export function archiveSections(record){
 const result=Object.fromEntries(ARCHIVE_TABS.map(([id])=>[id,[]]));let active='identite',started=false;
 for(const page of record.pages)for(const block of page){
  if(block.type==='text'){
   const text=block.text,heading=text.length<180&&/^(?:\d+[.)]?\s*)?(?:Identité|Inventaire|Chronologie|Science|Sources|Apports scientifiques|Références)/i.test(text);
   if(heading){started=true;active=/identité/i.test(text)?'identite':/inventaire/i.test(text)?'inventaire':/chronologie/i.test(text)?'chronologie':/sources|références/i.test(text)?'sources':'science';continue;}
   if(!started||/^(?:Champ\s+Contenu|Objet\s+Masse|Date\s+Événement|Badges d'état|Légende des états|Référence du dossier)/i.test(text)||/Fiche « Plus de détails ».*Page \d|Document généré conformément/.test(text))continue;
  }else if(!started)continue;
  result[active].push(block);
 }return result;
}
export function archiveEvents(record){
 const events=archiveSections(record).chronologie.filter(isArchiveDatedTable).flatMap(b=>b.rows.slice(1)).filter(r=>r.length>1&&r[0]&&r[1]);
 return events.map((row,i)=>({id:String(i),date:row[0],title:archiveEventTitle(row[1]),text:row.slice(1).join(' · ')}));
}
export const isArchiveDatedTable=block=>block.type==='table'&&/^date\b/i.test(block.rows[0]?.[0]||'');
/** Short editorial headings; the complete source event remains in event.text. */
export function archiveEventTitle(text){
 const titles=[[/^Lancement\b/i,'Le lancement'],[/^Survol de Jupiter/i,'Survol de Jupiter'],[/^Survol de Pluton/i,'Survol de Pluton'],[/^Survol d.Arrokoth/i,'Survol d’Arrokoth'],[/^Déploiement.*bouclier thermique/i,'Le bouclier thermique se déploie'],[/^Déploiement.*miroir primaire/i,'Le miroir se déploie'],[/^Découverte des galaxies/i,'Un regard sur les premières galaxies'],[/^Publication de la première image/i,'La première image scientifique']];
 for(const [pattern,title] of titles)if(pattern.test(text))return title;
 const phrase=text.split(/\s[—–]\s|\s:\s|;\s/)[0];
 return phrase.length<=56?phrase:phrase.slice(0,53).replace(/\s+\S*$/,'')+'…';
}
export const archiveFact=(record,pattern)=>record.facts.find(r=>pattern.test(r[0]))?.[1]||'';
export function archiveBody(record){return ({'voyager-1':'saturn','voyager-2':'neptune','pioneer-11':'saturn'}[record.id])||(record.body==='observatories'?'earth':record.body==='outer'?'jupiter':record.body==='small-bodies'?'67p':record.body==='pluto'?'pluto':record.body);}
export function archiveHeadline(record){
 const titles={'apollo-12':'La précision, pour nouvel horizon.','apollo-13':'Un retour devenu une mission.','apollo-14':'Reprendre le chemin de la Lune.','apollo-15':'Plus loin que les premiers pas.','apollo-16':'Lire l’histoire des hauts plateaux.','apollo-17':'Les derniers pas. Un héritage intact.','spoutnik-2':'Un être vivant, pour la première fois en orbite.','rosetta-philae':'Dix ans de voyage. Une rencontre avec une comète.','james-webb':'Regarder plus loin. Remonter le temps.','nancy-grace-roman':'Un nouveau regard sur l’Univers.','curiosity':'À la recherche d’un monde autrefois habitable.','perseverance':'Chercher les traces. Préparer le retour.','voyager-1':'Au-delà des planètes. Le voyage continue.','voyager-2':'Quatre mondes géants. Une seule trajectoire.','cassinihuygens':'Vingt ans de voyage. Un autre regard sur Saturne.','hera':'Comprendre un impact. Protéger notre planète.','near-shoemaker':'Un rendez-vous avec Éros.','parker-solar-probe':'Là où commence le vent solaire.','luna-9':'Se poser sur un autre monde.','luna-3':'La face cachée se révèle.','luna-10':'La première orbite autour de la Lune.','venera-7':'Un signal depuis la surface de Vénus.','venera-13':'Les couleurs d’un monde brûlant.'};
 return titles[record.id]||({apollo:'Une empreinte dans l’histoire lunaire.',surveyor:'Préparer le terrain pour les premiers pas.',lunokhod:'Explorer la Lune, roue après roue.',venera:'Sous les nuages, un autre monde.','venera-early':'Atteindre Vénus. Traverser l’inconnu.','lunar-lander':'Se poser. Explorer. Laisser une trace.','luna-return':'Des fragments de Lune, rapportés sur Terre.','luna-orbiter':'Ouvrir la voie à l’exploration lunaire.',mer:'Suivre les indices d’une ancienne planète bleue.','rover-rtg':'À hauteur de roche. À l’échelle d’un monde.'}[record.family]||'Une exploration. Des découvertes. Un héritage.');
}
