async page => {
 await page.addInitScript(()=>{let seed=9310;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 const results=[];
 for(const v of ['a','b']){
  const errors=[];const err=e=>errors.push(e.message);page.on('pageerror',err);
  await page.goto(`http://localhost:9310/${v}/?lang=zh`);await page.waitForFunction(()=>window.__wik);
  await page.keyboard.press('ArrowUp');
  const result=await page.evaluate(()=>{
   const check=(ok,msg)=>{if(!ok)throw Error(msg);};
   __wik.sim(3.3);__wik.auto(true);
   for(let i=0;i<1500&&__wik.state().cityLevel<3;i++)__wik.sim(.1);
   __wik.auto(false);__wik.tp(0,-10);
   const state=__wik.state();check(state.cityLevel===3&&state.pickaxeLevel===1,'wrong setup');
   __wik.give(-state.coins);__wik.give(-state.gems,'gem');
   const pick=()=>__wik.tiles().find(z=>z.id==='pickaxe');
   __wik.give(pick().cost-pick().paid-1-(__wik.state().shards.low||0),'shard','low');
   const missing=__wik.guide();const r=Math.hypot(missing.goal[0],missing.goal[2]);
   check(!missing.eggReachable,'egg behind medium ore should be unavailable at pickaxe 1');
   check(r>=16&&r<22,'missing shard should point at low ore, not egg or higher ore');
   __wik.give(1,'shard','low');
   const funded=__wik.guide();const tile=pick();
   check(Math.hypot(funded.goal[0]-tile.x,funded.goal[2]-tile.z)<.01,'funded upgrade should point to pickaxe');
   __wik.zoneAt('pickaxe');__wik.sim(.05);__wik.tp(0,-10);
   const part=pick();check(part.paid>0&&part.paid<part.cost,'expected partial payment');
   const partial=__wik.guide();check(Math.hypot(partial.goal[0]-part.x,partial.goal[2]-part.z)<.01,'partial balance should count paid materials');
   __wik.zoneAt('pickaxe');__wik.sim(.5);
   check(__wik.state().pickaxeLevel===2,'upgrade failed');
   check(__wik.guide().eggReachable,'egg route should unlock after pickaxe 2');
   const next=pick(),reentry=__wik.guide();
   if(next?.requiresReentry&&reentry.goal)check(Math.hypot(reentry.goal[0]-next.x,reentry.goal[2]-next.z)>.1,'guide stuck on reentry pad');
   return {missing,funded,partial,after:__wik.state()};
  });
  results.push({v,...result,errors});page.removeListener('pageerror',err);
 }
 return results;
}
