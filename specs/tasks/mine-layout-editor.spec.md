---
task: mine-layout-editor
title: 矿体可视化编辑模式（Phase 1）
created: 2026-08-28
updated: 2026-08-28
status: completed
parent: kit_implementation_plan.md
related:
  - tasks/layout-editor.spec.md
  - tasks/furniture-layout-editor.spec.md
  - tasks/base-excavation.spec.md
---

# Task: 矿体可视化编辑模式（Phase 1）

## 背景与动机

矿体尺寸、方块格数和位置目前硬编码在 `createLinearMineGates()` / `createMineGate()` 中，调整纵深、高度或格数需要反复改代码并截图对齐。需要在现有 `?editor=1` 编辑器中增加矿体 Tab，支持数值编辑、侧视预览，并叠加显示营房范围与建造格阶段参照。

## 目标

Phase 1 落地：

1. 抽取 `MINE_DEFAULTS`，普通游戏与编辑器统一读取配置。
2. 在布局编辑器增加「矿体」Tab，支持数值编辑 + 侧视线框预览。
3. 编辑矿体时叠加只读建筑参照层（营房范围 + 建造格 + 阶段配色）。
4. LocalStorage 保存 / 恢复 / 复制 JSON。
5. 基础校验：矿段衔接、出生点范围、与营房距离提示。

**不在 Phase 1 范围**：拖拽手柄、Boss 战场装饰缩放预览、锁定金币分布预览。

## 设计决策

| 项 | 决策 |
|----|------|
| 格数 vs 尺寸 | 改 `columns/rows/layers` 时保持 cell 尺寸不变，外框 `width/height/depth` 随之变化 |
| 直接改外框尺寸 | 重算 cell 尺寸（`cell = 外框 / 格数`） |
| 首矿宽度 | 默认自动（`corridorHalfWidth(centerZ) * 2 + 1`），可手动锁定 |
| 存储 | `wreck-it-king-mine-layout-v1`，与 zones/furniture 一并复制 |

## 变更范围

### 受影响模块

| 模块 | 代码路径 | 变更类型 | 变更概述 |
|------|----------|----------|----------|
| 矿体配置 | `WreckItKing.html` `MINE_DEFAULTS` | 新增 | 4 段矿体默认参数 |
| 矿体创建 | `createMineGate` / `createLinearMineGates` | 重构 | 从配置读取尺寸与格数 |
| 布局编辑器 | `initLayoutEditor` 及 UI | 扩展 | Tab 切换、矿体面板、侧视镜头 |
| 矿体预览 | 编辑器专用函数 | 新增 | 线框 + 半透明方块网格 |
| 建筑参照 | 编辑器专用函数 | 新增 | 营房矩形 + 建造格阶段标记 |
| 本地保存 | `saveLayoutConfig` 等 | 扩展 | 含 mines 字段 |

### 新增配置

```javascript
MINE_DEFAULTS = {
  "mine-start":  { centerZ, width|null, widthLocked, height, depth, columns, rows, layers, cellW/H/D, lockedCoins, rewardBundles, active },
  "mine-golem":  { ..., spawnZ, arenaMinZ, arenaMaxZ, arenaHalfWidth },
  "mine-strong": { ..., spawnZ, arenaMinZ, arenaMaxZ, arenaHalfWidth },
  "mine-boss":   { ..., spawnZ }
}
```

## 编辑器交互规格

### Tab

- `建筑格 | 家具 | 矿体`，与现有编辑器共用面板框架。
- 矿体 Tab：侧视 (Z-Y) 镜头；建筑格/家具 Tab：保持现有俯视。

### 矿体列表面板

选中矿体后显示：

- centerZ、width（首矿显示自动/锁定）、height、depth
- columns、rows、layers、方块总数（只读）
- spawnZ（石怪/Boss 矿）
- cell 尺寸（只读，W × H × D）

### 建筑参照 Toggle

- ☑ 显示建筑参照
  - ☑ 营房范围（Room 1 / Room 2）
  - ☑ 建造格 + 阶段标签

阶段配色：`camp` 绿、`weapon` 蓝、`expand` 橙、`nest` 紫、`dragon` 青。

### 校验提示

- 相邻矿体 Z 衔接偏差 > 0.2 → 警告
- spawnZ 超出矿体后 40% 区域 → 警告
- 显示「首矿后缘 → 前进基地前缘」距离及缓冲建议

## 实施计划

- [x] 抽取 `MINE_DEFAULTS`，实现 `loadMineConfig` / `resolveMineDimensions`
- [x] 重构 `createMineGate` / `createLinearMineGates`
- [x] 编辑器 Tab + 矿体数值面板
- [x] 侧视矿体线框预览 + 方块网格
- [x] 营房/建造格只读参照层
- [x] 保存 / 恢复 / 复制 JSON（含 mines）
- [x] 基础校验与距离提示
- [ ] 验证普通游戏全流程与编辑模式不互相干扰

## 验收标准

- [ ] `?editor=1` 矿体 Tab 可选中 4 段矿体并修改数值
- [ ] 改格数时 cell 不变、外框变；改外框时 cell 重算
- [ ] 首矿宽度默认自动，可手动锁定
- [ ] 矿体 Tab 侧视可见线框预览与建筑参照
- [ ] 保存后普通游戏使用新矿体配置
- [ ] 复制 JSON 含 `{ zones, furniture, mines }`
- [ ] 衔接/出生点/缓冲距离有校验提示
- [ ] 编辑模式不触发挖矿、扣币或阶段推进

## 风险与注意事项

- 改矿体纵深会影响石怪 arena 与世界边界，配置中 arena 字段需与 mine-golem / mine-strong 同步。
- 编辑器预览 mesh 与真实 `createMineGate` 分离，避免编辑时触发碰撞/打击逻辑。
- 首矿 auto width 随 centerZ 变化时需同步 cellWidth 或给出提示。
