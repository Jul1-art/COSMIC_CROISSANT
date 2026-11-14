/** Run against a local static server:
 * TEST_BASE_URL=http://localhost:4173 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/mission-menu.mjs
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.TEST_BASE_URL||'http://localhost:4173';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>localStorage.setItem('relic.spacey-tour.v1','dismissed'));
 await page.goto(new URL('/?view=inspection&body=moon&mission=apollo-11',base).href,{waitUntil:'domcontentloaded'});
 const card=page.locator('#mission-popup'),actions=page.locator('#mission-actions'),toggle=page.locator('[data-mission-action="menu"]');
 await card.waitFor({timeout:60000});
 await page.locator('.pd-viewport').dispatchEvent('pointerdown');assert.ok(await card.isVisible(),'outside pointer input must not dismiss the summary');
 await toggle.click();await page.waitForFunction(()=>document.querySelector('.atlas-mission-controls')?.getAttribute('aria-busy')==='false',{timeout:60000});
 async function assertPinned(){assert.ok(await card.isVisible(),'mission card remains visible');assert.ok(await actions.isVisible(),'video and dossier stay accessible');assert.equal(await toggle.getAttribute('aria-expanded'),'true');const bounds=await card.boundingBox(),size=page.viewportSize();assert.ok(bounds.x+ bounds.width>=size.width-25,'Apollo summary stays on the right');const menu=page.getByRole('button',{name:'Ouvrir la carte et le menu Apollo 11'});assert.ok((await menu.textContent()).includes('Menu'));}
 await assertPinned();
 await page.mouse.move(750,330);await page.mouse.down({button:'right'});await page.mouse.move(830,370,{steps:8});await page.mouse.up({button:'right'});await page.mouse.wheel(0,-120);await page.mouse.click(750,330);await assertPinned();
 await page.locator('#mission-time-slider').evaluate(input=>{input.value=Date.parse('1969-07-20T20:17:43Z');input.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#mission-speed').focus();await page.keyboard.press('Escape');await assertPinned();
 await page.selectOption('#mission-chapter','return');await page.locator('[data-mission-action="orbit"]').click();await assertPinned();
 for(const viewport of [{width:390,height:844},{width:844,height:280},{width:1280,height:900}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await assertPinned();
  const last=await actions.locator('a').boundingBox();assert.ok(last&&last.y>=0&&last.y+last.height<=viewport.height,`menu actions remain inside ${JSON.stringify(viewport)}: ${JSON.stringify(last)}`);
 }
 await actions.locator('[data-mission-action="video"]').click();await page.locator('.mission-shared-film .mission-film-close').waitFor();
 assert.equal(await card.evaluate(node=>node.hidden),false,'the film must preserve the background card');assert.equal(await actions.evaluate(node=>node.hidden),false);
 await page.waitForFunction(()=>document.fullscreenElement?.classList.contains('mission-shared-film')||document.querySelector('#apollo-intro-video')?.currentTime>.1,{timeout:30000});
 await page.locator('.mission-film-close').click();await page.locator('.mission-shared-film').waitFor({state:'detached'});await assertPinned();
 await card.locator('[data-mission-action="close-popup"]').click();assert.equal(await card.isVisible(),false);
 const reopen=page.getByRole('button',{name:'Ouvrir la carte et le menu Apollo 11'});await reopen.click();await assertPinned();
 await page.keyboard.press('Escape');assert.equal(await card.isVisible(),false);await reopen.click();await assertPinned();
 await page.locator('[data-mission-action="exit"]').click();assert.equal(await card.isVisible(),false);assert.equal(await actions.isVisible(),false);
 // Direct entry to the 3D mission also exposes the card and both actions.
 await page.goto(new URL('/?mission=apollo-11&missionView=explore',base).href,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>Boolean(window.RELICFilm));if(await page.evaluate(()=>window.RELICFilm.phase!=='closed'))await page.locator('#intro .prologue-enter').click();await card.waitFor({timeout:60000});await assertPinned();
 assert.deepEqual(errors,[]);console.log('PASS: persistent summary and menu, scene input, time controls, viewport changes, film return, explicit close/reopen and direct 3D entry');
}finally{await browser.close();}
