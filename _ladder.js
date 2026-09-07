// 阶梯改造的验收脚本。读 __wik 自动机跑出来的采样，算三件事：
//   1. 阶梯顺序和各步时刻
//   2. 吃钻石的地贴有没有同时可付款（单轨的硬指标，必须为 0）
//   3. 各层矿在关键节点的消耗率（判定价格会不会把矿掏空）
const file = process.argv[2];
const S = require(file).result.value.samples;
const R = require(file).result.value;

const first = p => { const s = S.find(p); return s ? s.t : null; };
const fmt = v => v === null ? "  —  " : String(v).padStart(5) + "s";

console.log(`完成: ${R.done}   时长: ${R.t}s   采样: ${R.n}`);
console.log("marks:", JSON.stringify(R.marks));

console.log("\n── 阶梯 ──");
const steps = [
    ["主城 Lv2", s => s.city >= 2],
    ["武器 Lv2 (得弓)", s => s.wl >= 2],
    ["主城 Lv3", s => s.city >= 3],
    ["锄头 Lv2", s => s.pick >= 2],
    ["主城 Lv4", s => s.city >= 4],
    ["捡到蛋", s => s.carry],
    ["破壳", s => s.pet],
    ["武器 Lv3", s => s.wl >= 3],
    ["进化", s => s.evolved],
    ["锄头 Lv3", s => s.pick >= 3],
    ["锄头 Lv4", s => s.pick >= 4]
];
let prev = 0;
for (const [label, pred] of steps) {
    const t = first(pred);
    const gap = t === null ? null : (t - prev).toFixed(1);
    if (t !== null) prev = t;
    console.log(`${label.padEnd(18)} ${fmt(t)}   间隔 ${gap === null ? "—" : gap + "s"}`);
}

console.log("\n── 钻石单轨 ──");
let payOverlap = 0, visOverlap = 0, maxPay = 0;
const examples = [];
for (const s of S) {
    if (s.pay.length > 1) {
        payOverlap += 0.25;
        if (examples.length < 5) examples.push(`${s.t}s: ${s.pay.join("+")}`);
    }
    if (s.vis.length > 1) visOverlap += 0.25;
    maxPay = Math.max(maxPay, s.pay.length);
}
console.log(`同时可付款的秒数: ${payOverlap.toFixed(2)}s   峰值同时张数: ${maxPay}`);
console.log(`同时可见的秒数:   ${visOverlap.toFixed(2)}s`);
if (examples.length) console.log("样例:", examples.join("  "));

console.log("\n── 矿层消耗率 ──");
for (const [label, pred] of [["主城 Lv3 时", s => s.city >= 3], ["锄头 Lv2 时", s => s.pick >= 2],
                             ["主城 Lv4 时", s => s.city >= 4], ["通关时", s => s.cta]]) {
    const s = S.find(pred) || S[S.length - 1];
    const o = s.ore;
    const line = ["low", "mid", "high"].filter(k => o[k]).map(k => `${k} ${o[k].used}%`).join("  ");
    console.log(`${label.padEnd(12)} t=${String(s.t).padStart(5)}s   ${line}`);
}

const L = S[S.length - 1];
console.log("\n── 收尾 ──");
console.log(`城 Lv${L.city}  锄头 Lv${L.pick}  武器 Lv${L.wl}  宠物 ${L.pet}  进化 ${L.evolved}`);
console.log(`余额: 金币 ${L.coins}  钻石 ${L.gems}`);
console.log(`最后一帧还亮着的地贴: ${L.allvis.join(", ") || "(无)"}`);
