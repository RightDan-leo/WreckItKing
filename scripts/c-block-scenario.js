async page => {
 const results=[];
 for(const [seed,route,lang] of [[9310,'hatch-first','zh'],[9310,'build-first','zh'],[17,'hatch-first','zh'],[701,'build-first','zh']]) {
  const context=await page.context().browser().newContext({viewport:{width:390,height:844}});
  const tab=await context.newPage();const errors=[];tab.on('pageerror',e=>errors.push(e.message));
  await tab.addInitScript(seed=>{let n=seed;Math.random=()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};let api;Object.defineProperty(window,'__wik',{get:()=>api,set:v=>{api=v;v.hold=true;}});},seed);
  await tab.goto(`http://localhost:9310/c/index.html?lang=${lang}`);await tab.waitForFunction(()=>window.__wik);
  const initial=await tab.evaluate(()=>({state:__wik.state(),blocks:__wik.variants().blocks}));
  await tab.keyboard.press('ArrowDown');
  const run=await tab.evaluate(route=>{
   __wik.blockRoute(route);__wik.auto(true);let stage=0,maxPen=0,maxPlayerPen=0,minPadGap=Infinity,playerCollision=null;const milestones=[];
   for(let i=0;i<1200;i++){
    __wik.sim(.25);const s=__wik.state();
    const layout=__wik.variants().blocks;
    if(new Set(layout.pads.map(p=>p.id)).size!==layout.pads.length)throw Error('同一种升级出现重复入口');
    for(let a=0;a<layout.pads.length;a++){
     const pad=layout.pads[a];
     for(const other of layout.pads.slice(a+1)){
      const half=(pad.size+other.size)/2;
      const gap=Math.hypot(Math.max(0,Math.abs(pad.x-other.x)-half),Math.max(0,Math.abs(pad.z-other.z)-half));
      minPadGap=Math.min(minPadGap,gap);
      if(gap<.8)throw Error('地贴间距不足: '+JSON.stringify({stage:s.cityLevel,pad,other,gap}));
     }
     for(const c of layout.colliders){
      const gap=Math.hypot(Math.max(0,Math.abs(pad.x-c.x)-pad.size/2),Math.max(0,Math.abs(pad.z-c.z)-pad.size/2));
      if(gap<c.radius-.001)throw Error('建筑占用地贴: '+JSON.stringify({stage:s.cityLevel,pad,c}));
     }
     if(!['city-build','city-upgrade','seal','evolve'].includes(pad.id) && Math.abs(pad.x)-pad.size/2<1.5)throw Error('设施地贴侵占主街');
    }
    if(i%4===0){for(const e of __wik.audit().enemies)if(e.emerging<=0)maxPen=Math.max(maxPen,e.penetration);const depth=__wik.solidDepth(...s.pos,.62);if(depth>maxPlayerPen){maxPlayerPen=depth;playerCollision={pos:s.pos,depth,city:s.cityLevel,slide:__wik.slide(...s.pos,.62)};}}
    if(s.cityLevel!==stage){stage=s.cityLevel;const b=__wik.variants().blocks;
     const gate=__wik.blockProbe(0,b.front-3);const oldGate=stage>1?__wik.blockProbe(0,[-18.4,-26.4,-35.5][stage-2]):null;
     milestones.push({stage,at:__wik.marks().at(-1).at,blocks:b,gate,oldGate});}
    if(s.ctaOpen)break;
   }
   return {state:__wik.state(),marks:__wik.marks(),blocks:__wik.variants().blocks,milestones,maxPen,maxPlayerPen,playerCollision,minPadGap,overflow:document.documentElement.scrollWidth>innerWidth};
  },route);
  results.push({seed,route,lang,initial,errors,...run});await context.close();
 }
 return results;
}
