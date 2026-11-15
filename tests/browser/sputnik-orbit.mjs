/** TEST_BASE_URL=http://localhost:4174 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/sputnik-orbit.mjs */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_BASE_URL||'http://localhost:4174';
const tle=`ISS (ZARYA)
1 25544U 98067A   26315.85209532  .00008096  00000+0  15318-3 0  9994
2 25544  51.6324 289.3631 0007314  15.2015 344.9192 15.49321770594643`;
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),errors=[],feeds=[];
 page.on('pageerror',error=>errors.push(error.message));
 // Exercise mission rendering independently from third-party tile availability.
 await page.route('https://api.cesium.com/**',route=>route.abort());
 await page.route('**/api/celestrak/*',route=>{feeds.push(new URL(route.request().url()).pathname.split('/').pop());return route.fulfill({status:200,contentType:'text/plain',body:tle+'\n'+tle.replaceAll('25544','45544').replace('ISS (ZARYA)','STARLINK TEST')});});
 await page.goto(new URL('/assets/',base).href);
 await page.setContent('<style>body{margin:0;background:#000}#host{position:fixed;inset:0}#inspection-satellite-controls{position:fixed;z-index:50;left:16px;top:16px;width:240px}</style><div id="host"></div><aside id="inspection-satellite-controls"></aside>');
 await page.addStyleTag({url:new URL('/src/ui/theme.css',base).href});await page.addStyleTag({url:new URL('/src/missions/missions.css',base).href});
 await page.evaluate(async()=>{
  document.documentElement.dataset.theme='night';document.documentElement.lang='en';
  const {createDetailedGlobe}=await import('/src/atlas/detailed-globe.js');
  window.globe=createDetailedGlobe({host:document.querySelector('#host'),onState:()=>window.globe?.reveal()});window.globe.setFocus({id:'earth',lat:20,lon:0});
  window.sputnikStates=[];window.addEventListener('relic-sputnik-state',e=>sputnikStates.push(e.detail));
 });
 await page.waitForFunction(()=>window.globe.active,{timeout:60000});
 await page.waitForFunction(()=>document.querySelector('.satellite-loaded-total')?.textContent==='1',{timeout:30000});assert.deepEqual(feeds,['stations']);
 await page.evaluate(async()=>{const {installMissionUI}=await import('/src/missions/mission-ui.js');installMissionUI();const {openSputnik}=await import('/src/missions/sputnik.js');openSputnik();});
 assert.equal(await page.locator('#sputnik-card a').count(),1);assert.equal(await page.locator('#sputnik-card').getByText('Lire la fiche PDF').count(),0);
 await page.locator('#sputnik-card [data-sputnik=explore]').click();
 await page.waitForFunction(()=>window.sputnikStates.at(-1)?.active,{timeout:30000});
 await page.waitForTimeout(1500);if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});assert.ok(await page.locator('#sputnik-orbit-controls').isVisible());
 const beforeCollapse=await page.evaluate(()=>window.sputnikStates.at(-1).seconds);
 await page.locator('#sputnik-orbit-controls .mission-controls-collapse').click();
 assert.equal(await page.locator('#sputnik-orbit-controls .mission-controls-body').isVisible(),false);
 await page.waitForTimeout(300);assert.ok(await page.evaluate(()=>window.sputnikStates.at(-1).seconds)>beforeCollapse);
 await page.evaluate(()=>document.documentElement.lang='fr');await page.waitForTimeout(100);
 assert.equal(await page.locator('#sputnik-orbit-controls .mission-controls-collapse').getAttribute('aria-label'),'Développer les commandes');
 await page.locator('#sputnik-orbit-controls .mission-controls-collapse').click();assert.ok(await page.locator('#sputnik-orbit-controls .mission-controls-body').isVisible());
 await page.evaluate(()=>document.documentElement.lang='en');await page.waitForTimeout(100);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('relic-sputnik-command',{detail:{action:'seek',value:3000}})));
 await page.waitForFunction(()=>window.sputnikStates.at(-1)?.seconds>=3000);
 await page.locator('#sputnik-orbit-controls [data-sputnik=play]').click();
 await page.waitForFunction(()=>window.sputnikStates.at(-1)?.playing===false);
 const at=await page.evaluate(()=>window.sputnikStates.at(-1).seconds);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.sputnikStates.at(-1).seconds),at);
 await page.locator('#sputnik-card [data-sputnik=video]').click();await page.waitForFunction(()=>document.querySelector('#sputnik-intro-video')?.currentTime>.1,{timeout:30000});assert.equal(await page.locator('#sputnik-card').evaluate(node=>node.hidden),false);await page.locator('.mission-film-close').click();await page.locator('.mission-shared-film').waitFor({state:'detached'});assert.ok(await page.locator('#sputnik-card-actions').isVisible());
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);const box=await page.locator('#sputnik-orbit-controls').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390&&box.y>=0&&box.y+box.height<=844);
 await page.locator('#sputnik-orbit-controls [data-sputnik=stop]').click();await page.waitForFunction(()=>!window.sputnikStates.at(-1)?.active);assert.equal(await page.locator('#sputnik-orbit-controls').isVisible(),false);
 await page.setViewportSize({width:1280,height:900});await page.getByRole('button',{name:'Load other satellites'}).click();await page.waitForFunction(()=>document.querySelector('.satellite-loaded-total')?.textContent==='2',{timeout:30000});assert.ok(feeds.includes('starlink'));assert.ok(feeds.includes('active'));
 await page.evaluate(()=>window.globe.hide());assert.deepEqual(errors,[]);console.log('PASS: ISS-only startup, explicit full catalogue load, Sputnik menu, orbital scene, time controls, responsive layout and teardown');
}finally{await browser.close();}
