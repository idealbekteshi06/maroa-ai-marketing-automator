import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import maroaLogo from "@/assets/maroa-logo.png";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
  };

  return (
    <div
      className={`sticky top-0 z-50 transition-[border-color,background] duration-200 ${
        scrolled ? "border-b border-[var(--border-default)]" : "border-b border-transparent"
      }`}
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "saturate(180%) blur(12px)", WebkitBackdropFilter: "saturate(180%) blur(12px)" }}
    >
      <nav className="mx-auto flex max-w-[1200px] items-center gap-10 px-8 py-4">
        <Link to="/" className="inline-flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-foreground no-underline">
          <img src={maroaLogo} alt="Maroa" className="block h-8 w-auto" />
          maroa
        </Link>

        <div className="hidden items-center gap-7 text-sm md:flex">
          <a href="#how" onClick={scrollTo("how")} className="text-muted-foreground transition-colors hover:text-foreground">How it works</a>
          <a href="#agents" onClick={scrollTo("agents")} className="text-muted-foreground transition-colors hover:text-foreground">Agents</a>
          <a href="#pricing" onClick={scrollTo("pricing")} className="text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <a href="#faq" onClick={scrollTo("faq")} className="text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/login" className="inline-flex items-center rounded-[10px] px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-[var(--bg-overlay)] hover:text-foreground">Log in</Link>
          <Link to="/signup" className="inline-flex items-center rounded-full bg-[var(--brand)] px-[18px] py-2 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(10,132,255,0.25)] transition-all hover:-translate-y-px hover:bg-[var(--brand-hover)] hover:shadow-[0_4px_12px_rgba(10,132,255,0.3)]">
            Start free trial
          </Link>
        </div>
      </nav>
    </div>
  );
}
