import { Check } from "lucide-react";

export default function LandingShift() {
  return (
    <section className="py-24" id="demo">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="text-center">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">The shift</div>
          <h2 className="mx-auto mt-3 text-[clamp(32px,4vw,46px)] font-bold leading-[1.08] tracking-[-0.025em]" style={{ maxWidth: "22ch", textWrap: "balance" }}>
            Maroa flips the model. You describe the outcome. Agents handle the work.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 max-md:grid-cols-1 md:grid-cols-2">
          {/* OLD WAY */}
          <div className="flex flex-col overflow-hidden rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-subtle)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-[18px] py-3.5 text-[13px] font-semibold tracking-[-0.005em] text-muted-foreground">
              <span>Old way · tools that wait for you</span>
              <span className="font-mono text-[11px] text-[var(--fg-disabled)]">08:14</span>
            </div>
            <div className="flex-1 p-6">
              <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-white opacity-90 shadow-[var(--shadow-xs)]">
                <div className="flex border-b border-[var(--border-default)] text-[12px] font-medium text-muted-foreground">
                  <div className="border-b-2 border-foreground px-3.5 py-2.5 text-foreground">Compose</div>
                  <div className="px-3.5 py-2.5">Queue</div>
                  <div className="px-3.5 py-2.5">Analytics</div>
                </div>
                <div className="flex min-h-[170px] flex-col gap-2.5 p-[18px]">
                  <div className="flex min-h-[88px] items-center gap-2 text-sm text-[var(--fg-disabled)]">
                    What would you like to post?<span className="inline-block h-4 w-0.5 bg-[var(--fg-disabled)] animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2.5 border-t border-[var(--border-default)] pt-2.5 text-[var(--fg-disabled)]">
                    <Monitor className="h-4 w-4" />
                    <LinkIcon className="h-4 w-4" />
                    <SmileIcon className="h-4 w-4" />
                    <span className="ml-auto rounded-md bg-[var(--bg-muted)] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Schedule →</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-[12px] text-muted-foreground">You stare at the blinking cursor. Again.</p>
            </div>
          </div>

          {/* NEW WAY */}
          <div className="flex flex-col overflow-hidden rounded-[18px] border border-[rgba(10,132,255,0.25)] bg-white shadow-[0_10px_30px_-12px_rgba(10,132,255,0.18)]">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--brand-subtle)] px-[18px] py-3.5 text-[13px] font-semibold tracking-[-0.005em] text-[var(--brand)]">
              <span>With Maroa · agents that own the work</span>
              <span className="font-mono text-[11px]">08:14</span>
            </div>
            <div className="flex-1 p-6">
              <div className="mb-3.5 flex items-center justify-between">
                <h4 className="text-sm font-semibold tracking-[-0.005em]">Live activity</h4>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--brand)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" style={{ boxShadow: "0 0 0 3px rgba(10,132,255,0.2)" }} />
                  3 agents active
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: "Content agent", task: "Drafting Q4 weekend promo · 3 variants", time: "2m ago" },
                  { name: "Ads agent", task: "A/B testing hero image · €6 allocated", time: "11m ago" },
                  { name: "Scheduling agent", task: "Queueing for Thursday 7pm peak", time: "just now" },
                ].map((a) => (
                  <div key={a.name} className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-white px-3.5 py-3">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" style={{ boxShadow: "0 0 0 4px rgba(10,132,255,0.14)", animation: "pulse 2s ease-in-out infinite" }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold">{a.name}</div>
                      <div className="mt-0.5 text-[12px] text-muted-foreground">{a.task}</div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                ))}
              </div>

              <div className="mt-[18px] flex items-center gap-2 rounded-[10px] bg-[var(--brand-subtle)] px-3.5 py-3 text-[13px] text-[var(--brand)]">
                <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                You'll get a one-line summary at 5pm. Nothing to do until then.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Minimal inline icons for the old-way composer */
function Monitor({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>);
}
function LinkIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M10 14l11-11M21 14v7H3V3h7" /></svg>);
}
function SmileIcon({ className }: { className?: string }) {
  return (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>);
}
