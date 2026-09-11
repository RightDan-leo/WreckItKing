async page=>{
 await page.setViewportSize({width:1280,height:800});
 await page.addInitScript(()=>{let seed=9310;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 await page.goto('http://localhost:9310/a/?lang=zh');await page.waitForFunction(()=>window.__wik);await page.keyboard.press('ArrowUp');
 await page.evaluate(()=>{__wik.sim(.1);const b=__wik.ultimate();__wik.tp(b.x+3.5,b.z);__wik.sim(.6);if(!__wik.ultimate().lockVisible)throw Error('lock model missing');});
 await page.screenshot({path:'output/playwright/a-ultimate-locked.png'});
 if(await page.locator('body').innerText().then(t=>t.includes('清除末波后解锁')))throw Error('old footer remains');
 await page.reload();await page.waitForFunction(()=>window.__wik);await page.keyboard.press('ArrowUp');
 const upgrade=await page.evaluate(()=>{
  __wik.sim(3.3);
  if(!__wik.ultimate()?.locked)throw Error('barrel not present and locked from start');
  const locked=__wik.ultimate();__wik.tp(locked.x,locked.z);__wik.sim(1.5);
  if(!__wik.ultimate()?.locked||__wik.ultimate()?.lit||__wik.state().finaleStarted)throw Error('locked barrel ignited');
  __wik.tp(0,-7);__wik.auto(true);let tile;
  for(let i=0;i<2000;i++){__wik.sim(.1);tile=__wik.tiles().find(z=>z.id==='evolve');if(tile)break;}
  __wik.auto(false);if(!tile||tile.z!==-14||tile.x!==5||tile.cost!==10)throw Error('evolution location or donation wrong');
  __wik.tp(0,-15);__wik.sim(.6);return tile;
 });
 await page.screenshot({path:'output/playwright/a-evolve-in-city.png'});
 const barrel=await page.evaluate(()=>{
  __wik.auto(true);let charge;
  for(let i=0;i<2000;i++){__wik.sim(.1);charge=__wik.charge();if(charge?.ultimate)break;}
  __wik.auto(false);if(!charge?.ultimate)throw Error('ultimate barrel absent');
  if(__wik.ultimate()?.lockVisible)throw Error('lock still visible after unlock');
  if(__wik.tiles().some(z=>z.id==='seal'))throw Error('old donation pad remains');
  __wik.tp(charge.x+3.5,charge.z);__wik.sim(.6);return charge;
 });
 await page.screenshot({path:'output/playwright/a-ultimate-barrel.png'});
 const end=await page.evaluate(barrel=>{
  __wik.give(-__wik.state().coins);if(__wik.state().coins!==0)throw Error('zero-coin setup failed');__wik.tp(barrel.x,barrel.z);__wik.sim(1.3);
  if(!__wik.state().finaleStarted||__wik.state().coins>=120)throw Error('barrel state '+JSON.stringify({state:__wik.state(),charge:__wik.charge()}));
  __wik.sim(14);
  if(!__wik.state().ctaOpen||__wik.marks().filter(m=>m.label==='ultimate-barrel').length!==1)throw Error('intro did not complete exactly once');
  return {state:__wik.state(),marks:__wik.marks()};
 },barrel);
 return {upgrade,barrel,end};
}
