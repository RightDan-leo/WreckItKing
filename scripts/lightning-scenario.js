async page=>{
 await page.setViewportSize({width:1280,height:800});
 await page.addInitScript(()=>{let seed=9310;Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 await page.goto('http://localhost:9310/a/?lang=zh');await page.waitForFunction(()=>window.__wik);await page.keyboard.press('ArrowUp');
 const chain=await page.evaluate(()=>{
  __wik.sim(3.3);__wik.auto(true);let chain;
  for(let i=0;i<4000;i++){__wik.sim(.05);chain=__wik.lightning();if(chain.maxHits>=3&&chain.bolts>=3)break;}
  __wik.auto(false);if(chain.maxHits<3||chain.bolts<3)throw Error('no multi-target visible chain');
  return {chain,wave:__wik.audit().wave};
 });
 await page.screenshot({path:'output/playwright/a-chain-lightning.png'});
 return chain;
}
