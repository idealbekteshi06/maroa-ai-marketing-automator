import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ERROR_MESSAGES } from "@/lib/errorMessages";
import { toast } from "sonner";
import { getApiBase } from "@/lib/apiClient";

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

const IDLE_MESSAGES = [
  "● AI is monitoring your business 24/7",
  "● Content generation running — posts scheduled",
  "● Lead scoring active — contacts tracked",
  "● Competitor monitoring — weekly scan active",
  "● Email sequences processing automatically",
  "● SEO monitoring — next audit Sunday",
];

type StatusState = "idle" | "working" | "success" | "error";

export default function AIStatusBar({ businessId }: AIStatusBarProps) {
  const [status, setStatus] = useState<StatusState>("idle");
  const [message, setMessage] = useState(IDLE_MESSAGES[0]);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const msgIdx = useRef(0);

  // Cycle idle messages with fade
  useEffect(() => {
    if (status !== "idle") return;
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        msgIdx.current = (msgIdx.current + 1) % IDLE_MESSAGES.length;
        setMessage(IDLE_MESSAGES[msgIdx.current]);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(cycle);
  }, [status]);

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
            setMessage(IDLE_MESSAGES[0]);
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

  const dismiss = () => { setStatus("idle"); setMessage(IDLE_MESSAGES[0]); };

  const bgColor = status === "idle" ? "rgba(48,209,88,0.06)" : status === "success" ? "rgba(48,209,88,0.12)" : status === "working" ? "rgba(10,132,255,0.08)" : "rgba(220,38,38,0.08)";
  const textColor = status === "idle" ? "#30D158" : status === "success" ? "#30D158" : status === "working" ? "#0A84FF" : "#DC2626";

  return (
    <div style={{
      height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      background: bgColor, borderBottom: "1px solid rgba(128,128,128,0.1)",
      fontSize: 12, fontWeight: 500, color: textColor,
      opacity: visible ? 1 : 0, transition: "opacity 400ms ease",
    }}>
      {status === "idle" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#30D158", boxShadow: "0 0 6px rgba(48,209,88,0.5)" }} />}
      {status === "working" && <span style={{ width: 14, height: 14, border: "2px solid #0A84FF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
      <span>{message}</span>
      {status === "error" && (
        <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: textColor }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      )}
    </div>
  );
}
