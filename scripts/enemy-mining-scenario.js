async page=>{
 await page.addInitScript(()=>{let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 const results=[];
 for(const v of ['a','b'])for(const kind of ['circle','fan','line']){
  await page.goto(`http://localhost:9310/${v}/?lang=zh`);await page.waitForFunction(()=>window.__wik);
  await page.keyboard.press('ArrowUp');await page.evaluate(()=>__wik.sim(3.3));
  const result=await page.evaluate(kind=>{
   const check=(ok,msg)=>{if(!ok)throw Error(kind+': '+msg);};
   const before=__wik.blockProbe(0,-18.5);check(Math.hypot(before.x,before.z+18.5)>.1,'test must start with solid ore');
   const args=kind==='circle'?[0,-18.5,5,kind,0]:[0,-14,9,kind,Math.PI];
   const first=__wik.enemyBlast(...args);
   check(first.cells>0&&first.coins>0,'no destruction or resources');
   check(first.chunks>=4&&first.drops>0,'missing fracture chunks or physical drops');
   const after=__wik.blockProbe(0,-18.5);check(Math.hypot(after.x,after.z+18.5)<.02,'indestructible blocking voxel remains');
   check(__wik.state().breached.low>0,'breach progression missing');
   const again=__wik.enemyBlast(...args);check(again.cells===first.cells&&again.coins===first.coins&&again.shards===first.shards&&again.chunks===first.chunks&&again.drops===first.drops,'repeat attack duplicates rewards');
   const seal=__wik.enemyBlast(0,-45,1);check(seal.cells===again.cells,'sealed ore destroyed');
   const resources=__wik.enemyBlast(0,0,30);
   check(resources.shards>0&&__wik.drops().some(d=>d.kind.startsWith('shard-')),'buried upgrade material did not drop');
   return {first,resources,after,breached:__wik.state().breached};
  },kind);
  if(v==='a'&&kind==='circle') {
   await page.evaluate(()=>{__wik.tp(0,-14);__wik.sim(.12);});
   await page.screenshot({path:'output/playwright/enemy-mining-fracture.png'});
  }
  results.push({v,kind,...result});
 }
 return results;
}
