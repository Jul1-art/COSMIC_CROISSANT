import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
const base=process.env.TEST_BASE_URL||'http://localhost:4174';
try{
 const page=await browser.newPage({viewport:{width:1280,height:900},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);const welcome=page.locator('.explorer-welcome');await welcome.waitFor();
 assert.equal(await page.locator('#intro video').count(),0);assert.equal(await welcome.locator('h1').getAttribute('aria-label').then(x=>x.includes('Hi, explorer')),true);
 await page.waitForTimeout(300);assert.ok(Number(await welcome.locator('h1').getAttribute('data-typed-count'))>0);
 await welcome.getByRole('button',{name:'Français',exact:true}).click();assert.equal(await page.locator('html').getAttribute('lang'),'fr');
 await welcome.getByRole('textbox').fill('   ');await welcome.getByRole('button',{name:'Continuer',exact:true}).click();assert.equal(await welcome.getAttribute('data-step'),'1');await welcome.getByRole('textbox').fill('Élise');await welcome.getByRole('button',{name:'Continuer',exact:true}).click();assert.match(await welcome.locator('h1').getAttribute('aria-label'),/Élise/);assert.equal(await page.evaluate(()=>localStorage.getItem('relic.explorer.first-name')),'Élise');
 await welcome.getByRole('button',{name:'Oui, c’est parti !',exact:true}).click();await welcome.getByRole('button',{name:'Non, explorer le système solaire',exact:true}).click();await welcome.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>window.__relicFilmActive),false);assert.equal(await page.locator('#intro video').count(),0);
 await page.reload();await welcome.waitFor();await page.setViewportSize({width:390,height:844});await welcome.getByRole('button',{name:'English',exact:true}).click();assert.equal(await welcome.getByRole('textbox').inputValue(),'Élise');await welcome.getByRole('textbox').fill('Jules');await welcome.getByRole('textbox').press('Enter');await welcome.getByRole('button',{name:'Yeah, let’s go!',exact:true}).click();assert.ok(await welcome.evaluate(n=>n.scrollWidth<=innerWidth));await page.waitForTimeout(3500);if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH});
 await welcome.getByRole('button',{name:'Yes, show me the film',exact:true}).click();await welcome.waitFor({state:'detached'});await page.waitForFunction(()=>document.querySelector('#intro video')?.currentTime>.1,{timeout:60000});assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.evaluate(()=>window.__relicFilmActive),true);
 await page.evaluate(()=>window.RELICFilm.close());await page.waitForFunction(()=>window.__relicFilmActive===false);await page.goto(base+'/?view=inspection&body=moon');await page.waitForTimeout(500);assert.equal(await welcome.count(),0);assert.deepEqual(errors,[]);console.log('PASS: typing, French/English, remembered first name, back/return policy, mobile, skip and real film playback');
}finally{await browser.close();}
