/** Local-only identity shared by onboarding and future mascot greetings. */
export const EXPLORER_NAME_KEY='relic.explorer.first-name';
export function normalizeExplorerName(value){return String(value??'').normalize('NFC').replace(/[\u0000-\u001f\u007f]/gu,'').trim().replace(/\s+/gu,' ').slice(0,60);}
export function getExplorerName(storage){try{return normalizeExplorerName((storage??globalThis.localStorage).getItem(EXPLORER_NAME_KEY));}catch{return '';}}
export function saveExplorerName(value,storage){const name=normalizeExplorerName(value);if(!name)return '';try{(storage??globalThis.localStorage).setItem(EXPLORER_NAME_KEY,name);}catch{/* Available in memory for this visit when storage is disabled. */}return name;}
