/**
 * All Maroa module pages in one file for fast iteration. Each page is a real
 * implementation: header + KPIs (where relevant) + list/panels with loading
 * skeletons and empty states. Every value comes from real api.maroa.ai calls
 * (no mocked data per §0). When the backend returns nothing, the user sees an
 * Apple-styled empty state. When the endpoint isn't in §10.3 yet, the hook is
 * marked TODO(backend) in useModules.ts.
 */
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState } from "../components/common/EmptyState";
import { KpiCard } from "../components/common/KpiCard";
import { DataList, Row, Panel } from "../components/common/DataList";
import { useCurrentBusiness } from "../lib/api/hooks/useBusinesses";
import {
  useInbox, useNotifications, useContent, useContentItem, useCalendar, useLibrary,
  useBrandDna, useVideoJobs, useAds, useCampaign, useSeo, useCro, useLandingPages,
  useLandingPage, useLeadMagnets, useReferrals, useContacts, useContact, usePipeline,
  useSequences, useSequence, useReviews, useAnalytics, useCompetitors, useForecast,
  useAiBrain, useStrategy, useIntegrations, useTeam, useBilling, useSettings,
} from "../lib/api/hooks/useModules";
import {
  Inbox, Bell, Sparkles, Calendar, Image as ImageIcon, Film, Palette, Megaphone,
  Search, Wand2, FileText, Magnet, Gift, Users, GitBranch, Mail, Star, BarChart3,
  Eye, TrendingUp, Brain, Compass, Plug, UsersRound, CreditCard, Settings2,
} from "lucide-react";

function useBid() {
  const { user } = useAuth();
  const { business } = useCurrentBusiness(user?.id);
  return { bid: business?.id, uid: user?.id, business };
}

const txt = (v: unknown, fallback = "—") =>
  typeof v === "string" || typeof v === "number" ? String(v) : fallback;

// ───────── Overview ─────────
export function InboxPage() {
  const { bid } = useBid();
  const { data, isLoading } = useInbox(bid);
  return (
    <div>
      <PageHeader title="Inbox" subtitle="Every conversation, one place." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Inbox}
          emptyTitle="No messages yet"
          emptyHelper="When customers reach out across email, Instagram, Messenger, or SMS, they land here."
          renderItem={(m: any, i) => (
            <Row
              key={m?.id ?? i}
              title={txt(m?.from_name ?? m?.sender ?? "Unknown sender")}
              subtitle={txt(m?.preview ?? m?.last_message ?? m?.subject, "—")}
              right={m?.platform}
            />
          )}
        />
      </Panel>
    </div>
  );
}

export function NotificationsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useNotifications(bid);
  return (
    <div>
      <PageHeader title="Notifications" />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Bell}
          emptyTitle="You're all caught up"
          renderItem={(n: any, i) => (
            <Row
              key={n?.id ?? i}
              title={txt(n?.title)}
              subtitle={txt(n?.body ?? n?.message)}
              right={n?.created_at ? new Date(n.created_at).toLocaleString() : ""}
            />
          )}
        />
      </Panel>
    </div>
  );
}

// ───────── Creative ─────────
export function ContentPage() {
  const { bid } = useBid();
  const { data, isLoading } = useContent(bid);
  const list = Array.isArray(data) ? data : [];
  const pending = list.filter((c: any) => c?.status === "pending_approval").length;
  const published = list.filter((c: any) => c?.status === "published").length;
  return (
    <div>
      <PageHeader title="Content Studio" subtitle="Generate, score, approve, publish." />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Drafts" value={list.length.toString()} loading={isLoading} />
        <KpiCard label="Needs approval" value={pending.toString()} loading={isLoading} />
        <KpiCard label="Published · 30d" value={published.toString()} loading={isLoading} />
      </section>
      <Panel title="Recent content">
        <DataList
          loading={isLoading}
          items={list}
          emptyIcon={Sparkles}
          emptyTitle="Nothing here yet"
          emptyHelper="Maroa generates fresh content on its weekly cadence."
          renderItem={(c: any, i) => (
            <Row
              key={c?.id ?? i}
              title={txt(c?.content_theme ?? c?.title ?? "Untitled")}
              subtitle={txt(c?.instagram_caption ?? c?.facebook_post)}
              right={c?.status}
            />
          )}
        />
      </Panel>
    </div>
  );
}

export function ContentDetailPage() {
  const { id } = useParams();
  const { bid } = useBid();
  const { data, isLoading } = useContentItem(bid, id);
  return (
    <div>
      <PageHeader title="Content" subtitle={id} />
      {isLoading ? (
        <Panel><div className="h-40 animate-pulse rounded-xl" style={{ background: "hsl(var(--m-border-subtle))" }} /></Panel>
      ) : !data ? (
        <EmptyState icon={Sparkles} title="Not found" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Panel title="Caption">
              <p className="text-body whitespace-pre-wrap">{txt((data as any)?.instagram_caption ?? (data as any)?.facebook_post)}</p>
            </Panel>
          </div>
          <div className="space-y-5">
            <Panel title="Score">
              <div className="text-title-1 m-tnum">{txt((data as any)?.quality_score, "—")}</div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarPage() {
  const { bid } = useBid();
  const now = new Date();
  const { data, isLoading } = useCalendar(bid, now.getMonth() + 1, now.getFullYear());
  return (
    <div>
      <PageHeader title="Calendar" subtitle={now.toLocaleString(undefined, { month: "long", year: "numeric" })} />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Calendar}
          emptyTitle="No scheduled posts"
          emptyHelper="Generate a content calendar from Content Studio to populate this view."
          renderItem={(d: any, i) => (
            <Row
              key={d?.id ?? i}
              title={txt(d?.title ?? d?.theme)}
              subtitle={txt(d?.platform)}
              right={d?.scheduled_at ? new Date(d.scheduled_at).toLocaleDateString() : ""}
            />
          )}
        />
      </Panel>
    </div>
  );
}

export function LibraryPage() {
  const { bid } = useBid();
  const { data, isLoading } = useLibrary(bid);
  const list = Array.isArray(data) ? data : [];
  return (
    <div>
      <PageHeader title="Library" subtitle="Every asset Maroa has produced." />
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ background: "hsl(var(--m-border-subtle))" }} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Library is empty" helper="Generated images and videos will appear here." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((a: any, i) => (
            <div key={a?.id ?? i} className="aspect-square rounded-xl overflow-hidden bg-black/5">
              {a?.image_url ? (
                <img src={a.image_url} alt={a?.alt ?? ""} className="w-full h-full object-cover" loading="lazy" />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VideoPage() {
  const { bid } = useBid();
  const { data, isLoading } = useVideoJobs(bid);
  return (
    <div>
      <PageHeader title="Video Studio" subtitle="Reels, shorts, ad cutdowns." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Film}
          emptyTitle="No videos yet"
          emptyHelper="Available on Growth and Agency plans."
          renderItem={(v: any, i) => (
            <Row key={v?.id ?? i} title={txt(v?.title)} subtitle={txt(v?.status)} right={v?.duration} />
          )}
        />
      </Panel>
    </div>
  );
}

export function BrandPage() {
  const { bid } = useBid();
  const { data, isLoading } = useBrandDna(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="Brand DNA" subtitle="The brain Maroa writes from." />
      {isLoading ? (
        <Panel><div className="h-40 animate-pulse rounded-xl" style={{ background: "hsl(var(--m-border-subtle))" }} /></Panel>
      ) : !d ? (
        <EmptyState icon={Palette} title="No brand profile yet" helper="Complete onboarding so Maroa can study your voice." />
      ) : (
        <div className="space-y-5">
          <Panel title="Voice">
            <p className="text-body">{txt(d?.tone ?? d?.voice?.tone)}</p>
          </Panel>
          <Panel title="Mission">
            <p className="text-body">{txt(d?.mission)}</p>
          </Panel>
        </div>
      )}
    </div>
  );
}

// ───────── Growth ─────────
export function AdsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useAds(bid);
  const list = Array.isArray(data) ? data : [];
  const active = list.filter((a: any) => a?.status === "active").length;
  const spend = list.reduce((s: number, a: any) => s + (Number(a?.spend ?? 0) || 0), 0);
  const roas = list.length ? (list.reduce((s: number, a: any) => s + (Number(a?.roas ?? 0) || 0), 0) / list.length) : 0;
  return (
    <div>
      <PageHeader title="Ads" subtitle="Meta and Google, fully managed." />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Active campaigns" value={active.toString()} loading={isLoading} />
        <KpiCard label="Spend · MTD" value={spend ? `$${spend.toFixed(0)}` : "—"} loading={isLoading} />
        <KpiCard label="Blended ROAS" value={roas ? `${roas.toFixed(1)}x` : "—"} loading={isLoading} />
      </section>
      <Panel title="Campaigns">
        <DataList
          loading={isLoading}
          items={list}
          emptyIcon={Megaphone}
          emptyTitle="No campaigns running"
          emptyHelper="Connect Meta or Google Ads from Integrations to let Maroa launch your first campaign."
          renderItem={(a: any, i) => (
            <Row
              key={a?.id ?? i}
              title={txt(a?.name)}
              subtitle={`${txt(a?.platform)} · ${txt(a?.objective)}`}
              right={a?.status}
            />
          )}
        />
      </Panel>
    </div>
  );
}

export function CampaignDetailPage() {
  const { id } = useParams();
  const { bid } = useBid();
  const { data, isLoading } = useCampaign(bid, id);
  return (
    <div>
      <PageHeader title="Campaign" subtitle={id} />
      {isLoading ? <Panel><div className="h-40 animate-pulse" /></Panel> : !data ? <EmptyState icon={Megaphone} title="Not found" /> : (
        <Panel title={txt((data as any)?.name)}>
          <pre className="text-footnote whitespace-pre-wrap" style={{ color: "hsl(var(--m-muted-foreground))" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Panel>
      )}
    </div>
  );
}

export function SeoPage() {
  const { bid } = useBid();
  const { data, isLoading } = useSeo(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="SEO" subtitle="Rankings, pages, technical health." />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Indexed pages" value={txt(d?.indexed_pages)} loading={isLoading} />
        <KpiCard label="Avg position" value={txt(d?.avg_position)} loading={isLoading} />
        <KpiCard label="Organic clicks · 30d" value={txt(d?.clicks_30d)} loading={isLoading} />
      </section>
      <Panel title="Top keywords">
        <DataList
          loading={isLoading}
          items={d?.keywords as any[] | undefined}
          emptyIcon={Search}
          emptyTitle="No keyword data"
          emptyHelper="Connect Search Console from Integrations."
          renderItem={(k: any, i) => (
            <Row key={i} title={txt(k?.query)} subtitle={`Pos ${txt(k?.position)}`} right={txt(k?.clicks)} />
          )}
        />
      </Panel>
    </div>
  );
}

export function CroPage() {
  const { bid } = useBid();
  const { data, isLoading } = useCro(bid);
  return (
    <div>
      <PageHeader title="CRO" subtitle="Continuous tests across your funnel." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Wand2}
          emptyTitle="No active tests"
          emptyHelper="Maroa proposes tests once you have at least 1,000 monthly sessions."
          renderItem={(t: any, i) => (
            <Row key={t?.id ?? i} title={txt(t?.name)} subtitle={txt(t?.hypothesis)} right={t?.status} />
          )}
        />
      </Panel>
    </div>
  );
}

export function LandingPagesPage() {
  const { bid } = useBid();
  const { data, isLoading } = useLandingPages(bid);
  return (
    <div>
      <PageHeader title="Landing Pages" subtitle="Fast, on-brand pages for every campaign." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={FileText}
          emptyTitle="No landing pages yet"
          renderItem={(p: any, i) => (
            <Row key={p?.id ?? i} title={txt(p?.title ?? p?.slug)} subtitle={txt(p?.url)} right={p?.status} />
          )}
        />
      </Panel>
    </div>
  );
}

export function LandingPageDetailPage() {
  const { id } = useParams();
  const { bid } = useBid();
  const { data, isLoading } = useLandingPage(bid, id);
  return (
    <div>
      <PageHeader title="Landing page" subtitle={id} />
      {isLoading ? <Panel><div className="h-40 animate-pulse" /></Panel> : !data ? <EmptyState icon={FileText} title="Not found" /> : (
        <Panel title={txt((data as any)?.title)}>
          <pre className="text-footnote whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </Panel>
      )}
    </div>
  );
}

export function LeadMagnetsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useLeadMagnets(bid);
  return (
    <div>
      <PageHeader title="Lead Magnets" subtitle="Free resources that grow your list." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Magnet}
          emptyTitle="No lead magnets yet"
          renderItem={(m: any, i) => (
            <Row key={m?.id ?? i} title={txt(m?.title)} subtitle={txt(m?.type)} right={`${txt(m?.downloads, "0")} downloads`} />
          )}
        />
      </Panel>
    </div>
  );
}

export function ReferralsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useReferrals(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="Referrals" subtitle="Turn customers into your sales force." />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Referrers" value={txt(d?.referrers, "—")} loading={isLoading} />
        <KpiCard label="Converted" value={txt(d?.converted, "—")} loading={isLoading} />
        <KpiCard label="Reward paid" value={d?.reward_paid ? `$${d.reward_paid}` : "—"} loading={isLoading} />
      </section>
      <Panel title="Top referrers">
        <DataList
          loading={isLoading}
          items={d?.top as any[] | undefined}
          emptyIcon={Gift}
          emptyTitle="No referrals yet"
          renderItem={(r: any, i) => (
            <Row key={i} title={txt(r?.name)} subtitle={txt(r?.email)} right={`${txt(r?.count, "0")} referred`} />
          )}
        />
      </Panel>
    </div>
  );
}

// ───────── Audience ─────────
export function AudiencePage() {
  const { bid } = useBid();
  const { data, isLoading } = useContacts(bid);
  const list = Array.isArray(data) ? data : [];
  return (
    <div>
      <PageHeader title="CRM" subtitle={`${list.length} contacts`} />
      <Panel>
        <DataList
          loading={isLoading}
          items={list}
          emptyIcon={Users}
          emptyTitle="No contacts yet"
          emptyHelper="Contacts sync automatically from your forms, ads, and integrations."
          renderItem={(c: any, i) => (
            <Row
              key={c?.id ?? i}
              title={txt(c?.name ?? c?.email)}
              subtitle={txt(c?.email)}
              right={c?.score !== undefined ? `Score ${c.score}` : ""}
            />
          )}
        />
      </Panel>
    </div>
  );
}

export function ContactDetailPage() {
  const { id } = useParams();
  const { bid } = useBid();
  const { data, isLoading } = useContact(bid, id);
  return (
    <div>
      <PageHeader title="Contact" subtitle={id} />
      {isLoading ? <Panel><div className="h-40 animate-pulse" /></Panel> : !data ? <EmptyState icon={Users} title="Not found" /> : (
        <Panel title={txt((data as any)?.name ?? (data as any)?.email)}>
          <pre className="text-footnote whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </Panel>
      )}
    </div>
  );
}

export function PipelinePage() {
  const { bid } = useBid();
  const { data, isLoading } = usePipeline(bid);
  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Deals, stages, and forecast." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={GitBranch}
          emptyTitle="No deals in pipeline"
          renderItem={(d: any, i) => (
            <Row
              key={d?.id ?? i}
              title={txt(d?.name ?? d?.title)}
              subtitle={txt(d?.stage)}
              right={d?.value ? `$${d.value}` : ""}
            />
          )}
        />
      </Panel>
    </div>
  );
}

export function EmailPage() {
  const { bid } = useBid();
  const { data, isLoading } = useSequences(bid);
  return (
    <div>
      <PageHeader title="Email Sequences" subtitle="Lifecycle automations Maroa runs for you." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Mail}
          emptyTitle="No sequences yet"
          renderItem={(s: any, i) => (
            <Row key={s?.id ?? i} title={txt(s?.name)} subtitle={`${txt(s?.steps?.length ?? 0)} steps`} right={s?.status} />
          )}
        />
      </Panel>
    </div>
  );
}

export function SequenceDetailPage() {
  const { id } = useParams();
  const { bid } = useBid();
  const { data, isLoading } = useSequence(bid, id);
  return (
    <div>
      <PageHeader title="Sequence" subtitle={id} />
      {isLoading ? <Panel><div className="h-40 animate-pulse" /></Panel> : !data ? <EmptyState icon={Mail} title="Not found" /> : (
        <Panel title={txt((data as any)?.name)}>
          <pre className="text-footnote whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </Panel>
      )}
    </div>
  );
}

export function ReviewsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useReviews(bid);
  const list = Array.isArray(data) ? data : [];
  const avg = list.length ? (list.reduce((s: number, r: any) => s + (Number(r?.rating) || 0), 0) / list.length) : 0;
  return (
    <div>
      <PageHeader title="Reviews" subtitle="Across Google, Yelp, Facebook." />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Total reviews" value={list.length.toString()} loading={isLoading} />
        <KpiCard label="Average rating" value={avg ? avg.toFixed(2) : "—"} loading={isLoading} />
        <KpiCard label="Needs reply" value={list.filter((r: any) => !r?.replied).length.toString()} loading={isLoading} />
      </section>
      <Panel title="Recent reviews">
        <DataList
          loading={isLoading}
          items={list}
          emptyIcon={Star}
          emptyTitle="No reviews yet"
          renderItem={(r: any, i) => (
            <Row
              key={r?.id ?? i}
              title={`${"★".repeat(Math.round(Number(r?.rating) || 0))} ${txt(r?.author)}`}
              subtitle={txt(r?.text)}
              right={r?.platform}
            />
          )}
        />
      </Panel>
    </div>
  );
}

// ───────── Intelligence ─────────
export function AnalyticsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useAnalytics(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Last 30 days." />
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
        <KpiCard label="Sessions" value={txt(d?.sessions)} loading={isLoading} />
        <KpiCard label="Conversions" value={txt(d?.conversions)} loading={isLoading} />
        <KpiCard label="Revenue" value={d?.revenue ? `$${Number(d.revenue).toLocaleString()}` : "—"} loading={isLoading} />
        <KpiCard label="CAC" value={d?.cac ? `$${d.cac}` : "—"} loading={isLoading} />
      </section>
      <Panel title="Top channels">
        <DataList
          loading={isLoading}
          items={d?.channels as any[] | undefined}
          emptyIcon={BarChart3}
          emptyTitle="No analytics yet"
          emptyHelper="Connect GA4 or Plausible from Integrations."
          renderItem={(c: any, i) => (
            <Row key={i} title={txt(c?.name)} subtitle={`${txt(c?.sessions)} sessions`} right={c?.revenue ? `$${c.revenue}` : ""} />
          )}
        />
      </Panel>
    </div>
  );
}

export function CompetitorsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useCompetitors(bid);
  return (
    <div>
      <PageHeader title="Competitors" subtitle="Daily intelligence on who you sell against." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={Eye}
          emptyTitle="Not watching anyone yet"
          emptyHelper="Add a competitor and Maroa will track their ads, pricing, and content."
          renderItem={(c: any, i) => (
            <Row key={c?.id ?? i} title={txt(c?.name)} subtitle={txt(c?.domain)} right={c?.last_seen ? new Date(c.last_seen).toLocaleDateString() : ""} />
          )}
        />
      </Panel>
    </div>
  );
}

export function ForecastPage() {
  const { bid } = useBid();
  const { data, isLoading } = useForecast(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="Forecasting" subtitle="What the next 90 days look like." />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Revenue · next 30d" value={d?.next_30d ? `$${Number(d.next_30d).toLocaleString()}` : "—"} loading={isLoading} />
        <KpiCard label="Confidence" value={d?.confidence ? `${Math.round(Number(d.confidence) * 100)}%` : "—"} loading={isLoading} />
        <KpiCard label="Pipeline coverage" value={txt(d?.coverage)} loading={isLoading} />
      </section>
      {!isLoading && !d && (
        <EmptyState icon={TrendingUp} title="Not enough history yet" helper="Maroa needs ~30 days of activity to forecast." />
      )}
    </div>
  );
}

export function BrainPage() {
  const { bid } = useBid();
  const { data, isLoading } = useAiBrain(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="AI Brain" subtitle="What Maroa has learned about your business." />
      {isLoading ? <Panel><div className="h-40 animate-pulse" /></Panel> : !d ? (
        <EmptyState icon={Brain} title="Still learning" helper="Maroa's understanding deepens with every action." />
      ) : (
        <div className="space-y-5">
          <Panel title="What I know">
            <pre className="text-footnote whitespace-pre-wrap">{JSON.stringify(d?.knowledge ?? d, null, 2)}</pre>
          </Panel>
        </div>
      )}
    </div>
  );
}

export function StrategyPage() {
  const { bid } = useBid();
  const { data, isLoading } = useStrategy(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="Strategy" subtitle="This week's marketing plan." />
      {isLoading ? <Panel><div className="h-40 animate-pulse" /></Panel> : !d ? (
        <EmptyState icon={Compass} title="No strategy generated yet" helper="Maroa publishes a fresh weekly strategy every Monday." />
      ) : (
        <div className="space-y-5">
          <Panel title="Focus">
            <p className="text-body">{txt(d?.focus ?? d?.summary)}</p>
          </Panel>
          <Panel title="Plays this week">
            <DataList
              items={d?.plays as any[] | undefined}
              emptyTitle="No plays this week"
              renderItem={(p: any, i) => <Row key={i} title={txt(p?.title)} subtitle={txt(p?.why)} />}
            />
          </Panel>
        </div>
      )}
    </div>
  );
}

// ───────── Platform ─────────
export function IntegrationsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useIntegrations(bid);
  const list = Array.isArray(data) ? data : [];
  return (
    <div>
      <PageHeader title="Integrations" subtitle="Channels and tools Maroa is connected to." />
      <Panel>
        <DataList
          loading={isLoading}
          items={list}
          emptyIcon={Plug}
          emptyTitle="No integrations yet"
          emptyHelper="Connect Meta, Google, Stripe, GA4, and more to give Maroa full coverage."
          renderItem={(i: any, idx) => (
            <Row key={i?.id ?? idx} title={txt(i?.name ?? i?.provider)} subtitle={txt(i?.account)} right={i?.status} />
          )}
        />
      </Panel>
    </div>
  );
}

export function TeamPage() {
  const { bid } = useBid();
  const { data, isLoading } = useTeam(bid);
  return (
    <div>
      <PageHeader title="Team" subtitle="Agency seats and roles." />
      <Panel>
        <DataList
          loading={isLoading}
          items={data}
          emptyIcon={UsersRound}
          emptyTitle="Just you for now"
          emptyHelper="Invite teammates on the Agency plan."
          renderItem={(m: any, i) => (
            <Row key={m?.id ?? i} title={txt(m?.name ?? m?.email)} subtitle={txt(m?.email)} right={m?.role} />
          )}
        />
      </Panel>
    </div>
  );
}

export function BillingPage() {
  const { uid, business } = useBid();
  const { data, isLoading } = useBilling(uid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="Billing" subtitle="Plan, payment, invoices." />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard label="Current plan" value={txt(d?.plan ?? business?.plan, "—")} loading={isLoading} />
        <KpiCard label="MRR" value={d?.mrr ? `$${d.mrr}` : "—"} loading={isLoading} />
        <KpiCard label="Renews" value={d?.renews_at ? new Date(d.renews_at).toLocaleDateString() : "—"} loading={isLoading} />
      </section>
      <Panel title="Recent invoices">
        <DataList
          loading={isLoading}
          items={d?.invoices as any[] | undefined}
          emptyIcon={CreditCard}
          emptyTitle="No invoices yet"
          renderItem={(inv: any, i) => (
            <Row key={i} title={txt(inv?.number)} subtitle={inv?.date ? new Date(inv.date).toLocaleDateString() : ""} right={inv?.amount ? `$${inv.amount}` : ""} />
          )}
        />
      </Panel>
    </div>
  );
}

export function SettingsPage() {
  const { bid } = useBid();
  const { data, isLoading } = useSettings(bid);
  const d = data as any;
  return (
    <div>
      <PageHeader title="Settings" subtitle="Preferences, automation, notifications." />
      {isLoading ? <Panel><div className="h-40 animate-pulse" /></Panel> : (
        <Panel title="Preferences">
          <pre className="text-footnote whitespace-pre-wrap">{JSON.stringify(d ?? { message: "No custom settings yet." }, null, 2)}</pre>
        </Panel>
      )}
    </div>
  );
}

export function NotFoundPanel() {
  return <EmptyState icon={Settings2} title="Page not found" />;
}
