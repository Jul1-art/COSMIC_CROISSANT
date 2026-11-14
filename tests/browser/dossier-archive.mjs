/** TEST_BASE_URL=http://localhost:4174 PLAYWRIGHT_MODULE=/path/to/playwright
 * CHROMIUM_PATH=/usr/bin/chromium node tests/browser/dossier-archive.mjs */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
const base=process.env.TEST_BASE_URL||'http://localhost:4174';
try{
 const page=await browser.newPage({serviceWorkers:'block'}),errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const mission of ['mission.html?mission=apollo-11','sputnik.html']){
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.goto(new URL('/pages/'+mission,base).href);await page.waitForTimeout(900);
   assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.evaluate(()=>scrollY),0,'The archive must open on its hero, not jump past it');
   assert.ok(await page.locator('.dossier-hero').isVisible());if(process.env.SCREENSHOT_DIR)await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/${mission.startsWith('sputnik')?'sputnik':'apollo'}-archive-${viewport.width}.png`});await page.locator('.dossier-hero-photo button').click();await page.locator('.dossier-lightbox').waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('.dossier-lightbox').isVisible(),false);
   
   for(const id of ['identite','inventaire','chronologie','science','sources']){
    await page.locator('[role=tab][data-tab='+id+']').click();await page.waitForTimeout(350);assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);
    await page.locator('[role=tabpanel]:visible img').evaluateAll(images=>{for(const image of images)image.loading='eager';return Promise.all(images.map(image=>image.decode()));});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal document overflow');
    assert.ok(!/Spoutnik|Alunissage|chronologie|équipage|rétroréflecteur/.test(await page.locator('[role=tabpanel]:visible').innerText()),'The record is English');
   }
   await page.locator('[role=tab][data-tab=identite]').click();await page.locator('[role=tab][data-tab=identite]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-tab'),'inventaire');
   await page.locator('#panel-inventaire .dossier-chapter-end button').click();assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-tab'),'chronologie');
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(new URL('/pages/mission.html?mission=apollo-11&theme=day#inventaire',base).href);assert.equal(await page.locator('[role=tab][aria-selected=true]').getAttribute('data-tab'),'inventaire');assert.equal(await page.locator('html').getAttribute('data-theme'),'day');assert.equal(await page.locator('.dossier-reveal').count(),0,'Reduced motion does not hide content behind animations');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>localStorage.setItem('relic.preferences.v1',JSON.stringify({motion:'reduced'})));await page.goto(new URL('/pages/sputnik.html',base).href);assert.equal(await page.locator('html').getAttribute('data-motion'),'reduced');assert.equal(await page.locator('.dossier-reveal').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: both English archives, desktop/mobile, hero, all chapters, keyboard navigation, next chapter, image viewer and reduced motion');
}finally{await browser.close();}
