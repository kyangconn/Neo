# 状态栏素材库

Whale Play 内置状态栏素材库用于 Agentic Play 右侧动态状态栏。Builder 不生成 HTML/CSS，只生成结构化 `statusBars` 产物。

## 产物链路

1. Builder 在 `save_character_draft` 的 `pack.statusBars` 中保存状态栏配置。
2. 保存角色时，`statusBars` 写入角色卡数据。
3. 导出文件夹时，`statusBars` 写入 `agentic/status-bars.json`。
4. Agentic Play 新会话读取角色卡 `statusBars`，初始化 `gameState.player.status_bars`。
5. 剧情推进后，`update_game_state` 修改状态；状态记录保存到 SQLite。

## 可用素材 id

| assetId | 显示用途 | 推荐变量来源 |
|---------|----------|--------------|
| `health` | 生命/血量/伤势 | `主角.状态条.生命` |
| `mana` | 魔法/灵力/法术位/咒力 | `主角.状态条.魔法` |
| `stamina` | 耐力/行动力/体力消耗 | `主角.状态条.耐力` |
| `affection` | 好感/信任/羁绊 | `角色.${角色名}.好感度` |
| `experience` | 经验/等级进度/熟练度 | `主角.成长.经验` |
| `sanity` | 理智/精神稳定/污染抗性 | `主角.状态条.理智` |
| `danger` | 危险度/警戒度/危机进度 | `场景.危险度` |

机器可读清单：`assets/status-ui-library.json`。

## pack.statusBars 格式

```json
{
  "version": 1,
  "source": "whale-builder",
  "bars": [
    {
      "id": "health",
      "assetId": "health",
      "label": "生命",
      "value": 100,
      "max": 100,
      "min": 0,
      "description": "当前身体状态。",
      "valueLabel": "100/100",
      "visible": true,
      "mvuPath": "主角.状态条.生命"
    }
  ]
}
```

字段说明：

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 稳定 id。通用条可直接用 `health`；角色专属条可用 `luna_affection` |
| `assetId` | 是 | 本地素材 id，决定 UI 风格和识别方式 |
| `label` | 是 | UI 显示名，如“生命”“法术位”“露娜好感” |
| `value` | 是 | 初始值；未知可写 `null` |
| `max` | 是 | 上限，必须大于 0 |
| `min` | 否 | 下限，默认 0 |
| `description` | 否 | 鼠标提示/辅助说明 |
| `valueLabel` | 否 | 复杂资源显示文字，如 `3/6` |
| `visible` | 否 | 是否显示，默认 true |
| `mvuPath` | 否 | 对应 MVU 变量路径，便于维护 |

## 常用写法

### RPG

```json
{
  "version": 1,
  "bars": [
    { "id": "health", "assetId": "health", "label": "生命", "value": 92, "max": 100, "mvuPath": "主角.状态条.生命" },
    { "id": "mana", "assetId": "mana", "label": "法术位", "value": 3, "max": 6, "valueLabel": "3/6", "description": "1环 2/4，2环 1/2", "mvuPath": "主角.状态条.魔法" },
    { "id": "experience", "assetId": "experience", "label": "经验", "value": 15, "max": 100, "mvuPath": "主角.成长.经验" }
  ]
}
```

法术位明细放在 MVU：

```yaml
主角:
  法术位:
    1环: { 剩余: 2, 上限: 4 }
    2环: { 剩余: 1, 上限: 2 }
```

`mana` 状态栏只显示总剩余/总上限。

### 恋爱/羁绊

```json
{
  "version": 1,
  "bars": [
    { "id": "luna_affection", "assetId": "affection", "label": "露娜好感", "value": 35, "max": 100, "mvuPath": "角色.露娜.好感度" }
  ]
}
```

## Agentic Play 更新写法

状态变化必须通过 `update_game_state` 修改：

```json
{
  "state_patch": {
    "player": {
      "status_bars": {
        "mana": {
          "id": "mana",
          "assetId": "mana",
          "value": 2,
          "max": 6,
          "label": "法术位",
          "description": "1环 1/4，2环 1/2",
          "valueLabel": "2/6"
        }
      }
    }
  },
  "reason": "玩家施放一个 1 环法术。"
}
```

## 约束

- 不要写 HTML/CSS 状态栏。
- 不要把状态栏数据写进世界书正文。
- 不要初始化所有素材 id，只写当前玩法真正会用到的条。
- `initvar.yaml`、`变量更新规则.yaml`、`statusBars` 三者初始值必须一致。
