import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <div
      className="flex w-full min-h-screen"
      style={{
        background: "hsl(var(--m-background))",
        color: "hsl(var(--m-foreground))",
      }}
    >
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1">
          <div className="max-w-[1440px] mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
