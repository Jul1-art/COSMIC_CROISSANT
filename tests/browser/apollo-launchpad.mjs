/** TEST_BASE_URL=http://localhost:4174 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/apollo-launchpad.mjs */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_BASE_URL||'http://localhost:4174';
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message.replace(/https?:\/\/\S+/g,'[provider URL]')));
 await page.addInitScript(()=>{localStorage.setItem('relic.spacey-tour.v1','dismissed');window.padStates=[];window.addEventListener('message',e=>{if(e.data?.type==='state'&&e.data.state?.id==='earth')window.padStates.push({source:e.data.state.sourceMode,ion:e.data.state.ionStatus,lat:e.data.state.latitude,lon:e.data.state.longitude});});});
 await page.goto(new URL('/?mission=apollo-11&missionView=explore',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.RELICFilm),{timeout:60000});if(await page.evaluate(()=>window.RELICFilm.phase!=='closed'))await page.locator('#intro .prologue-enter').click();
 const timeline=page.locator('.atlas-mission-controls[aria-label="Apollo 11 reconstruction"]');await timeline.waitFor({timeout:60000});await page.waitForFunction(()=>document.querySelector('.atlas-mission-controls')?.getAttribute('aria-busy')==='false',{timeout:60000});
 await page.selectOption('#mission-chapter','launch');const time=await page.locator('#mission-time-slider').inputValue();
 await page.locator('#mission-vehicle-key').click();await page.locator('#mission-launchpad').waitFor();await page.waitForFunction(()=>document.body.dataset.detailedGlobe==='active',{timeout:60000});
 try{await page.waitForFunction(()=>window.padStates.at(-1)?.source==='ion-photorealistic'||['asset-unavailable','missing-token','invalid-token'].includes(window.padStates.at(-1)?.ion),null,{timeout:65000});}catch(e){console.log('Sanitized state',await page.evaluate(()=>({states:window.padStates.slice(-4),details:document.body.dataset.detailedGlobe})));if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});throw e;}
 await page.waitForFunction(()=>{const s=window.padStates.at(-1);return s&&Math.abs(s.lat-28.608389)<.01&&Math.abs(s.lon+80.604333)<.01;},null,{timeout:30000});
 const state=await page.evaluate(()=>window.padStates.at(-1));console.log('Sanitized tile state',state);if(state.source!=='ion-photorealistic'&&process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});assert.equal(state.source,'ion-photorealistic','LC-39A must render actual ion 3D tiles');assert.ok(['ready','loading'].includes(state.ion));assert.ok(Math.abs(state.lat-28.608389)<.01);assert.ok(Math.abs(state.lon+80.604333)<.01);
 assert.equal(await timeline.isVisible(),false);assert.equal(await page.locator('#mission-time-slider').inputValue(),time);
 await page.waitForTimeout(5000);if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});
 await page.locator('#mission-launchpad [data-launchpad=close]').click();await page.locator('#mission-launchpad').waitFor({state:'hidden'});assert.equal(await page.locator('.detailed-globe-frame').count(),0);assert.ok(await timeline.isVisible());assert.equal(await page.locator('#mission-time-slider').inputValue(),time);
 await page.locator('#mission-vehicle-key').click();await page.locator('#mission-launchpad').waitFor();await page.waitForFunction(()=>document.body.dataset.detailedGlobe==='active',null,{timeout:60000});const native=page.frames().find(f=>f.url().includes('/pages/globe.html'));await native.locator('canvas[tabindex="0"]').focus();await page.keyboard.press('Escape');await page.locator('#mission-launchpad').waitFor({state:'hidden'});assert.equal(await page.locator('.detailed-globe-frame').count(),0);assert.ok(await timeline.isVisible());
 assert.deepEqual(errors,[]);console.log('PASS: Saturn V to LC-39A, real Cesium ion photogrammetry, exact geographic target, paused timeline, camera return and Escape');
}finally{await browser.close();}
