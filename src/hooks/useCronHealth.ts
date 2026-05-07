import { useEffect, useState } from "react";
import { getCronHealth, type CronHealthDto } from "@/lib/apiClient";

const POLL_INTERVAL_MS = 5 * 60_000; // 5 minutes — banner only, no need to be aggressive

export interface UseCronHealthState {
  data: CronHealthDto | null;
  loading: boolean;
  error: string | null;
}

/**
 * Polls /api/cron-health/:businessId. Drives the live "Lead scoring active",
 * "Competitor monitoring", "SEO monitoring" status banners on Home — so the
 * banner reflects whether the cron actually ran in its expected window, not
 * a hardcoded string.
 */
export function useCronHealth(businessId: string | null | undefined): UseCronHealthState {
  const [state, setState] = useState<UseCronHealthState>({
    data: null,
    loading: !!businessId,
    error: null,
  });

  useEffect(() => {
    if (!businessId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();

    const fetchOnce = async () => {
      try {
        const data = await getCronHealth(businessId, ctrl.signal);
        if (cancelled) return;
        setState({ data, loading: false, error: data ? null : "no-data" });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "fetch_failed",
        }));
      }
    };

    fetchOnce();
    const id = window.setInterval(fetchOnce, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [businessId]);

  return state;
}

/** Compute the most prominent message to surface at the top of the dashboard. */
export interface CronStatusMessage {
  label: string;
  status: "ok" | "stale" | "missing";
  detail: string;
}

export function pickHomeStatusMessage(data: CronHealthDto | null): CronStatusMessage {
  if (!data) {
    return {
      label: "AI is monitoring your business 24/7",
      status: "ok",
      detail: "Status checks resume in a moment.",
    };
  }
  const slots = [
    { key: "content_generation", label: "Content engine", interval: "weekly" },
    { key: "competitor_monitor", label: "Competitor monitoring", interval: "weekly" },
    { key: "analytics_snapshot", label: "Performance tracker", interval: "daily" },
    { key: "lead_scoring", label: "Lead scoring", interval: "daily" },
    { key: "retention_emails", label: "Retention emails", interval: "daily" },
    { key: "win_notifications", label: "Win notifications", interval: "every 6h" },
  ] as const;

  // Prefer surfacing the most recently-run healthy cron — it's a real activity
  // signal and reads better than a generic "all systems green" banner.
  const healthy = slots
    .map((s) => ({ slot: s, val: data[s.key as keyof CronHealthDto] }))
    .filter((x) => x.val && typeof x.val === "object" && "healthy" in x.val && (x.val as { healthy: boolean }).healthy)
    .map((x) => ({ slot: x.slot, val: x.val as CronHealthDto["lead_scoring"] }))
    .sort((a, b) => {
      const aTs = a.val.last_run_at ? new Date(a.val.last_run_at).getTime() : 0;
      const bTs = b.val.last_run_at ? new Date(b.val.last_run_at).getTime() : 0;
      return bTs - aTs;
    });

  if (healthy.length > 0) {
    const top = healthy[0];
    const ageHours = top.val.age_hours ?? 0;
    let when = "just now";
    if (ageHours >= 24) when = `${Math.round(ageHours / 24)}d ago`;
    else if (ageHours >= 1) when = `${ageHours}h ago`;
    return {
      label: `${top.slot.label} ran ${when}`,
      status: "ok",
      detail: `Next run ${top.slot.interval}.`,
    };
  }

  // No healthy cron ran — surface the most overdue one as a stale warning.
  const stale = slots
    .map((s) => ({ slot: s, val: data[s.key as keyof CronHealthDto] }))
    .filter((x) => x.val && typeof x.val === "object" && "last_run_at" in x.val) as Array<{
      slot: typeof slots[number];
      val: CronHealthDto["lead_scoring"];
    }>;

  if (stale.length === 0) {
    return {
      label: "Your AI is setting up",
      status: "missing",
      detail: "First scheduled runs land within 24 hours.",
    };
  }
  const oldest = stale.reduce(
    (acc, x) => (acc.val.age_hours ?? 0) > (x.val.age_hours ?? 0) ? acc : x,
    stale[0],
  );
  return {
    label: `${oldest.slot.label} hasn't run yet`,
    status: "missing",
    detail: oldest.val.last_run_at ? `Last run ${oldest.val.age_hours}h ago.` : "Awaiting first run.",
  };
}
