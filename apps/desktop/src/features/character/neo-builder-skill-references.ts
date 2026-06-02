type NeoBuilderSkillReference = {
  id: string;
  title: string;
  summary: string;
  aliases?: string[];
  content: string;
};

const referenceDefinitions: NeoBuilderSkillReference[] = [
  {
    id: "SKILL.md",
    title: "Whale Builder Skill Index",
    summary: "Whale Play 原生角色卡与世界书工作流总入口，负责场景路由和参考文档索引。",
    aliases: ["neo-workflow", "workflow"],
    content: `---
name: neo-character-builder
description: "创建、补全、评估 Whale Play 原生角色卡和世界书。覆盖角色基础信息、世界观、NPC、场景、事件、文风、开场白、前置世界书和关键词召回世界书。支持从零创作、从现有材料转化、联网资料辅助和断点续接。确保在用户提到角色设定、人设卡、character card、角色卡、世界书、世界观设定、NPC 设定、文风指导、开场白、创作规划等需求时使用。当前 Whale Builder 不生成 MVU、EJS、SillyTavern forge、外部项目目录、脚本文件或打包说明。"
---

# Whale Play 角色卡与世界书编写

帮助用户创建 Whale Play 原生角色卡与可绑定世界书。这个 skill 复刻 tavern-cards 的分层能力：先用 SKILL.md 路由，再按阶段读取 references/ 下的规则；区别是所有产出都落在 Whale Builder 的草稿、世界书条目和本地创作记录里，不写外部工程文件。

## 术语说明

"角色卡"在 Whale Builder 中指 Whale Play 角色库里可保存的一张角色实体，字段包括 name, description, personality, scenario, firstMessage, exampleDialogues, tags。一个 Builder 工作台可以同时产出世界书条目，用户点击创建后绑定到该角色。

"世界书"指长期背景和召回规则。always 条目是前置世界书，默认 position 为 beforeHistory；trigger 条目是关键词召回世界书，默认 position 为 afterHistory。

## 用户占位约定

默认不要替用户决定身份、动作或情绪。若用户明确要求使用 {{user}} 或 <user>，可以在 firstMessage、exampleDialogues 或世界书内容中保留占位。

## 场景路由

判断三个维度，组合决定流程：

1. 任务阶段：创建 / 修改草稿 / 评估
2. 创建来源：从零 / 从材料转化 / 联网资料辅助
3. 任务范围：完整角色卡 / 局部字段 / 世界书条目 / 开场白

| 组合 | 流程 |
|------|------|
| 创建 + 从零 + 完整角色卡 | 需求对齐：项目属性 -> 需求对齐：世界/角色/条目 -> 创作规划确认 -> 条目与字段创作 -> 开场白 -> 校验 -> 保存草稿 |
| 创建 + 从材料 + 完整角色卡 | 材料转化 -> 需求对齐缺口 -> 创作规划确认 -> 条目与字段创作 -> 开场白 -> 校验 -> 保存草稿 |
| 创建 + 联网资料辅助 | 联网搜索 -> 资料提炼 -> 创作规划确认 -> 转化为角色字段和世界书 -> 校验 -> 保存草稿 |
| 创建 + 局部任务 | 直接定位对应规则文档，不强制完整流程 |
| 修改草稿 + 局部任务 | 读取当前对话、草稿和用户反馈 -> 定位字段或条目 -> 加载对应规则 -> 修正并校验 |
| 修改草稿 + 完整项目 | 断点续接 -> 检查进度与产出物 -> 回到对应步骤继续 |
| 评估 | 分析字段完整性、世界书召回、写作质量和一致性，给出修正建议 |

## 完整项目流程

1. 需求对齐：项目属性 -> references/requirements.md
2. 从材料转化时先执行 -> references/conversion.md
3. 需求对齐：世界/角色/条目 -> references/requirements/world-characters.md 与 references/requirements/entries-dynamics-style.md
4. 产出 Whale Play 创作规划并等待用户确认 -> references/requirements/planning-yaml.md
5. 按规划创作角色字段和世界书条目 -> references/composition.md
6. 按条目类型读取对应创作文档：
   - 角色：references/contents-creation/character/
   - 世界观：references/contents-creation/worldbuilding/
   - 开场白：references/contents-creation/first-message.md
   - 扮演准则和阶段指导：references/contents-creation/presentation.md 与 references/contents-creation/stage-guidance.md
7. 运行 Whale Play 校验 -> validate_character_draft
8. 保存 Builder 产出物 -> save_character_draft

## Whale Play 与原 tavern-cards 的映射

- tavern-cards 的项目目录 -> Whale Builder 本地工作台记录
- 创作规划.yaml -> present_creation_plan 工具展示的创作规划
- entryManifest 注册 -> save_character_draft 的 worldbookEntries
- 蓝灯/常驻条目 -> always + beforeHistory
- 绿灯/关键词条目 -> trigger + afterHistory
- pack/configure/forge -> 不生成；由 Whale Play 的创建按钮保存角色和世界书
- MVU/EJS -> 当前不生成；动态阶段用普通世界书条目和场景指导表达

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

此索引是 Whale Builder 内置 references 的权威来源。标注"按需查阅"的为参考层，其余为主动加载文档。

~~~
references/
├── requirements.md
├── composition.md
├── rules.md
├── conventions.md
├── conversion.md
├── project-setup.md
├── resume.md
├── configuration.md
├── manual.md
├── requirements/
│   ├── world-characters.md
│   ├── entries-dynamics-style.md
│   ├── planning-yaml.md
│   └── entry-types.md
├── contents-creation/
│   ├── worldbook.md
│   ├── first-message.md
│   ├── presentation.md
│   ├── stage-guidance.md
│   ├── character/
│   │   ├── basic-info.md
│   │   ├── personality-palette.md
│   │   ├── multi-stage.md
│   │   ├── tri-faceted.md
│   │   ├── rephrase.md
│   │   ├── npc.md
│   │   └── character-catalog.md
│   └── worldbuilding/
│       ├── worldview.md
│       ├── timeline.md
│       └── geography.md
└── type/
    ├── state.ts
    └── settings.ts
~~~`,
  },
  {
    id: "references/requirements.md",
    title: "需求对齐",
    summary: "收集项目属性、对齐创作模式、生成 Whale Play 创作规划并等待用户确认。",
    content: `# 需求对齐

任何完整角色卡开始前都要先做信息收集。Whale Builder 不创建外部项目，但仍保留原 skill 的"先规划、再创作、再校验"节奏。

## 铁律

用户个人独特的想法和思路是内容独创性的保障。你的任务是忠实收集和整理需求；关键设定不确定时必须询问用户确认。可以用启发式选项帮助用户做决定，但不要把自己的猜测当成用户设定。

## 对齐模式

开头判断用户偏好：

- 粗略规划：先确定骨架，细节在创作时补问。
- 一次确认：尽量一次把核心信息定下来。
- 直接生成：用户明确说"直接写"时，可减少追问，但必须避免编造关键专有名词。

## 流程

1. 读取 references/project-setup.md，确定 Whale Play 工作台属性。
2. 读取 references/requirements/world-characters.md，收集世界与角色信息。
3. 读取 references/requirements/entries-dynamics-style.md，规划世界书条目、动态阶段、风格与开场白。
4. 读取 references/requirements/planning-yaml.md，调用 present_creation_plan 展示创作规划并等待用户确认。
5. 用户确认后进入 references/composition.md。

## 必须追问的情况

- 角色名、地名、组织名、关键称谓缺失。
- 用户给了真实题材但未开启或未确认联网搜索。
- 用户要求还原原作/真实资料，却没有给材料来源。
- 角色和用户的关系入口不清楚。
- 世界书是否需要前置/召回拆分不清楚。

## 可默认处理的情况

- tags 可根据题材生成 2-6 个短标签。
- 没有头像时不生成 avatar。
- 世界书名称可用"角色名 Worldbook"。
- always 世界书 position 默认为 beforeHistory。
- trigger 世界书 position 默认为 afterHistory。`,
  },
  {
    id: "references/project-setup.md",
    title: "Whale Play 工作台创建",
    summary: "把原版项目创建映射到 Whale Builder 本地工作台。",
    content: `# Whale Play 工作台创建

Whale Builder 不运行 forge init，不写 .cardrc.json，不创建外部目录。项目创建在这里等价于确定当前 Builder 工作台的属性。

## 要收集的项目属性

- projectName：默认使用角色名或用户给的作品名。
- outputType：完整角色卡 / 局部字段 / 世界书 / 开场白 / 评估。
- sourceType：原创 / 用户材料 / 联网资料 / 混合。
- worldbookRequired：是否需要世界书。
- searchRequired：是否需要真实资料或联网搜索。
- planningMode：粗略规划 / 一次确认 / 直接生成。

## Whale Play 保存语义

- save_character_draft 只保存 Builder 产出物，不写入角色库。
- 用户点击右侧"创建"后，Neo 才创建 Character，并将世界书绑定到角色。
- 本地创作记录自动保存，包括构思中、待保存、已保存三个状态。

## 禁止项

- 不生成 MVU、EJS、forge 命令、patch 命令、项目目录、模板文件。
- 不向用户输出"请复制到某文件"这类外部工程步骤。
- 不把 Whale Builder 的本地存储说成用户需要手动维护的文件。`,
  },
  {
    id: "references/conversion.md",
    title: "从材料转化",
    summary: "把小说、设定、真实资料或联网资料转化为 Whale Play 角色卡与世界书规划。",
    content: `# 从材料转化

当用户有现成素材、原作、真实人物/地点/职业资料时，需求对齐阶段的信息不靠想象补全，而是从材料提取。

## 材料类型

- 结构化材料：JSON、YAML、表格、设定条目。直接按字段映射为角色、世界观、条目规划。
- 叙事材料：小说、脚本、长 Markdown。先做章节/段落索引，再提取世界、角色、事件、风格。
- 联网资料：调用 web_search 获取结果，提炼可用事实，不照抄网页。

## 转化流程

1. 识别材料类型和可信度。
2. 提取角色、地点、组织、事件、物品、规则、风格。
3. 去重：多处描述同一事实时合并。
4. 标注缺口：源材料没有的关键名称或关系必须询问。
5. 生成 Whale Play 创作规划，等待用户确认。
6. 按规划进入创作执行。

## 转化约束

- 不编造原文没有的关键事实。
- 文学描写转为可执行设定，不保留散文腔。
- 每个重要特征要能追溯到用户材料或搜索结果。
- 用户材料和搜索结果冲突时，列出冲突并询问以哪个为准。
- 默认用简体中文整理，除非用户要求保留原语。`,
  },
  {
    id: "references/resume.md",
    title: "断点续接",
    summary: "读取 Whale Play 本地创作记录，继续构思中或待保存的 Builder 工作台。",
    content: `# 断点续接

Whale Builder 的断点不依赖 entryManifest，而依赖本地工作台记录。

## 状态来源

- 当前对话消息
- 已生成草稿 draft
- 已生成世界书 worldbookDraft
- 保存状态 savedCharacterId
- 工具调用和 usage 记录

## 状态判断

- 构思中：有对话或选择，但还没有 draft。
- 待保存：已有 draft，但用户还没点击创建。
- 已保存：已经写入 Whale Play 角色库。

## 续接流程

1. 读取当前对话里最后的用户目标。
2. 如果已有 draft，先根据用户新反馈定位要修改的字段或世界书条目。
3. 如果没有 draft，回到 requirements 或 composition 的对应阶段。
4. 不要把已保存角色当成要修改的目标；当前版本只支持继续创作记录，不做角色库编辑。
5. 继续时仍要按需读取 reference，不能只凭上一轮记忆。`,
  },
  {
    id: "references/composition.md",
    title: "创作执行",
    summary: "按创作规划写角色字段和世界书条目，执行质量扫描、校验和保存。",
    content: `# 创作执行

根据已确认的 Whale Play 创作规划执行角色字段、世界书条目、开场白和最终草稿保存。

## 前置必读

开始创作前必须先加载：

- references/rules.md：写作规则。
- references/conventions.md：Whale Play 字段、世界书、关键词和保存约定。

## 执行原则

- 创作规划是本轮事实来源，按规划顺序执行。
- 可以根据依赖调整执行顺序，但不得漏掉用户确认过的关键条目。
- 信息不足时先 ask_user_options，不要硬编关键名称。
- 每个条目写完都要做质量扫描，最后统一 validate_character_draft。

## 推荐顺序

1. 世界观概览：如果世界观会影响角色行为，先写。
2. 地点/组织/时间线：只写模型会用错的差异信息。
3. 核心角色：基础信息 -> 性格调色盘 -> 三面性或多阶段 -> 二次解释。
4. NPC/关系：只写会影响互动的 NPC。
5. 扮演准则/阶段指导：约束叙事方式或剧情推进。
6. firstMessage：最后写，确保它和 scenario、关系入口一致。

## 条目创作循环

对每个世界书条目：

1. 读取对应创作规则文档。
2. 编写内容，遵守 rules.md。
3. 禁词和空泛扫描：绝对零度、八股化、具体性。
4. 设置 type、keys、position、priority。
5. 放入 save_character_draft 的 worldbookEntries。

## DoubleCheck

保存前必须检查：

- name、description、personality、scenario、firstMessage 必填。
- firstMessage 不替用户行动。
- trigger 条目有 keys，且没有单汉字关键词。
- always 条目用于前置规则，trigger 条目用于召回事实。
- 角色和世界观不互相矛盾。
- 没有某城市、某组织、待定、TODO 等占位符。
- 输出面向用户可读，不展示原始 JSON。`,
  },
  {
    id: "references/rules.md",
    title: "写作规则",
    summary: "绝对零度、八股化、具体性、简体中文和占位符检查。",
    aliases: ["rules"],
    content: `# 写作规则

所有角色字段和世界书条目都必须遵守本文档。本文档是唯一写作质量来源。

## 格式规范

- 默认简体中文。
- 角色字段写可执行设定，不写教程口吻。
- 世界书条目优先使用短段、列表、键值结构，不写散文。
- 不使用"某城市""某学校""某组织""待定"等占位符。
- 不确定的关键名称必须问用户。

## 绝对零度原则

- 有主观评价和判断 -> 删除或改成事实。
- 有陈旧/劣质比喻 -> 改成直接描述。
- 堆砌无意义形容词 -> 精简。
- 用代词和意象词导致含义模糊 -> 改成具体本意。

## 八股化检查

发现以下表达时删除或改写：

- 模糊词：似乎、几乎、仿佛、如同、宛如、好像。
- 陈旧比喻：像小兽、投石入湖、心湖泛起涟漪。
- 微表情模板：嘴角微微上扬、眼中闪过一丝。
- 语气声线套话：带着某种口吻、用某种语气。
- 标签化性格：她很温柔、他很神秘、她很善良。
- 大段替用户解释角色魅力的系统提示腔。

## 具体性检查

- 抽象描述 -> 改成具体行为。
- 笼统表述 -> 改成具体细节。
- 性格标签 -> 改成场景里的反应模式。

错误："性格温柔善良"。
正确："看见新人把表格填错时，她会先把错项圈出来，再把自己的旧模板推过去。"

## 通用写作要点

- 外貌只写能帮助模型识别角色的特征。
- 背景只写会改变当前互动的事件。
- 关系写具体画面，不写"感情深厚"。
- 能力写边界和代价，不写无限强。
- 冲突写可推进的欲望、限制、误解、职责或危险。

## 自查清单

- 无主观评价。
- 无陈旧比喻和八股微表情。
- 无空泛标签。
- 无占位符。
- firstMessage 没有替用户行动。
- 世界书条目短、准、可召回。`,
  },
  {
    id: "references/conventions.md",
    title: "Whale Play 字段与世界书约定",
    summary: "Neo 角色字段、世界书条目、关键词、优先级和保存约定。",
    content: `# Whale Play 字段与世界书约定

## 角色字段

- name：简短明确的角色名。
- description：身份、外观、说话方式、关系入口、可观察信息。
- personality：核心动机、行为倾向、压力反应、亲近后的变化、边界。
- scenario：开局环境、当前冲突、用户如何进入场景。
- firstMessage：角色已经发出的第一条消息，不写说明书。
- exampleDialogues：用短对话展示角色声音。
- tags：2-6 个短标签。

## 世界书条目

- title：短标题，清楚标记内容。
- type：always 或 trigger。
- position：always 默认 beforeHistory；trigger 默认 afterHistory。
- keys：trigger 必填，always 可空。
- content：模型需要记住的事实、规则或约束。
- role：默认 system。
- priority：越重要越高，建议从 100 递减。
- enabled：默认 true。

## keywords 建议

- 角色：角色名、昵称、外号。
- NPC：姓名、职务、组织称呼。
- 地点：全名、简称、所在地名。
- 组织：全名、简称、成员称呼。

约束：

- 严禁单汉字关键词。
- 避免过泛词：老师、学校、城市、协会这类词要加限定。
- 避免成语或常见短语作为关键词。
- 多个 keys 用逗号分隔。

## 条目拆分

- 前置世界书：不依赖关键词、每轮都重要的底层规则。
- 召回世界书：只有提到角色、地点、组织、事件时才需要的信息。
- 世界观过长时拆成概览、地点、组织、时间线、NPC、阶段指导。

## 保存约定

最终只调用 save_character_draft。不要输出外部 patch、pack、configure 命令。`,
  },
  {
    id: "references/configuration.md",
    title: "Whale Play 运行时配置",
    summary: "解释 beforeHistory、afterHistory、trigger、priority 等运行时字段。",
    content: `# Whale Play 运行时配置

Whale Builder 的配置是世界书条目字段，不需要外部 configure。

## position

- beforeHistory：插入在历史之前，适合常驻身份、世界底层规则、写作约束。
- afterHistory：插入在历史之后，适合关键词召回的信息。
- atDepth：特殊深度插入，除非用户明确需要，默认不使用。

## type

- always：常驻条目。keys 可空，通常 beforeHistory。
- trigger：召回条目。keys 必填，通常 afterHistory。

## priority

建议：

- 100：核心身份、世界底层规则、强约束。
- 80-95：核心角色、当前场景、主要组织。
- 50-75：地点、NPC、时间线、道具。
- 30-50：补充背景。

## triggerMode

- or：任一关键词命中即可召回，默认使用。
- and：需要多个条件同时命中，只有用户明确要求精准触发时使用。

## scanDepth

默认不写。需要让召回只看最近若干轮时再设置。`,
  },
  {
    id: "references/manual.md",
    title: "Whale Builder 工具手册",
    summary: "当前 Builder 可用工具和调用时机。",
    content: `# Whale Builder 工具手册

## list_skill_references

列出 reference 索引。用户要求"查看 workflow/skill 内容"或模型不确定该读哪个文档时使用。

## read_skill_reference

按 id 或路径读取本地 reference。完整任务至少读取 SKILL.md、requirements.md、composition.md、rules.md、conventions.md，并按条目类型读取对应创作文档。

## ask_user_options

信息不足时用。问题必须短，选项必须会实质改变角色体验。

## present_creation_plan

完整角色卡任务在进入正式创作前使用。展示核心设定、计划写入的字段和世界书条目，让用户确认或调整。

## record_entry_output

每完成、开始或跳过一个规划条目时使用。它会更新创作规划.yaml 中 entries 的 status，用于右侧进度和断点续接。

## evaluate_character_draft

用户要求审查、修改建议、质量评估，或保存前需要 DoubleCheck 时使用。评估范围包括角色字段、性格调色盘、世界书条目、创作规划和开场白。

## web_search

联网搜索开启时使用。适合真实资料、历史、职业、地点、神话、作品风格。搜索结果只能作为参考，不能照抄。

## validate_character_draft

保存前校验字段、世界书 keys、占位符、firstMessage 等。

## save_character_draft

保存最终 Builder 产出物。保存后用户可在右侧查看并点击创建。`,
  },
  {
    id: "references/requirements/world-characters.md",
    title: "世界与角色信息收集",
    summary: "收集世界观、核心角色、用户入口、NPC 和关系。",
    content: `# 世界与角色信息收集

## 世界信息

- 题材和时代。
- 地点、组织、阶层、规则、禁忌。
- 当前冲突和安全边界。
- 哪些内容应该常驻，哪些内容应该关键词召回。

## 角色信息

- name、别名、身份、年龄段或生命阶段。
- 外观特征和可识别动作。
- 核心动机、恐惧、职责、欲望。
- 和用户的关系入口。
- 说话方式和互动节奏。
- 能力边界、资源、弱点。

## NPC 和群像

只有当 NPC 会影响互动时才写入世界书。NPC 条目应包含姓名、身份、和主角关系、出场触发、对剧情的作用。

## 用户入口

必须明确用户怎么进入 firstMessage 场景：路过、被召见、同事、敌人、契约对象、陌生人、旧识等。不要替用户决定人格和行动。`,
  },
  {
    id: "references/requirements/entries-dynamics-style.md",
    title: "条目、动态阶段与风格规划",
    summary: "规划世界书条目、阶段指导、风格约束和开场白。",
    content: `# 条目、动态阶段与风格规划

Whale Play 不生成 MVU/EJS。原版动态能力在 Whale Play 中映射为世界书条目、阶段指导和场景规则。

## 条目规划

- 前置世界书：角色核心身份、世界底层规则、写作/扮演准则。
- 召回世界书：地点、组织、NPC、事件、道具、阶段规则。
- 角色字段：只放角色本体和开局互动最需要的信息。

## 动态阶段

如果用户需要关系阶段、剧情阶段或地点切换：

- 用 stage-guidance 条目描述阶段触发和表现。
- 不写变量代码。
- 不假设应用能自动更新阶段；把阶段作为模型叙事判断规则。

## 风格规划

风格只写会影响输出的规则：

- 叙述视角。
- 语言密度。
- 禁止或鼓励的意象。
- 暴力、恐怖、恋爱、喜剧等基调边界。

## 开场白规划

开场白需明确：

- 场景地点。
- 角色正在做什么。
- 用户进入方式。
- 第一句压力点或邀请。
- 不替用户回应。`,
  },
  {
    id: "references/requirements/planning-yaml.md",
    title: "Whale Play 创作规划结构",
    summary: "present_creation_plan 应展示的规划结构和确认项。",
    content: `# Whale Play 创作规划结构

Whale Builder 不写外部文件，但完整项目必须生成等价的创作规划对象，并在右侧以"创作规划.yaml"产出物展示。该对象是断点续接、逐条产出和编辑评估的事实来源。

## present_creation_plan 参数建议

- projectName：项目或角色名。
- worldbookName：计划生成的世界书名称。
- sourceType：原创 / 用户材料 / 联网资料 / 混合。
- planningMode：粗略规划 / 一次确认 / 直接生成。
- summary：一句话说明创作方向。
- characterPlan / characters：角色名、身份、关系入口、核心冲突。
- personalityPalette：底色、主色调、点缀、衍生。
- worldPlan / world：世界观、地点、组织、规则。
- entryPlan：计划生成的世界书条目列表，每条必须有 name、type、purpose，最好有 keys。
- firstMessagePlan / firstMessage：开场方式。
- openQuestions：必须用户确认的问题。
- yaml：可选；不传时工具会自动生成。
- options：确认或调整的可点击选项。

## YAML 结构

~~~yaml
project:
  name: xxx
  worldbookName: xxx
  form: charactercard
  sourceType: 原创
  planningMode: 粗略规划

world:
  overview: xxx
  regions:
    - xxx
  factions:
    - xxx

characters:
  - name: xxx
    identity: xxx
    relationship: xxx
    palette:
      base: xxx
      main:
        - xxx
      accents:
        - xxx

style:
  perspective: 第三人称
  tone: 克制、直接
  mood: 悬疑

entries:
  - id: entry_1
    name: 世界设定
    type: 世界观
    path: 世界书/世界观/世界设定.yaml
    purpose: 约束底层世界规则
    status: planned
    keywords:
      - xxx

first_message:
  format: 叙事式
  word_count: 120-350
  scene: xxx
  opening_situation: xxx
~~~

## 展示给用户的确认内容

- 角色名、地名、组织名是否正确。
- 性格调色盘的底色、主色调、点缀是否符合用户想法。
- 哪些性格衍生需要用户亲自补。
- 角色和用户的关系入口是否符合预期。
- 世界书条目数量和类型是否合适。
- 是否需要联网搜索补资料。
- firstMessage 的切入点是否正确。

## 何时可以跳过确认

用户明确说"直接生成""不用问""你决定"，且没有关键专有名词缺失时，可以直接进入创作。但仍要生成 creationPlan，并在保存前调用 validate_character_draft。`,
  },
  {
    id: "references/requirements/entry-types.md",
    title: "条目类型说明",
    summary: "Whale Play 世界书常用条目类型和适用场景。",
    content: `# 条目类型说明

## 前置世界书 always

适合：

- 世界底层规则。
- 角色不可违背的核心身份。
- 扮演准则。
- 写作风格强约束。

默认 position：beforeHistory。

## 召回世界书 trigger

适合：

- 地点、组织、NPC、历史事件、道具。
- 只在关键词出现时才需要的信息。
- 阶段指导和场景规则。

默认 position：afterHistory。必须有 keys。

## 角色字段

适合：

- description：角色可观察设定。
- personality：行为倾向和心理边界。
- scenario：开局环境和互动入口。
- firstMessage：第一条角色消息。

## 不建议写成世界书的内容

- 用户已经知道、模型也不会误解的百科常识。
- 没有互动作用的大段背景。
- 纯审美形容词。
- 不能被关键词召回的散文段落。`,
  },
  {
    id: "references/contents-creation/worldbook.md",
    title: "Whale Play 世界书条目创作",
    summary: "前置世界书和关键词召回世界书的写法。",
    aliases: ["worldbook"],
    content: `# Whale Play 世界书条目创作

## always 条目

- type：always。
- position：beforeHistory。
- keys：可为空。
- 用于角色底层规则、世界核心规则、扮演准则。
- 内容必须短，避免和角色字段重复。

## trigger 条目

- type：trigger。
- position：afterHistory。
- keys：必填。
- 用于 NPC、地点、组织、事件、道具、阶段规则。
- keys 不得使用单汉字，不得过泛。

## 内容写法

- 只写模型需要记住并执行的信息。
- 不写"这个条目的作用是"。
- 每条建议 80-240 字。
- 长设定拆成多个条目。
- 重要条目 priority 更高。

## 检查

- trigger 有 keys。
- keys 能自然被用户或模型说到。
- content 无占位符。
- 与角色字段不矛盾。`,
  },
  {
    id: "references/contents-creation/character/basic-info.md",
    title: "角色基础信息",
    summary: "name、description、tags 和可观察设定。",
    aliases: ["basic-info"],
    content: `# 角色基础信息

## name

简洁明确。用户没有给名字时，先询问或给选项；除非用户允许直接生成。

## description

写可观察设定：

- 身份、职业、种族或社会位置。
- 外观关键特征。
- 说话方式。
- 和用户的关系入口。
- 当前状态或正在承受的压力。

不要写空泛评价，如"非常有魅力""神秘莫测"。

## tags

2-6 个短标签，例如 fantasy、detective、school、slow-burn。不要把长句塞进 tags。

## 输出风格

description 是设定数据库，不是小说片段。用清楚的句子或短段写明会影响互动的事实。`,
  },
  {
    id: "references/contents-creation/character/personality-palette.md",
    title: "性格调色盘",
    summary: "底色、主色调、点缀和衍生；AI 引导用户创作衍生，不把性格压扁成标签。",
    aliases: ["personality-palette"],
    content: `# 性格调色盘

## 调色盘结构

- 底色：角色最深层的性格基调，始终存在但不一定最明显。
- 主色调：日常最突出的性格，别人对角色的第一印象，通常 1-2 个。
- 点缀：特定条件下才出现的隐藏性格，可以没有，也可以多个。
- 衍生：每个性格色彩在具体场景中的表现。衍生是调色盘核心。

## 铁律

- 衍生由用户自己写，AI 负责启发和整理。AI 不要把数据库里的常见联想硬塞给用户。
- 衍生写具体场景和行为，不写抽象定义。
- 衍生可以矛盾，人本来就复杂。
- 每个重要性格至少 2-3 个衍生。
- 用户写得不通顺、重复、跳跃，也要尽量保留原样；这些可能是角色活过来的关键。
- 可以跨性格关联衍生，也可以关联其他角色。
- 用户可以只有底色 + 主色调，没有点缀。

## Whale Play 输出

save_character_draft 必须带 personalityPalette：

~~~json
{
  "base": "叛逆",
  "main": ["热情", "不拘一格"],
  "accents": ["依赖"],
  "derivatives": [
    { "color": "热情", "items": ["...", "..."] },
    { "color": "叛逆", "items": ["...", "..."] }
  ],
  "futureDerivatives": ["..."]
}
~~~

Builder 会把 personalityPalette 编译进 personality 字段，同时作为独立产出物保存。

## 追问策略

如果用户只给了性格词，先问衍生：

- "这个性格在日常场景里具体会做什么？"
- "压力过大时这个性格会怎么变形？"
- "面对某个重要角色时，这个性格有没有反常表现？"

## 自查清单

- 底色、主色调、点缀结构明确。
- 重要性格点至少有 2 条衍生。
- 衍生是具体场景和行为，不是抽象定义。
- AI 没有替用户硬编关键衍生。
- 用户原始表达没有被过度润色成模板。`,
  },
  {
    id: "references/contents-creation/character/tri-faceted.md",
    title: "三面性",
    summary: "同一角色在不同关系或场景下的行为切换。",
    content: `# 三面性

三面性用于角色在不同场景有根本不同的行为模式时。

## 常见三面

- 公共面：在外人、组织、危险场合的表现。
- 私下面：在信任对象或独处时的表现。
- 压力面：被逼到边界、失败、受伤或失控时的表现。

## 规则

- 三面不能互相矛盾，要由同一个核心动机解释。
- 不要写成"温柔/冷酷/疯狂"标签。
- 每一面都要有具体行为、语言习惯和触发条件。`,
  },
  {
    id: "references/contents-creation/character/rephrase.md",
    title: "二次解释",
    summary: "把性格标签转化为可执行行为，避免模型误读。",
    content: `# 二次解释

二次解释用于防止模型把性格词理解得太泛。

## 写法

- 先指出容易误读的标签。
- 再说明在本角色身上具体表现为什么行为。
- 给出边界：什么情况下不会这样做。

示例：

"谨慎"不是拒绝行动，而是行动前会确认代价、撤退路线和谁会被牵连。`,
  },
  {
    id: "references/contents-creation/character/multi-stage.md",
    title: "多阶段调色盘",
    summary: "关系或剧情推进时角色行为变化的非代码写法。",
    content: `# 多阶段调色盘

Whale Play 不写变量代码。多阶段变化用角色 personality 和 stage-guidance 世界书表达。

## 阶段设计

- 阶段不是简单升级，而是关系状态带来的行为变化。
- 性格底色保持一致。
- 每阶段写触发条件、表现、禁区、可推进事件。

## 常见阶段

- 陌生/试探。
- 合作/交换利益。
- 信任/暴露弱点。
- 冲突/裂痕。
- 和解/承诺。

## 注意

不要承诺系统会自动记录阶段。把阶段写成模型判断当前剧情状态时可使用的指导。`,
  },
  {
    id: "references/contents-creation/character/npc.md",
    title: "NPC 编写",
    summary: "辅助角色、组织成员和关系网的世界书写法。",
    content: `# NPC 编写

NPC 只有会影响互动时才写入世界书。

## 必填信息

- 姓名或称呼。
- 身份和所属组织。
- 与主角、用户或世界冲突的关系。
- 出场触发。
- 能提供或制造什么信息/阻碍。

## 写法

- 不抢主角戏。
- 不写无关长背景。
- keys 使用姓名、外号、职务组合，避免单汉字。
- 可作为 trigger 条目。`,
  },
  {
    id: "references/contents-creation/character/character-catalog.md",
    title: "角色速览",
    summary: "群像项目中先建立角色索引，防止关系混乱。",
    content: `# 角色速览

当核心角色或 NPC 超过 5 个时，先写角色速览。

## 内容

- 姓名。
- 一句话定位。
- 与主角/用户关系。
- 所属组织或地点。
- 主要冲突。
- 对应详细条目的 keys。

## 用途

帮助模型在多角色项目中快速定位人物，避免外貌、关系和阵营混淆。`,
  },
  {
    id: "references/contents-creation/worldbuilding/worldview.md",
    title: "世界观条目",
    summary: "世界规则、社会结构、力量体系和差异信息。",
    content: `# 世界观条目

世界观只写模型会用错或需要持续遵守的差异信息。

## 内容

- 世界底层规则。
- 社会结构。
- 能力或技术边界。
- 禁忌、代价、资源限制。
- 当前主要冲突。

## 写法

- 优先 always + beforeHistory，除非只是某地点/组织的局部信息。
- 用列表压缩。
- 不写百科常识。
- 每句话问：删了模型会错吗？不会就删。`,
  },
  {
    id: "references/contents-creation/worldbuilding/timeline.md",
    title: "时间线条目",
    summary: "历史事件和当前剧情事件的世界书写法。",
    content: `# 时间线条目

时间线用于解释当前冲突如何形成。

## 类型

- history：历史事件，影响世界和人物关系。
- plot：当前剧情，描述开局前后的关键节点。

## 写法

- 按时间顺序。
- 每个事件写结果和当前影响。
- 不写没有互动作用的年代流水账。
- 如果只在提到事件名时需要，做 trigger 条目。`,
  },
  {
    id: "references/contents-creation/worldbuilding/geography.md",
    title: "地理条目",
    summary: "地点、区域、建筑和行动空间的写法。",
    content: `# 地理条目

地点条目服务于场景行动，不写旅游介绍。

## 内容

- 地点名称和别称。
- 物理特征。
- 谁控制这里。
- 常见危险或规则。
- 和角色/剧情的关系。

## keys

使用地点全名、简称、标志性称呼。避免"城市""学校"这类泛词。`,
  },
  {
    id: "references/contents-creation/first-message.md",
    title: "开场白创作",
    summary: "firstMessage 的场景、动作、压力点和用户入口规则。",
    aliases: ["first-message"],
    content: `# 开场白创作

firstMessage 是角色已经发出的第一条消息，不是说明书。

## 必须包含

- 场景感。
- 角色动作或正在处理的事。
- 对用户的自然入口。
- 一个压力点、邀请、误会、请求或冲突。

## 禁止

- 不替用户回答。
- 不替用户行动。
- 不写"以下是开场白"。
- 不用系统提示腔介绍角色设定。

## 长度

通常 120-350 字。用户要求短开场时可更短。

## 自查

删掉角色名后，声音和处境仍应能区分这个角色。`,
  },
  {
    id: "references/contents-creation/presentation.md",
    title: "扮演准则",
    summary: "整体叙述风格、禁忌、节奏和呈现方式。",
    content: `# 扮演准则

扮演准则适合做 always 世界书，约束整个角色输出方式。

## 何时使用

- 用户要求特定文风。
- 世界观需要避免某类描写。
- 角色需要稳定叙述视角。
- 需要控制节奏、暴力程度、暧昧边界或信息揭示方式。

## 写法

- 写明确行为规则，不写审美口号。
- 不要过长。
- 不要和角色 personality 重复。
- 规则必须服务互动体验。`,
  },
  {
    id: "references/contents-creation/stage-guidance.md",
    title: "阶段指导",
    summary: "无 MVU/EJS 时的关系阶段、剧情阶段和场景推进指导。",
    content: `# 阶段指导

Whale Play 当前不生成 MVU/EJS。阶段指导用普通世界书表达模型判断规则。

## 内容

- 阶段名称。
- 进入条件。
- 角色行为变化。
- 可触发事件。
- 禁止越级的内容。
- 如何从当前阶段推进到下一阶段。

## 写法

- 通常做 trigger 条目，keys 可以包含阶段名、关系词、关键事件。
- 如果阶段规则每轮都必须生效，可做 always 条目。
- 不承诺自动状态更新。`,
  },
  {
    id: "references/type/state.ts",
    title: "Whale Builder State Shape",
    summary: "Whale Builder 内部状态概念，用于理解断点续接和保存。",
    content: `export type NeoBuilderState = {
  builderSessionId: string
  status: 'ideating' | 'draft_ready' | 'saved'
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  creationPlan: NeoCreationPlan | null
  personalityPalette: NeoPersonalityPalette | null
  evaluationReport: NeoBuilderEvaluationReport | null
  draft: null | {
    character: NeoCharacterDraft
    worldbookName?: string
    worldbookDescription?: string
    worldbookEntries: NeoWorldbookEntryDraft[]
    notes?: string
  }
  savedCharacterId: string | null
}

export type NeoCreationPlan = {
  project: { name: string; worldbookName?: string; form: 'charactercard' | 'worldbook' }
  entries: Array<{ id: string; name: string; type: string; status: 'planned' | 'in_progress' | 'done' | 'skipped' }>
  yaml: string
  updatedAt: string
}

export type NeoPersonalityPalette = {
  base: string
  main: string[]
  accents: string[]
  derivatives: Array<{ color: string; items: string[] }>
  futureDerivatives?: string[]
  compiledText?: string
}

export type NeoBuilderEvaluationReport = {
  summary: string
  issues: Array<{ severity: 'high' | 'medium' | 'low'; target: string; message: string }>
  suggestions: string[]
  score?: number
}

export type NeoCharacterDraft = {
  name: string
  description: string
  personality: string
  scenario: string
  firstMessage: string
  exampleDialogues?: string
  tags?: string[]
}

export type NeoWorldbookEntryDraft = {
  title: string
  keys: string
  content: string
  priority: number
  type: 'always' | 'trigger'
  position: 'beforeHistory' | 'afterHistory' | 'atDepth'
  triggerMode: 'and' | 'or'
  role: 'system' | 'user' | 'assistant'
  enabled: boolean
}`,
  },
  {
    id: "references/type/settings.ts",
    title: "Whale Builder Settings Shape",
    summary: "Whale Builder 需要关注的设置项。",
    content: `export type NeoBuilderSettings = {
  modelConfig: {
    provider: string
    model: string
    maxTokens?: number
    temperature?: number
    reasoningEffort?: string
  }
  webSearchEnabled: boolean
  deepseekUserIdScope: 'builder-session'
}

// 说明：
// - DeepSeek user_id 使用 builderSessionId 隔离，避免不同 Builder 会话互相污染 KV cache。
// - deepseek-v4-pro 不需要温度设置时，Provider 会自动 omit temperature。
// - 联网搜索由 UI 开关控制，工具不能绕过开关。`,
  },
];

const byId = new Map(referenceDefinitions.map((reference) => [reference.id, reference]));
const aliasToId = new Map<string, string>();

for (const reference of referenceDefinitions) {
  aliasToId.set(reference.id.toLowerCase(), reference.id);
  for (const alias of reference.aliases ?? []) {
    aliasToId.set(alias.toLowerCase(), reference.id);
  }
}

export const NEO_BUILDER_REFERENCE_IDS = referenceDefinitions.map((reference) => reference.id);

export const NEO_BUILDER_REFERENCE_LOOKUP_IDS = [
  ...NEO_BUILDER_REFERENCE_IDS,
  ...referenceDefinitions.flatMap((reference) => reference.aliases ?? []),
];

export const NEO_BUILDER_REFERENCE_TEXTS: Record<string, string> = Object.fromEntries([
  ...referenceDefinitions.map((reference) => [reference.id, reference.content] as const),
  ...referenceDefinitions.flatMap((reference) =>
    (reference.aliases ?? []).map((alias) => [alias, reference.content] as const),
  ),
]);

export function listNeoBuilderSkillReferences(query?: string) {
  const needle = query?.trim().toLowerCase();
  return referenceDefinitions
    .filter((reference) => {
      if (!needle) return true;
      return [reference.id, reference.title, reference.summary, ...(reference.aliases ?? [])].some((value) =>
        value.toLowerCase().includes(needle),
      );
    })
    .map((reference) => ({
      id: reference.id,
      title: reference.title,
      summary: reference.summary,
      aliases: reference.aliases ?? [],
    }));
}

export function readNeoBuilderSkillReference(idOrAlias: string) {
  const id = aliasToId.get(idOrAlias.trim().toLowerCase());
  return id ? (byId.get(id) ?? null) : null;
}
