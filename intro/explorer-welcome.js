import {createOpeningTyping} from './prologue-typing.js';
import {getExplorerName,saveExplorerName,normalizeExplorerName} from '../src/core/explorer-profile.js';

const copy={
 en:{greeting:'Hi, explorer of space.\nWant to learn about NASA and ESA missions?\nWell, you have come to the right place.\nFirst, let me ask you some questions.\nDo you prefer English or French?',name:'What’s your first name?',hint:'Spacey will use your name when you explore together.\nSaved only in this browser.',label:'Your first name',placeholder:'First name',continue:'Continue',ready:'Okay, {name}.\nWe’re ready to discover. Are you ready?',go:'Yeah, let’s go!',film:'Would you like to watch a film\nabout the beginning of space exploration?',yes:'Yes, show me the film',no:'No, take me to the Solar System',back:'Back',step:'Before we begin',privacy:'Your name stays on this device.'},
 fr:{greeting:'Salut, explorateur de l’espace.\nTu veux découvrir les missions de la NASA et de l’ESA ?\nTu es au bon endroit.\nD’abord, quelques questions.\nTu préfères l’anglais ou le français ?',name:'Quel est ton prénom ?',hint:'Spacey utilisera ton prénom pendant votre exploration.\nIl est enregistré uniquement dans ce navigateur.',label:'Ton prénom',placeholder:'Prénom',continue:'Continuer',ready:'D’accord, {name}.\nTout est prêt pour découvrir. Et toi ?',go:'Oui, c’est parti !',film:'Veux-tu regarder un film\nsur les débuts de la conquête spatiale ?',yes:'Oui, voir le film',no:'Non, explorer le système solaire',back:'Retour',step:'Avant de commencer',privacy:'Ton prénom reste sur cet appareil.'}
};
/** Intro-only gate. Returning from a mission keeps the existing return policy. */
export function createExplorerWelcome({host,getLanguage,setLanguage,reducedMotion,onComplete}){
 const document=host.ownerDocument;
 const root=document.createElement('section');root.className='explorer-welcome prologue';root.setAttribute('aria-label','Welcome to RELIC');root.dataset.cueKind='typing';
 root.innerHTML='<header class="welcome-header"><span>R E L I C</span><span class="welcome-step"></span></header><main class="welcome-main"><p class="welcome-eyebrow"></p><h1 class="welcome-title" tabindex="-1"></h1><div class="welcome-interaction"></div></main><footer class="welcome-footer"><button type="button" class="welcome-back"></button><span class="welcome-progress" aria-hidden="true"></span></footer>';
 const background=[...document.body.children].filter(node=>!['SCRIPT','LINK','STYLE'].includes(node.tagName)).map(node=>[node,node.inert]);
 for(const [node]of background)node.inert=true;
 function restore(){for(const [node,inert]of background)node.inert=inert;}
 host.before(root);host.hidden=true;
 const title=root.querySelector('h1'),interaction=root.querySelector('.welcome-interaction'),back=root.querySelector('.welcome-back');
 const typing=createOpeningTyping({element:title,getLanguage,reducedMotion});
 let step=0,name=getExplorerName(),frame=0,disposed=false;
 let compact=innerWidth<=650;
 function resize(){if(compact===(innerWidth<=650))return;compact=innerWidth<=650;if(step===1)name=normalizeExplorerName(root.querySelector('input')?.value);render(false);}
 window.addEventListener('resize',resize);
 const language=()=>getLanguage()==='fr'?'fr':'en';
 const button=(label,action,primary=false)=>{const node=document.createElement('button');node.type='button';node.className='welcome-button'+(primary?' welcome-primary':'');node.textContent=label;node.onclick=action;return node;};
 function finish(watch){if(disposed)return;disposed=true;cancelAnimationFrame(frame);typing.dispose();window.removeEventListener('resize',resize);root.remove();restore();host.hidden=false;onComplete({watch,name,language:language()});}
 function render(focus=true){
  cancelAnimationFrame(frame);const c=copy[language()];root.lang=language();root.setAttribute('aria-label',language()==='fr'?'Bienvenue sur RELIC':'Welcome to RELIC');root.dataset.step=String(step);
  root.querySelector('.welcome-step').textContent=String(step+1).padStart(2,'0')+' / 04';root.querySelector('.welcome-eyebrow').textContent=c.step;root.querySelector('.welcome-progress').textContent='—'.repeat(step+1);back.hidden=step===0;back.textContent=c.back;interaction.replaceChildren();
  const raw=[c.greeting,c.name,c.ready.replace('{name}',name),c.film][step];
  const limit=innerWidth<=650?32:65;const text=raw.split('\n').flatMap(line=>{const lines=[''];for(const word of line.split(' ').flatMap(word=>Array.from({length:Math.max(1,Math.ceil([...word].length/limit))},(_,i)=>[...word].slice(i*limit,(i+1)*limit).join('')))){const i=lines.length-1;if(lines[i]&&(lines[i]+' '+word).length>limit)lines.push(word);else lines[i]+=(lines[i]?' ':'')+word;}return lines;}).join('\n');
  const duration=reducedMotion()?0:Math.min(8,Math.max(1.4,text.length*.025));typing.setCue({start:0,typingStart:0,typingDuration:duration||.2},text);
  const start=performance.now();function tick(now){typing.render({position:reducedMotion()?1:(now-start)/1000,gated:false});if(!disposed&&(now-start)/1000<duration+1)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
  if(step===0){interaction.append(button('English',()=>{setLanguage('en');step=1;render();},true),button('Français',()=>{setLanguage('fr');step=1;render();}));}
  if(step===1){const form=document.createElement('form');form.className='welcome-name-form';const label=document.createElement('label');label.htmlFor='explorer-first-name';label.textContent=c.label;const input=document.createElement('input');input.id='explorer-first-name';input.name='given-name';input.autocomplete='given-name';input.maxLength=60;input.required=true;input.placeholder=c.placeholder;input.value=name;const note=document.createElement('p');note.className='welcome-note';note.id='welcome-name-note';note.textContent=c.hint;input.setAttribute('aria-describedby',note.id);const submit=button(c.continue,()=>{},true);submit.type='submit';form.append(label,input,note,submit);form.onsubmit=e=>{e.preventDefault();const value=normalizeExplorerName(input.value);if(!value){input.value='';input.reportValidity();return;}name=saveExplorerName(value);step=2;render();};interaction.append(form);}
  if(step===2)interaction.append(button(c.go,()=>{step=3;render();},true));
  if(step===3)interaction.append(button(c.yes,()=>finish(true),true),button(c.no,()=>finish(false)));
  if(focus)title.focus({preventScroll:true});
 }
 back.onclick=()=>{if(step===1)name=normalizeExplorerName(root.querySelector('input')?.value);step=Math.max(0,step-1);render();};
 render(false);title.focus({preventScroll:true});
 return {dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);typing.dispose();window.removeEventListener('resize',resize);root.remove();restore();host.hidden=false;}};
}
