# MVU initvar.yaml

`initvar.yaml` 写变量初始值，必须与 `schema.ts` 的结构和 firstMessage 的开局状态一致。

## 基本规则

- 只写 YAML 数据，不写 TypeScript、HTML、CSS 或说明性正文。
- 初始值必须能通过 `schema.ts` 校验。
- 不初始化当前玩法不会用到的状态。
- 使用状态栏素材时，初始值仍然只写变量；状态栏展示另写 `pack.statusBars`。

## 示例

```yaml
主角:
  状态条:
    生命:
      value: 100
      max: 100
      label: 生命
      description: 状态良好
      valueLabel: ""
    魔法:
      value: 3
      max: 6
      label: 法术位
      description: 1环 2/4，2环 1/2
      valueLabel: 3/6
  法术位:
    1环:
      剩余: 2
      上限: 4
    2环:
      剩余: 1
      上限: 2
  成长:
    经验:
      value: 0
      max: 100
      label: 经验
      description: 尚未获得经验
      valueLabel: ""
角色:
  露娜:
    好感度: 35
场景:
  危险度: 10
```

## 与 statusBars 对齐

如果 `statusBars` 中有：

```json
{ "id": "mana", "assetId": "mana", "label": "法术位", "value": 3, "max": 6 }
```

则 `initvar.yaml` 中应存在对应的初始变量，例如 `主角.状态条.魔法.value = 3`、`max = 6`。两边的初始值必须一致。

## 自查清单

- [ ] YAML 层级与 `schema.ts` 一致。
- [ ] firstMessage 开局状态与初始变量一致。
- [ ] `statusBars` 中展示的每个条目都能在 initvar 中找到来源。
- [ ] 没有繁体字、日文汉字、HTML/CSS。
