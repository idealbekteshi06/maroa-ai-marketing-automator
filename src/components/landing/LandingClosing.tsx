import { Link } from "react-router-dom";

export default function LandingClosing() {
  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] py-32 text-white">
      {/* Gradient glow */}
      <div
        className="pointer-events-none absolute inset-[-1px]"
        style={{
          background: "radial-gradient(800px 400px at 50% 0%, rgba(10,132,255,0.18), transparent 70%), radial-gradient(600px 300px at 85% 100%, rgba(191,90,242,0.1), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[820px] px-8 text-center">
        <h2 className="text-[clamp(40px,5.5vw,72px)] font-extrabold leading-[1.02] tracking-[-0.035em]" style={{ textWrap: "balance" }}>
          Stop running the playbook.<br />Run the outcome.
        </h2>
        <p className="mx-auto mt-6 text-lg leading-[1.55] text-[#94A3B8]">
          14 days free. Your first campaign lives by Friday.
        </p>
        <Link
          to="/signup"
          className="mt-10 inline-flex items-center rounded-full bg-white px-7 py-4 text-[15px] font-semibold text-[#0A0A0A] transition-all hover:-translate-y-px hover:bg-[#F1F5F9]"
        >
          Start free trial →
        </Link>
      </div>
    </section>
  );
}
