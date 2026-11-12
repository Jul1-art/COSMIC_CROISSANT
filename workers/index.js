import {createCelestrakProxy} from './celestrak.js';
let proxy;
export default {async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/celestrak/')){
    proxy ||= createCelestrakProxy({cache:caches.default});
    return proxy(request);
  }
  return env.ASSETS.fetch(request);
}};
