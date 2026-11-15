import {MISSION_FR} from './mission-fr-strings.js';
export const missionLanguage=()=>globalThis.document?.documentElement.lang==='fr'?'fr':'en';
export function missionText(text,language=missionLanguage()){
 if(language!=='fr'||typeof text!=='string')return text;
 const trimmed=text.trim();let value=MISSION_FR[trimmed];
 if(value===undefined)for(const prefix of ['Next:','Enlarge photograph:'])if(trimmed.startsWith(prefix)){value=MISSION_FR[prefix]+' '+missionText(trimmed.slice(prefix.length).trim(),language);break;}
 return value===undefined?text:text.replace(trimmed,value);
}
/** Observe only mission UI, never the whole application. Remembers the English
 * source so locale switches and live timeline updates remain reversible. */
export function localizeMissionElement(root){
 if(!root?.ownerDocument?.createTreeWalker||typeof MutationObserver==='undefined')return {refresh(){},dispose(){}};
 const originals=new WeakMap(),attributes=new WeakMap();let scheduled=false,disposed=false;
 const options={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']};
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(refresh);}});
 function refresh(){
  if(disposed)return;scheduled=false;observer.disconnect();
  const walker=root.ownerDocument.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
   if(node.parentElement.closest('script,style'))continue;let saved=originals.get(node);
   if(!saved||node.nodeValue!==saved.rendered)saved={source:node.nodeValue};
   saved.rendered=missionText(saved.source);if(node.nodeValue!==saved.rendered)node.nodeValue=saved.rendered;originals.set(node,saved);
  }
  for(const element of [root,...root.querySelectorAll('[aria-label],[title],[placeholder],[alt]')]){
   const saved=attributes.get(element)||{};
   for(const name of options.attributeFilter)if(element.hasAttribute(name)){const value=element.getAttribute(name);let row=saved[name];if(!row||value!==row.rendered)row={source:value};row.rendered=missionText(row.source);if(value!==row.rendered)element.setAttribute(name,row.rendered);saved[name]=row;}
   attributes.set(element,saved);
  }
  observer.observe(root,options);
 }
 const language=new MutationObserver(refresh);language.observe(root.ownerDocument.documentElement,{attributes:true,attributeFilter:['lang']});refresh();
 return {refresh,dispose(){disposed=true;observer.disconnect();language.disconnect();}};
}
