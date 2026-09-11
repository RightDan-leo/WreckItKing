async page => {
 await page.setViewportSize({width:1280,height:800});
 await page.addInitScript(()=>{
  let seed=9310;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});
 });
 const results=[];
 for(const order of ['city-first','clear-first']){
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  await page.goto('http://localhost:9310/a/?lang=zh');await page.waitForFunction(()=>window.__wik);
  await page.keyboard.press('ArrowUp');
  const result=await page.evaluate(order=>{
   const check=(ok,msg)=>{if(!ok)throw Error(order+': '+msg);};
   __wik.sim(3.3);__wik.sweep(false);
   if(order==='clear-first'){
    __wik.auto(true);
    for(let i=0;i<1000&&__wik.state().cityLevel<2;i++)__wik.sim(.1);
    __wik.auto(false);check(__wik.state().cityLevel===2,'city 2 unreachable');
    __wik.mineAll('low');__wik.killAll();__wik.sim(.1);
    check(!__wik.variants().frontier.active,'expanded before city level 3');
    // Isolate event ordering using normal payment callbacks; economy is covered by playtest.
    __wik.give(100);__wik.give(20,'gem');
    __wik.zoneAt('forge');__wik.sim(2);__wik.tp(0,-10);__wik.sim(.1);
    __wik.zoneAt('city-upgrade');__wik.sim(2);
   }else{
    __wik.auto(true);
    for(let i=0;i<1500&&__wik.state().cityLevel<3;i++)__wik.sim(.1);
   }
   __wik.auto(false);check(__wik.state().cityLevel===3,'city 3 unreachable '+JSON.stringify(__wik.state()));
   if(order==='city-first'){
    check(!__wik.variants().frontier.active,'expanded over uncleared ore');
    // Pay just one low shard, then clear the mine while away from the pad.
    __wik.give(-(__wik.state().shards.low||0),'shard','low');__wik.give(1,'shard','low');
    __wik.zoneAt('pickaxe');__wik.sim(.15);__wik.tp(0,-10);
    const before=__wik.tiles().find(t=>t.id==='pickaxe');
    check(before.paid>0&&before.paid<before.cost,'partial payment not established');
    __wik.mineAll('low');__wik.sim(.1);
    const after=__wik.tiles().find(t=>t.id==='pickaxe');
    check(after.paid===before.paid&&after.cost===before.cost,'migration reset payment');
   }else __wik.sim(.1);
   check(__wik.variants().frontier.active,'cleared low mine did not become a plaza');
   check(__wik.marks().filter(m=>m.label==='frontier-city').length===1,'duplicate expansion');
   const pads=__wik.tiles();
   for(const id of ['pickaxe','forge','hatchery']){
    const matches=pads.filter(p=>p.id===id);check(matches.length<=1,'duplicate '+id);
    if(matches.length)check(matches[0].z<=-14,'old rear pad '+id);
   }
   // Probe the full central route and all service-pad footprints against real collision resolution.
   const probe=(x,z)=>{const p=__wik.blockProbe(x,z);check(Math.hypot(p.x-x,p.z-z)<.02,'blocked route '+x+','+z);};
   for(let z=-6;z>=-22;z-=.5)for(const x of [-1,0,1])probe(x,z);
   for(const [cx,cz] of [[0,-18.5],[5,-18.5],[-5,-18.5],[-5,-14]])
    for(const dx of [-1.6,0,1.6])for(const dz of [-1.6,0,1.6])probe(cx+dx,cz+dz);
   __wik.killAll();__wik.tp(0,-15);__wik.sim(2);
   return {order,pads,frontier:__wik.variants().frontier};
  },order);
  await page.screenshot({path:`output/playwright/a-frontier-${order}.png`});
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>__wik.sim(.1));
  await page.screenshot({path:`output/playwright/a-frontier-${order}-mobile.png`});
  result.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.setViewportSize({width:1280,height:800});
  results.push({...result,errors});page.removeListener('pageerror',onError);
 }
 return results;
}
