import { useState, useEffect, useRef, useMemo } from "react";
import { X } from "lucide-react";
import { ERROR_MESSAGES } from "@/lib/errorMessages";
import { toast } from "sonner";
import { getApiBase } from "@/lib/apiClient";
import { useCronHealth } from "@/hooks/useCronHealth";

interface AIStatusBarProps {
  businessId: string | null;
}

const HIDE_EVENTS = new Set(["heartbeat", "ping", "connected", "test", "undefined", "", "ai_event_received", "content_published_sent", "keepalive"]);
const EVENT_MESSAGES: Record<string, string> = {
  content_created: "✍️ New post generated",
  content_published: "✅ Post published",
  content_approved: "✅ Content approved",
  lead_captured: "🔥 New lead captured",
  campaign_created: "📣 Campaign created",
  competitor_analyzed: "🎯 Competitor analysis complete",
  seo_audit_complete: "🔍 SEO audit complete",
  brain_updated: "🧠 Strategy updated",
  email_sent: "📧 Email sent",
  seo_audit: "🔍 SEO audit complete",
  competitor_alert: "🎯 Competitor alert",
};

const FALLBACK_IDLE_MESSAGES = [
  "● AI is monitoring your business 24/7",
];

function relativeAge(hours: number | null): string {
  if (hours === null || hours === undefined) return "just now";
  if (hours < 1) return "moments ago";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

type StatusState = "idle" | "working" | "success" | "error";

export default function AIStatusBar({ businessId }: AIStatusBarProps) {
  const cronHealth = useCronHealth(businessId);
  const [status, setStatus] = useState<StatusState>("idle");
  const [message, setMessage] = useState(FALLBACK_IDLE_MESSAGES[0]);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const msgIdx = useRef(0);

  // Build the rotating idle messages from real cron-health timestamps when
  // available; otherwise fall back to a single generic line.
  const idleMessages = useMemo<string[]>(() => {
    const data = cronHealth.data;
    if (!data) return FALLBACK_IDLE_MESSAGES;
    const entries: { label: string; healthy: boolean; age: number | null; lastRun: string | null }[] = [
      { label: "Content engine", healthy: data.content_generation.healthy, age: data.content_generation.age_hours, lastRun: data.content_generation.last_run_at },
      { label: "Lead scoring", healthy: data.lead_scoring.healthy, age: data.lead_scoring.age_hours, lastRun: data.lead_scoring.last_run_at },
      { label: "Competitor monitoring", healthy: data.competitor_monitor.healthy, age: data.competitor_monitor.age_hours, lastRun: data.competitor_monitor.last_run_at },
      { label: "Performance tracker", healthy: data.analytics_snapshot.healthy, age: data.analytics_snapshot.age_hours, lastRun: data.analytics_snapshot.last_run_at },
      { label: "Retention emails", healthy: data.retention_emails.healthy, age: data.retention_emails.age_hours, lastRun: data.retention_emails.last_run_at },
      { label: "Win notifications", healthy: data.win_notifications.healthy, age: data.win_notifications.age_hours, lastRun: data.win_notifications.last_run_at },
    ];
    const messages = entries
      .filter((e) => e.lastRun)
      .map((e) => `● ${e.label} — last run ${relativeAge(e.age)}`);
    return messages.length > 0 ? messages : FALLBACK_IDLE_MESSAGES;
  }, [cronHealth.data]);

  // Reset to first idle message when the cron-health source changes.
  useEffect(() => {
    msgIdx.current = 0;
    setMessage(idleMessages[0]);
  }, [idleMessages]);

  // Cycle idle messages with fade
  useEffect(() => {
    if (status !== "idle") return;
    if (idleMessages.length <= 1) return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        msgIdx.current = (msgIdx.current + 1) % idleMessages.length;
        setMessage(idleMessages[msgIdx.current]);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(cycle);
  }, [status, idleMessages]);

  // SSE connection
  useEffect(() => {
    if (!businessId) return;
    const apiBase = getApiBase();
    if (!apiBase) return;
    let es: EventSource;
    try {
      es = new EventSource(`${apiBase}/webhook/dashboard-events?business_id=${businessId}`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type || "";
          if (!type || HIDE_EVENTS.has(type.toLowerCase())) return;
          const humanMsg = EVENT_MESSAGES[type];
          if (!humanMsg) return;
          setStatus("success");
          setMessage(humanMsg);
          setVisible(true);
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setStatus("idle");
            setMessage(idleMessages[0]);
          }, 5000);
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") return;
          toast.error(ERROR_MESSAGES.LOAD_FAILED);
        }
      };
      es.onerror = () => es.close();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(ERROR_MESSAGES.LOAD_FAILED);
    }
    return () => { es?.close(); clearTimeout(timerRef.current); };
  }, [businessId]);

  const dismiss = () => { setStatus("idle"); setMessage(idleMessages[0]); };

  const bgColor = status === "idle" ? "rgba(48,209,88,0.06)" : status === "success" ? "rgba(48,209,88,0.12)" : status === "working" ? "rgba(8, 129, 255,0.08)" : "rgba(220,38,38,0.08)";
  const textColor = status === "idle" ? "#30D158" : status === "success" ? "#30D158" : status === "working" ? "#0881FF" : "#DC2626";

  return (
    <div style={{
      height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      background: bgColor, borderBottom: "1px solid rgba(128,128,128,0.1)",
      fontSize: 12, fontWeight: 500, color: textColor,
      opacity: visible ? 1 : 0, transition: "opacity 400ms ease",
    }}>
      {status === "idle" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#30D158", boxShadow: "0 0 6px rgba(48,209,88,0.5)" }} />}
      {status === "working" && <span style={{ width: 14, height: 14, border: "2px solid #0881FF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
      <span>{message}</span>
      {status === "error" && (
        <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: textColor }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      )}
    </div>
  );
}
