import * as THREE from 'three';
import {createLander,createCSM} from './mission-models.js';

const C={gold:0xc8a665,silver:0xc3cad1,dark:0x242831,solar:0x192e50,white:0xe5e3da};
const material=(color,metalness=.55,roughness=.48)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
function mesh(g,geo,mat,pos=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const box=(g,size,mat,pos)=>mesh(g,new THREE.BoxGeometry(...size),mat,pos);
const cyl=(g,rt,rb,h,mat,pos,n=32)=>mesh(g,new THREE.CylinderGeometry(rt,rb,h,n),mat,pos);
const sphere=(g,r,mat,pos)=>mesh(g,new THREE.SphereGeometry(r,40,24),mat,pos);
function rod(g,a,b,mat,r=.025){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),m=cyl(g,r,r,start.distanceTo(end),mat);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
function dish(g,r,pos,mat){const geo=new THREE.LatheGeometry(Array.from({length:25},(_,i)=>{const x=i/24*r;return new THREE.Vector2(x,x*x/(2*r));}),48),m=mesh(g,geo,mat,pos);m.rotation.x=Math.PI/2;rod(g,[pos[0],pos[1],pos[2]],[pos[0],pos[1],pos[2]+r*.6],mat,.018);return m;}
function panel(g,w,h,pos,mat){const group=new THREE.Group();group.position.set(...pos);g.add(group);box(group,[w,.045,h],mat);const lines=material(0x7f90aa,.6,.4);for(let i=0;i<=Math.round(w/.25);i++)box(group,[.009,.052,h],lines,[-w/2+i*w/Math.round(w/.25),0,0]);for(let i=0;i<5;i++)box(group,[w,.052,.009],lines,[0,0,-h/2+i*h/4]);return group;}
function wheels(g,count,length,width,r,mat){for(const side of [-1,1])for(let i=0;i<count/2;i++){const z=(i/(count/2-1)-.5)*length,w=cyl(g,r,r,.21,mat,[side*width,.35,z]);w.rotation.z=Math.PI/2;rod(g,[side*.45,.85,z*.5],[side*width,.35,z],material(C.silver),.045);for(let j=0;j<12;j++){const a=j/12*Math.PI*2;box(g,[.23,.035,.05],mat,[side*width,.35+Math.cos(a)*r,z+Math.sin(a)*r]).rotation.x=-a;}}}
function feet(g,n,reach,y,mat){for(let i=0;i<n;i++){const a=i/n*2*Math.PI+Math.PI/4,x=Math.cos(a),z=Math.sin(a);rod(g,[x*.6,y,z*.6],[x*reach,.1,z*reach],mat,.035);rod(g,[x*.8,y*.6,z*.8],[x*reach,.1,z*reach],mat,.025);cyl(g,.22,.25,.07,mat,[x*reach,.06,z*reach]);}}

/** Architectural reconstructions are explicitly labelled, never survey models. */
export function buildSpacecraft(mission){
 const g=new THREE.Group(),gold=material(C.gold),silver=material(C.silver,.82,.28),dark=material(C.dark,.3,.7),solar=material(C.solar,.4,.38),white=material(C.white,.2,.6),kind=mission.family,id=mission.id;
 const add=(name,text)=>{g.userData.parts??=[];g.userData.parts.push({name,text});};
 if(id==='mars-pathfinder'){
  g.name='Carl Sagan Memorial Station and Sojourner';
  const station=new THREE.Group();station.name='Carl Sagan Memorial Station';g.add(station);
  const corners=Array.from({length:3},(_,i)=>new THREE.Vector3(Math.cos(i*2*Math.PI/3)*.85,.22,Math.sin(i*2*Math.PI/3)*.85));
  function triangle(a,b,c,mat){const geo=new THREE.BufferGeometry().setFromPoints([a,b,c]);geo.setIndex([0,2,1]);geo.computeVertexNormals();const face=new THREE.Mesh(geo,mat.clone());face.material.side=THREE.DoubleSide;station.add(face);return face;}
  triangle(...corners,gold);
  for(let i=0;i<3;i++){
   const a=corners[i],b=corners[(i+1)%3],c=corners[(i+2)%3],tip=a.clone().add(b).sub(c);
   const petal=triangle(a,b,tip,solar);petal.name='Solar petal '+(i+1);
   for(const edge of [[a,b],[a,tip],[b,tip]])rod(station,edge[0].toArray(),edge[1].toArray(),silver,.018);
   for(let row=1;row<7;row++){const fraction=row/7,start=a.clone().lerp(tip,fraction),end=b.clone().lerp(tip,fraction);start.y+=.003;end.y+=.003;rod(station,start.toArray(),end.toArray(),silver,.004);}
   const angle=i*2*Math.PI/3;
   for(let lobe=-1;lobe<=1;lobe++){const bag=sphere(station,.36,material(0xb6a28a,.05,.95),[Math.cos(angle)*1.02,.08,Math.sin(angle)*1.02+lobe*.26]);bag.scale.set(1,.22,.7);bag.name='Retracted airbag';}
  }
  box(station,[.65,.25,.5],gold,[0,.4,0]);box(station,[.28,.16,.28],white,[-.28,.53,.1]);
  cyl(station,.022,.028,1.1,silver,[.12,.92,.1]);const cameraHead=box(station,[.24,.11,.1],white,[.12,1.49,.1]);cameraHead.name='IMP stereo camera';
  for(const x of [.045,.195])cyl(station,.035,.035,.065,dark,[x,1.49,.18]).rotation.x=Math.PI/2;
  cyl(station,.008,.008,.9,silver,[-.4,.87,-.15]);cyl(station,.1,.1,.035,white,[.35,.65,-.2]);
  const rover=buildSpacecraft({...mission,id:'sojourner'});rover.name='Sojourner';
  let bounds=new THREE.Box3().setFromObject(rover);rover.scale.multiplyScalar(.3/bounds.getSize(new THREE.Vector3()).y);rover.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(rover);rover.position.set(2.05,-bounds.min.y,.35);g.add(rover);
  g.userData.references=['https://pds.nasa.gov/data/mpfr-m-apxs-5-ddr-v1.0/mprv_0001/document/mission.htm','https://science.nasa.gov/mission/mars-pathfinder/'];
  add('Carl Sagan Memorial Station','Atterrisseur tétraédrique ouvert : trois pétales solaires, imageur stéréo IMP et station météorologique.');
  add('Sojourner','Rover à six roues représenté à côté de sa station de communication ; hauteur déployée de 30 cm. Position relative de présentation.');
  add('Airbags rétractés','Volumes de contexte autour de la base ; leur disposition n’est pas une cartographie des vestiges.');
  return g;
 }
 if(kind==='apollo'){
  const lm=createLander();g.add(lm.root);lm.root.position.x=-3.5;
  const csm=createCSM();csm.scale.setScalar(1.3);csm.position.set(4,2,0);g.add(csm);add('Module lunaire','Deux étages, quatre jambes, moteur de descente et cabine d’ascension.');add('Module de commande et de service','Capsule conique, module cylindrique et moteur principal.');
  if(/1[567]$/.test(id)){const rover=new THREE.Group();box(rover,[1.4,.22,2.1],gold,[0,.65,0]);wheels(rover,4,1.6,.9,.3,dark);box(rover,[1.2,.5,.7],silver,[0,1.05,0]);rover.position.set(2,0,4);g.add(rover);add('Lunar Roving Vehicle','Véhicule électrique à quatre roues utilisé à partir d’Apollo 15.');}
  return g;
 }
 if(kind==='sputnik'||kind==='sputnik2'){
  if(kind==='sputnik'){sphere(g,.58/2,silver,[0,1,0]);for(const side of [-1,1])for(const z of [-1,1])rod(g,[side*.14,1,z*.14],[side*(z===1?2.4:2.9),-.4,z*1.4],silver,.008);add('PS-1','Sphère pressurisée de 58 cm et quatre antennes radio.');}
  else{cyl(g,0,1,2.6,silver,[0,1.8,0]);sphere(g,.48,silver,[0,1.2,0]);cyl(g,1.02,1.02,.12,dark,[0,.5,0]);for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(g,[0,1.6,0],[Math.cos(a)*2,.7,Math.sin(a)*2],silver,.018);}add('Capsule biologique','Compartiment pressurisé pour Laïka, instruments et enveloppe conique.');}return g;
 }
 if(['rover-rtg','mer','sojourner','zhurong','exomars','lunokhod'].includes(kind)){
  const lunar=kind==='lunokhod',small=kind==='sojourner';
  if(lunar){cyl(g,.95,.8,.75,silver,[0,1,0],12);const lid=cyl(g,.95,.95,.04,solar,[0,1.65,-.55]);lid.rotation.x=-.85;wheels(g,8,1.9,1.05,.3,dark);for(const x of [-.5,.5]){cyl(g,.08,.08,.8,silver,[x,1.75,.5]);sphere(g,.13,dark,[x,2.2,.5]);}add('Lunokhod','Châssis pressurisé à huit roues indépendantes et couvercle solaire relevé.');}
  else{
   box(g,[1.25,.45,1.9],gold,[0,.9,0]);wheels(g,6,1.75,1,.35,dark);
   if(kind==='rover-rtg'){cyl(g,.2,.2,.8,silver,[0,.9,-1.25]).rotation.x=-.4;add('Générateur radio-isotopique','Source d’énergie à l’arrière du châssis.');}
   else{panel(g,kind==='zhurong'?3:2.5,1.9,[0,1.18,0],solar);if(kind==='zhurong'){for(const x of [-1,1])panel(g,1.1,1.6,[x*1.55,1.18,0],solar);}}
   if(!small){cyl(g,.06,.08,1.25,silver,[.25,1.8,.55]);box(g,[.6,.25,.25],white,[.25,2.45,.55]);for(const x of [-.18,.18]){const lens=cyl(g,.08,.08,.12,dark,[.25+x,2.45,.72]);lens.rotation.x=Math.PI/2;}rod(g,[-.55,.9,.9],[-1.05,.55,1.6],silver,.06);rod(g,[-1.05,.55,1.6],[-.5,.4,2],silver,.055);cyl(g,.12,.12,.25,silver,[-.5,.4,2]);}
   else g.scale.setScalar(.5);
   add('Train roulant','Six roues et suspension articulée ; architecture adaptée à la famille du rover.');add('Plateforme scientifique','Caméras, instruments et panneaux solaires ou alimentation radio-isotopique.');
  }return g;
 }
 if(['venera','venera-early'].includes(kind)){
  const early=kind==='venera-early';sphere(g,early?.7:.85,gold,[0,1.2,0]);cyl(g,early?.85:1.5,early?.85:1.5,.12,silver,[0,.25,0]);cyl(g,.38,.38,.6,silver,[0,2,0]);const aero=cyl(g,1.4,1.4,.09,gold,[0,2.25,0]);for(let i=0;i<8;i++){const a=i*Math.PI/4;rod(g,[Math.cos(a)*.65,1.2,Math.sin(a)*.65],[Math.cos(a)*1.3,.3,Math.sin(a)*1.3],silver,.035);}for(const x of [-1,1])box(g,[.25,.4,.3],silver,[x*.95,1,.3]);add('Capsule pressurisée','Enceinte thermique pour résister à l’atmosphère vénusienne.');add(early?'Module de descente':'Anneau d’atterrissage et aérofrein','Architecture représentative de la génération de l’atterrisseur.');return g;
 }
 if(['surveyor','viking','lunar-lander','luna-lander','luna-return'].includes(kind)){
  const survey=kind==='surveyor',luna=kind==='luna-lander',ret=kind==='luna-return';
  if(luna){sphere(g,.65,gold,[0,.8,0]);for(let i=0;i<4;i++){const p=box(g,[.9,.03,1.2],silver,[Math.cos(i*Math.PI/2)*.8,.35,Math.sin(i*Math.PI/2)*.8]);p.rotation.y=-i*Math.PI/2;p.rotation.z=.1;}rod(g,[0,1.1,0],[0,2.4,0],silver,.015);}
  else{
   if(survey){for(let i=0;i<3;i++){const a=i*2*Math.PI/3,b=(i+1)*2*Math.PI/3;rod(g,[Math.cos(a),.7,Math.sin(a)],[Math.cos(b),.7,Math.sin(b)],silver,.045);rod(g,[Math.cos(a),.7,Math.sin(a)],[0,2.3,0],silver,.035);}cyl(g,.32,.45,.5,dark,[0,.7,0]);rod(g,[0,1,0],[0,3.2,0],silver,.045);panel(g,1.1,.8,[0,2.55,0],solar);box(g,[.25,.5,.3],white,[.35,2.1,0]);}
   else{cyl(g,ret?.8:1,ret?.8:1,.6,gold,[0,1,0],8);cyl(g,.25,.45,.45,dark,[0,.5,0]);if(ret){cyl(g,.4,.4,1.2,silver,[0,2,0]);sphere(g,.4,gold,[0,2.8,0]);}else{box(g,[.7,.45,.6],silver,[0,1.55,0]);for(const x of [-1,1])panel(g,1.1,.8,[x*1.2,1.25,0],solar);cyl(g,.06,.06,.8,silver,[.45,1.9,.2]);box(g,[.3,.2,.25],dark,[.45,2.35,.2]);}}
   feet(g,survey||kind==='viking'?3:4,survey?1.8:1.65,1.25,silver);
  }
  add('Atterrisseur','Plateforme, instruments, propulsion et appuis de surface.');if(ret)add('Étage de remontée','Colonne propulsive et capsule de retour d’échantillons.');return g;
 }
 if(kind==='webb'){
  for(let i=0;i<5;i++){const layer=mesh(g,new THREE.OctahedronGeometry(2.8,0),new THREE.MeshStandardMaterial({color:i%2?0xcdb9d1:0xb9bdc9,metalness:.7,roughness:.35,side:THREE.DoubleSide}),[0,.15+i*.05,0]);layer.scale.set(1,.012,1.55);}
  const mirror=new THREE.Group();mirror.rotation.x=Math.PI/2;mirror.position.set(0,2.2,0);g.add(mirror);
  for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++){const s=-q-r;if(Math.max(Math.abs(q),Math.abs(r),Math.abs(s))>2||q===0&&r===0)continue;const hex=cyl(mirror,.48,.48,.05,gold,[q*.84,0,(r+q/2)*.97],6);}
  for(const x of [-1,1])rod(g,[x*1.5,1.8,0],[0,2.2,2.4],silver,.03);sphere(g,.18,gold,[0,2.2,2.4]);box(g,[.6,.6,1],gold,[0,.6,0]);add('Miroir primaire','18 segments hexagonaux et miroir secondaire sur tripode.');add('Bouclier solaire','Cinq membranes isolantes sous l’optique infrarouge.');return g;
 }
 if(kind==='roman'){cyl(g,.72,.72,3.2,white,[0,1.8,0]);cyl(g,.6,.6,.1,dark,[0,3.45,0]);panel(g,3.8,2,[0,1,-.9],solar);add('Télescope','Architecture de télescope de 2,4 m, pare-lumière et panneau solaire.');return g;}
 if(kind==='voyager'||kind==='pioneer'||kind==='cassini'){
  cyl(g,.65,.65,1,gold,[0,1,0],10);dish(g,kind==='voyager'?1.85:1.4,[0,2,0],white);for(const side of [-1,1]){rod(g,[0,1,0],[side*2,1.1,-.6],silver,.04);for(let i=0;i<(kind==='voyager'?3:2);i++)cyl(g,.17,.17,.35,dark,[side*(1.65+i*.38),1.1,-.6]);}rod(g,[0,1,0],[-1,1,kind==='voyager'?-5:-2.4],silver,.02);box(g,[.5,.5,.5],dark,[-1,1,-2.4]);add('Antenne grand gain','Réflecteur principal et structure centrale de la sonde.');add('Alimentation et instruments','Générateurs radio-isotopiques et mâts scientifiques.');return g;
 }
 if(kind==='parker'){cyl(g,1.05,1.05,.16,dark,[0,2,0],12);cyl(g,.55,.55,1.5,gold,[0,1,0],8);for(const x of [-1,1])panel(g,.7,.7,[x*.8,1.1,0],solar);for(const x of [-1,1])rod(g,[x*.3,1,0],[x*1.5,-1,0],silver,.012);add('Bouclier thermique','Protection solaire au-dessus du bus et panneaux repliables.');return g;}
 // Orbiter details differ by mission: antenna, bus, solar wings and booms.
 const configs={
  'hera':{w:5.7,h:1.5,bus:[1.6,1.7,1.6],dish:.565},'rosetta-philae':{w:7,h:2,bus:[1.6,2.2,2.1],dish:1.1},
  'juice':{w:7,h:2.5,bus:[2,2.2,2],dish:1.25},'europa-clipper':{w:10,h:2.5,bus:[1.5,2,1.5],dish:1.5},
  'bepicolombo':{w:7,h:1.8,bus:[1.8,2.7,1.8],dish:.55},'messenger':{w:2.6,h:1.5,bus:[1.4,1.6,1.2],dish:.55},
  'maven':{w:4.5,h:1.8,bus:[1.5,1.6,1.5],dish:1},'mars-express':{w:5.5,h:1.4,bus:[1.5,1.7,1.8],dish:.8},
  'hope':{w:4,h:1.5,bus:[1.5,2,1.8],dish:.75},'akatsuki':{w:2.5,h:1.2,bus:[1.1,1.4,1.45],dish:.8},
  'ace':{w:2,h:1.3,bus:[1.3,.9,1.3],dish:.5},'soho':{w:5.5,h:2.3,bus:[2,2.5,2],dish:.65},
  'stereo':{w:3,h:1.5,bus:[1.2,1.1,1.3],dish:.6},'near-shoemaker':{w:2,h:1.3,bus:[1.2,1.8,1.2],dish:.75}
 };
 const key=Object.keys(configs).find(k=>id.startsWith(k)),cfg=configs[key]||{w:2.6,h:1.4,bus:[1.2,1.5,1.2],dish:.65};
 const russian=kind==='luna-orbiter';
 if(russian){sphere(g,.65,silver,[0,1.2,0]);cyl(g,.5,.6,1.2,silver,[0,2,0]);for(let i=0;i<4;i++){const a=i*Math.PI/2;rod(g,[0,1.5,0],[Math.cos(a)*1.4,2.8,Math.sin(a)*1.4],silver,.015);}}
 else{box(g,cfg.bus,gold,[0,1.5,0]);for(const side of [-1,1]){rod(g,[0,1.5,0],[side*cfg.w*.65,1.5,0],silver,.045);panel(g,cfg.w,cfg.h,[side*(cfg.w/2+cfg.bus[0]/2+.3),1.5,0],solar);}dish(g,cfg.dish,[0,1.9,cfg.bus[2]/2],white);cyl(g,.15,.3,.4,dark,[0,.55,0]);for(const x of [-.4,.4])cyl(g,.06,.09,.2,dark,[x,.65,.4]);}
 if(kind==='rosetta'){const philae=new THREE.Group();box(philae,[.65,.55,.6],gold,[0,.55,0]);feet(philae,3,.75,.6,silver);philae.position.set(3.5,-.2,2);g.add(philae);add('Philae','Atterrisseur à trois pieds présenté séparément de Rosetta.');}
 if(/stereo|mars-express/.test(id))rod(g,[0,2,0],[0,2,-6],silver,.018);
 add('Plateforme de la sonde','Bus central isolé, propulsion et antenne de télécommunication.');add('Génération électrique','Ailes solaires déployées ; géométrie pédagogique de la plateforme.');return g;
}

