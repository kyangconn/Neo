# MVU 与状态栏产物

Whale Builder 现在只要求 MVU 编写与 Agentic Play 运行时真正会用到的内容。不要再生成旧式 HTML 状态栏、正则状态栏界面或未被 Whale Play 读取的辅助文件。

## 必须产出

如果项目需要动态变量，产出以下内容：

1. `mvu.schemaTs`：`schema.ts` 内容，用于描述变量结构。
2. `mvu.initvarYaml`：`initvar.yaml` 内容，用于初始化 MVU 变量。
3. `mvu.updateRulesYaml`：`变量更新规则.yaml` 内容，用于指导 AI 何时修改变量。
4. `statusBars`：Agentic Play 初始状态栏配置，用本地素材 id 渲染右侧状态栏。

最终调用 `save_character_draft` 时，把这些内容放进 `pack`：

```json
{
  "pack": {
    "character": { "...": "..." },
    "worldbook": { "entries": [] },
    "mvu": {
      "schemaTs": "export const Schema = z.object({...});\nexport type Schema = z.output<typeof Schema>;",
      "initvarYaml": "主角:\n  状态条:\n    生命:\n      value: 100\n      max: 100\n",
      "updateRulesYaml": "---\n变量更新规则:\n  主角.状态条.生命.value:\n    type: number\n    range: 0~max\n"
    },
    "statusBars": {
      "version": 1,
      "bars": [
        {
          "id": "health",
          "assetId": "health",
          "label": "生命",
          "value": 100,
          "max": 100,
          "description": "当前身体状态。"
        }
      ]
    }
  }
}
```

## 编写顺序

1. 读取 `references/mvu/status-ui-assets.md`，确定要展示的状态栏素材 id。
2. 编写 `schema.ts`，只定义当前玩法需要的变量。
3. 编写 `initvar.yaml`，初始值必须与 firstMessage 的开局状态一致。
4. 编写 `变量更新规则.yaml`，只给需要判断的变量写更新规则。
5. 编写 `statusBars`，把需要展示的初始变量映射到本地素材库。
6. 调用 `save_character_draft` 保存完整 pack。

## 变量与状态栏关系

- MVU 负责“变量是什么、如何初始化、如何更新”。
- `statusBars` 负责“哪些变量要显示在 Agentic Play 右侧状态栏”。
- Agentic Play 新会话会读取角色卡上的 `statusBars` 初始化 `gameState.player.status_bars`。
- 剧情推进后，主持人必须通过 `update_game_state` 修改 `player.status_bars`，状态会保存到 SQLite。

## 不再推荐

- 不生成状态栏 HTML/CSS。
- 不把血条、好感度、经验条写成世界书正文。
- 不强行复制旧 `assets/mvu-templates/正则/状态栏界面.html`。
- 不初始化当前玩法不会用到的状态条。

## 阶段索引

| 阶段 | 文档 | 产出 |
|------|------|------|
| 1 | `references/mvu/status-ui-assets.md` | 状态栏素材选择 |
| 2 | `references/mvu/schema.md` | `mvu.schemaTs` |
| 3 | `references/mvu/initvar.md` | `mvu.initvarYaml` |
| 4 | `references/mvu/update-rules-guide.md` | `mvu.updateRulesYaml` |
| 5 | 本文 | `pack.statusBars` |
