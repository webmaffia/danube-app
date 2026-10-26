"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DemoReset } from "@/components/DemoReset";
import { useIsDesktop } from "@/lib/nav";

// The phone frame. The console is for the presenter's laptop, so it gets a
// wide frame instead, and the desktop version (/desktop) fills the window.
export function AppFrame({ children }: { children: ReactNode }) {
  const wide = usePathname().startsWith("/console");
  const desktop = useIsDesktop();
  return (
    <>
      <div className={`app-shell ${wide ? "app-shell--wide" : ""} ${desktop ? "app-shell--desktop" : ""}`}>
        <div className="app-scroll">{children}</div>
      </div>
      {!wide && <DemoReset />}
    </>
  );
}
