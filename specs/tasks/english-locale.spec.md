---
task: english-locale
title: 英文版：只换文案，玩法与数值逐位不动
created: 2026-09-08
updated: 2026-09-08
status: done
related:
  - tasks/radial-mining-reboot.spec.md
  - tasks/arpg-combat-overhaul.spec.md
---

# Task: 英文版本地化

> 2026-09-11 用户最新要求：ABC 只需要中文版，后续不再维护或回归英文版。本文件保留为历史记录，英文验收要求不再适用。

## 需求（用户原话，2026-09-08）

> 把这版翻译出一个英文版，只改变文本，游戏玩法、数值和现在完全保持一致
>
> 也把英文版部署到 github pages

第二句决定了交付形态：英文版要有一个能直接打开的线上地址。

## 形态：同一个文件 + `?lang=en`，不复制第二份

摆在面前的是两条路：复制出 `WreckItKing_EN.html`，或者在同一份文件里挂语言开关。

选后者，理由只有一条但足够重：**这个文件每天都在改**。复制一份的成本不在复制那一刻，
在之后每一次改数值——`power-spike-tuning` 那一轮动了守卫血量、`sealed-vein-offering` 那一轮
挪了三张地贴，任何一次忘了同步，两份文件就永久分叉，而分叉的表现是「英文版玩起来不一样」，
恰好违背这次需求的前半句。同一份文件跑两种语言，分叉在结构上不可能发生。

代价是英文版地址带一个查询串（`?lang=en`）。目前的分发渠道就是 Pages 链接，这个代价是零。
真正要付代价的场景是投给广告平台——有些平台按单文件收、且不带查询串，那时需要一个
standalone 的 EN 文件。**那一步没有做**，因为现在还不存在这个需求；真要做，是把 `LANG` 的
兜底从 `"zh"` 改成 `"en"` 另存一份，一行的事，见下面「没有做的事」。

## 查表：key 用中文原文

```js
const LANG = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "zh";
const EN = { "低级矿": "Low-Grade Ore", ... };
function t(text, params) {
    let out = LANG === "en" && EN[text] !== undefined ? EN[text] : text;
    if (params) for (const key in params) out = out.split(`{${key}}`).join(params[key]);
    return out;
}
```

没有另造 `UI_ORE_LOW` 这类 id，直接用中文原文当 key。三个好处：

1. call site 读起来还是一句人话，`toast("封印松动了，凿开它")` 不用跳到别处查它是什么意思。
2. 漏翻的那一条会**原样显示中文**，实机上一眼就看得见；用 id 的话漏翻显示的是 `ui.seal.loose`，
   看起来像个 bug 而不像漏翻。
3. 中文版这条路上 `t()` 直接返回入参，等于没有这一层。

## 接线：在出口查表，而不是在每个 call site

关键取舍。玩家可见文案有 54 条会流到界面上，如果每处都改成 `t("...")`，就是 54 处改动，
每一处都是一次手滑的机会。改法是只在**出口**查表：

| 出口 | 改动 |
|---|---|
| `toast(text)` | `ui.toast.textContent = t(text)` |
| `setTutorial(visible, copy)` | `ui.tutorialCopy.textContent = t(copy)` |
| `showDamage(pos, text, ...)` | `element.textContent = t(text)`（伤害数字查不到、原样通过） |
| `ORE_TIERS[].name` / `SHARD_GRADES[].name` | 定义处 `name: t("低级矿")`，之后 `tier.name` 处处都已是英文 |
| HTML 写死的那几句 | `localizeMarkup()`，只在 `LANG === "en"` 时改写 |

于是绝大多数 call site 一个字都没动，包括 `unlockCopy()` / `zoneBlockedCopy()` 这两个
「返回一句中文、由调用方丢给 toast」的函数——它们的返回值经过 `toast` 出口，自动就翻了。

在数据表定义处翻 `name` 之前先确认过它不是逻辑键：`tier.name` 全部十处都是拼进句子的，
没有任何地方拿它做比较。`TILE_DEFS[].name`、`CITY_STAGES[].label`、`ECONOMY_PRESETS[].label`
则根本没有玩家可见的用途（地贴只画图标和价格，label 只有调参面板读），所以没翻。

## 插值句：占位符，不能靠拼接

22 处句子带 `${}`。这些**必须**改 call site，因为中英词序不同：

```
锄头升级，现在能凿开{ore}了
Pickaxe upgraded — you can break {ore} now
```

`{ore}` 在中文里居中、在英文里结尾，靠「前缀 + tier.name + 后缀」拼是拼不出来的。
所以 key 里写占位符，中英两版各自决定它落在哪儿：

```js
toast(t("锄头升级，现在能凿开{ore}了", { ore: tier.name }));
```

这类句子在 call site 就已经拼成英文了，到 `toast` 出口再查一次表查不到、原样通过——
重复查是无害的，换来的是出口那一行不用区分「已翻」和「未翻」两种入参。

## 不翻的：调参面板

面板的 162 条字段标签、7 条运行时提示（「已写入源文件 N 项」这些）全部保持中文。
它是开发工具，挂在 `?tune` 上，不跟玩家语言走。校验脚本会把这 7 条报成「漏翻」，
是预期的。

## 三种货币在英文里必须是三个词

代码里的命名是历史遗留且反直觉的：`gem` 指**钻石**、`shard` 指**宝石**。中文界面靠
「钻石 / 宝石」两个词分开，英文如果都译成 gem，玩家就分不清哪个进哪个账。定为：

| 代码 | 中文 | 英文 | 来源 → 去向 |
|---|---|---|---|
| `coin` | 金币 | Gold | 挖矿 → 主城、封印献祭 |
| `shard` | 宝石 | Gem（Rough / Fine / Radiant） | 矿里预埋 → 锄头 Lv2/3/4 |
| `gem` | 钻石 | Diamond | 守卫掉落 → 孵化、进化、武器 |

## 验收：怎么证明「数值完全一致」

跑完整局对比时间线**不足以**证明——自动局本身有随机波动。实测两次中文局的 CTA
落在 115.9 和 124.4 秒，差 8.5 秒，比任何真实回归都大。拿这种数据下结论会同时
误报和漏报。

改用**确定性指纹**：矿场几何是种子生成的，配置表是静态的，两版应当逐位相同。

```js
// 把 __wik.tune() 递归摊平成 340 个 path=value，加上 __wik.band() 和 __wik.tiles()，算 hash
```

| 版本 | 数值字段 | 指纹 | 矿带几何 |
|---|---|---|---|
| 中文 | 340 | `-1604875490` | low 246 格 / mid 359 / high 744 / sealed 469 |
| 英文 | 340 | `-1604875490` | 同上，逐字相同 |

指纹相同，就排除了「翻译顺手碰到了某个数」这一整类风险，而这是随机跑局永远证不了的。

其余四项验证：

| 验证 | 方法 | 结果 |
|---|---|---|
| 英文版能跑完整局 | `__wik.auto(true)` + 分片 `sim`，共 320 秒 | 走到 CTA，115.8 秒 |
| 全程文案确实是英文 | `MutationObserver` 挂 `#toast` 和 `#damage-layer`，收集整局 | 11 条提示 + `FRENZY` 全英文，零中文泄漏 |
| 中文版没被弄坏 | 同上，跑中文 | 10 条提示 + 「狂暴」「完美闪避」全中文 |
| 占位符没写歪 | 静态对账：每条 key 和译文的 `{...}` 集合必须相等 | 0 处不匹配 |

最后一项值得单独说：译文里把 `{ore}` 写成 `{one}` 的话，屏幕上会直接露出 `{ore}` 三个字符，
而它只在那一句话真的弹出来时才看得见。静态查一遍比等实机撞上便宜太多。

> **坑**：`MutationObserver` 的回调是微任务，而 `__wik.sim(320)` 是一次同步跑完的，
> 所以直接在同一个同步块里读收集数组只会拿到空数组。必须分片跑（`sim(8)` × 40），
> 片间 `await new Promise(r => setTimeout(r, 0))` 让事件循环有机会 flush。

## 接口变更

| 位置 | 变更 |
|---|---|
| `LANG` / `EN` / `t()` | 新增，紧跟 `"use strict"`——必须早于 `ORE_TIERS` 等数据表定义 |
| `?lang=en` | 新增 URL 参数；其余值（含不带）一律中文 |
| `localizeMarkup()` | 新增，`cacheUi()` 末尾调用；只在英文时改写 HTML 里写死的 8 处文案 + `<html lang>` + `document.title` |
| `toast()` / `setTutorial()` / `showDamage()` | 出口加 `t()` |
| `ORE_TIERS[].name` / `SHARD_GRADES[].name` | 定义处包 `t()` |
| 22 处插值句 | 模板字面量改成 `t(key, params)` |

## 没有做的事

- **standalone 的 EN 单文件**。要做就是把 `LANG` 兜底改成 `"en"` 另存一份，但那会重新引入
  分叉风险，所以等到真有平台要求单文件时再做，并且应该由脚本生成而不是手工另存。
- **按 `navigator.language` 自动切换**。刻意没做：需求写的是「翻译出一个英文版」，不是
  「让浏览器决定」。自动切会让中文用户在某些环境下打开变成英文，是个不可预期的行为。
- **调参面板英文化**。开发工具，见上。

## 验收

- [x] `?lang=en` 全程英文，界面、提示、飘字、结算页无中文泄漏
- [x] 不带参数时与改动前完全一致（中文提示、中文飘字、中文结算页）
- [x] 数值指纹两版逐位相同（340 字段 + 矿带几何）
- [x] 英文版能自动跑到 CTA
- [x] 占位符集合对账 0 处不匹配
- [x] 调参面板保持中文（开发工具，按设计不翻）
