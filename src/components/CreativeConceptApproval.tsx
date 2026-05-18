// @ts-nocheck
import { useState, useEffect } from "react";
import {
  developCreativeConcept,
  creativeConceptDecision,
  listCreativeConcepts,
  type CreativeConcept,
} from "@/lib/api";

interface ConceptRow {
  id: string;
  content_goal: string;
  idea_level: string;
  insight: string;
  top_concept: CreativeConcept["top_concept"];
  weighted_score: number;
  humankind_score: number;
  pattern: string;
  status: string;
  created_at: string;
}

interface Props {
  businessId: string;
  onApproved?: (conceptId: string) => void;
}

const PATTERN_NAMES: Record<string, string> = {
  P01: "Idea vs Enemy",
  P02: "Behavior Inversion",
  P03: "Brand as Activist",
  P04: "Cultural Hijack",
  P05: "Limitation as Power",
  P06: "Invisible Brand",
  P07: "Craft as Message",
  P08: "User as Co-Author",
  P09: "Serialization & Ritual",
  P10: "Absurd as Carrier",
  P11: "Social Experiment",
  P12: "Truth Telling",
  P13: "Product as Proof",
  P14: "Benefit Hyperbole",
  P15: "Long-form Drama",
  P16: "Design as Idea",
  P17: "Tech as Canvas",
  P18: "Behavior Change Over Time",
};

export function CreativeConceptApproval({ businessId, onApproved }: Props) {
  const [concepts, setConcepts] = useState<ConceptRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [contentGoal, setContentGoal] = useState("");
  const [decisioning, setDecisioning] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [businessId]);

  async function refresh() {
    try {
      const r = await listCreativeConcepts({ businessId, limit: 10 });
      setConcepts(r.concepts || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function generate() {
    if (!contentGoal.trim()) {
      setErr("Tell us what content goal — e.g. 'monthly hero campaign' or 'Reel for new product launch'");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await developCreativeConcept({ businessId, contentGoal, ideaLevel: "campaign" });
      setContentGoal("");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function decide(conceptId: string, decision: "approve" | "reject" | "use") {
    setDecisioning(conceptId);
    try {
      await creativeConceptDecision({ businessId, conceptId, decision });
      await refresh();
      if (decision === "approve" || decision === "use") onApproved?.(conceptId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setDecisioning(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold">Develop a strategic concept (Cannes-grade)</div>
        <div className="text-xs text-muted-foreground">
          Runs Claude Opus through the creative-director framework: insight extraction, 3-method ideation,
          6-criteria scoring, pattern saturation cap, kill-argument check.
        </div>
        <div className="flex gap-2">
          <input
            value={contentGoal}
            onChange={(e) => setContentGoal(e.target.value)}
            placeholder="e.g. 'monthly hero campaign for spring' or 'Reel for new product launch'"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          />
          <button
            type="button"
            onClick={generate}
            disabled={loading || !contentGoal.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Develop Concept"}
          </button>
        </div>
        {err ? <div className="text-xs text-destructive">{err}</div> : null}
      </div>

      {concepts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No concepts yet. Pick a content goal above and run the framework.
        </div>
      ) : (
        <div className="space-y-3">
          {concepts.map((c) => {
            const t = c.top_concept || ({} as CreativeConcept["top_concept"]);
            const scores = t.scores || ({} as CreativeConcept["top_concept"]["scores"]);
            const pattern = c.pattern || t.pattern;
            return (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.content_goal}</div>
                    <div className="mt-1 text-base font-semibold">{t.name}</div>
                    <div className="mt-1 text-sm text-foreground/90">{t.one_sentence}</div>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs ${statusClass(c.status)}`}>{c.status}</span>
                </div>

                <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs">
                  <div className="font-medium text-muted-foreground">Insight</div>
                  <div className="mt-1 text-sm">{c.insight}</div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <ScorePill label="Weighted" value={c.weighted_score ?? scores.weighted} max={10} />
                  <ScorePill label="HumanKind" value={c.humankind_score ?? scores.humankind} max={10} />
                  <ScorePill label="Originality" value={scores.originality} max={10} />
                  <ScorePill label="Emotion T" value={scores.emotion_tier} max={3} accent />
                </div>

                {pattern ? (
                  <div className="mt-3 text-xs">
                    <span className="rounded bg-secondary px-2 py-1 font-mono">{pattern}</span>
                    <span className="ml-2 text-muted-foreground">{PATTERN_NAMES[pattern] || ""}</span>
                  </div>
                ) : null}

                {t.comparable_canon ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Stands alongside: <span className="text-foreground/80">{t.comparable_canon}</span>
                  </div>
                ) : null}

                {t.kill_argument ? (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Argument against (kill-argument)</summary>
                    <p className="mt-1 text-foreground/80">{t.kill_argument}</p>
                  </details>
                ) : null}

                {t.downstream_brief_for_higgsfield ? (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Downstream MCSLA brief</summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2 font-mono text-[11px]">
{JSON.stringify(t.downstream_brief_for_higgsfield, null, 2)}
                    </pre>
                  </details>
                ) : null}

                {c.status === "pending_review" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => decide(c.id, "use")}
                      disabled={decisioning === c.id}
                      className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      Use this →
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(c.id, "approve")}
                      disabled={decisioning === c.id}
                      className="rounded-md border border-border px-3 py-1 text-xs hover:bg-secondary disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(c.id, "reject")}
                      disabled={decisioning === c.id}
                      className="rounded-md border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value, max, accent = false }: { label: string; value?: number | null; max: number; accent?: boolean }) {
  const v = typeof value === "number" ? value : 0;
  const pct = max > 0 ? Math.min(100, Math.round((v / max) * 100)) : 0;
  const tone = accent ? "bg-amber-500/20 text-amber-700" : v >= 8 ? "bg-emerald-500/20 text-emerald-700" : v >= 6 ? "bg-blue-500/20 text-blue-700" : "bg-muted text-muted-foreground";
  return (
    <div className={`rounded-md px-2 py-1 ${tone}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="font-mono text-sm font-semibold">
        {v.toFixed(1)}<span className="opacity-50">/{max}</span>
      </div>
      <div className="mt-0.5 h-1 rounded bg-foreground/10">
        <div className="h-full rounded bg-current opacity-60" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function statusClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-500/20 text-emerald-700";
    case "used":
      return "bg-primary/20 text-primary";
    case "rejected":
      return "bg-destructive/20 text-destructive";
    case "pending_review":
    default:
      return "bg-amber-500/20 text-amber-700";
  }
}