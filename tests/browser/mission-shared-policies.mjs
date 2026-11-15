/** TEST_BASE_URL=http://localhost:4174 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/mission-shared-policies.mjs */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
const base=process.env.TEST_BASE_URL||'http://localhost:4174';
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),errors=[],media=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/sputnik-1/film-')&&r.url().endsWith('.m3u8'))media.push(r.url());});
 // The overlay must be correct even when native fullscreen is unavailable.
 await page.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=()=>Promise.reject(new Error('Fullscreen unavailable in fixture'));});
 for(const file of ['mission.html?mission=apollo-11','sputnik.html']){
  await page.goto(new URL('/pages/'+file,base).href);await page.waitForTimeout(150);
  if(await page.locator('html').getAttribute('lang')!=='fr')await page.locator('.dossier-language').click();
  await page.waitForFunction(()=>document.documentElement.lang==='fr');assert.match(await page.locator('.dossier-hero').innerText(),file.startsWith('sputnik')?/Spoutnik 1/:/Un premier pas/);
  assert.equal(await page.locator('a[href*="fiche-mission.pdf"]').count(),0);assert.equal(await page.locator('.dossier-footer').count(),0);
  for(const id of ['identite','inventaire','chronologie','science','sources']){await page.locator('[role=tab][data-tab='+id+']').click();await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>scrollY),0);const text=await page.locator('#panel-'+id).innerText();assert.ok(!/The mission|Three people|The signal|A small sphere|Hardware inventory/.test(text));assert.ok(text.length>100);}
  await page.locator('[role=tab][data-tab=identite]').click();await page.locator('#panel-identite .dossier-chapter-end button').click();await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>scrollY),0);
  await page.locator('.dossier-language').click();await page.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-tab'),'inventaire');assert.match(await page.locator('#panel-inventaire').innerText(),/hardware|Hardware/);
  await page.locator('.dossier-language').click();assert.equal(await page.locator('html').getAttribute('lang'),'fr');
 }
 await page.locator('.sputnik-watch-film').click();await page.waitForFunction(()=>document.querySelector('#sputnik-intro-video')?.currentTime>.1);
 assert.ok(media.at(-1).includes('film-fr'));const layout=await page.evaluate(()=>{const host=document.querySelector('.mission-shared-film'),v=host.querySelector('video'),controls=host.querySelector('.prologue-controls'),r=host.getBoundingClientRect(),vr=v.getBoundingClientRect(),cr=controls.getBoundingClientRect();return {background:getComputedStyle(host).backgroundColor,isolation:getComputedStyle(host).isolation,videoPosition:getComputedStyle(v).position,videoFit:getComputedStyle(v).objectFit,host:[r.x,r.y,r.width,r.height],video:[vr.x,vr.y,vr.width,vr.height],bottom:cr.bottom,viewport:[innerWidth,innerHeight],endMark:getComputedStyle(host.querySelector('.prologue-endmark')).display,hit:document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest('.mission-shared-film')!==null};});
 assert.equal(layout.background,'rgb(0, 0, 0)');assert.equal(layout.isolation,'isolate');assert.equal(layout.videoPosition,'absolute');assert.equal(layout.videoFit,'contain');assert.equal(layout.host[0],0);assert.equal(layout.host[1],0);assert.equal(layout.host[2],layout.viewport[0]);assert.equal(layout.host[3],layout.viewport[1]);assert.equal(layout.bottom,layout.viewport[1]);assert.equal(layout.endMark,'none');assert.ok(layout.hit);
 if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});
 await page.locator('.mission-film-close').click();await page.locator('.mission-shared-film').waitFor({state:'detached'});assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
 await page.evaluate(()=>window.scrollTo(0,900));await page.goto(new URL('/pages/mission.html?mission=apollo-11',base).href);assert.equal(await page.locator('html').getAttribute('lang'),'fr');assert.equal(await page.evaluate(()=>scrollY),0);
 await page.evaluate(()=>window.scrollTo(0,900));await page.goBack();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>scrollY),0);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS: both mission languages, no brief/footer, page/chapter/back scroll reset, localized film, opaque isolated player without native fullscreen, no document bleed');
}finally{await browser.close();}
