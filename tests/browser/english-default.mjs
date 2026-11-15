import {skipWelcome} from './onboarding-helper.mjs';
/** TEST_BASE_URL=http://localhost:4174 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/english-default.mjs */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'});page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message.replace(/https?:\/\/\S+/g,'[provider URL]')));
 await page.addInitScript(()=>{localStorage.setItem('nasa-atlas-language','fr');localStorage.removeItem('relic.language-version');localStorage.setItem('relic.preferences.v1',JSON.stringify({language:'fr',theme:'day',motion:'reduced'}));localStorage.setItem('relic.spacey-tour.v1','dismissed');});
 const base=process.env.TEST_BASE_URL||'http://localhost:4174';await page.goto(new URL('/?mission=apollo-11&missionView=explore',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.RELICFilm));assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.evaluate(()=>localStorage.getItem('nasa-atlas-language')),'en');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('relic.preferences.v1')).theme),'day');
 await skipWelcome(page);if(await page.evaluate(()=>window.RELICFilm.phase!=='closed'))await page.locator('#intro .prologue-enter').click();await page.waitForFunction(()=>document.querySelector('.atlas-mission-controls')?.getAttribute('aria-busy')==='false');
 const card=await page.locator('#mission-popup').innerText();assert.match(card,/Lunar landing/);assert.match(card,/20 July 1969/);assert.match(card,/Sea of Tranquility/);assert.match(await page.locator('#mission-actions').innerText(),/Watch film/);assert.match(await page.locator('.atlas-mission-controls').innerText(),/Earth–Moon/);
 const visible=await page.locator('body').innerText();assert.ok(!/Alunissage|Reconstitution|Décollage|Les détails|Explorer la mission|Spoutnik/.test(visible));assert.deepEqual(errors,[]);console.log('PASS: legacy French install migrates to English, preserves appearance, and opens English intro, mission card, timeline and 3D controls');
}finally{await browser.close();}
