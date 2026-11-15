export async function advanceWelcome(page){
 const welcome=page.locator('.explorer-welcome');
 if(!await welcome.evaluate(n=>n.classList.contains('welcome-typing-done')))await welcome.locator('h1').click();
 await welcome.locator('h1').click();
}
/** Mission-scene regressions enter the atlas through the real welcome flow. */
export async function skipWelcome(page){
 const welcome=page.locator('.explorer-welcome');
 if(!await welcome.count())return;
 for(let i=0;i<4;i++)await advanceWelcome(page);
 await welcome.getByRole('button',{name:'English',exact:true}).click();
 await welcome.getByRole('textbox').fill('Explorer');
 await welcome.getByRole('textbox').press('Enter');
 await welcome.getByRole('button',{name:'Yeah, let’s go!',exact:true}).click();
 await welcome.getByRole('button',{name:'No, take me to the Solar System',exact:true}).click();
}
