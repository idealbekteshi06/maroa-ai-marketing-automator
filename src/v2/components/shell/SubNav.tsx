import { NavLink, useLocation } from "react-router-dom";
import { findSection } from "./nav";

export function SubNav() {
  const { pathname } = useLocation();
  const section = findSection(pathname);
  if (!section?.children?.length) return null;
  const base = `/app${section.to ? `/${section.to}` : ""}`;

  return (
    <div
      className="sticky top-14 z-20 px-4 sm:px-6 overflow-x-auto"
      style={{
        background: "hsl(var(--m-background) / 0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: "1px solid hsl(var(--m-border-subtle))",
      }}
    >
      <ul className="flex items-center gap-1 h-11 min-w-max">
        {section.children.map((c) => {
          const to = `${base}/${c.to}`;
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <li key={c.to}>
              <NavLink to={to}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-medium transition-colors"
                style={{
                  background: active ? "hsl(var(--m-surface-elevated))" : "transparent",
                  color: active ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                  border: active ? "1px solid hsl(var(--m-border-subtle))" : "1px solid transparent",
                }}>
                {c.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
