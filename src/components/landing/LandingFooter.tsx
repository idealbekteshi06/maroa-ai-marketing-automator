import { Link } from "react-router-dom";
import maroaLogo from "@/assets/maroa-logo.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0A] px-8 py-6 pb-10 text-[#94A3B8]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 text-[13px]">
        <Link to="/" className="inline-flex items-center gap-2 text-[15px] font-bold text-white no-underline">
          <img src={maroaLogo} alt="Maroa" className="block h-6 w-auto brightness-0 invert" style={{ opacity: 0.85 }} />
          maroa
        </Link>
        <div className="flex gap-6">
          <Link to="/privacy" className="text-[#94A3B8] transition-colors hover:text-white">Privacy</Link>
          <Link to="/terms" className="text-[#94A3B8] transition-colors hover:text-white">Terms</Link>
          <Link to="/data-deletion" className="text-[#94A3B8] transition-colors hover:text-white">Data Deletion</Link>
          <a href="mailto:info@maroa.ai" className="text-[#94A3B8] transition-colors hover:text-white">Contact</a>
          <span>&copy; 2026 Maroa</span>
        </div>
      </div>
    </footer>
  );
}
