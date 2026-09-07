// 确认这次阶梯改造的各处改动都还在文件里。并发会话也在改同一个文件，
// 每次实机验证前跑一遍，免得把「被覆盖」误读成「改错了」。
const h = require("fs").readFileSync("WreckItKing.html", "utf8");
const marks = [
    ["主城 Lv3 = 38", 'cost: 38, unlock: "pickaxe"'],
    ["主城 Lv2 解锁武器台", 'cost: 20, unlock: "forge"'],
    ["主城 Lv4 解锁孵化台", 'cost: 100, unlock: "hatchery"'],
    ["武器台槽位进城", "forge: { x: -5.4, z: -3.4 }"],
    ["孵化台移到外圈", "hatchery: { x: -4.2, z: -7.8 }"],
    ["weaponCost 两级", "weaponCost: [4, 6],"],
    ["武器三级 · 顶格 805", "damage: 805, reach: 0.6, splash: 3.4"],
    ["伤害查表", "return weaponTier(weaponLevel).damage + bonus"],
    ["弓要买", "function bowUnlocked()"],
    ["射箭也走 bowUnlocked", "const shooting = !mining && bowUnlocked()"],
    ["反向门", "let cityGate = null;"],
    ["放行扩建", "function releaseCityGate(id)"],
    ["钻石单轨", "function forgeWindowOpen()"],
    ["单轨对账", "function syncForgeWindow()"],
    ["龙蛋定点", "function spawnFixedEgg()"],
    ["蛋不再劫持引导", "eggPickup && hatcheryZone && hatcheryZone.group.visible"],
    ["兜底纳入武器台", "// 锻造台原先被排除在兜底之外"],
    ["矿层消耗探针", "ore: () => TIER_ORDER.reduce"]
];
let gone = 0;
for (const [label, pat] of marks) {
    const ok = h.includes(pat);
    if (!ok) gone++;
    console.log(`${ok ? "OK  " : "丢失"}  ${label}`);
}
console.log(gone ? `\n${gone} 处被覆盖了` : "\n全部在位");
