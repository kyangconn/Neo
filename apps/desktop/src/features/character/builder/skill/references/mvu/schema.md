# MVU schema.ts

`schema.ts` 只描述运行时变量结构。状态栏 UI 不写在 schema 里，状态栏展示由 `pack.statusBars` 和 Whale Play 本地素材库负责。

## 基本规则

- 导出 `Schema` 和 `type Schema`。
- 不 import zod/lodash；`z` 和 `_` 已全局可用。
- 数值使用 `z.coerce.number().transform((v) => _.clamp(v, min, max))`。
- 根字段不使用 `.optional()`。
- 只为当前玩法会变化、会被剧情判断、会进入状态栏或 EJS 条件的内容建模。
- 不要为了“看起来完整”建空变量树。

## 状态栏变量结构

需要展示为状态栏的变量优先放在 `主角.状态条`、`主角.成长`、`角色.${角色名}` 或 `场景` 下。状态栏推荐结构：

```typescript
const StatusBar = z.object({
  value: z.coerce.number().transform((v) => _.clamp(v, 0, 9999)),
  max: z.coerce.number().transform((v) => _.clamp(v, 1, 9999)),
  label: z.string().prefault(""),
  description: z.string().prefault(""),
  valueLabel: z.string().prefault(""),
});
```

示例：

```typescript
const StatusBar = z.object({
  value: z.coerce.number().transform((v) => _.clamp(v, 0, 9999)),
  max: z.coerce.number().transform((v) => _.clamp(v, 1, 9999)),
  label: z.string().prefault(""),
  description: z.string().prefault(""),
  valueLabel: z.string().prefault(""),
});

export const Schema = z.object({
  主角: z.object({
    状态条: z.object({
      生命: StatusBar.prefault({ value: 100, max: 100, label: "生命", description: "", valueLabel: "" }),
      魔法: StatusBar.prefault({ value: 3, max: 6, label: "法术位", description: "1环 2/4，2环 1/2", valueLabel: "3/6" }),
    }),
    法术位: z.record(
      z.string(),
      z.object({
        剩余: z.coerce.number().transform((v) => _.clamp(v, 0, 99)),
        上限: z.coerce.number().transform((v) => _.clamp(v, 0, 99)),
      }),
    ).prefault({}),
    成长: z.object({
      经验: StatusBar.prefault({ value: 0, max: 100, label: "经验", description: "", valueLabel: "" }),
    }),
  }),
  角色: z.record(
    z.string(),
    z.object({
      好感度: z.coerce.number().transform((v) => _.clamp(v, 0, 100)),
    }),
  ).prefault({}),
  场景: z.object({
    危险度: z.coerce.number().transform((v) => _.clamp(v, 0, 100)),
  }),
});

export type Schema = z.output<typeof Schema>;
```

## 法术位处理

法术位不是单一数值时，使用两层结构：

- `主角.状态条.魔法`：给 UI 显示总剩余/总上限。
- `主角.法术位.${环级}`：保存每个环级明细，供剧情判断。

这样右侧状态栏能显示一个清晰的 `mana` 条，同时 AI 仍知道每环法术位剩余多少。

## 自查清单

- [ ] `Schema` 和 `type Schema` 已导出。
- [ ] 需要展示的 HP/魔法/好感/经验等变量能映射到 `statusBars`。
- [ ] 初始值能由 `initvar.yaml` 表达。
- [ ] 更新范围能由 `变量更新规则.yaml` 表达。
- [ ] 没有 HTML/CSS/正则状态栏代码。
