# Spec 索引

项目：New Wreck It King（单文件 `WreckItKing.html`）

当前版本：环形矿区改版（主城居中 + 朝一个方向的分层扇形矿墙 + 主城升级解锁链 + 封印矿里的火焰巨龙结局）。

## 改版 Specs

| ID | 标题 | 状态 | 路径 |
|----|------|------|------|
| radial-mining-reboot | 环形矿区改版总纲 | in-progress | [tasks/radial-mining-reboot.spec.md](./tasks/radial-mining-reboot.spec.md) |
| back-carried-coins | 金币背负堆叠 | in-progress | [tasks/back-carried-coins.spec.md](./tasks/back-carried-coins.spec.md) |
| radial-ore-field | 朝一个方向展开的分层扇形矿墙 | in-progress | [tasks/radial-ore-field.spec.md](./tasks/radial-ore-field.spec.md) |
| deep-vein-horizon | 深层矿脉远景（看得见走不到） | in-progress | [tasks/deep-vein-horizon.spec.md](./tasks/deep-vein-horizon.spec.md) |
| city-expansion-chain | 主城升级扩张与功能解锁链 | in-progress | [tasks/city-expansion-chain.spec.md](./tasks/city-expansion-chain.spec.md) |
| pickaxe-upgrade-sweep | 锄头升级横扫低阶矿 | in-progress | [tasks/pickaxe-upgrade-sweep.spec.md](./tasks/pickaxe-upgrade-sweep.spec.md) |
| coin-auto-collect | 金币无条件自动回收 | in-progress | [tasks/coin-auto-collect.spec.md](./tasks/coin-auto-collect.spec.md) |
| dual-currency-economy | 金币 / 钻石双货币双版本（A 版已删，留作历史） | done | [tasks/dual-currency-economy.spec.md](./tasks/dual-currency-economy.spec.md) |
| mining-shard-tiers | 分品质宝石与锄头升级链 | in-progress | [tasks/mining-shard-tiers.spec.md](./tasks/mining-shard-tiers.spec.md) |
| frozen-ore-monsters | 矿内冻结野怪与分级强度 | in-progress | [tasks/frozen-ore-monsters.spec.md](./tasks/frozen-ore-monsters.spec.md) |
| corridor-rovers | 矿层走廊巡游杂兵 | in-progress | [tasks/corridor-rovers.spec.md](./tasks/corridor-rovers.spec.md) |
| arpg-combat-overhaul | ARPG 战斗深度与钻石武器线（回滚开关 `?arpg=0`） | in-progress | [tasks/arpg-combat-overhaul.spec.md](./tasks/arpg-combat-overhaul.spec.md) |
| bow-weapon-line | 武器线改成弓箭：打矿举镐/打怪举弓、分级箭矢特效、中程 6.2 米 | done | [tasks/bow-weapon-line.spec.md](./tasks/bow-weapon-line.spec.md) |
| pet-hatch-evolution | 龙蛋孵化与宠物进化 | in-progress | [tasks/pet-hatch-evolution.spec.md](./tasks/pet-hatch-evolution.spec.md) |
| flame-dragon-finale | 火焰巨龙出场演出与下载结算 | in-progress | [tasks/flame-dragon-finale.spec.md](./tasks/flame-dragon-finale.spec.md) |
| sealed-vein-offering | 封印献祭：金币的终点站与玩家亲手破封 | in-progress | [tasks/sealed-vein-offering.spec.md](./tasks/sealed-vein-offering.spec.md) |
| progression-ladder-rework | 推进阶梯重排：武器台进城、城与武器/锄头严格交替、钻石单轨、龙蛋定点 | done（低级矿消耗率一条未达标，见该文第 8.1 节） | [tasks/progression-ladder-rework.spec.md](./tasks/progression-ladder-rework.spec.md) |
| power-spike-tuning | 战力台阶调参：镐头改近战、守卫血量重排、小龙补强 | done | [tasks/power-spike-tuning.spec.md](./tasks/power-spike-tuning.spec.md) |

## 调参入口

三条路，同一份数据：改源码、开游戏内面板、或在控制台上 `__wik.tune()`。函数体内不再留裸字面量，所有可调数值都收在 `WreckItKing.html` 顶部的几张表里。

### 游戏内调参面板

左下角「调参」按钮，或按 `` ` `` 键。面板直接读写下面这几张表本身，不维护副本。

- **即时生效**：拖滑块当帧就算数，不用重载。
- **重载类字段**带「需重载」标记（环半径、格数、守卫血量这些是建场时烘进几何和对象的）。改动会存进 `localStorage`，并在 `createArena()` 之前重新注入，所以重载不丢。
- **保存到文件**把改动写进 `WreckItKing.html` 的源码，写完自动重载——重载后计数器显示「全是默认值」，因为那些值现在就是默认值了。需要本地服务器（`npm start`）提供 `/__save` 端点；部署出去的版本上没有这个端点，按钮会自动退回导出。
- **导出改动**只吐改过的项（`路径: 原值 → 新值`）。导出整份配置贴回去会把注释和没动过的字段一起冲掉。
- **回默认值**清空覆盖，回到文件里写死的那份。

覆盖存在浏览器的 `localStorage` 里，只对当前域名有效：换台机器、换浏览器、或者访问部署出去的版本都看不到。要让改动对所有人生效，必须走「保存到文件」（或导出后手动改源码），然后重新部署。

面板字段表是 `TUNING_SCHEMA`，只挑了值得边玩边拖的项——矿石颜色、守卫前摇这类要盯着画面反复试的，滑块帮不上忙，没放进去。

### 表本身

| 表 | 管什么 | 改完何时生效 |
|----|--------|--------------|
| `CONFIG` | 移动、攻击/挖矿间隔与射程、金币飞行、开局金币、地贴付款速度、竞技场半径 | 立即 |
| `BALANCE` | 玩家伤害公式、宠物两形态、横扫赏金、金币抛射手感（含影子金币比例） | 立即 |
| `ORE_TIERS` | 每层矿的 `hardness`、`cellsPerCoin`、`shardYield`、守卫属性（含 `chaseRadius` 追多远放弃 / `reengageRadius` 多近会醒）、环半径与格数 | 挖矿/掉落立即；几何、预埋宝石与守卫血量要重载 |
| `CITY_STAGES` | 主城四级的价格与解锁项 | 下一块地贴亮起时 |
| `PICKAXE_LEVELS` | 每级锄头的 `power`（每挥凿几格）与 HUD 战力 | 立即 |
| `SHARD_GRADES` | 三档宝石的名字、颜色、体积 | 重载 |
| `DEEP_VEINS` | 封印矿之外那四层「只给看」的远景：半径、高度、张角、配色、剪影体型 | 重载 |
| `ECONOMY_PRESETS` | 锄头 / 孵化 / 进化 / 武器 / 封印献祭的价格、货币归属、守卫钻石掉落、守卫堵路、顺序锁 | 重载 |
| `ROVER_LANES` | 三条矿层走廊里巡游杂兵的血量、掉金币、伤害、体型 | 掉落与伤害立即；血量和体型要重载 |
| `ROVER_RANGE` / `ROVER_PATROLS` | 巡游杂兵多近才扑上来 / 追多远放弃 / **扑上来时的速度倍率** / **追出走廊多远放弃**；两只怪离主路多远、巡逻多长（按米，除以走廊半径才换成角度） | 追击那几根立即；巡逻布局要重载 |
| `GUARD_CHASE` | 守卫激怒后的**速度倍率**、**主城外沿禁区**（怪一律不得进城）。追多远放弃 / 多近会醒在 `ORE_TIERS[].monster` 里，两个数必须拉开才有滞回 | 立即 |
| `WEAPON_LEVELS` | 钻石武器三级的伤害、攻击距离**增减**（Lv1 是负的：镐头是近战，弓才把距离拉回中程）、溅射半径与伤害比例、HUD 战力 | 立即 |
| `ARPG` | 受击硬直、完美闪避窗口与破绽、时间微顿、狂暴换档、武器线的守卫钻石增量 | 立即 |

价格只在 `ECONOMY_PRESETS`（锄头 / 孵化台 / 进化 / 武器 / 封印献祭）和 `CITY_STAGES`（主城四级）两处，别的地方没有第二份。锄头的最高等级不写死，等于 `ECON.pickaxeCost.length + 1`——现在是三档宝石价、封顶 4 级。

> **2026-09-07：纯金币版已删除。** `ECONOMY_PRESETS` 里只剩 `gem` 一份，`ECON` 是指向它的常量，`?econ=` 参数不再有任何作用（老链接会静默落到唯一那版）。表的两层形状留着没拍平：调参面板的字段路径和 `/__save` 的写回定位都写成 `ECONOMY_PRESETS.gem.xxx`，拍平要连着改三处。

### URL 参数

| 参数 | 作用 |
|------|------|
| `?tune` | 显出左下角的调参按钮。不带这个参数时按钮是隐藏的 |
| `?arpg=0` | 关掉整套 ARPG 战斗改造与钻石武器线，回落到改造前的伤害公式与守卫钻石掉落。**这是武器线和战斗深度唯一的回滚开关**，不需要动文件；细节见 `arpg-combat-overhaul.spec.md` |
| ~~`?econ=`~~ | 已失效，见上面那条注 |

### 本地服务器

`npm start` 起 `server.js`（默认 9310）。除了发静态文件，它比 `npx serve` 多两件事：

- `POST /__save` 按路径定位到源码里那一个数字、只换它，改前留一份 `WreckItKing.html.bak`，改后回读校验。表里那些解释「为什么是这个数」的注释比数值本身难重建，所以不整份重写。定位必须钻到具体那一层——`cellsPerCoin`、`hardness`、`hp`、`knockback` 这些键在四层矿里各有一份，全局替换会改错层。
  - **只认本机请求**（`127.0.0.1` / `::1`），别处一律 403。服务器绑的是 `0.0.0.0`，同事要能从内网点链接进来玩；没有这道闸，任何能访问到这个端口的人打开调参面板拖两下、点「保存到文件」就把源码改了。
- 不带扩展名的路径直接发文件、不发 302。`serve` 会把 `/WreckItKing.html?tune` 重定向成 `/WreckItKing` 并把查询串一起丢掉。

### 分享给同事

内网直链 `http://<你的内网 IP>:9310/WreckItKing`。要求同网段、你的机器开着且服务在跑、防火墙放行 Node 入站。调参入口整个挂在 `?tune` 上——不带这个参数时左下角那个按钮是隐藏的，免得把一条他们不该有的路摆在眼前。

### 量节奏：别只用 `__wik.marks()`

`__wik.auto(true)` 开自动机，`__wik.sim(秒)` 手动步进（标签页失焦时 rAF 会被节流，实测节奏必须脱离墙钟）。

坑在 `marks()` 上：它背后的 `markRun` 全局只有五个触发点——地贴完成、破封、孵化、终局、CTA。**打死守卫不算事件，横扫炸出六十个金币不算事件，金币连续进账不算事件。** 拿它算「最长空档」会稳定虚报约 7 秒，而且虚报的正好是战斗和挖矿密集的那些段，据此调价格会调错地方（主城 Lv2 和 Lv3 那两条「空窗」就是这么误报出来的，见 `mining-shard-tiers.spec.md` 末尾）。

补法是每 0.25 秒采一次 `__wik.state()`，从数值变化反推事件，不用改游戏文件（战斗线常年在改 `killEnemy` 一带，加 `markRun` 容易撞车）：`enemies` 变小是击杀，`drops` 单步涨 ≥ 20 是横扫引爆，`carryingEgg` 由假变真是捡蛋。把这些和 `marks()` 并进一条时间线再算间隔。

### 量战斗数值：`__wik.duel()`

`__wik.duel("high", { weapon: 3, pet: "evo" })` 指定战力打一只满血守卫，返回击杀耗时、DPS、掉血、挨打次数。

**不要拿完整自动局的数据调伤害。** 同一档的实测 eDPS 会从 567 飘到 3725，飘的全是交战质量（有没有在躲、被击退推出去几次、路上跑了多久），不是战力——在那种噪音里调数值等于瞎调。`duel` 把变量锁死：守卫复位成满血、玩家只做「够不着就走过去，够得着就站定」，同一组数值跑三遍结果一致。

它测的是**输出上限**，不是真实体感（它不躲也不风筝）。真实体感照旧由完整自动局给，两个数一起看才有意义。

## 继续复用的 Specs

| ID | 标题 | 状态 | 路径 |
|----|------|------|------|
| layout-editor | 建筑格可视化布局编辑模式 | completed | [tasks/layout-editor.spec.md](./tasks/layout-editor.spec.md) |
| furniture-layout-editor | 建筑编辑器家具位置调整 | completed | [tasks/furniture-layout-editor.spec.md](./tasks/furniture-layout-editor.spec.md) |
| camp-build-fx | 营地建筑出现 / 升级特效 | completed | [tasks/camp-build-fx.spec.md](./tasks/camp-build-fx.spec.md) |
| camp-ground-build-zone | 全流程地面建造与升级格 | completed | [tasks/camp-ground-build-zone.spec.md](./tasks/camp-ground-build-zone.spec.md) |
| mine-monster-silhouette | 三类矿墙怪物剪影预示系统 | completed | [tasks/mine-monster-silhouette.spec.md](./tasks/mine-monster-silhouette.spec.md) |
| monster-chase-leash | 三类怪物追击范围与返回原位 | completed | [tasks/monster-chase-leash.spec.md](./tasks/monster-chase-leash.spec.md) |
| accessible-translation-camera | 无晕动固定平移跟随镜头 | ready | [tasks/accessible-translation-camera.spec.md](./tasks/accessible-translation-camera.spec.md) |

## 已被改版取代的 Specs

保留作为历史记录，实现已被环形矿区改版覆盖。

| ID | 标题 | 取代者 |
|----|------|--------|
| base-excavation | 基地掘进与前线房间推进 | city-expansion-chain |
| opening-guidance | 开局前进与自动挖矿引导强化 | city-expansion-chain |
| coin-cart-pickup | 金币自动拾取与跟随矿车 | back-carried-coins |
| mine-layout-editor | 矿体可视化编辑模式 | radial-ore-field |
| sequence-break-mining | 逃课挖穿路线 | radial-ore-field |
| first-golem-combat | 第一只石怪挖矿阻断战 | frozen-ore-monsters |
| second-golem-combat | 强化石怪扇形击飞 | frozen-ore-monsters |
