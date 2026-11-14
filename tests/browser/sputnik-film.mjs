/** TEST_BASE_URL=http://localhost:4174 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/sputnik-film.mjs */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TEST_BASE_URL||'http://localhost:4174';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),errors=[],movies=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/sputnik-1/film-en/index.m3u8'))movies.push(r.url());});
 await page.goto(new URL('/pages/sputnik.html',base).href);
 for(const id of ['identite','inventaire','chronologie','science','sources']){
  await page.locator('[role=tab][data-tab='+id+']').click();
  await page.locator('[role=tabpanel]:visible img').evaluateAll(images=>{for(const img of images)img.loading='eager';return Promise.all(images.map(img=>img.decode()));});
 }
 assert.equal(await page.locator('#dossier-content img').count(),9);assert.equal(movies.length,0,'The movie must not load before a play action');
 await page.locator('.sputnik-watch-film').click();
 const video=page.locator('#sputnik-intro-video');await video.waitFor({timeout:30000});
 await page.waitForFunction(()=>{const v=document.querySelector('#sputnik-intro-video');return v?.currentTime>.1&&!v.paused;},{timeout:30000});
 assert.ok(Math.abs(await video.evaluate(v=>v.duration)-113.27)<.2);assert.ok(movies.length>0);
 assert.ok(await page.locator('.mission-shared-film .prologue-controls').count());
 await video.evaluate(v=>{v.currentTime=48;});await page.waitForFunction(()=>document.querySelector('#sputnik-intro-video')?.currentTime>=48);
 await page.locator('.mission-film-close').click();await page.locator('.mission-shared-film').waitFor({state:'detached'});assert.equal(await page.locator('video').count(),0);
 await page.setViewportSize({width:390,height:844});await page.locator('[role=tab][data-tab=chronologie]').click();await page.locator('.dossier-film-feature button').click();await video.waitFor();
 await page.waitForFunction(()=>document.querySelector('#sputnik-intro-video')?.currentTime>.1,{timeout:30000});
 await page.locator('.mission-film-close').click();await page.locator('.mission-shared-film').waitFor({state:'detached'});
 assert.ok(await page.locator('#panel-chronologie').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: nine article images, lazy film loading, shared fullscreen player, real playback/seeking, desktop/mobile replay and return to dossier');
}finally{await browser.close();}
