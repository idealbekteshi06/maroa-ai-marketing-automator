import { NavLink, useLocation } from "react-router-dom";
import { Lock } from "lucide-react";
import { NAV } from "./nav";

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 m-glass"
      style={{ borderRight: "1px solid hsl(var(--m-border-subtle))" }}
    >
      <div className="px-5 h-14 flex items-center">
        <div className="text-headline">Maroa</div>
        <div
          className="ml-2 text-caption px-1.5 py-0.5 rounded-md"
          style={{
            background: "hsl(var(--m-accent) / 0.1)",
            color: "hsl(var(--m-accent))",
          }}
        >
          AI CMO
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((group) => (
          <div key={group.label}>
            <div
              className="text-caption uppercase px-2 mb-1.5"
              style={{ color: "hsl(var(--m-muted-foreground))" }}
            >
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const fullPath = `/app${item.to ? `/${item.to}` : ""}`;
                const active =
                  pathname === fullPath ||
                  (item.to && pathname.startsWith(`${fullPath}/`));
                return (
                  <li key={item.label}>
                    <NavLink
                      to={fullPath}
                      end={!item.to}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-callout transition-colors"
                      style={{
                        background: active
                          ? "hsl(var(--m-accent) / 0.1)"
                          : "transparent",
                        color: active
                          ? "hsl(var(--m-accent))"
                          : "hsl(var(--m-foreground))",
                      }}
                    >
                      <item.icon size={16} strokeWidth={1.5} />
                      <span className="flex-1">{item.label}</span>
                      {item.gated && (
                        <Lock
                          size={11}
                          style={{ color: "hsl(var(--m-muted-foreground))" }}
                        />
                      )}
                      {item.badge && (
                        <span
                          className="text-caption px-1.5 py-0.5 rounded-md"
                          style={{
                            background: "hsl(var(--m-accent) / 0.15)",
                            color: "hsl(var(--m-accent))",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
