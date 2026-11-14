/** English is the initial language for this release. Existing French choices
 * from the mixed-language interface migrate once; later explicit choices stay. */
const VERSION='english-interface-v1';
export function initialLanguage(storage){
 try{
  if(storage.getItem('relic.language-version')!==VERSION){
   storage.setItem('nasa-atlas-language','en');
   let saved={};try{saved=JSON.parse(storage.getItem('relic.preferences.v1')||'{}');}catch{}
   storage.setItem('relic.preferences.v1',JSON.stringify({...saved,language:'en'}));
   storage.setItem('relic.language-version',VERSION);return 'en';
  }
  return storage.getItem('nasa-atlas-language')==='fr'?'fr':'en';
 }catch{return 'en';}
}
