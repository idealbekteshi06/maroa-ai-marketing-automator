/**
 * Side-drawer for reviewing a single content piece on the Today page.
 * Shows the full caption / preview and lets the operator approve,
 * request changes, or reject without leaving the page.
 *
 * Keyboard: A = approve · R = reject · Esc = close.
 */
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Btn, Pill } from "@/v2/components/common/Card";
import {
  approveApprovalItem,
  rejectApprovalItem,
  requestApprovalChanges,
} from "@/v2/lib/data/handlers";
import { Loader2, Instagram, Facebook, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    platform?: string;
    caption?: string;
    hashtags?: string[];
    mediaUrl?: string | null;
    status?: string;
    scheduledAt?: string | null;
  } | null;
}

const PLATFORM_ICON: Record<string, typeof Instagram> = {
  Instagram,
  Facebook,
};

export default function ReviewDrawer({ open, onClose, item }: Props) {
  const [busy, setBusy] = useState<"approve" | "reject" | "changes" | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open, item?.id]);

  const run = async (kind: "approve" | "reject" | "changes") => {
    if (!item) return;
    setBusy(kind);
    try {
      if (kind === "approve") await approveApprovalItem(item.id);
      else if (kind === "reject") await rejectApprovalItem(item.id, note || undefined);
      else await requestApprovalChanges(item.id, note || "Please revise.");
      onClose();
    } finally {
      setBusy(null);
    }
  };

  // keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "a" || e.key === "A") run("approve");
      if (e.key === "r" || e.key === "R") run("reject");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id, note]);

  const Icon = useMemo(() => {
    if (!item?.platform) return Sparkles;
    return PLATFORM_ICON[item.platform] ?? Sparkles;
  }, [item?.platform]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
        style={{ background: "hsl(var(--m-background))" }}
      >
        <SheetHeader
          className="px-5 h-14 flex-row items-center justify-between space-y-0 shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}
        >
          <SheetTitle className="text-[13px] font-semibold flex items-center gap-2">
            <Icon size={14} strokeWidth={1.75} />
            Review post
          </SheetTitle>
          {item?.platform && <Pill tone="muted">{item.platform}</Pill>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {!item ? (
            <div className="p-8 text-center text-[13px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
              No item selected.
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {item.mediaUrl && (
                <img
                  src={item.mediaUrl}
                  alt=""
                  className="w-full rounded-xl object-cover max-h-72"
                  style={{ border: "1px solid hsl(var(--m-border-subtle))" }}
                />
              )}

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  Topic
                </div>
                <div className="text-[15px] font-semibold leading-snug">{item.title}</div>
              </div>

              {item.caption && (
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    Caption
                  </div>
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">
                    {item.caption}
                  </p>
                </div>
              )}

              {item.hashtags && item.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.hashtags.map((h) => (
                    <span
                      key={h}
                      className="text-[11.5px] px-2 py-0.5 rounded-md"
                      style={{
                        background: "hsl(var(--m-info) / 0.08)",
                        color: "hsl(var(--m-info))",
                      }}
                    >
                      #{h.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              )}

              {item.scheduledAt && (
                <div className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  Scheduled for{" "}
                  {new Date(item.scheduledAt).toLocaleString(undefined, {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--m-muted-foreground))" }}>
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Tell Maroa what to tweak…"
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none resize-none"
                  style={{
                    background: "hsl(var(--m-surface))",
                    border: "1px solid hsl(var(--m-border-subtle))",
                    color: "hsl(var(--m-foreground))",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="px-5 py-3 flex items-center justify-between gap-2 shrink-0"
          style={{ borderTop: "1px solid hsl(var(--m-border-subtle))" }}
        >
          <div className="text-[10.5px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            <kbd className="px-1 rounded" style={{ background: "hsl(var(--m-surface))" }}>A</kbd> approve ·{" "}
            <kbd className="px-1 rounded" style={{ background: "hsl(var(--m-surface))" }}>R</kbd> reject
          </div>
          <div className="flex items-center gap-1.5">
            <Btn variant="ghost" onClick={() => run("changes")} disabled={!!busy || !item}>
              {busy === "changes" ? <Loader2 size={12} className="animate-spin" /> : "Request changes"}
            </Btn>
            <Btn variant="danger" onClick={() => run("reject")} disabled={!!busy || !item}>
              {busy === "reject" ? <Loader2 size={12} className="animate-spin" /> : "Reject"}
            </Btn>
            <Btn variant="primary" onClick={() => run("approve")} disabled={!!busy || !item}>
              {busy === "approve" ? <Loader2 size={12} className="animate-spin" /> : "Approve"}
            </Btn>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
