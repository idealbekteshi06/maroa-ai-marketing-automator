import { useAuth } from "@/contexts/AuthContext";
import { Card, Btn, Pill } from "@/v2/components/common/Card";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { useIntegrations, useBilling, useBrandDna } from "@/v2/lib/api/hooks/useModules";
import { Building2, MessageSquareQuote, Plug, Zap, CreditCard, Check } from "lucide-react";
import { useState } from "react";

type AutopilotMode = "manual" | "review" | "autopilot";

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
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const integrations = useIntegrations(bid);
  const billing = useBilling(bid);
  const brand = useBrandDna(bid);

  const [mode, setMode] = useState<AutopilotMode>(
    business?.autopilot_enabled ? "autopilot" : "review",
  );

  const integList = Array.isArray(integrations.data) ? integrations.data : [];
  const brandD = brand.data as any;
  const billingD = billing.data as any;

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
        action={<Btn variant="secondary">Edit</Btn>}
      >
        <Field label="Business name" value={business?.business_name ?? business?.name} />
        <Field label="Primary goal" value={business?.primary_goal} />
        <Field
          label="Monthly budget"
          value={business?.monthly_budget ? `$${business.monthly_budget}` : null}
        />
        <Field label="Owner email" value={user?.email} />
      </Card>

      <Card title="Brand voice" action={<Btn variant="secondary">Edit voice</Btn>}>
        {brand.isLoading ? (
          <div className="h-16 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
        ) : (
          <>
            <Field label="Tone" value={brandD?.tone ?? brandD?.voice?.tone} />
            <Field label="Mission" value={brandD?.mission} />
            <Field label="Audience" value={brandD?.audience ?? brandD?.target_audience} />
          </>
        )}
      </Card>

      <Card title="Connected accounts" padded={false}>
        {integrations.isLoading ? (
          <div className="p-5 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : integList.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Plug
              size={20}
              strokeWidth={1.5}
              className="mx-auto mb-2"
              style={{ color: "hsl(var(--m-muted-foreground))" }}
            />
            <p className="text-[12.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              Connect your social, ad, and analytics accounts to give Maroa context.
            </p>
            <Btn variant="primary" className="mt-3">
              Connect an account
            </Btn>
          </div>
        ) : (
          <ul>
            {integList.map((it: any, idx: number) => (
              <li
                key={it.id ?? idx}
                className="px-5 py-3 flex items-center gap-3"
                style={{
                  borderBottom:
                    idx === integList.length - 1
                      ? "none"
                      : "1px solid hsl(var(--m-border-subtle))",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(var(--m-surface))", border: "1px solid hsl(var(--m-border-subtle))" }}
                >
                  <Plug size={13} strokeWidth={1.75} style={{ color: "hsl(var(--m-muted-foreground))" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">
                    {it.provider ?? it.name ?? "Integration"}
                  </div>
                  <div className="text-[11px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {it.account_name ?? it.account ?? "—"}
                  </div>
                </div>
                <Pill tone={it.status === "connected" ? "success" : "muted"}>
                  {it.status ?? "—"}
                </Pill>
                <Btn variant="ghost">Manage</Btn>
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
                onClick={() => setMode(m.id)}
                className="text-left p-4 rounded-xl transition-all"
                style={{
                  background: active
                    ? "hsl(var(--m-accent) / 0.06)"
                    : "hsl(var(--m-surface))",
                  border: `1px solid ${
                    active ? "hsl(var(--m-accent))" : "hsl(var(--m-border-subtle))"
                  }`,
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
                <p
                  className="text-[12px] leading-relaxed"
                  style={{ color: "hsl(var(--m-muted-foreground))" }}
                >
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Billing" action={<Btn variant="secondary">Manage billing</Btn>}>
        <Field
          label="Plan"
          value={
            (business?.plan
              ? business.plan[0].toUpperCase() + business.plan.slice(1)
              : null) ?? billingD?.plan
          }
        />
        <Field label="Status" value={billingD?.status ?? "Active"} />
        <Field label="Next invoice" value={billingD?.next_invoice_date} />
      </Card>
    </div>
  );
}
