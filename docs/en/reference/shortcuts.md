# Keyboard Shortcuts

The following keyboard shortcuts are available in the chat interface.

## Chat Input

| Shortcut          | Action                  | Location                                                      |
| ----------------- | ----------------------- | ------------------------------------------------------------- |
| `Enter`           | Send message            | `ChatPage.tsx` `handleKeyDown()`                              |
| `Shift` + `Enter` | Insert newline in input | `ChatPage.tsx` — the default behavior when `shiftKey` is held |

**Note:** Sending is only triggered when `Enter` is pressed **without** `Shift`. If `Shift` is held, the default behavior (newline) is preserved, allowing multi-line message composition.

## Message Editing

| Shortcut         | Action                        | Location                               |
| ---------------- | ----------------------------- | -------------------------------------- |
| `Ctrl` + `Enter` | Save edited message           | `MessageEditBox.tsx` `handleKeyDown()` |
| `Escape`         | Cancel editing / close dialog | `MessageEditBox.tsx` `handleKeyDown()` |

These shortcuts apply when the message edit box is open (after clicking the edit button on a message).

## Implementation

### Chat input (`ChatPage.tsx`)

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};
```

### Message edit box (`MessageEditBox.tsx`)

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

## Adding New Shortcuts

To add new keyboard shortcuts:

1. Add a `handleKeyDown` handler (or extend an existing one) in the relevant component.
2. Use `e.key` for the key name and `e.ctrlKey`, `e.shiftKey`, `e.altKey` for modifier keys.
3. Call `e.preventDefault()` to prevent default browser behavior when the shortcut is active.
4. Document the shortcut in this file.
