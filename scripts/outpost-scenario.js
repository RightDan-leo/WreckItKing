async page=>{
 await page.setViewportSize({width:1280,height:800});
 await page.addInitScript(()=>{let seed=9310;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 const results=[];
 for(const v of ['a','b']){
  await page.goto(`http://localhost:9310/${v}/?lang=zh`);await page.waitForFunction(()=>window.__wik);
  await page.evaluate(()=>__wik.sim(3.3));await page.keyboard.press('ArrowUp');
  await page.evaluate(()=>{
   const u=__wik.ultimate();if(u.modelVisible||!u.lockVisible)throw Error('unfunded barrel model visible');
   __wik.tp(u.x,u.z);__wik.sim(.2);
   if(!__wik.ultimate().hintInside||__wik.ultimate().lit)throw Error('locked plot hint/activation wrong');
  });
  if(!(await page.locator('body').innerText()).includes('回城'))throw Error('missing return-to-city hint');
  await page.screenshot({path:`output/playwright/${v}-ultimate-empty.png`});
  await page.evaluate(()=>{__wik.tp(0,-7);__wik.sim(.1);});
  const before=await page.evaluate(()=>{
   __wik.auto(true);for(let i=0;i<2000&&!__wik.tiles().some(z=>z.id==='outpost');i++){__wik.sim(.1);const w=__wik.audit().wave;if(__wik.tiles().some(z=>z.id==='outpost')&&(!w.spawned||w.killed<w.count))throw Error('outpost appeared before final wave cleared');}
   __wik.auto(false);const t=__wik.tiles().find(z=>z.id==='outpost');if(!t)throw Error('no final outpost objective');const w=__wik.audit().wave;if(w.count!==60||w.killed!==60)throw Error('outpost appeared early');
   const wallet=__wik.state().coins;__wik.give(7-wallet);__wik.tp(t.x+3.5,t.z+1);__wik.sim(.2);__wik.zoneAt('outpost');__wik.sim(.1);
   const paid=__wik.outpost().zone?.paid;if(!(paid>0&&paid<t.cost))throw Error('partial funding failed');
   __wik.tp(t.x+3.5,t.z+1);__wik.sim(.2);
   if(__wik.outpost().zone.paid!==paid||!__wik.ultimate().locked)throw Error('lost partial payment or unlocked early');
   // Restore only the coins removed by the probe; preserve pickups arriving during payment.
   __wik.give(wallet-7);
   return {tile:t,wallet,partial:paid};
  });
  await page.waitForTimeout(1300);
  await page.screenshot({path:`output/playwright/${v}-outpost-donation.png`});
  const built=await page.evaluate(()=>{
   __wik.auto(true);for(let i=0;i<1800&&!__wik.outpost().built;i++)__wik.sim(.1);
   __wik.auto(false);if(!__wik.outpost().built)throw Error('outpost never built');
   if(__wik.ore().low.left||__wik.ore().mid.left)throw Error('built over solid ore');
   if(__wik.ultimate().locked||!__wik.ultimate().modelVisible)throw Error('final construction did not reveal/unlock barrel');
   for(let z=-23;z>=-32;z-=.5)for(const x of [-1,0,1]){const p=__wik.blockProbe(x,z);if(Math.hypot(p.x-x,p.z-z)>.02)throw Error('blocked front route');}
   __wik.tp(0,-26);__wik.sim(.3);return {outpost:__wik.outpost(),state:__wik.state()};
  });
  await page.screenshot({path:`output/playwright/${v}-outpost-built.png`});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:`output/playwright/${v}-outpost-mobile.png`});await page.setViewportSize({width:1280,height:800});
  const end=await page.evaluate(()=>{
   __wik.auto(true);for(let i=0;i<1800&&!__wik.state().ctaOpen;i++){
    __wik.sim(.1);const u=__wik.ultimate(),o=__wik.outpost(),w=__wik.audit().wave;
    if(u&&!u.locked&&(!o.built||w.killed<w.count))throw Error('early unlock');
   }
   // Economy is asserted on normal routes in playtest-scenario; this probe teleports through locked mines.
   if(!__wik.state().ctaOpen)throw Error('blocked or subsidized '+JSON.stringify({state:__wik.state(),outpost:__wik.outpost(),ultimate:__wik.ultimate(),marks:__wik.marks()}));
   return {state:__wik.state(),outpost:__wik.outpost(),marks:__wik.marks()};
  });results.push({v,before,built,end});
 }
 return results;
}
