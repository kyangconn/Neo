---
name: whaleplay-character-builder
description: "创建、编辑、评估 WhalePlay 角色卡和世界书（角色信息、世界观、NPC、场景、事件、文风、MVU 变量、EJS 方案等）。覆盖角色卡内嵌世界书和独立世界书，支持从零创作和从现有材料转化。确保在以下情况也使用此 skill：用户提到'角色设定'、'人设卡'、'worldlore'、'character card'、'角色卡'、'酒馆世界书'、'WhalePlay'、'世界书条目'、'世界书配置'、'蓝灯'、'绿灯'、'角色条目'、'世界观设定'、'NPC设定'等关键词时，即使用户没有明确说'世界书'也应触发。当用户要编写角色基础信息、性格调色盘、三面性、二次解释、多阶段调色盘、世界观、文风指导等创作流程时也应触发。当用户提到'MVU'、'变量系统'、'schema.ts'、'变量更新'、'initvar'、'变量结构'、'tavern-cards-forge'等关键词时也应触发。"
---

# WhalePlay 角色卡与世界书编写

帮助用户创建 Whale Play 原生角色卡与可绑定世界书。这个 skill 复刻 tavern-cards 的分层能力：先用 SKILL.md 路由，再按阶段读取 references/ 下的规则；区别是所有产出都落在 Whale Builder 的草稿、世界书条目和本地创作记录里，不写外部工程文件。

## 术语说明

"角色卡"在 Whale Builder 中指 Whale Play 不是"一张卡 = 一个角色"的意思。一个角色卡项目可以包含多个角色、NPC、世界观等完整内容，最终打包为一个角色卡文件。本文档中"角色卡"均指打包格式，不暗示角色数量。


## 用户占位约定

`{{user}}` 或 `<user>` 是 WhalePlay 提供的宏，在运行时自动替换为玩家角色的名称。在条目内容中可使用此宏来表示玩家角色，无需关心具体名称。

## 场景路由

判断三个维度，组合决定流程：

1. 任务阶段：创建 / 修改草稿 / 评估
2. 创建来源：（仅创建阶段）：从零 / 从材料转化 / 联网资料辅助
3. 任务范围：完整角色卡 / 局部字段 

| 组合 | 流程 |
|------|------|
| 创建 + 从零 + 完整项目 | 需求对齐：项目属性 → 项目创建(init) → 需求对齐：世界/角色/条目 → 条目创作 |
| 创建 + 从材料 + 完整项目 | 转化标注（`references/conversion.md`）→ 需求对齐：项目属性 → 项目创建(init) → 需求对齐：世界/角色/条目 → 条目创作 |
| 创建 + 局部任务 | 直接定位创作规则文档，不走项目流程 |
| 修改 + 局部任务 | 定位条目 → 加载创作规则文档 |
| 修改 + 完整项目 | 断点续接（`references/resume.md`） → 检测进度后回到完整项目流程对应步骤继续 |
| 评估 | 评估流程：分析结构、检查配置、抽查写作质量，生成评估报告 |

## 完整项目流程

1. **需求对齐：项目属性**：收集项目属性（名称、形式、MVU、typeLists 调整等）→ `references/requirements.md`
   - 从材料转化时先执行 → `references/conversion.md`
2. **项目创建**：`node scripts/tavern-cards-forge.mjs init {project}` → `references/project-setup.md`
3. **需求对齐：世界/角色/条目**：收集世界信息、角色信息、条目规划、写作风格，产出编写规划文档 `创作规划.yaml`（项目目录下）→ `references/requirements.md`
4. **创建条目**：按创作规划依次编写，每条写完立即注册（禁词扫描 + DoubleCheck）→ `references/composition.md`
5. **编写 MVU 变量**（如需）→ `references/mvu/guide.md`，完成后按收尾步骤复制模板、应用 patch、校验
6. **创建 EJS预处理 条目 + EJS 收尾检查**（如需 EJS）→ `references/ejs/guide.md`
    - 以上两步完成后 → **MVU 一致性检查**，见 `references/mvu/guide.md` 收尾步骤第 4 步
7. **运行 configure**：`node scripts/tavern-cards-forge.mjs configure {project}`，自动推导运行时字段 → `references/configuration.md`（仅特殊需求时读取）
8. **编写开场白**（角色卡）→ `references/contents-creation/first-message.md`
9. **打包输出**：`node scripts/tavern-cards-forge.mjs pack {project}`

## 状态文件

每个项目在根目录维护 `tavern-cards-state.json`，记录项目属性和条目清单。完整字段定义见 `references/type/state.ts`。


## 工具参考

- list_skill_references：列出内置 reference 索引
- read_skill_reference：读取指定 reference
- ask_user_options：信息不足时给用户选项
- present_creation_plan：展示 Whale Play 创作规划并等待确认
- record_entry_output：登记规划条目的执行状态
- evaluate_character_draft：评估当前草稿并给出修改建议
- web_search：联网搜索真实资料，需联网开关开启
- validate_character_draft：校验角色草稿和世界书条目
- save_character_draft：保存最终 Builder 产出物

## 参考资料

此索引是 `references/` 文档列表的权威来源。标注「按需查阅」的为参考资料层，其余为主动加载文档。

```
references/
├── requirements.md              —— 需求对齐 + 创作规划.yaml schema
├── composition.md               —— 条目编排、创作循环、DoubleCheck
├── rules.md                     —— 写作规则（前置必读）
├── conventions.md               —— 注册约定与文件格式（前置必读）
├── conversion.md                —— 从材料转化流程
├── project-setup.md             —— 项目创建
├── resume.md                    —— 断点续接
├── configuration.md             —— 条目运行时配置（仅特殊需求时读取）
├── manual.md                    —— 操作命令完整参考（按需查阅）
├── requirements/
│   ├── world-characters.md      —— 世界与角色信息收集
│   ├── entries-dynamics-style.md —— 条目、MVU/EJS、风格与开场白规划
│   ├── planning-yaml.md         —— 创作规划.yaml 完整结构和示例
│   └── entry-types.md           —— 条目类型说明
├── contents-creation/
│   ├── character/
│   │   ├── basic-info.md          —— 角色基础信息
│   │   ├── personality-palette.md —— 性格调色盘
│   │   ├── multi-stage.md —— 多阶段调色盘
│   │   ├── tri-faceted.md         —— 三面性
│   │   ├── rephrase.md            —— 二次解释
│   │   ├── npc.md                 —— NPC 编写
│   │   └── character-catalog.md   —— 角色速览
│   ├── worldbuilding/
│   │   ├── worldview.md         —— 世界观条目
│   │   ├── timeline.md          —— 时间线条目
│   │   └── geography.md         —— 区域条目
│   ├── first-message.md         —— 开场白创作
│   ├── presentation.md          —— 呈现方式（扮演准则）
│   └── stage-guidance.md        —— 阶段指导条目编写
├── mvu/
│   ├── guide.md                 —— MVU 编写流程
│   ├── initvar.md               —— 初始变量编写
│   ├── schema.md                —— MVU 变量类型定义与 schema 写法
│   ├── update-rules-guide.md    —— 变量更新规则编写指南
│   ├── update-rules.yaml        —— 更新规则 YAML 参考示例（按需查阅）
│   └── zod-rule.yaml            —— Zod 校验规则参考（按需查阅）
├── ejs/
│   ├── guide.md                 —— EJS 方案编写流程、@@if 条目显隐、段落级条件渲染
│   ├── reference.md             —— EJS 语法参考手册（按需查阅）
│   └── features.md              —— EJS 可用特性与 API（按需查阅）
└── type/
    ├── state.ts                 —— 状态文件类型定义（按需查阅）
    └── settings.ts              —— .cardrc.json 类型定义（按需查阅）
```