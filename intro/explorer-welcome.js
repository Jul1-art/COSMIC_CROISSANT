import {createTypingSound} from './typing-sound.js';
import {createOpeningTyping} from './prologue-typing.js';
import {getExplorerName,saveExplorerName,normalizeExplorerName} from '../src/core/explorer-profile.js';

const copy={
 en:{greeting:'Hi, explorer of space.\nWant to learn about NASA and ESA missions ?\nWell, you have come to the right place.\nFirst, let me ask you some questions.\nDo you prefer English or French ?',name:'What’s your first name ?',label:'Your first name',placeholder:'First name',submit:'Confirm first name',ready:'Okay, {name}.\nWe’re ready to discover. Are you ready ?',go:'Yeah, let’s go!',film:'Would you like to watch a film\nabout the beginning of space exploration ?',yes:'Yes, show me the film',no:'No, take me to the Solar System',back:'Back',click:'Click to continue'},
 fr:{greeting:'Salut, explorateur de l’espace.\nTu veux découvrir les missions de la NASA et de l’ESA ?\nTu es au bon endroit.\nD’abord, quelques questions.\nTu préfères l’anglais ou le français ?',name:'Quel est ton prénom ?',label:'Ton prénom',placeholder:'Prénom',submit:'Valider le prénom',ready:'D’accord, {name}.\nTout est prêt pour découvrir. Et toi ?',go:'Oui, c’est parti !',film:'Veux-tu regarder un film\nsur les débuts de la conquête spatiale ?',yes:'Oui, voir le film',no:'Non, explorer le système solaire',back:'Retour',click:'Clique pour continuer'}
};
/** Intro-only gate. Returning from a mission keeps the existing return policy. */
export function createExplorerWelcome({host,getLanguage,setLanguage,reducedMotion,onComplete}){
 const document=host.ownerDocument;
 const root=document.createElement('section');root.className='explorer-welcome prologue';root.setAttribute('aria-label','Welcome to RELIC');root.dataset.cueKind='typing';
 root.innerHTML='<main class="welcome-main"><h1 class="welcome-title" tabindex="-1"></h1><p class="welcome-click-hint"></p><div class="welcome-interaction"></div></main><footer class="welcome-footer"><button type="button" class="welcome-back"></button></footer>';
 const background=[...document.body.children].filter(node=>!['SCRIPT','LINK','STYLE'].includes(node.tagName)).map(node=>[node,node.inert]);
 for(const [node]of background)node.inert=true;
 function restore(){for(const [node,inert]of background)node.inert=inert;}
 host.before(root);host.hidden=true;
 const title=root.querySelector('h1'),interaction=root.querySelector('.welcome-interaction'),back=root.querySelector('.welcome-back');
 const sound=createTypingSound();root.addEventListener('pointerdown',sound.unlock,{passive:true});root.addEventListener('keydown',sound.unlock);
 const typing=createOpeningTyping({element:title,getLanguage,reducedMotion});
 let step=0,name=getExplorerName(),frame=0,disposed=false,typed=false,duration=0;
 let compact=innerWidth<=650;
 function resize(){if(compact===(innerWidth<=650))return;compact=innerWidth<=650;if(step===5)name=normalizeExplorerName(root.querySelector('input')?.value);render(false);}
 window.addEventListener('resize',resize);
 const language=()=>getLanguage()==='fr'?'fr':'en';
 const button=(label,action,primary=false)=>{const node=document.createElement('button');node.type='button';node.className='welcome-button'+(primary?' welcome-primary':'');node.textContent=label;node.onclick=action;return node;};
 function finish(watch){if(disposed)return;disposed=true;cancelAnimationFrame(frame);typing.dispose();sound.dispose();window.removeEventListener('resize',resize);root.remove();restore();host.hidden=false;onComplete({watch,name,language:language()});}
 function render(focus=true){
  cancelAnimationFrame(frame);const c=copy[language()];root.lang=language();root.setAttribute('aria-label',language()==='fr'?'Bienvenue sur RELIC':'Welcome to RELIC');root.dataset.step=String(step);
  const hint=root.querySelector('.welcome-click-hint');hint.textContent=c.click;hint.hidden=step>=4;back.hidden=step===0;back.textContent=c.back;interaction.replaceChildren();
  const raw=[...c.greeting.split('\n'),c.name,c.ready.replace('{name}',name),c.film][step];
  const limit=innerWidth<=650?32:65;const text=raw.split('\n').flatMap(line=>{const lines=[''];for(const word of line.split(' ').flatMap(word=>Array.from({length:Math.max(1,Math.ceil([...word].length/limit))},(_,i)=>[...word].slice(i*limit,(i+1)*limit).join('')))){const i=lines.length-1;if(lines[i]&&(lines[i]+' '+word).length>limit)lines.push(word);else lines[i]+=(lines[i]?' ':'')+word;}return lines;}).join('\n');
  duration=reducedMotion()?0:Math.min(8,Math.max(1.4,text.length*.025));typing.setCue({start:0,typingStart:0,typingDuration:duration||.2},text);
  typed=false;root.classList.remove('welcome-typing-done');
  let lastCount=0;const start=performance.now();function tick(now){const elapsed=(now-start)/1000;typing.render({position:reducedMotion()?1:elapsed,gated:false});const count=Number(title.dataset.typedCount)||0;if(count>lastCount&&!/\s/u.test((title.dataset.visibleText||'').slice(-1)))sound.tap();lastCount=count;if(elapsed>=duration)completeTyping();else if(!disposed)frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
  if(step===4){interaction.append(button('English',()=>{setLanguage('en');step=5;render();},true),button('Français',()=>{setLanguage('fr');step=5;render();}));}
  if(step===5){const form=document.createElement('form');form.className='welcome-name-form';const input=document.createElement('input');input.id='explorer-first-name';input.name='given-name';input.autocomplete='given-name';input.maxLength=60;input.required=true;input.placeholder=c.placeholder;input.value=name;input.setAttribute('aria-label',c.label);const submit=button('',()=>{},true);submit.classList.add('welcome-name-submit');submit.setAttribute('aria-label',c.submit);submit.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';submit.type='submit';form.append(input,submit);form.onsubmit=e=>{e.preventDefault();const value=normalizeExplorerName(input.value);if(!value){input.value='';input.reportValidity();return;}name=saveExplorerName(value);step=6;render();};interaction.append(form);}
  if(step===6)interaction.append(button(c.go,()=>{step=7;render();},true));
  if(step===7)interaction.append(button(c.yes,()=>finish(true),true),button(c.no,()=>finish(false)));
  if(focus)title.focus({preventScroll:true});
 }
 function completeTyping(){cancelAnimationFrame(frame);typing.render({position:Math.max(1,duration+.15),gated:false});typed=true;root.classList.add('welcome-typing-done');}
 function advance(){if(step>=4||disposed)return;if(!typed){completeTyping();return;}step++;render();}
 root.addEventListener('click',event=>{if(!event.target.closest('button,input,form,a'))advance();});
 root.addEventListener('keydown',event=>{if(step<4&&['Enter',' '].includes(event.key)&&!event.target.closest('button,input,form,a')){event.preventDefault();advance();}});
 back.onclick=()=>{if(step===5)name=normalizeExplorerName(root.querySelector('input')?.value);step=Math.max(0,step-1);render();};
 render(false);title.focus({preventScroll:true});
 return {dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);typing.dispose();sound.dispose();window.removeEventListener('resize',resize);root.remove();restore();host.hidden=false;}};
}
