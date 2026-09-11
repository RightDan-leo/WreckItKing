async page => {
 await page.setViewportSize({width:1280,height:800});
 await page.addInitScript(()=>{let api;Object.defineProperty(window,'__wik',{configurable:true,get:()=>api,set:v=>{api=v;v.hold=true;}});});
 const results=[];
 for(const version of ['a','b','c']) {
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  await page.goto(`http://localhost:9310/${version}/?lang=zh`);await page.waitForFunction(()=>window.__wik);await page.keyboard.press('ArrowUp');
  const display=await page.evaluate(()=>{
   __wik.sim(3.3);__wik.auto(true);
   for(let i=0;i<1500&&!__wik.bow().display;i++)__wik.sim(.1);
   __wik.auto(false);if(!__wik.bow().display||__wik.bow().visible)throw Error('first bow display/ownership wrong');
   const tile=__wik.tiles().find(t=>t.id==='forge');__wik.tp(tile.x+3,tile.z+2);__wik.sim(.1);return __wik.bow();
  });
  await page.screenshot({path:`output/playwright/${version}-bow-display.png`});
  const back=await page.evaluate(()=>{
   __wik.auto(true);for(let i=0;i<1500&&__wik.weapon().level<2;i++)__wik.sim(.1);
   __wik.auto(false);__wik.tp(0,-7);__wik.sim(1);
   const b=__wik.bow();if(b.pose!=='back'||!b.visible||b.display)throw Error('acquired bow not stowed '+JSON.stringify(b));return b;
  });
  await page.screenshot({path:`output/playwright/${version}-bow-back.png`});
  const shooting=await page.evaluate(()=>{
   __wik.auto(true);let b;for(let i=0;i<1500;i++){__wik.sim(.05);b=__wik.bow();if(b.pose==='shooting'&&b.arrows>0)break;}
   __wik.auto(false);if(b.pose!=='shooting'||b.arrows===0)throw Error('no bow attack');return b;
  });
  await page.screenshot({path:`output/playwright/${version}-bow-shooting.png`});
  if(errors.length)throw Error(errors.join('\n'));results.push({version,display,back,shooting,errors});page.off('pageerror',onError);
 }
 return results;
}
