# 键盘快捷键

以下键盘快捷键在聊天界面中可用。

## 聊天输入

| 快捷键 | 操作 | 代码位置 |
|----------|--------|----------|
| `Enter` | 发送消息 | `ChatPage.tsx` `handleKeyDown()` |
| `Shift` + `Enter` | 在输入框中换行 | `ChatPage.tsx` — 按下 `shiftKey` 时的默认行为 |

**注意：** 仅在按下 `Enter` 且**未按住** `Shift` 时才会触发发送。若按住 `Shift`，则保持默认行为（换行），允许编写多行消息。

## 消息编辑

| 快捷键 | 操作 | 代码位置 |
|----------|--------|----------|
| `Ctrl` + `Enter` | 保存编辑后的消息 | `MessageEditBox.tsx` `handleKeyDown()` |
| `Escape` | 取消编辑/关闭对话框 | `MessageEditBox.tsx` `handleKeyDown()` |

这些快捷键在消息编辑框打开时生效（点击消息上的编辑按钮后）。

## 实现代码

### 聊天输入（`ChatPage.tsx`）

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

### 消息编辑框（`MessageEditBox.tsx`）

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    void save();
  }
  if (e.key === "Escape") {
    onCancel();
  }
};
```

## 添加快捷键

要添加新的键盘快捷键：

1. 在相关组件中添加（或扩展现有的）`handleKeyDown` 处理函数。
2. 使用 `e.key` 指定按键名称，使用 `e.ctrlKey`、`e.shiftKey`、`e.altKey` 指定修饰键。
3. 在快捷键激活时调用 `e.preventDefault()` 以阻止浏览器默认行为。
4. 在此文件中记录该快捷键。
