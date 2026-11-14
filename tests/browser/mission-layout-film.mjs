/** TEST_BASE_URL=http://localhost:4174 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/mission-layout-film.mjs */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TEST_BASE_URL||'http://localhost:4174';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),errors=[];page.setDefaultTimeout(60000);
 page.on('pageerror',e=>errors.push(e.message.replace(/https?:\/\/\S+/g,'[provider URL]')));
 // Layout and camera regression do not depend on external terrain availability.
 await page.route('https://api.cesium.com/**',route=>route.abort());
 await page.route('**/src/atlas/app.js?*',async route=>{const source=await readFile(new URL('../../src/atlas/app.js',import.meta.url),'utf8');await route.fulfill({status:200,contentType:'application/javascript',body:source+'\nwindow.__missionCamera=()=>({position:camera.position.toArray(),target:controls.target.toArray(),flight:Boolean(flight),moon:(naturalSystems?.getMesh("moon")||moon).getWorldPosition(new THREE.Vector3()).toArray(),time:atlasMission.time});'});});
 await page.addInitScript(()=>localStorage.setItem('relic.spacey-tour.v1','dismissed'));
 await page.goto(new URL('/?mission=apollo-11&missionView=explore',base).href,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>Boolean(window.RELICFilm));if(await page.evaluate(()=>window.RELICFilm.phase!=='closed'))await page.locator('#intro .prologue-enter').click();
 await page.waitForFunction(()=>document.querySelector('.atlas-mission-controls')?.getAttribute('aria-busy')==='false');await page.selectOption('#mission-chapter','launch');await page.locator('#mission-vehicle-key').click();await page.locator('#mission-launchpad').waitFor();
 for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:844,height:280}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(250);
  const boxes=await page.evaluate(()=>{const rect=id=>{const r=document.querySelector(id).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};return {card:rect('#mission-popup'),actions:rect('#mission-actions'),pad:rect('#mission-launchpad'),stack:rect('.mission-card-stack')};});
  assert.ok(boxes.pad.top>=boxes.actions.bottom+7,'LC-39A follows video and dossier');assert.ok(Math.abs(boxes.card.left-boxes.pad.left)<1,'Both cards share their column');assert.ok(boxes.stack.top>=0&&boxes.stack.bottom<=viewport.height,'The column scrolls within the viewport');
 }
 await page.setViewportSize({width:1280,height:900});await page.locator('#mission-launchpad [data-launchpad=close]').click();await page.locator('#mission-launchpad').waitFor({state:'hidden'});
 assert.equal(await page.locator('#mission-popup').evaluate(n=>n.parentElement.tagName),'BODY');assert.ok(await page.locator('#mission-actions').isVisible());
 await page.locator('[data-mission-action=orbit]').click();await page.waitForTimeout(1600);
 const relative=(state,key='position')=>state[key].map((v,i)=>v-state.moon[i]),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const orbitBefore=await page.evaluate(()=>window.__missionCamera());await page.selectOption('#mission-speed','86400');await page.locator('[data-mission-action=play]').click();await page.waitForTimeout(1200);await page.locator('[data-mission-action=play]').click();await page.waitForTimeout(200);
 const orbitAfter=await page.evaluate(()=>window.__missionCamera());assert.ok(distance(orbitBefore.moon,orbitAfter.moon)>.001);assert.ok(distance(relative(orbitBefore),relative(orbitAfter))<1e-7,'The Moon must keep the same apparent size throughout playback');assert.ok(distance(relative(orbitBefore,'target'),relative(orbitAfter,'target'))<1e-7);
 const before=await page.evaluate(()=>window.__missionCamera());assert.equal(before.flight,false);
 await page.locator('#mission-actions [data-mission-action=video]').click();await page.waitForFunction(()=>document.querySelector('#apollo-intro-video')?.currentTime>.1);
 for(const viewport of [{width:900,height:700},{width:1200,height:850}]){await page.setViewportSize(viewport);await page.waitForTimeout(200);const during=await page.evaluate(()=>window.__missionCamera());assert.deepEqual(during.position,before.position);assert.deepEqual(during.target,before.target);assert.equal(during.flight,false,'Fullscreen/resizing must not queue a solar overview flight');}
 await page.locator('.mission-film-close').click();await page.locator('.mission-shared-film').waitFor({state:'detached'});await page.waitForTimeout(1600);
 const after=await page.evaluate(()=>window.__missionCamera());assert.deepEqual(after.position,before.position);assert.deepEqual(after.target,before.target);assert.equal(after.time,before.time);assert.equal(after.flight,false);assert.deepEqual(errors,[]);
 console.log('PASS: lunar playback preserves camera distance and pan; LC-39A stacks below Apollo actions on desktop/mobile/short screens; lunar-orbit camera and mission time remain unchanged through fullscreen film and resizing');
}finally{await browser.close();}
