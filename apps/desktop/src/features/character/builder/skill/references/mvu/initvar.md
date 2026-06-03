# 初始变量（initvar.yaml）

## 编写原则

- YAML 格式，结构需与 `schema.ts` 中定义的 Schema 对应，完成后通过 `node scripts/tavern-cards-forge.mjs validate-mvu` 校验
- 初始值要符合开场情节的设定。开场情节在需求对齐阶段确认，或在此阶段询问用户

## 产出

注册为 `[InitVar]请勿打开`，写入 `世界书/变量/initvar.yaml`。

## 自查清单

- [ ] YAML 格式正确
- [ ] 类型与 Schema 一致
- [ ] 通过 validate-mvu 校验
- [ ] 没有繁体字、日文汉字
