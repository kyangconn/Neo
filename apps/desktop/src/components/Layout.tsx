import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate, type NavLinkRenderProps } from "react-router";
import {
  User,
  Settings,
  Home,
  LayoutTemplate,
  BookOpen,
  Sparkles,
  PenTool,
  History,
  Minus,
  Square,
  X,
} from "lucide-react";
import { cn } from "@neo-tavern/ui";

async function withCurrentWindow(action: (appWindow: import("@tauri-apps/api/window").Window) => Promise<void>) {
  if (typeof window === "undefined") return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await action(getCurrentWindow());
  } catch {
    /* Window API is unavailable outside the Tauri shell. */
  }
}

function WindowTitleBar() {
  return (
    <div
      data-tauri-drag-region
      onMouseDown={(event) => {
        if (event.button !== 0 || event.detail > 1) return;
        void withCurrentWindow((appWindow) => appWindow.startDragging());
      }}
      onDoubleClick={() => void withCurrentWindow((appWindow) => appWindow.toggleMaximize())}
      className="absolute left-16 right-0 top-0 z-50 flex h-7 items-stretch justify-end bg-transparent"
    >
      <button
        type="button"
        className="flex w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Minimize"
        aria-label="Minimize"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => void withCurrentWindow((appWindow) => appWindow.minimize())}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="flex w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Maximize"
        aria-label="Maximize"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => void withCurrentWindow((appWindow) => appWindow.toggleMaximize())}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <Square className="h-3 w-3" />
      </button>
      <button
        type="button"
        className="flex w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        title="Close"
        aria-label="Close"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => void withCurrentWindow((appWindow) => appWindow.close())}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Layout() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  const lastChatId = typeof window !== "undefined" ? localStorage.getItem("neo:last-chat-id") : null;

  const navItems = [
    { to: "/", icon: Home, label: t("nav.home") },
    { to: "/character", icon: User, label: t("nav.characters") },
    { to: "/character-builder", icon: PenTool, label: t("nav.builder", "Builder") },
    { to: "/preset", icon: LayoutTemplate, label: t("nav.presets") },
    { to: "/worldbook", icon: BookOpen, label: t("nav.worldbook") },
    { to: "/persona", icon: Sparkles, label: t("nav.persona") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  return (
    <div className="relative flex h-screen bg-background">
      <WindowTitleBar />
      <aside className="app-rail w-16 flex flex-col items-center border-r py-4 gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }: NavLinkRenderProps) =>
              cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                isActive && "bg-accent text-foreground",
              )
            }
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
          </NavLink>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Recent chat shortcut */}
        {lastChatId && (
          <button
            onClick={() => navigate(`/chat/${lastChatId}`)}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={t("nav.recentChat", "最近对话")}
          >
            <History className="h-5 w-5" />
          </button>
        )}

        <div className="h-12 flex items-center justify-center">
          <button
            onClick={() => navigate("/about")}
            className="text-xs text-muted-foreground font-medium -rotate-90 whitespace-nowrap leading-none hover:text-foreground transition-colors"
          >
            WHALE
          </button>
        </div>
      </aside>
      <main className="flex-1 flex min-w-0 flex-col overflow-hidden pt-7">
        <Outlet />
      </main>
    </div>
  );
}
