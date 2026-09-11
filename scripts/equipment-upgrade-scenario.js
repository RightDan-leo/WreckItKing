async page=>{
 await page.setViewportSize({width:1000,height:900});
 await page.addInitScript(()=>{let seed=9310;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const kind of ['pick','weapon'])for(const level of kind==='pick'?[1,2,3,4]:[2,3]){
  await page.goto('http://localhost:9310/a/?lang=zh');await page.waitForFunction(()=>window.__wik);await page.keyboard.press('ArrowUp');
  const profile=await page.evaluate(({kind,level})=>{__wik.sim(3.3);__wik.tp(0,-7);const data=__wik.equipment({[kind]:level,show:true});__wik.sim(.1);return data;},{kind,level});
  await page.screenshot({path:`output/playwright/equipment-${kind}-${level}.png`});
  const sample=kind==='pick'?await page.evaluate(()=>__wik.equipmentMineSample()):null;
  results.push({kind,level,profile,sample});
 }
 const picks=results.filter(r=>r.kind==='pick');for(let i=1;i<picks.length;i++){
  if(picks[i].sample.cells/picks[i].sample.seconds<=picks[i-1].sample.cells/picks[i-1].sample.seconds)throw Error('mining efficiency did not increase');
  if(picks[i].profile.pickParts<=picks[i-1].profile.pickParts)throw Error('pick silhouette did not change');
 }
 if(picks[1].sample.seconds>picks[0].sample.seconds*.75)throw Error('first upgrade feels too small');
 const bows=results.filter(r=>r.kind==='weapon');if(bows[1].profile.bowParts<=bows[0].profile.bowParts||bows[1].profile.damage/bows[1].profile.attackInterval<=bows[0].profile.damage/bows[0].profile.attackInterval)throw Error('bow upgrade missing');
 if(errors.length)throw Error(errors.join('\n'));return results;
}
