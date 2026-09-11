// 中文手动操作回归。夹具仅设置钱包，捐献按钮、付款、爆破、孵化和升级走实际更新。
async page => {
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),tab=await ctx.newPage(),errors=[];
 tab.on('pageerror',e=>errors.push(e.message));
 await tab.addInitScript(()=>{let seed=9310;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};let api;Object.defineProperty(window,'__wik',{get:()=>api,set:v=>{api=v;v.hold=true;}});});
 await tab.route('**/c/index.html*',async route=>{
  const response=await route.fetch();let body=await response.text();
  body=body.replace('window.__wik = {',`window.__flow={
   coins:n=>{coins=n;syncBackCoins();updateUI();},
   wallet:n=>{coins=n;gems=n;for(const g of Object.keys(shards))shards[g]=n;syncBackCoins();updateUI();},
   egg:()=>eggPickup && {x:eggPickup.mesh.position.x,z:eggPickup.mesh.position.z},
   totals:()=>Object.fromEntries(['low','mid','high'].map(g=>[g,shards[g]+coinDrops.filter(c=>c.shard && c.grade===g && !c.ghost).length+oreNodes.reduce((sum,n)=>sum+n.shards.filter(s=>s.grade===g && !s.taken).length,0)])),
   buttons:()=>zones.map(z=>({id:z.id,paid:z.paid,cost:z.cost,remote:z.remoteBudget||0}))
  };window.__wik = {`);
  await route.fulfill({response,body});
 });
 await tab.goto('http://localhost:9310/c/index.html?lang=zh');await tab.waitForFunction(()=>window.__wik);await tab.keyboard.press('ArrowDown');
 const checks=[];const check=(name,ok,data)=>{if(!ok)throw Error(name+': '+JSON.stringify(data));checks.push({name,data});};
 const initial=await tab.evaluate(()=>{const born=__wik.state().coins;__wik.tp(0,-10);__wik.sim(3);__wik.tp(0,-7);__wik.sim(5);__flow.coins(3);__wik.sim(.02);return {born,tiles:__wik.tiles(),blocks:__wik.variants().blocks};});
 check('出生10金币',initial.born===10,initial.born);
 check('未清空用地即可捐献',initial.blocks.progress.remaining>0 && initial.tiles.find(t=>t.id==='city-upgrade').payable,initial.tiles);
 await tab.locator('#block-donate').click();
 const partial=await tab.evaluate(()=>{__wik.sim(2);return {state:__wik.state(),tiles:__wik.tiles(),blocks:__wik.variants().blocks};});
 check('矿区外点击也能分批捐献',partial.tiles.find(t=>t.id==='city-upgrade').paid===3 && partial.state.coins===0 && partial.state.pos[1]===-7,partial);
 check('未付满不爆破',partial.blocks.blasts.length===0 && partial.blocks.progress.remaining>0,partial.blocks.progress);
 await tab.evaluate(()=>{__flow.coins(12);__wik.sim(.02);});await tab.locator('#block-donate').click();
 const burst=await tab.evaluate(()=>{for(let i=0;i<300 && !__wik.variants().blocks.blasts.length;i++)__wik.sim(1/60);return {state:__wik.state(),blocks:__wik.variants().blocks,buttons:__flow.buttons()};});
 check('最后一笔到帐同帧爆破',burst.blocks.blasts.length===1 && burst.blocks.progress.remaining===0 && burst.state.cityLevel===1,burst.blocks.blasts);
 check('只扣剩余金额',burst.state.coins===0 && burst.buttons.find(t=>t.id==='city-upgrade').paid===15,burst.buttons);
 check('仅清当前建设用地',burst.blocks.nodes.find(n=>n.id==='low-0').remaining>0 && burst.blocks.nodes.find(n=>n.id==='low-1').remaining===initial.blocks.nodes.find(n=>n.id==='low-1').remaining,burst.blocks.nodes.slice(0,2));
 await tab.screenshot({path:'output/playwright/c-donation-blast.png'});
 const built=await tab.evaluate(()=>{__wik.sim(4);return {state:__wik.state(),blocks:__wik.variants().blocks};});
 check('爆破后生成街区且只执行一次',built.state.cityLevel===2 && built.blocks.blasts.length===1,built.blocks.blasts);
 const stage3=await tab.evaluate(()=>{__wik.auto(true);for(let i=0;i<2000 && __wik.state().cityLevel<3;i++)__wik.sim(.05);__wik.auto(false);return {state:__wik.state(),egg:__flow.egg(),tiles:__wik.tiles(),blocks:__wik.variants().blocks};});
 check('自然收入继续到三级城',stage3.state.cityLevel===3 && stage3.blocks.fallback===0,stage3.state);
 const hatch=stage3.tiles.find(t=>t.id==='hatchery');
 check('龙蛋在龙巢来路上',stage3.egg && hatch.z<stage3.egg.z,stage3);
 const pet=await tab.evaluate(()=>{const e=__flow.egg();__wik.tp(e.x,e.z);__wik.sim(3);const held=__wik.state().carryingEgg;__flow.wallet(0);const h=__wik.tiles().find(t=>t.id==='hatchery');__wik.tp(h.x,h.z);__wik.sim(5);return {held,state:__wik.state(),tiles:__wik.tiles()};});
 check('抱蛋前进即可零资源孵化',pet.held && pet.state.pet && !pet.tiles.some(t=>t.id==='hatchery'),pet.state);
 const tool=await tab.evaluate(()=>{__flow.wallet(100);const t=__wik.tiles().find(t=>t.id==='pickaxe');__wik.tp(t.x,t.z);__wik.sim(5);return {state:__wik.state(),tiles:__wik.tiles()};});
 check('停留不连扣下一档工具',tool.state.pickaxeLevel===2 && tool.tiles.find(t=>t.id==='pickaxe').requiresReentry,tool.tiles);
 const midway=await tab.evaluate(()=>{__wik.tp(0,-21);__wik.sim(.2);__flow.wallet(0);__wik.give(1,'shard','mid');const p=__wik.tiles().find(t=>t.id==='pickaxe');__wik.tp(p.x,p.z);__wik.sim(2);const paid=__wik.tiles().find(t=>t.id==='pickaxe').paid;__wik.tp(0,-26);__wik.sim(.2);__flow.coins(100);__wik.sim(.02);return paid;});
 check('迁移前允许部分支付工具材料',midway===1,midway);
 await tab.locator('#block-donate').click();
 const migrated=await tab.evaluate(()=>{__wik.sim(4);return {state:__wik.state(),pads:__wik.variants().blocks.pads,tool:__wik.tiles().find(t=>t.id==='pickaxe')};});
 check('新区只保留一个锄头升级入口',migrated.state.cityLevel===4 && migrated.pads.filter(p=>p.id==='pickaxe').length===1,migrated.pads);
 check('前移保留已交材料',migrated.tool.paid===1 && migrated.tool.z===-34,migrated.tool);
 const retired=await tab.evaluate(()=>{__wik.tp(-2.9,-24);__wik.sim(2);return __wik.tiles();});
 check('旧位置不再扣款',retired.find(t=>t.id==='pickaxe').paid===1 && !retired.some(t=>t.inside),retired);
 const once=await tab.evaluate(()=>{const p=__wik.tiles().find(t=>t.id==='pickaxe');__wik.tp(p.x,p.z);__wik.sim(4);return __wik.state().pickaxeLevel;});
 check('到前沿只补差额即可升级',once===3,once);
 const end=await tab.evaluate(()=>{__flow.wallet(100);__wik.tp(0,-36);__wik.sim(.1);__wik.auto(true);for(let i=0;i<3000 && !__wik.state().ctaOpen;i++)__wik.sim(.05);__wik.auto(false);return {state:__wik.state(),marks:__wik.marks(),blocks:__wik.variants().blocks};});
 check('提前捐献路线完整到终局',end.state.ctaOpen && end.blocks.blasts.length===3,end.state);
 check('每个扩区只爆破和收费一次',end.blocks.blasts.map(b=>b.level).join(',')==='1,2,3' && end.marks.filter(m=>/^city-[234]$/.test(m.label)).length===3,end.blocks.blasts);
 check('必需流程不强制购买四级工具',end.state.pickaxeLevel===3,end.state.pickaxeLevel);
 await ctx.close();return [{lang:'zh',errors,checks}];
}
