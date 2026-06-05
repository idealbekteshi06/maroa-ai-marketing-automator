/**
 * HubSpot-style Contacts page.
 * - Toolbar: search, filter chips, bulk actions.
 * - Dense table: avatar, name, email, company, score, last activity, owner.
 * - Right-side detail drawer on row click.
 */
import { useMemo, useState } from "react";
import { PageHeader } from "@/v2/components/common/PageHeader";
import { EmptyState } from "@/v2/components/common/EmptyState";
import { useContacts } from "@/v2/lib/api/hooks/useModules";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentBusiness } from "@/v2/lib/api/hooks/useBusinesses";
import { Users, Search, Plus, Upload, Filter, Mail, Phone, Building2, X } from "lucide-react";
import { Btn, Pill } from "@/v2/components/common/Card";
import { toast } from "sonner";

type Contact = Record<string, any>;

function initials(s: string) {
  return s.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}
function timeAgo(iso?: string) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "now"; if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30); if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

export default function ContactsPage() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  const bid = business?.id;
  const { data, isLoading } = useContacts(bid);
  const contacts: Contact[] = Array.isArray(data) ? data : [];

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openContact, setOpenContact] = useState<Contact | null>(null);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const name = (c.name ?? c.full_name ?? c.email ?? "").toString().toLowerCase();
      const email = (c.email ?? "").toString().toLowerCase();
      const score = Number(c.score ?? c.lead_score ?? 0);
      const matchQ = !q || name.includes(q.toLowerCase()) || email.includes(q.toLowerCase());
      const matchF =
        filter === "all" ||
        (filter === "hot" && score >= 75) ||
        (filter === "warm" && score >= 40 && score < 75) ||
        (filter === "cold" && score < 40);
      return matchQ && matchF;
    });
  }, [contacts, q, filter]);

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  }
  function toggleOne(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length.toLocaleString()} total`}
        action={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={() => toast.info("CSV import coming soon")}>
              <Upload size={13} /> Import
            </Btn>
            <Btn variant="primary" onClick={() => toast.info("New contact form coming")}>
              <Plus size={13} /> New contact
            </Btn>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--m-muted-foreground))" }} />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email…"
            className="w-full h-9 pl-8 pr-3 rounded-lg text-[13px] outline-none focus:ring-2"
            style={{ background: "hsl(var(--m-surface))",
                     border: "1px solid hsl(var(--m-border-subtle))" }}
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg"
             style={{ background: "hsl(var(--m-surface-elevated))",
                      border: "1px solid hsl(var(--m-border-subtle))" }}>
          {(["all","hot","warm","cold"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-2.5 h-7 rounded-md text-[12px] font-medium capitalize transition-colors"
              style={{
                background: filter === f ? "hsl(var(--m-background))" : "transparent",
                color: filter === f ? "hsl(var(--m-foreground))" : "hsl(var(--m-muted-foreground))",
                boxShadow: filter === f ? "var(--m-shadow-sm)" : "none",
              }}>{f}</button>
          ))}
        </div>
        <Btn variant="ghost"><Filter size={13} /> More filters</Btn>
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2 text-[12.5px]"
               style={{ color: "hsl(var(--m-muted-foreground))" }}>
            <span>{selected.size} selected</span>
            <Btn variant="secondary" onClick={() => toast.info("Bulk email queued")}>
              <Mail size={13} /> Email
            </Btn>
            <Btn variant="ghost" onClick={() => setSelected(new Set())}>Clear</Btn>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden"
           style={{ background: "hsl(var(--m-surface))",
                    border: "1px solid hsl(var(--m-border-subtle))" }}>
        <div className="grid grid-cols-[28px_2fr_2fr_1fr_80px_80px_80px] gap-3 px-4 h-10 items-center text-[11px] font-medium uppercase tracking-wider"
             style={{ color: "hsl(var(--m-muted-foreground))",
                      borderBottom: "1px solid hsl(var(--m-border-subtle))",
                      background: "hsl(var(--m-surface-elevated))" }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer" />
          <div>Name</div>
          <div>Email</div>
          <div className="hidden md:block">Company</div>
          <div className="hidden lg:block">Score</div>
          <div className="hidden lg:block">Activity</div>
          <div></div>
        </div>

        {isLoading ? (
          <div className="p-2 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg animate-pulse"
                   style={{ background: "hsl(var(--m-border-subtle))" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={Users}
              title={contacts.length === 0 ? "No contacts yet" : "No matches"}
              helper={contacts.length === 0
                ? "Contacts sync automatically from your forms, ads, and integrations."
                : "Try a different search or clear your filters."} />
          </div>
        ) : (
          <ul>
            {filtered.map((c) => {
              const score = Number(c.score ?? c.lead_score ?? 0);
              const tone = score >= 75 ? "success" : score >= 40 ? "info" : "muted";
              return (
                <li key={c.id} onClick={() => setOpenContact(c)}
                    className="grid grid-cols-[28px_2fr_2fr_1fr_80px_80px_80px] gap-3 px-4 h-14 items-center cursor-pointer transition-colors hover:bg-[hsl(var(--m-surface-elevated))]"
                    style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
                  <input type="checkbox" checked={selected.has(c.id)}
                         onClick={(e) => e.stopPropagation()}
                         onChange={() => toggleOne(c.id)}
                         className="cursor-pointer" />
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                         style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
                      {initials(c.name ?? c.full_name ?? c.email ?? "")}
                    </div>
                    <span className="text-[13px] font-medium truncate">
                      {c.name ?? c.full_name ?? c.email ?? "Unknown"}
                    </span>
                  </div>
                  <div className="text-[12.5px] truncate"
                       style={{ color: "hsl(var(--m-muted-foreground))" }}>{c.email ?? "—"}</div>
                  <div className="hidden md:block text-[12.5px] truncate"
                       style={{ color: "hsl(var(--m-muted-foreground))" }}>{c.company ?? "—"}</div>
                  <div className="hidden lg:block">
                    {score > 0 ? <Pill tone={tone as any}>{score}</Pill>
                               : <span className="text-[12px]" style={{ color: "hsl(var(--m-muted-foreground))" }}>—</span>}
                  </div>
                  <div className="hidden lg:block text-[12px] m-tnum"
                       style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {timeAgo(c.last_activity_at ?? c.updated_at ?? c.created_at)}
                  </div>
                  <div></div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail drawer */}
      {openContact && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpenContact(null)}>
          <div className="flex-1 bg-black/20" />
          <aside className="w-full sm:w-[420px] h-full overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}
                 style={{ background: "hsl(var(--m-background))",
                          borderLeft: "1px solid hsl(var(--m-border))" }}>
            <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-5"
                    style={{ background: "hsl(var(--m-background) / 0.9)",
                             backdropFilter: "blur(20px)",
                             borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
              <h2 className="text-[14px] font-semibold">Contact</h2>
              <button onClick={() => setOpenContact(null)}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[hsl(var(--m-surface-elevated))]"
                      style={{ color: "hsl(var(--m-muted-foreground))" }}>
                <X size={15} />
              </button>
            </header>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold"
                     style={{ background: "hsl(var(--m-accent-soft))", color: "hsl(var(--m-accent))" }}>
                  {initials(openContact.name ?? openContact.email ?? "")}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold truncate">
                    {openContact.name ?? openContact.email ?? "Unknown"}
                  </div>
                  <div className="text-[12px] truncate"
                       style={{ color: "hsl(var(--m-muted-foreground))" }}>
                    {openContact.title ?? "Contact"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a href={`mailto:${openContact.email ?? ""}`}
                   className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-medium"
                   style={{ background: "hsl(var(--m-foreground))", color: "hsl(var(--m-background))" }}>
                  <Mail size={13} /> Email
                </a>
                <a href={`tel:${openContact.phone ?? ""}`}
                   className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-[12.5px] font-medium"
                   style={{ background: "hsl(var(--m-surface-elevated))",
                            border: "1px solid hsl(var(--m-border-subtle))" }}>
                  <Phone size={13} /> Call
                </a>
              </div>

              <Section title="About">
                <Field label="Email" value={openContact.email} icon={Mail} />
                <Field label="Phone" value={openContact.phone} icon={Phone} />
                <Field label="Company" value={openContact.company} icon={Building2} />
                <Field label="Score" value={
                  openContact.score !== undefined ? String(openContact.score) : undefined
                } />
                <Field label="Source" value={openContact.source} />
                <Field label="Created" value={openContact.created_at
                  ? new Date(openContact.created_at).toLocaleDateString() : undefined} />
              </Section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: "hsl(var(--m-muted-foreground))" }}>{title}</h3>
      <div className="rounded-lg overflow-hidden"
           style={{ background: "hsl(var(--m-surface))",
                    border: "1px solid hsl(var(--m-border-subtle))" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value?: any; icon?: any }) {
  return (
    <div className="flex items-center gap-2.5 px-3 h-10"
         style={{ borderBottom: "1px solid hsl(var(--m-border-subtle))" }}>
      {Icon && <Icon size={13} style={{ color: "hsl(var(--m-muted-foreground))" }} />}
      <span className="text-[12px] w-20 shrink-0"
            style={{ color: "hsl(var(--m-muted-foreground))" }}>{label}</span>
      <span className="text-[12.5px] truncate flex-1">{value ?? "—"}</span>
    </div>
  );
}
