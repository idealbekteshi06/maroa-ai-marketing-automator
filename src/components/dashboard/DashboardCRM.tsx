import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { externalSupabase } from "@/integrations/supabase/external-client";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, Search as SearchIcon, Loader2, Plus, MessageSquare, Bot,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  lead_score: number;
  last_activity: string | null;
}

interface Deal {
  id: string;
  contact_name: string;
  value: number;
  stage: string;
}

const PIPELINE_STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;

function scoreBadge(score: number) {
  if (score >= 76) return { bg: "bg-success/10", text: "text-success", label: "🔥 Ready to buy" };
  if (score >= 51) return { bg: "bg-orange-500/10", text: "text-orange-500", label: "Hot lead" };
  if (score >= 26) return { bg: "bg-warning/10", text: "text-warning", label: "Warming up" };
  return { bg: "bg-muted", text: "text-muted-foreground", label: "Cold lead" };
}

function timeAgo(d: string | null) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardCRM() {
  const { businessId, isReady } = useAuth();
  const [tab, setTab] = useState<"contacts" | "pipeline">("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipeline, setPipeline] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add contact dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  // Log activity dialog
  const [logOpen, setLogOpen] = useState(false);
  const [logContactId, setLogContactId] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logSaving, setLogSaving] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  const fetchContacts = async () => {
    if (!businessId) return;
    try {
      const res = await api.getContacts({ business_id: businessId });
      setContacts(((res as any)?.contacts ?? (res as any)?.data ?? (Array.isArray(res) ? res : [])) as Contact[]);
    } catch {
      toast.error("Failed to load contacts");
    }
  };

  const fetchPipeline = async () => {
    if (!businessId) return;
    try {
      const res = await api.getPipeline({ business_id: businessId });
      setPipeline(((res as any)?.deals ?? (res as any)?.data ?? (Array.isArray(res) ? res : [])) as Deal[]);
    } catch {
      toast.error("Failed to load pipeline");
    }
  };

  useEffect(() => {
    if (!businessId || !isReady) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchPipeline()]);
      setLoading(false);
    };
    load();
  }, [businessId, isReady]);

  // Live lead score updates via Supabase real-time
  useEffect(() => {
    if (!businessId || !isReady) return;
    const channel = externalSupabase
      .channel(`lead-scores-${businessId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "contacts",
        filter: `business_id=eq.${businessId}`,
      }, (payload: any) => {
        const updated = payload.new;
        const oldScore = payload.old?.lead_score ?? 0;
        const newScore = updated?.lead_score ?? 0;
        if (updated?.id) {
          // Update contact in state
          setContacts(prev => prev.map(c => c.id === updated.id ? { ...c, lead_score: newScore, last_activity: updated.last_activity || c.last_activity } : c));
          // Highlight
          setHighlightedIds(prev => new Set(prev).add(updated.id));
          setTimeout(() => setHighlightedIds(prev => { const n = new Set(prev); n.delete(updated.id); return n; }), 3000);
          // Threshold crossing toasts
          if (oldScore < 75 && newScore >= 75) {
            toast.success(`🔥 ${updated.full_name || updated.first_name || "A lead"} is now Hot! Score: ${newScore}/100`);
          } else if (oldScore < 50 && newScore >= 50) {
            toast(`🌡️ ${updated.full_name || updated.first_name || "A lead"} warming up — score: ${newScore}/100`);
          }
          if (updated.intent_level === "ready_to_buy" && payload.old?.intent_level !== "ready_to_buy") {
            toast.success(`🎯 ${updated.full_name || updated.first_name || "A lead"} is ready to buy! Take action now.`);
          }
        }
      })
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "contacts",
        filter: `business_id=eq.${businessId}`,
      }, (payload: any) => {
        const n = payload.new;
        if (n) {
          setContacts(prev => [{ id: n.id, name: n.full_name || `${n.first_name || ""} ${n.last_name || ""}`.trim(), email: n.email || "", phone: n.phone || "", lead_score: n.lead_score || 0, last_activity: n.created_at } as Contact, ...prev]);
          toast.success(`👤 New lead captured: ${n.first_name || n.email || "Unknown"}`);
        }
      })
      .subscribe();

    return () => { externalSupabase.removeChannel(channel); };
  }, [businessId, isReady]);

  const handleAddContact = async () => {
    if (!businessId || !addName || !addEmail) return;
    setAddSaving(true);
    try {
      await api.contactCreate({ business_id: businessId, name: addName, email: addEmail, phone: addPhone });
      toast.success("Contact added");
      setAddOpen(false);
      setAddName(""); setAddEmail(""); setAddPhone("");
      await fetchContacts();
    } catch {
      toast.error("Failed to add contact");
    } finally {
      setAddSaving(false);
    }
  };

  const handleLogActivity = async () => {
    if (!businessId || !logContactId || !logNote) return;
    setLogSaving(true);
    try {
      await api.contactActivityLog({ business_id: businessId, contact_id: logContactId, activity_type: "note", note: logNote });
      toast.success("Activity logged");
      setLogOpen(false);
      setLogNote(""); setLogContactId("");
    } catch {
      toast.error("Failed to log activity");
    } finally {
      setLogSaving(false);
    }
  };

  const filtered = contacts.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const isEmpty = tab === "contacts" ? contacts.length === 0 : pipeline.length === 0;

  // Stats
  const hotLeads = contacts.filter(c => (c.lead_score ?? 0) >= 75).length;
  const avgScore = contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + (c.lead_score ?? 0), 0) / contacts.length) : 0;
  const pipelineValue = pipeline.reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground font-medium">Total Contacts</p>
          <p className="text-xl font-bold text-foreground mt-1">{contacts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground font-medium">Hot Leads</p>
          <p className={`text-xl font-bold mt-1 ${hotLeads > 0 ? "text-orange-500" : "text-foreground"}`}>{hotLeads}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground font-medium">Avg Lead Score</p>
          <p className="text-xl font-bold text-foreground mt-1">{avgScore}/100</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground font-medium">Pipeline Value</p>
          <p className="text-xl font-bold text-foreground mt-1">${pipelineValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex border border-border rounded-md overflow-hidden bg-card">
          {(["contacts", "pipeline"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-r border-border last:border-0 ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "contacts" ? "Contacts" : "Pipeline"}
            </button>
          ))}
        </div>
        {tab === "contacts" && (
          <Button size="sm" className="h-9 text-xs" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Contact
          </Button>
        )}
      </div>

      {tab === "contacts" && contacts.length === 0 && !loading && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-4 text-sm font-semibold text-foreground">Your leads will appear here automatically</h3>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">Every person who interacts with your campaigns, ads, or emails is captured and scored by AI.</p>
        </div>
      )}

      {isEmpty && tab !== "contacts" ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center shadow-meta">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold text-foreground">Your AI is setting up your CRM</h3>
          <p className="text-sm text-muted-foreground mt-1">Leads will appear here as your campaigns run</p>
        </div>
      ) : tab === "contacts" && contacts.length === 0 ? (
        null
      ) : tab === "contacts" ? (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-card"
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-card shadow-meta overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Lead Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Activity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const badge = scoreBadge(c.lead_score ?? 0);
                    return (
                      <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-all duration-500 ${highlightedIds.has(c.id) ? "bg-success/5" : ""}`} style={highlightedIds.has(c.id) ? { boxShadow: "inset 0 0 0 1px hsl(var(--success) / 0.3)" } : undefined}>
                        <td className="px-4 py-3 font-medium text-foreground">{c.name || c.email?.split("@")[0] || "Unknown"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                            {c.lead_score ?? 0} · {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{timeAgo(c.last_activity)}</td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => { setLogContactId(c.id); setLogOpen(true); }}
                          >
                            <MessageSquare className="mr-1 h-3 w-3" /> Log Activity
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Pipeline Kanban */
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <Bot className="h-3 w-3" /> AI is handling this
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE_STAGES.map(stage => {
              const deals = pipeline.filter(d => d.stage?.toLowerCase() === stage.toLowerCase());
              return (
                <div key={stage} className="rounded-lg border border-border bg-card p-3 shadow-meta min-h-[200px]">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {stage} <span className="text-foreground ml-1">{deals.length}</span>
                  </h4>
                  <div className="space-y-2">
                    {deals.map(d => (
                      <div key={d.id} className="rounded-md border border-border bg-muted/30 p-2.5">
                        <p className="text-xs font-medium text-foreground truncate">{d.contact_name || "Unknown"}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {d.value != null && Number.isFinite(Number(d.value)) ? `$${Number(d.value).toLocaleString()}` : "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Name" value={addName} onChange={e => setAddName(e.target.value)} />
            <Input placeholder="Email" type="email" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
            <Input placeholder="Phone" value={addPhone} onChange={e => setAddPhone(e.target.value)} />
            <Button className="w-full" onClick={handleAddContact} disabled={addSaving || !addName || !addEmail}>
              {addSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Add Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add a note..."
              value={logNote}
              onChange={e => setLogNote(e.target.value)}
            />
            <Button className="w-full" onClick={handleLogActivity} disabled={logSaving || !logNote}>
              {logSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
