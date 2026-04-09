import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Instagram, Facebook, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { cn } from "@/lib/utils";

interface ContentCalendarProps {
  businessId: string | null;
}

interface ContentItem {
  id: string;
  platform: string;
  caption: string;
  status: string;
  created_at: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3.5 w-3.5 text-pink-500" />,
  facebook: <Facebook className="h-3.5 w-3.5 text-blue-500" />,
  linkedin: <Globe className="h-3.5 w-3.5 text-blue-700" />,
};

const statusBadge: Record<string, { text: string; class: string }> = {
  published: { text: "Published", class: "bg-success/10 text-success" },
  scheduled: { text: "Scheduled", class: "bg-primary/10 text-primary" },
  pending: { text: "Draft", class: "bg-muted text-muted-foreground" },
  pending_approval: { text: "Pending", class: "bg-warning/10 text-warning" },
};

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1 + offset * 7); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ContentCalendar({ businessId }: ContentCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const today = new Date();

  const fetchContent = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const start = weekDates[0].toISOString().split("T")[0];
    const endDate = new Date(weekDates[6]);
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.toISOString().split("T")[0];

    const { data } = await externalSupabase
      .from("generated_content")
      .select("id, platform, caption, status, created_at")
      .eq("business_id", businessId)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true });

    setContent((data || []) as ContentItem[]);
    setLoading(false);
  }, [businessId, weekDates]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const getContentForDay = (date: Date) =>
    content.filter(c => isSameDay(new Date(c.created_at), date));

  const selectedDayContent = selectedDay ? getContentForDay(selectedDay) : [];

  return (
    <div className="rounded-lg border border-border bg-card shadow-meta">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Content Calendar</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs text-primary font-medium px-2 py-1 rounded hover:bg-muted transition-colors"
          >
            Today
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day strip */}
      <div className="flex overflow-x-auto">
        {weekDates.map((date, i) => {
          const dayContent = getContentForDay(date);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDay && isSameDay(date, selectedDay);
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : date)}
              className={cn(
                "flex flex-1 min-w-[60px] flex-col items-center gap-1 py-3 border-b-2 transition-colors",
                isSelected ? "border-primary bg-primary/5" : isToday ? "border-primary/50" : "border-transparent",
                "hover:bg-muted/50"
              )}
            >
              <span className="text-[10px] text-muted-foreground">{dayNames[i]}</span>
              <span className={cn("text-lg font-bold", isToday ? "text-primary" : "text-foreground")}>
                {date.getDate()}
              </span>
              {dayContent.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                  {dayContent.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day content */}
      {selectedDay && (
        <div className="border-t border-border p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          {selectedDayContent.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No posts this day</p>
          ) : (
            <div className="space-y-2">
              {selectedDayContent.map(item => {
                const badge = statusBadge[item.status] || statusBadge.pending;
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
                    {platformIcons[item.platform?.toLowerCase()] || <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="flex-1 text-xs text-foreground truncate">{item.caption || "Untitled post"}</span>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", badge.class)}>
                      {badge.text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
