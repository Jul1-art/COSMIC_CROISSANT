/** Mission-scene regressions enter the atlas through the real welcome flow. */
export async function skipWelcome(page){
 const welcome=page.locator('.explorer-welcome');
 if(!await welcome.count())return;
 await welcome.getByRole('button',{name:'English',exact:true}).click();
 await welcome.getByRole('textbox').fill('Explorer');
 await welcome.getByRole('button',{name:'Continue',exact:true}).click();
 await welcome.getByRole('button',{name:'Yeah, let’s go!',exact:true}).click();
 await welcome.getByRole('button',{name:'No, take me to the Solar System',exact:true}).click();
}
