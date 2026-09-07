---
task: back-carried-coins
title: 金币背负堆叠
created: 2026-08-31
updated: 2026-09-01
status: in-progress
parent: tasks/radial-mining-reboot.spec.md
supersedes:
  - tasks/coin-cart-pickup.spec.md
related:
  - tasks/coin-auto-collect.spec.md
---

# Task: 金币背负堆叠

## 背景与动机

当前金币由跟随英雄的小矿车承载。矿车是独立实体，需要单独维护跟随、转向、车轮和碰撞规避，在新的环形开放场地里会频繁卡在矿体之间，且视觉上分散了主角焦点。

## 目标

删除矿车，改为金币直接堆叠在英雄背上。拾取时金币飞到背部堆顶，支付时从背部堆顶飞向建造格，持有量通过背上金币柱的高度直观表达。

## 变更范围

| 模块 | 代码路径 | 变更类型 | 变更概述 |
|------|----------|----------|----------|
| 矿车 | `createCoinCart` / `updateCoinCart` / `getCoinCartTargetPosition` | 删除 | 移除矿车实体、跟随与车轮动画 |
| 背负金币 | `createPlayer` / `syncCarriedCoins` | 新增 | 在英雄背部挂载金币堆容器并按持有量同步 |
| 拾取 | `updateCoins` / `startCoinFlyToCart` | 修改 | 飞行目标改为背部堆顶 |
| 支付 | `flyCoinTo` | 修改 | 支付金币从背部堆顶起飞 |
| 主循环 | `update` | 修改 | 移除矿车更新调用 |

## 视觉规格

- 金币堆挂在英雄背部靠上位置，随英雄旋转和走路轻微晃动。
- 金币逐枚向上堆叠成柱，超过可见上限后保持最高柱，HUD 继续显示真实数量。
- 金币柱使用与地面金币相同的共享几何与材质，避免新增开销。
- 抱蛋时金币堆继续显示，不与龙蛋模型穿插。
- 金币数量为 0 时隐藏整个金币堆。

## 交互规格

- 金币落地停一拍后无条件飞向背部堆顶并入账，不判距离。吸附/收取半径已废弃，详见 [coin-auto-collect](coin-auto-collect.spec.md)。
- 支付时从堆顶取下最上面一枚飞向建造格；可见金币耗尽时使用临时金币网格补位。
- 拾取与支付的音效、计数与飞行时长沿用现有配置。

## 接口变更

| 模块 | 方法/属性 | 变更 | 说明 |
|------|-----------|------|------|
| Player | `coinStack` | 新增 | 背部金币堆容器 |
| Player | `getCoinStackTop(offsetX, offsetZ)` | 新增 | 返回背部堆顶世界坐标，替代 `getCoinCartTargetPosition` |
| Coin | `startCoinFlyToBack(coin)` | 新增 | 替代 `startCoinFlyToCart` |
| Coin | `coin.state === "toBack"` | 修改 | 替代 `"toCart"` |

## 实施计划

- [ ] 删除矿车创建、更新、目标点与主循环调用
- [ ] 在英雄背部创建金币堆容器并实现按数量同步
- [ ] 拾取飞行目标改为背部堆顶
- [ ] 支付飞行起点改为背部堆顶
- [ ] 清理 `CONFIG` 中矿车相关参数

## 验收标准

- [ ] 场景中不再出现矿车。
- [ ] 拾取金币时可见金币飞到背上并逐枚堆高。
- [ ] 支付时金币从背上飞向地贴，堆高同步下降。
- [ ] 金币为 0 时背部无残留模型。
- [ ] 英雄穿过狭窄矿缝时不再有实体被卡住。
