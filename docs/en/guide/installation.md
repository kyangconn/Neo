# Installation

Welcome! This guide will help you get Whale Play up and running on your machine. You can choose whichever option works best for you.



---

## System Requirements

Make sure your system meets these minimum requirements before proceeding:

| Requirement | Details |
|---|---|
| **Operating System** | Windows 10+, macOS 12+, or Linux (requires `webkit2gtk-4.1` on Debian/Ubuntu or equivalent) |
| **Node.js** | Version 18 or higher. [Download from nodejs.org](https://nodejs.org/) |
| **pnpm** | Version 9 or higher. Install it with: `npm install -g pnpm` |

For contributors who want to run the native Tauri desktop app, you'll also need:

- **Rust** (stable toolchain). [Install from rustup.rs](https://rustup.rs/)

---

## Option 1: One-Click Script (Windows)

The quickest way to get started on Windows — double-click and go.

1. **Open the project folder** after cloning or downloading the source.
2. **Run one of these scripts:**
   - **PowerShell** — Right-click `setup.ps1` and select *Run with PowerShell*, or open PowerShell in the folder and run:
     ```powershell
     .\setup.ps1
     ```
   - **Batch file** — Double-click `一键安装启动.bat` (or `yi-jian-an-zhuang-qi-dong.bat`).

Both scripts will:
- Check for Node.js and pnpm (and install them if missing).
- Optionally install Rust (for Tauri desktop mode).
- Install all project dependencies with `pnpm install`.
- Automatically launch the dev server (`pnpm tauri dev` if Rust is available, or `pnpm dev` in the browser otherwise).

> **Tip:** If the script finishes but you don't see a window, check the terminal output for the URL (usually `http://localhost:1420`) and open it manually.

---

## Option 2: Manual Setup

If you prefer to install things step by step, or you're on macOS/Linux:

```bash
# Clone the repository
git clone https://github.com/YELEBAI/Whaleplay.git

# Enter the project directory
cd Neo

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

After running `pnpm dev`, watch the terminal for a URL like `http://localhost:1420` — open that in your browser to see Whale Play.

![Installation terminal output](../images/installation-terminal.png)

> **📸 Screenshot needed:** Run `pnpm install` and capture the terminal output showing successful dependency installation. Save the image as `docs/images/installation-terminal.png`.

---

## Option 3: Download a Prebuilt Binary

If you just want to use Whale Play without installing any developer tools:

1. Go to the [GitHub Releases page](https://github.com/YELEBAI/Whaleplay/releases) for the project.
2. Find the latest release.
3. Download the installer for your platform:
   - **Windows**: `Whale-Play_<version>_x64-setup.exe` or `Whale-Play_<version>_x64.msi`
   - **macOS**: `Whale-Play_<version>_x64.dmg`
   - **Linux**: `Whale-Play_<version>_amd64.deb` or `Whale-Play_<version>.AppImage`
4. Run the installer and follow the on-screen prompts.

> **Note:** Prebuilt binaries are built and signed by the project maintainers. If you need the latest unreleased features, use Option 1 or 2 instead.

---

## Tauri Desktop Development (for Contributors)

If you want to contribute code or test the native desktop window, you'll use Tauri:

```bash
# Launch the native Tauri window (requires Rust)
pnpm tauri dev
```

This compiles the Rust backend and opens Whale Play as a standalone desktop application with full native integration (system notifications, file dialogs, etc.).

### Browser Mode vs. Desktop Mode

| Command | What it does | When to use |
|---|---|---|
| `pnpm dev` | Starts only the Vite dev server — open in your browser at `http://localhost:1420` | Fast UI iteration, styling, React component work |
| `pnpm tauri dev` | Starts the Vite dev server + compiles the Rust backend — opens a native window | Testing Tauri APIs, native features, or the final packaged experience |

### Building a Desktop Installer

To create a distributable installer for your platform:

```bash
pnpm build:desktop
```

The installer will be placed in `apps/desktop/src-tauri/target/release/bundle/`.

---

## Troubleshooting

### `pnpm install` fails with network errors
Try setting a different registry mirror:
```bash
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### `webkit2gtk` not found (Linux)
On Debian/Ubuntu:
```bash
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

### Permission errors on macOS/Linux
Some commands may need `sudo` for global installs:
```bash
sudo npm install -g pnpm
```

### Still stuck?
Open an issue on [GitHub](https://github.com/YELEBAI/Whaleplay/issues) or ask in the project's discussion forum.
