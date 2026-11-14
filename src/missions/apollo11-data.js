/** Apollo 11 pilot catalogue. Dates UTC; local placement is illustrative, never surveyed. */
export const APOLLO_11 = {
  id:'apollo-11', name:'Apollo 11', agency:'NASA', programme:'Apollo',
  site:{name:'Base de la Tranquillité',body:'moon',latitude:.67409,longitude:23.47298},
  crew:[['Neil Armstrong','Commandant'],['Buzz Aldrin','Pilote du module lunaire'],['Michael Collins','Pilote du module de commande']],
  summary:'Le premier alunissage habité. Huit jours de voyage, deux hommes sur la Lune et un patrimoine technique toujours présent à la surface.',
  sources:[
    ['NASA · Mission Apollo 11','https://www.nasa.gov/mission/apollo-11/'],
    ['NASA · Chronologie officielle SP-4029','https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11i_Timeline.htm'],
    ['NASA · Rapport de mission MSC-00171','https://www.nasa.gov/wp-content/uploads/static/apollo50th/pdf/A11_MissionReport.pdf'],
    ['NASA · Lunar Surface Journal','https://www.nasa.gov/wp-content/uploads/static/history/alsj/a11/a11ov.html'],
    ['NASA · Expérience sismique','https://science.nasa.gov/resource/apollo-11-seismic-experiment/'],
    ['NASA SVS · Reconstitution du site par LRO','https://svs.gsfc.nasa.gov/4185/'],
    ['NASA · Protection du patrimoine lunaire','https://www.nasa.gov/history/for-all-humanity/'],
  ],
  videos:[
    {title:'Survol du site d’alunissage',description:'Reconstitution NASA à partir des photographies et du relief mesurés par LRO. Sans narration.',credit:'NASA Scientific Visualization Studio · Ernie Wright · 2014',src:'https://svs.gsfc.nasa.gov/vis/a000000/a004100/a004185/apollo11_flyover_720p30.mp4',source:'https://svs.gsfc.nasa.gov/4185/'},
    {title:'La descente d’Eagle',description:'Profil d’approche et d’alunissage reconstitué à partir des données LRO. Vidéo de la chaîne officielle NASA.',credit:'NASA Video · Apollo 11 Landing Profile',youtube:'In5xf5DHiM4',source:'https://www.youtube.com/watch?v=In5xf5DHiM4'},
  ],
};
export const EVENTS = [
  ['launch','1969-07-16T13:32:00Z','Décollage','Saturn V décolle du Kennedy Space Center. L’équipage rejoint une orbite de stationnement terrestre.'],
  ['tli','1969-07-16T16:22:13Z','Cap sur la Lune','Le S-IVB réalise l’injection translunaire. Columbia se retourne et extrait Eagle de son adaptateur.'],
  ['orbit','1969-07-19T17:21:50Z','Orbite lunaire','Une mise à feu du moteur du module de service freine le vaisseau pour le placer en orbite lunaire.'],
  ['descent','1969-07-20T20:05:05Z','La descente','Armstrong et Aldrin descendent dans Eagle. Collins reste en orbite à bord de Columbia.'],
  ['landing','1969-07-20T20:17:43Z','Eagle s’est posé','Eagle atteint la mer de la Tranquillité. Son étage de descente restera sur la Lune.'],
  ['step','1969-07-21T02:56:15Z','Le premier pas','Armstrong pose le pied sur le sol lunaire. Aldrin le rejoint ; les astronautes déploient les expériences et collectent des échantillons.'],
  ['eva-end','1969-07-21T05:11:12Z','Retour dans Eagle','La sortie est terminée. Les échantillons et les films sont à bord ; les instruments, outils et équipements inutiles restent au sol.'],
  ['ascent','1969-07-21T17:54:00Z','Décollage lunaire','L’étage d’ascension quitte la surface. L’étage de descente sert de plateforme et reste au site.'],
  ['dock','1969-07-21T21:35:00Z','Retrouvailles en orbite','Eagle rejoint Columbia. Les astronautes et les échantillons sont transférés dans le module de commande.'],
  ['jettison','1969-07-21T23:41:31Z','Eagle est largué','L’étage d’ascension est abandonné en orbite lunaire. Son devenir et son emplacement final ne sont pas confirmés.'],
  ['return','1969-07-22T04:55:42Z','Retour vers la Terre','Le module de service propulse Columbia sur une trajectoire de retour.'],
  ['separation','1969-07-24T16:21:12Z','Séparation du module de service','Le module de service est largué avant la rentrée et est détruit dans l’atmosphère terrestre.'],
  ['splash','1969-07-24T16:50:35Z','Amerrissage','Columbia amerrit dans le Pacifique avec l’équipage et environ 21,55 kg d’échantillons lunaires.'],
].map(([id,date,title,text])=>({id,date,time:Date.parse(date),title,text}));
export const START=EVENTS[0].time, END=EVENTS.at(-1).time;
export const eventTime=id=>EVENTS.find(row=>row.id===id).time;
export function missionState(time){
  const value=Number(time),t=Number.isFinite(value)?Math.max(START,Math.min(END,value)):START;
  const event=EVENTS.findLast(row=>row.time<=t)||EVENTS[0];
  return {time:t,event,elapsedSeconds:Math.floor((t-START)/1000),landed:t>=eventTime('landing'),deployed:t>=eventTime('step'),ascent:t>=eventTime('ascent'),returned:t>=END};
}
export function missionProgress(time){return (missionState(time).time-START)/(END-START);}
export function formatUTC(time){return new Intl.DateTimeFormat('fr-FR',{timeZone:'UTC',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(time))+' UTC';}
export function elapsedLabel(time){const s=missionState(time).elapsedSeconds;return `T+${String(Math.floor(s/3600)).padStart(3,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
// Positions in metres relative to Eagle, for readable pedagogical models only.
export const HARDWARE = [
  {id:'descent',name:'Étage de descente d’Eagle',zone:'Surface lunaire',status:'Laissé sur place',mass:'≈ 2 200 kg à sec',position:[0,0,0],kind:'lander',since:'landing',text:'Structure à quatre pieds, moteur de descente, réservoirs, échelle et plaque commémorative. Il a servi de plateforme au décollage de l’étage d’ascension.'},
  {id:'reflector',name:'Rétroréflecteur laser · LRRR',zone:'Surface lunaire',status:'Toujours utilisé',mass:'≈ 20 kg',position:[14,0,-10],kind:'reflector',since:'step',text:'Cent coins de cube renvoient vers la Terre une partie des impulsions laser. Cet instrument passif permet encore la télémétrie Terre–Lune, sans alimentation électrique.'},
  {id:'seismic',name:'Sismomètre · PSEP',zone:'Surface lunaire',status:'Inactif',mass:'≈ 48 kg',position:[-13,0,-14],kind:'seismic',since:'step',text:'Le premier sismomètre placé sur la Lune, alimenté par panneaux solaires. Il cesse de répondre le 25 août 1969. Les séries sismiques de plusieurs années proviennent des missions Apollo suivantes.'},
  {id:'dust',name:'Détecteur de poussière',zone:'Surface lunaire',status:'Inactif',mass:'Moins de 1 kg',position:[-13,1.1,-14],kind:'dust',since:'step',text:'Petit détecteur monté sur le PSEP pour observer l’évolution de ses cellules solaires et étudier les dépôts de poussière.'},
  {id:'flag',name:'Drapeau et mât',zone:'Surface lunaire',status:'Renversé au décollage',mass:'≈ 2 kg',position:[7,0,6],kind:'flag',since:'step',text:'Un mât et une barre horizontale déploient le tissu dans le vide. Aldrin rapporte avoir vu le drapeau tomber sous le souffle du décollage d’Eagle.'},
  {id:'antenna',name:'Antenne bande S déployable',zone:'Surface lunaire',status:'Inactif',mass:'Masse non consolidée',position:[-8,0,7],kind:'antenna',since:'step',text:'Une antenne orientable déployée à la surface assure les communications. Elle est distincte des antennes du module lunaire ; sa position ici est illustrative.'},
  {id:'camera',name:'Caméra TV Westinghouse',zone:'Surface lunaire',status:'Inactif',mass:'≈ 3,3 kg, caméra seule',position:[12,0,13],kind:'camera',since:'step',text:'Installée d’abord dans le compartiment MESA, puis déplacée sur un trépied, elle transmet les premiers pas et la sortie lunaire en direct. Elle ne filme pas l’alunissage.'},
  {id:'tools',name:'Outils d’échantillonnage',zone:'Surface lunaire',status:'Laissés sur place',mass:'Variable selon les outils',position:[4,0,-6],kind:'tools',since:'step',text:'Des outils et accessoires devenus inutiles sont laissés pour réduire la masse au retour. Les échantillons, certaines pièces et le collecteur de vent solaire sont rapportés sur Terre.'},
  {id:'bags',name:'Sacs de délestage et équipements',zone:'Surface lunaire',status:'Laissés sur place',mass:'Non consolidée',position:[-4,0,3],kind:'bags',since:'eva-end',text:'Des équipements, consommables et déchets sont abandonnés avant le décollage. Aucun sac d’Apollo 11 laissé sur la Lune n’a été récupéré pour une analyse terrestre en 2019.'},
  {id:'blankets',name:'Isolation thermique',zone:'Surface lunaire',status:'Laissée sur place',mass:'Incluse dans les équipements',position:[2,0,2],kind:'blankets',since:'landing',text:'Les couvertures multicouches protègent les structures des échanges thermiques. Celles attachées à l’étage de descente font partie du module ; elles ne doivent pas être comptées deux fois.'},
  {id:'ascent',name:'Étage d’ascension d’Eagle',zone:'Orbite lunaire',status:'Devenir non confirmé',mass:'≈ 2 400 kg à sec',since:'jettison',text:'Largué après le rendez-vous et le transfert de l’équipage. Un impact ultérieur a souvent été supposé, mais il n’existe pas de localisation finale confirmée.'},
  {id:'service',name:'Module de service · SM',zone:'Atmosphère terrestre',status:'Détruit à la rentrée',mass:'≈ 5 000 kg à sec',since:'separation',text:'Il assure propulsion, énergie et consommables. Séparé de Columbia le 24 juillet, il est détruit dans l’atmosphère terrestre ; ce n’est pas un objet encore en orbite lunaire.'},
  {id:'sivb',name:'Troisième étage · S-IVB',zone:'Orbite héliocentrique',status:'Trajectoire solaire',mass:'≈ 13 500 kg à sec',since:'tli',text:'Après l’injection translunaire et l’extraction d’Eagle, l’étage est envoyé sur une trajectoire passant près de la Lune puis autour du Soleil. Sa position actuelle n’est pas simulée ici.'},
  {id:'sla',name:'Panneaux de l’adaptateur · SLA',zone:'Trajectoire translunaire',status:'Largués en vol',mass:'Non consolidée',since:'tli',text:'Les quatre panneaux de l’adaptateur sont éjectés pour permettre l’amarrage et l’extraction du module lunaire. Leurs positions finales ne sont pas représentées.'},
];
export const MISSIONS=new Map([[APOLLO_11.id,APOLLO_11]]);
