import { NavLink, useLocation } from "react-router-dom";
import { NAV } from "./nav";

export function BottomBar() {
  const { pathname } = useLocation();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe"
      style={{
        background: "hsl(var(--m-background) / 0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderTop: "1px solid hsl(var(--m-border-subtle))",
      }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {NAV.filter((n) => ["", "content", "ads", "crm", "growth"].includes(n.to)).map((item) => {
          const full = `/app${item.to ? `/${item.to}` : ""}`;
          const active = pathname === full ||
            (item.to && pathname.startsWith(`${full}/`)) ||
            (!item.to && pathname === "/app");
          return (
            <li key={item.label} className="flex-1">
              <NavLink to={full} end={!item.to}
                className="flex flex-col items-center justify-center gap-0.5 h-14 text-[10.5px] font-medium"
                style={{ color: active ? "hsl(var(--m-accent))" : "hsl(var(--m-muted-foreground))" }}
                aria-label={item.label}>
                <item.icon size={20} strokeWidth={active ? 2 : 1.75} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
