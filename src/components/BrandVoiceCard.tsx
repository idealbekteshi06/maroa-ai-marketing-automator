import { Mic, Edit3, Volume2, VolumeX, Quote, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BrandVoice = {
  /** Short descriptor: "warm, family-owned, understated confidence" */
  tone?: string;
  /** Words/phrases that fit the brand. */
  do_use?: string[];
  /** Words/phrases the brand should NEVER say. */
  do_not_use?: string[];
  /** Verbatim phrases customers use about the brand. */
  customer_phrases?: string[];
  /** ISO timestamp of last refresh. */
  updated_at?: string | null;
  /** Optional confidence the model has in this voice (0-100). */
  confidence?: number;
  /** Source — e.g. "Reviews · website · social". */
  derived_from?: string;
};

interface BrandVoiceCardProps {
  voice: BrandVoice | null | undefined;
  loading?: boolean;
  onEdit?: () => void;
  onRefresh?: () => void;
  className?: string;
  compact?: boolean;
}

function formatRelative(iso?: string | null): string {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function BrandVoiceCard({
  voice,
  loading = false,
  onEdit,
  onRefresh,
  className,
  compact = false,
}: BrandVoiceCardProps) {
  const hasVoice =
    voice &&
    (voice.tone ||
      (voice.do_use && voice.do_use.length > 0) ||
      (voice.do_not_use && voice.do_not_use.length > 0) ||
      (voice.customer_phrases && voice.customer_phrases.length > 0));

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!hasVoice) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Your AI is still learning your voice</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We're reading your reviews, website copy, and customer interactions. The first version of your brand voice
              arrives within ~2 hours.
            </p>
            {onRefresh && (
              <Button variant="outline" size="sm" className="mt-3" onClick={onRefresh}>
                Re-run brand voice analysis
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mic className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">Your brand voice</p>
            <p className="text-xs text-muted-foreground">
              {voice?.derived_from ? `Derived from ${voice.derived_from}` : "Derived from your reviews + content"}
              {voice?.updated_at ? ` · Updated ${formatRelative(voice.updated_at)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {typeof voice?.confidence === "number" && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
              {Math.round(voice.confidence)}% confidence
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>
      </header>

      {voice?.tone && (
        <div className="mb-4 rounded-lg border border-border/60 bg-background/40 p-3">
          <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Quote className="h-3 w-3" />
            Tone
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">{voice.tone}</p>
        </div>
      )}

      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        {voice?.do_use && voice.do_use.length > 0 && (
          <section>
            <p className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-success">
              <Volume2 className="h-3 w-3" />
              Sounds like us
            </p>
            <ul className="space-y-1">
              {voice.do_use.slice(0, compact ? 3 : 5).map((phrase, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 rounded-md bg-success/5 px-2 py-1 text-xs text-foreground/90"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" strokeWidth={3} />
                  <span>{phrase}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {voice?.do_not_use && voice.do_not_use.length > 0 && (
          <section>
            <p className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-destructive">
              <VolumeX className="h-3 w-3" />
              Never sounds like us
            </p>
            <ul className="space-y-1">
              {voice.do_not_use.slice(0, compact ? 3 : 5).map((phrase, i) => (
                <li
                  key={i}
                  className="rounded-md bg-destructive/5 px-2 py-1 text-xs text-foreground/70 line-through"
                >
                  {phrase}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {!compact && voice?.customer_phrases && voice.customer_phrases.length > 0 && (
        <section className="mt-4 border-t border-border/60 pt-4">
          <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Quote className="h-3 w-3" />
            What customers actually say
          </p>
          <div className="flex flex-wrap gap-1.5">
            {voice.customer_phrases.slice(0, 8).map((phrase, i) => (
              <span
                key={i}
                className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] text-foreground/85"
              >
                "{phrase}"
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] italic text-muted-foreground">
            Maroa reuses these verbatim — they outperform anything generated by an LLM alone.
          </p>
        </section>
      )}
    </div>
  );
}
