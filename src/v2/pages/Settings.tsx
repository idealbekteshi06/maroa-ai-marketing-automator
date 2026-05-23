import { useState, useEffect } from "react";
import { Card, Btn, Pill } from "@/v2/components/common/Card";
import { useSettingsPageData } from "@/v2/lib/data/usePageData";
import {
  updateAutopilotMode,
  editBusinessProfile,
  editBrandVoice,
  connectSocialAccount,
  manageConnectedAccount,
  manageBilling,
} from "@/v2/lib/data/handlers";
import type { AutopilotMode } from "@/v2/lib/data/types";
import { Plug, Check, AlertCircle } from "lucide-react";

const MODES: { id: AutopilotMode; label: string; desc: string }[] = [
  { id: "manual", label: "Manual", desc: "Maroa drafts. You decide every action." },
  { id: "review", label: "Review mode", desc: "Maroa works. You approve before anything ships." },
  { id: "autopilot", label: "Autopilot", desc: "Maroa runs your marketing. You see the receipts." },
];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3" style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
      <div className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
        {label}
      </div>
      <div className="col-span-2 text-[13px]">{value ?? "—"}</div>
    </div>
  );
}

export default function SettingsPage() {
  const state = useSettingsPageData();
  const [mode, setMode] = useState<AutopilotMode>("review");

  useEffect(() => {
    if (state.status === "success" || state.status === "empty") {
      setMode(state.data.autopilotMode);
    }
  }, [state.status, state.status === "success" || state.status === "empty" ? state.data.autopilotMode : null]);

  if (state.status === "error") {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} style={{ color: "hsl(var(--m-destructive))" }} />
          <div>
            <div className="text-[14px] font-medium">We couldn't load your settings.</div>
            <p className="text-[12.5px] mt-1" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Please refresh in a moment.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isLoading = state.status === "loading";
  const data = state.status === "loading" ? undefined : state.data;

  const handleModeChange = (m: AutopilotMode) => {
    setMode(m);
    updateAutopilotMode(m);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] mt-0.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
          Tune your business, voice, accounts, and how much Maroa is allowed to do.
        </p>
      </header>

      <Card
        title="Business profile"
        action={<Btn variant="secondary" onClick={() => editBusinessProfile()}>Edit</Btn>}
      >
        <Field label="Business name" value={data?.profile.businessName} />
        <Field label="Primary goal" value={data?.profile.primaryGoal} />
        <Field
          label="Monthly budget"
          value={data?.profile.monthlyBudget ? `$${data.profile.monthlyBudget}` : null}
        />
        <Field label="Owner email" value={data?.profile.ownerEmail} />
      </Card>

      <Card title="Brand voice" action={<Btn variant="secondary" onClick={() => editBrandVoice()}>Edit voice</Btn>}>
        {isLoading ? (
          <div className="h-16 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
        ) : (
          <>
            <Field label="Tone" value={data?.brandVoice.tone} />
            <Field label="Mission" value={data?.brandVoice.mission} />
            <Field label="Audience" value={data?.brandVoice.audience} />
          </>
        )}
      </Card>

      <Card title="Connected accounts" padded={false}>
        {isLoading ? (
          <div className="p-5 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : !data || data.connectedAccounts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Plug size={20} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: "hsl(var(--m-muted-foreground))" }} />
            <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Connect your social, ad, and analytics accounts to give Maroa context.
            </p>
            <Btn variant="primary" className="mt-3" onClick={() => connectSocialAccount()}>
              Connect an account
            </Btn>
          </div>
        ) : (
          <ul>
            {data.connectedAccounts.map((it, idx) => (
              <li
                key={it.id}
                className="px-5 py-3 flex items-center gap-3"
                style={{
                  borderBottom: idx === data.connectedAccounts.length - 1 ? "none" : "1px solid hsl(var(--m-border-subtle))",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }}
                >
                  <Plug size={13} strokeWidth={1.75} style={{ color: "hsl(var(--m-muted-foreground))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{it.provider}</div>
                  <div className="text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {it.accountName}
                  </div>
                </div>
                <Pill tone={it.status === "connected" ? "success" : it.status === "needs_attention" ? "warning" : "muted"}>
                  {it.status === "connected" ? "Connected" : it.status === "needs_attention" ? "Needs attention" : "Disconnected"}
                </Pill>
                <Btn variant="ghost" onClick={() => manageConnectedAccount(it.id)}>Manage</Btn>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Autopilot mode">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className="text-left p-4 rounded-xl transition-all"
                style={{
                  background: active ? "hsl(var(--m-accent) / 0.06)" : "hsl(var(--m-surface))",
                  border: `1px solid ${active ? "hsl(var(--m-accent))" : "hsl(var(--m-border-subtle))"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-semibold">{m.label}</span>
                  {active && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(var(--m-accent))", color: "hsl(var(--m-accent-foreground))" }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Billing" action={<Btn variant="secondary" onClick={() => manageBilling()}>Manage billing</Btn>}>
        <Field label="Plan" value={data?.billing.planName} />
        <Field label="Status" value={data?.billing.status} />
        <Field label="Next invoice" value={data?.billing.nextInvoiceDate} />
      </Card>
    </div>
  );
}
