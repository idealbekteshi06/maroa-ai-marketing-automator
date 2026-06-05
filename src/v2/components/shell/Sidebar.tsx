import { NavLink, useLocation } from "react-router-dom";
import { ChevronsUpDown, CircleDot, LogOut } from "lucide-react";
import { NAV } from "./nav";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const autopilotOn = business?.autopilot_enabled;
  const initial = (business?.business_name ?? business?.name ?? user?.email ?? "M")
    .toString().charAt(0).toUpperCase();

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0"
      style={{
        background: "hsl(var(--m-surface))",
        borderRight: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      <div className="px-4 h-14 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] font-semibold"
             style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-accent-foreground))" }}>M</div>
        <div className="text-[15px] font-semibold tracking-tight">Maroa</div>
      </div>

      <div className="px-3 pb-3">
        <button
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
          style={{ border: "1px solid hsl(var(--m-border-subtle))" }}
        >
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-semibold shrink-0"
               style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">
              {business?.business_name ?? business?.name ?? "Your business"}
            </div>
            <div className="text-[11px] truncate" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              {business?.plan ? business.plan[0].toUpperCase() + business.plan.slice(1) : "Free"} plan
            </div>
          </div>
          <ChevronsUpDown size={13} style={{ color: "hsl(var(--m-muted-foreground))" }} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <ul className="space-y-0.5">
          {NAV.map((item, idx) => {
            const fullPath = `/app${item.to ? `/${item.to}` : ""}`;
            const active = pathname === fullPath ||
              (item.to && pathname.startsWith(`${fullPath}/`)) ||
              (!item.to && pathname === "/app");
            const prevGroup = idx > 0 ? NAV[idx - 1].group : undefined;
            const showGroupHeader = item.group && item.group !== prevGroup;
            return (
              <li key={item.label}>
                {showGroupHeader && (
                  <div className="px-2.5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                       style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {item.group}
                  </div>
                )}
                <NavLink
                  to={fullPath}
                  end={!item.to}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors"
                  style={{
                    background: active ? "hsl(var(--m-surface-elevated))" : "transparent",
                    color: active ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                  }}
                >
                  <item.icon size={15} strokeWidth={1.75} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
                {active && item.children && item.children.length > 0 && (
                  <ul className="ml-7 mt-0.5 mb-1 space-y-0.5 border-l"
                      style={{ borderColor: "hsl(var(--m-border-subtle))" }}>
                    {item.children.map((c) => {
                      const sub = `${fullPath}/${c.to}`;
                      const subActive = pathname === sub || pathname.startsWith(`${sub}/`);
                      return (
                        <li key={c.to}>
                          <NavLink
                            to={sub}
                            className="block pl-3 pr-2 py-1.5 -ml-px text-[12.5px] transition-colors"
                            style={{
                              color: subActive ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                              borderLeft: `2px solid ${subActive ? "hsl(var(--m-accent))" : "transparent"}`,
                              fontWeight: subActive ? 500 : 400,
                            }}
                          >
                            {c.label}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>


      <div className="px-3 py-3 space-y-2"
           style={{ borderTop: "1px solid hsl(var(--m-border-subtle))" }}>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
             style={{ background: "hsl(var(--m-surface-elevated))" }}>
          <CircleDot size={12}
                     style={{ color: autopilotOn ? "hsl(var(--m-success))" : "hsl(var(--m-warning))" }} />
          <span className="text-[12px] font-medium flex-1 truncate">
            {autopilotOn ? "Autopilot: Active" : "Autopilot: Review"}
          </span>
        </div>
        <button onClick={() => signOut?.()}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
                style={{ color: "hsl(var(--m-muted-foreground))" }}>
          <LogOut size={13} />
          <span className="flex-1 text-left truncate">{user?.email ?? "Account"}</span>
        </button>
      </div>
    </aside>
  );
}
