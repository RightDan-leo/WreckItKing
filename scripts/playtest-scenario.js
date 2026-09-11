async (page) => {
 await page.setViewportSize({width:1280,height:800});
 await page.addInitScript(() => {
  let seed=9310; Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});
 });
 const results=[];
 for(const v of ['a','b','c']){
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  await page.goto(`http://localhost:9310/${v}/index.html?lang=zh`);await page.waitForFunction(()=>window.__wik);
  const initial=await page.evaluate(()=>({variants:__wik.variants(),audit:__wik.audit()}));
  await page.evaluate(()=>__wik.sim(3.3)); await page.keyboard.press('ArrowDown');
  const run=await page.evaluate(()=>{
   __wik.auto(true);const waits={};const first={};let maxDrops=0,maxGhosts=0,maxPen=0,collision=null;const shots=[];
   for(let i=0;i<1000;i++){
    const time=__wik.sim(.25),s=__wik.state(),a=__wik.audit();
    if (__wik.waveEnemies().some(e=>!e.engaged)) throw Error("final wave stopped pursuing");
    const barrel=__wik.ultimate();
    if(barrel && a.wave.killed<a.wave.count && !barrel.locked)throw Error('early barrel unlock');
    maxDrops=Math.max(maxDrops,s.drops);maxGhosts=Math.max(maxGhosts,__wik.drops().filter(d=>d.ghost).length);
    for(const e of a.enemies){if(e.emerging>0)continue;if(e.penetration>maxPen){maxPen=e.penetration;collision={time,...e};}}
    for(const kind of ['gem','shard'])if(a.hud[kind]&&first[kind]===undefined)first[kind]=time;
    for(const z of __wik.tiles()){
     if(z.complete||!z.payable)continue;
     const key=z.id+':'+z.cost;const w=waits[key]||(waits[key]={currency:z.currency,appeared:time,ready:null});
     const wallet=z.currency==='coin'?s.coins:z.currency==='gem'?s.gems:(s.shards[s.need]||0);
     if(wallet>=z.cost-z.paid&&w.ready===null){w.ready=time;w.wait=+(time-w.appeared).toFixed(2);}
    }
    if(i%80===79)shots.push({time,state:s,audit:a});
    if(s.ctaOpen)break;
   }
   return {maxSplashHits:__wik.petSplash(),state:__wik.state(),marks:__wik.marks(),variants:__wik.variants(),audit:__wik.audit(),waits,first,maxDrops,maxGhosts,maxPen,collision,shots};
  });
  results.push({v,initial,run,errors});page.removeListener('pageerror',onError);
 }
 return results;
}
