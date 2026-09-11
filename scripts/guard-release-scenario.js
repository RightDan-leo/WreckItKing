async page=>{
 await page.addInitScript(()=>{let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 const results=[];
 for(const version of ['a','b'])for(const tier of ['low','mid']){
  await page.goto(`http://localhost:9310/${version}/?lang=zh`);await page.waitForFunction(()=>window.__wik);
  const result=await page.evaluate(tier=>{
   const g=__wik.guards().find(g=>g.tier===tier);const [x,z]=g.pos;const angle=Math.atan2(z,x),r=Math.hypot(x,z)-5;
   __wik.tp(Math.cos(angle+.25)*r,Math.sin(angle+.25)*r);
   const side=__wik.breach(tier);
   if(side!==g.id)throw Error('test missed segment');
   if(__wik.guards().find(v=>v.id===g.id).revealed)throw Error('side tunnel released buried guard');
   __wik.tp(Math.cos(angle)*r,Math.sin(angle)*r);__wik.breach(tier);__wik.sim(.05);
   const exposed=__wik.guards().find(v=>v.id===g.id);
   if(!exposed.revealed)throw Error('own tunnel did not release guard');
   return {id:g.id,exposed};
  },tier);results.push({version,tier,...result});
 }
 return results;
}
