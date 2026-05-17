import { useState } from "react";
import { vetCustomerAsset, smartProcessAsset, type VetterVerdict } from "@/lib/api";

interface Props {
  businessId: string;
  defaultContentTheme?: string;
}

const VERDICT_LABELS: Record<VetterVerdict["verdict"], { label: string; tone: string; description: string }> = {
  use_as_is: { label: "Use as-is", tone: "bg-emerald-500/20 text-emerald-700", description: "Skip Higgsfield. Publish directly. Saves credits." },
  enhance_via_higgsfield: { label: "Enhance", tone: "bg-blue-500/20 text-blue-700", description: "Soul I2I will restage lighting/composition while preserving the subject." },
  regenerate_fresh: { label: "Regenerate", tone: "bg-amber-500/20 text-amber-700", description: "Use as visual reference only. Generate new with full MCSLA prompt." },
  reject: { label: "Reject", tone: "bg-destructive/20 text-destructive", description: "Don't use. Reason returned to dashboard." },
};

const DIMENSIONS = ["technical", "composition", "lighting", "brand_alignment", "genre_fit", "marketing_suitability", "safety", "genuineness"] as const;

export function ImageVetter({ businessId, defaultContentTheme }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [contentTheme, setContentTheme] = useState(defaultContentTheme || "");
  const [verdict, setVerdict] = useState<VetterVerdict | null>(null);
  const [smartResult, setSmartResult] = useState<{ verdict: VetterVerdict; generated: string[]; path: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function vet() {
    if (!imageUrl.startsWith("http")) {
      setErr("Paste a public image URL");
      return;
    }
    setLoading(true);
    setErr(null);
    setVerdict(null);
    setSmartResult(null);
    try {
      const v = await vetCustomerAsset({ businessId, imageUrl, contentTheme });
      setVerdict(v);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function smartRun() {
    if (!imageUrl.startsWith("http")) {
      setErr("Paste a public image URL");
      return;
    }
    setLoading(true);
    setErr(null);
    setVerdict(null);
    setSmartResult(null);
    try {
      const r = await smartProcessAsset({ businessId, imageUrl, contentTheme });
      setSmartResult(r);
      setVerdict(r.verdict);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold">Vet a customer-uploaded image</div>
        <p className="mt-1 text-xs text-muted-foreground">
          8-dimension scoring with per-genre weights. Decides per image: use as-is / enhance via Soul I2I / regenerate fresh / reject.
        </p>
        <div className="mt-3 space-y-2">
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://...image.jpg"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            disabled={loading}
          />
          <input
            value={contentTheme}
            onChange={(e) => setContentTheme(e.target.value)}
            placeholder="Content theme (e.g. 'product hero shot for instagram')"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={vet}
              disabled={loading || !imageUrl.startsWith("http")}
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
            >
              {loading ? "Scoring…" : "Vet only"}
            </button>
            <button
              type="button"
              onClick={smartRun}
              disabled={loading || !imageUrl.startsWith("http")}
              className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Processing…" : "Vet + auto-process"}
            </button>
          </div>
        </div>
        {err ? <div className="mt-2 text-xs text-destructive">{err}</div> : null}
      </div>

      {verdict ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Verdict</div>
              <div className={`mt-1 inline-block rounded px-2 py-1 text-sm font-semibold ${VERDICT_LABELS[verdict.verdict].tone}`}>
                {VERDICT_LABELS[verdict.verdict].label}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{VERDICT_LABELS[verdict.verdict].description}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
              <div className="font-mono text-2xl font-bold">{verdict.total_100.toFixed(1)}<span className="text-sm opacity-50">/100</span></div>
              {verdict.borderline ? <div className="text-[10px] uppercase text-amber-600">borderline</div> : null}
              {verdict.manual_review_recommended ? <div className="text-[10px] uppercase text-amber-600">manual review</div> : null}
              <div className="mt-1 text-xs text-muted-foreground">genre: {verdict.genre}</div>
            </div>
          </div>

          {verdict.hard_gates_fired && verdict.hard_gates_fired.length > 0 ? (
            <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
              <div className="font-semibold text-destructive">Hard gate fired</div>
              {verdict.hard_gates_fired.map((g, i) => (
                <div key={i} className="text-foreground/80">[{g.name}] forces {g.forces}: {g.reason}</div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DIMENSIONS.map((d) => (
              <DimPill key={d} label={d.replace(/_/g, " ")} value={verdict.scores[d]} />
            ))}
          </div>

          {verdict.notes ? (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground">Per-dimension notes</summary>
              <div className="mt-1 space-y-1">
                {Object.entries(verdict.notes).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}><span className="font-mono text-foreground/60">{k}:</span> {v}</div>
                ))}
              </div>
            </details>
          ) : null}

          {verdict.next_action?.i2i_prompts ? (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground">Soul I2I enhance prompts</summary>
              <div className="mt-2 space-y-2">
                {verdict.next_action.i2i_prompts.map((p) => (
                  <div key={p.aspect_ratio} className="rounded bg-muted/40 p-2">
                    <div className="text-[10px] uppercase text-muted-foreground">{p.aspect_ratio}</div>
                    <div className="mt-1 font-mono text-[11px] whitespace-pre-wrap">{p.prompt}</div>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          {smartResult && smartResult.generated.length > 0 ? (
            <div className="mt-3">
              <div className="text-xs font-semibold text-muted-foreground">Generated assets ({smartResult.path})</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {smartResult.generated.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-square overflow-hidden rounded border border-border bg-muted"
                  >
                    <img src={u} alt="Generated asset" className="h-full w-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DimPill({ label, value }: { label: string; value: number }) {
  const v = typeof value === "number" ? value : 0;
  const tone = v >= 8 ? "bg-emerald-500/20 text-emerald-700" : v >= 6 ? "bg-blue-500/20 text-blue-700" : v >= 4 ? "bg-amber-500/20 text-amber-700" : "bg-destructive/20 text-destructive";
  return (
    <div className={`rounded-md px-2 py-1 ${tone}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="font-mono text-sm font-semibold">{v.toFixed(1)}<span className="opacity-50">/10</span></div>
      <div className="mt-0.5 h-1 rounded bg-foreground/10">
        <div className="h-full rounded bg-current opacity-60" style={{ width: `${Math.min(100, (v / 10) * 100)}%` }} />
      </div>
    </div>
  );
}
