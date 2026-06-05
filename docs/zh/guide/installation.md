# 安装

欢迎！本指南将帮助你在自己的机器上安装并运行 Whale Play。你可以选择最适合自己的方式。

## 部署方式

本程序目前提供三种部署方式：

- 一键脚本（Windows)
- 手动运行
- 预编译程序包 (Windows)

---

## 系统要求

在开始之前，请确保你的系统满足以下最低要求：

| 要求         | 详情                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| **操作系统** | Windows 10+、macOS 12+ 或 Linux（Debian/Ubuntu 需要 `webkit2gtk-4.1` 或同等依赖） |
| **Node.js**  | 版本 18 或更高。[从 nodejs.org 下载](https://nodejs.org/)                         |
| **pnpm**     | 版本 9 或更高。使用以下命令安装：`npm install -g pnpm`                            |

如果你希望以原生 Tauri 桌面应用方式运行，还需要：

- **Rust**（稳定工具链）。[从 rustup.rs 安装](https://rustup.rs/)）

---

## 方式一：一键脚本（Windows）

在 Windows 上最快捷的启动方式——双击即可运行。

1. **打开项目文件夹**（克隆或下载源代码后）。
2. **运行以下任一脚本：**
   - **PowerShell** — 右键点击 `setup.ps1`，选择"使用 PowerShell 运行"；或者在文件夹中打开 PowerShell 并执行：
     ```powershell
     .\setup.ps1
     ```
   - **批处理文件** — 双击 `一键安装启动.bat`（或 `yi-jian-an-zhuang-qi-dong.bat`）。

两个脚本都会：

- 检查 Node.js 和 pnpm（如果缺失则自动安装）。
- 可选安装 Rust（用于 Tauri 桌面模式）。
- 使用 `pnpm install` 安装所有项目依赖。
- 自动启动开发服务器（如有 Rust 则运行 `pnpm tauri dev`，否则在浏览器中运行 `pnpm dev`）。

> **提示：** 如果脚本执行完毕但未看到窗口，请检查终端输出中的 URL（通常为 `http://localhost:1420`），手动在浏览器中打开。

---

## 方式二：手动安装

如果你希望逐步手动安装，或者你使用的是 macOS/Linux：

```bash
# 克隆仓库
git clone https://github.com/YELEBAI/Whaleplay.git

# 进入项目目录
cd Whaleplay

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

运行 `pnpm dev` 后，在终端中查找类似 `http://localhost:1420` 的 URL —— 在浏览器中打开即可看到 Whale Play。

![安装终端输出](../images/installation-terminal.png)

当然你也可以在 `pnpm install` 后，运行命令 `pnpm tauri dev` 来打开一个桌面应用，界面和功能都与浏览器中的一致。

这会编译 Rust 后端，并将 Whale Play 作为独立桌面应用程序打开，具备完整的原生集成（系统通知、文件对话框等）。

### 浏览器模式 vs. 桌面模式

| 命令             | 作用                                                           | 适用场景                               |
| ---------------- | -------------------------------------------------------------- | -------------------------------------- |
| `pnpm dev`       | 仅启动 Vite 开发服务器——在浏览器中打开 `http://localhost:1420` | 快速 UI 迭代、样式调整、React 组件开发 |
| `pnpm tauri dev` | 启动 Vite 开发服务器 + 编译 Rust 后端——打开原生窗口            | 测试 Tauri API、原生功能或最终打包体验 |

---

## 方式三：下载预构建安装包

如果你只想使用 Whale Play，不想安装任何开发工具：

1. 前往项目的 [GitHub Releases 页面](https://github.com/YELEBAI/Whaleplay/releases)。
2. 找到最新版本。
3. 下载适用于你平台的安装包：
   - **Windows**：`Whale-Play_<版本号>_x64-setup.exe` 或 `Whale-Play_<版本号>_x64.msi`
   - **macOS**：`Whale-Play_<版本号>_x64.dmg`
   - **Linux**：`Whale-Play_<版本号>_amd64.deb` 或 `Whale-Play_<版本号>.AppImage`
4. 运行安装程序，按照屏幕提示完成安装。

> **注意：** 预构建安装包由项目维护者构建和签名，可能不包含最新功能和修复。如果你需要最新的未发布功能，请使用方式一或方式二。

### 构建桌面安装包

要创建可分发的安装包：

```bash
pnpm build:desktop
```

安装包将生成在 `apps/desktop/src-tauri/target/release/bundle/` 目录下。

---

## 故障排除

### `pnpm install` 因网络错误失败

尝试设置不同的镜像源：

```bash
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### 找不到 `webkit2gtk`（Linux）

在 Debian/Ubuntu 上：

```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### macOS/Linux 权限错误

某些命令在全局安装时可能需要 `sudo`：

```bash
sudo npm install -g pnpm
```

### 仍有问题？

在 [GitHub](https://github.com/YELEBAI/Whaleplay/issues) 上提交 Issue，或在项目的讨论区中提问。
