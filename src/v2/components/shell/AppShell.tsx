import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { SubNav } from "./SubNav";
import { BottomBar } from "./BottomBar";
import { CommandPalette } from "./CommandPalette";
import { FloatingBrain } from "./FloatingBrain";
import { useSyncHandlerContext } from "@/v2/lib/data/useSyncHandlerContext";

export function AppShell() {
  useSyncHandlerContext();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);
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
        <SubNav />
        <main className="flex-1 pb-24 md:pb-8">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomBar />
      <FloatingBrain open={brainOpen} onOpenChange={setBrainOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
