/**
 * Store Connect — Shopify / dropshipping catalog ingestion
 * ============================================================================
 * - Connect hero: paste store URL → /api/store/connect ingests the catalog
 *   and teaches the AI. Collapses into a compact header once connected.
 * - Product grid: first 50 imported products (image, title, price, vendor).
 * - Full Automation panel: one switch that hands the marketing keys to Maroa
 *   (daily AI content from products + scheduled publishing + daily ad audits).
 * - "What the AI knows": platform, product count, last sync — derived from
 *   connect/sync responses held in state.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  ExternalLink,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  storeConnect,
  storeSync,
  storeGetProducts,
  storeSetAutomation,
  type StoreProduct,
} from "@/lib/api";

const CONNECT_STEPS = [
  "Reading your store…",
  "Importing products…",
  "Teaching the AI…",
];

interface ConnectInfo {
  platform?: string;
  product_count?: number;
  store_url?: string;
  synced_at?: string;
}

export default function StoreConnect() {
  const { businessId } = useAuth();
  const qc = useQueryClient();

  const [storeUrl, setStoreUrl] = useState("");
  const [connectStep, setConnectStep] = useState(0);
  const [connectInfo, setConnectInfo] = useState<ConnectInfo | null>(null);
  const [automationOn, setAutomationOn] = useState(false);
  const [autonomyMode, setAutonomyMode] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: ["store", "products", businessId],
    queryFn: () => storeGetProducts({ business_id: businessId!, limit: "50" }),
    enabled: !!businessId,
    retry: false,
  });

  const products = productsQuery.data?.products ?? [];
  const isConnected = products.length > 0 || !!connectInfo;

  const connect = useMutation({
    mutationFn: () =>
      storeConnect({ business_id: businessId!, store_url: storeUrl.trim() }),
    onSuccess: (d) => {
      setConnectInfo({
        platform: d?.platform,
        product_count: d?.product_count,
        store_url: d?.store_url ?? storeUrl.trim(),
        synced_at: new Date().toISOString(),
      });
      if (d?.platform === "generic") {
        toast.info(
          "Not a Shopify store — we analyzed the site instead. Product import is Shopify-only for now.",
          { duration: 8000 },
        );
      } else {
        toast.success(
          `Store connected — ${d?.product_count ?? 0} products imported. The AI is learning your catalog.`,
        );
      }
      qc.invalidateQueries({ queryKey: ["store", "products", businessId] });
    },
    onError: (e: Error) =>
      toast.error(e?.message || "Failed to connect the store. Check the URL and try again."),
  });

  const sync = useMutation({
    mutationFn: () => storeSync({ business_id: businessId! }),
    onSuccess: (d) => {
      setConnectInfo((prev) => ({
        ...(prev ?? {}),
        product_count: d?.product_count ?? prev?.product_count,
        synced_at: new Date().toISOString(),
      }));
      toast.success(
        `Catalog re-synced — ${d?.product_count ?? 0} products up to date.`,
      );
      qc.invalidateQueries({ queryKey: ["store", "products", businessId] });
    },
    onError: (e: Error) => toast.error(e?.message || "Re-sync failed."),
  });

  const automation = useMutation({
    mutationFn: (enabled: boolean) =>
      storeSetAutomation({ business_id: businessId!, enabled }),
    onMutate: (enabled) => {
      const previous = automationOn;
      setAutomationOn(enabled); // optimistic
      return { previous };
    },
    onSuccess: (d, enabled) => {
      if (d?.wf1_autonomy_mode) setAutonomyMode(d.wf1_autonomy_mode);
      toast.success(
        enabled
          ? "Full automation ON — Maroa now runs your marketing daily."
          : "Full automation OFF — everything will wait for your approval.",
      );
    },
    onError: (e: Error, _enabled, ctx) => {
      setAutomationOn(ctx?.previous ?? false); // revert
      toast.error(e?.message || "Could not update automation setting.");
    },
  });

  // Fake stepper while connecting — cycles through the three phases.
  useEffect(() => {
    if (!connect.isPending) {
      setConnectStep(0);
      return;
    }
    const id = setInterval(
      () => setConnectStep((s) => Math.min(s + 1, CONNECT_STEPS.length - 1)),
      4000,
    );
    return () => clearInterval(id);
  }, [connect.isPending]);

  const handleConnect = () => {
    if (!storeUrl.trim()) {
      toast.error("Paste your store URL first.");
      return;
    }
    connect.mutate();
  };

  const connectedUrl =
    connectInfo?.store_url ??
    (products[0]?.product_url
      ? safeOrigin(products[0]?.product_url)
      : undefined);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShoppingBag className="h-3.5 w-3.5" />
          Store · Shopify &amp; dropshipping
        </div>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
          Connect your store
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your store URL. Maroa imports your catalog, learns every
          product, and can run all of your marketing on full automation.
        </p>
      </div>

      {/* ── 1. Connect hero / compact connected header ── */}
      {isConnected ? (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Store connected
                </p>
                <p className="text-xs text-muted-foreground">
                  {connectedUrl ?? "Your catalog is imported and the AI is trained on it."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => sync.mutate()}
              disabled={sync.isPending || !businessId}
            >
              {sync.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-4 w-4" />
              )}
              Re-sync
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Connect store</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Works best with Shopify — we import your full product catalog.
              Other sites get an AI analysis of the storefront.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="https://your-store.myshopify.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                disabled={connect.isPending}
                className="sm:max-w-md"
              />
              <Button
                onClick={handleConnect}
                disabled={connect.isPending || !businessId}
              >
                {connect.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-1.5 h-4 w-4" />
                )}
                Connect store
              </Button>
            </div>

            {connect.isPending && (
              <div className="flex flex-col gap-1.5 rounded border border-border bg-muted/30 p-3">
                {CONNECT_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2 text-xs">
                    {i < connectStep ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : i === connectStep ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-border" />
                    )}
                    <span
                      className={
                        i <= connectStep
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 3. Full Automation panel ── */}
      <Card className="border-primary/30">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Let Maroa run my marketing
                  </p>
                  {autonomyMode && (
                    <Badge variant="outline" className="text-[10px]">
                      {autonomyMode}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                  {automationOn ? (
                    <>
                      <span className="font-medium text-foreground">On:</span>{" "}
                      daily AI content generated from your products, scheduled
                      and published automatically, and your ads audited every
                      day.
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">Off:</span>{" "}
                      Maroa still drafts content and audit recommendations, but
                      everything waits for your approval before anything is
                      published or changed.
                    </>
                  )}
                </p>
              </div>
            </div>
            <Switch
              checked={automationOn}
              onCheckedChange={(checked) => automation.mutate(checked)}
              disabled={automation.isPending || !businessId}
              aria-label="Let Maroa run my marketing"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── 4. What the AI knows ── */}
      {isConnected && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">What the AI knows</CardTitle>
            </div>
            <CardDescription className="text-xs">
              The knowledge Maroa uses when writing content and running ads for
              you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Platform
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-foreground">
                  {connectInfo?.platform === "generic"
                    ? "Website (analyzed)"
                    : connectInfo?.platform ?? "Shopify"}
                </p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Products imported
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {connectInfo?.product_count ??
                    productsQuery.data?.count ??
                    products.length}
                </p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Last synced
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {connectInfo?.synced_at
                    ? new Date(connectInfo.synced_at).toLocaleString()
                    : "Earlier — hit Re-sync to refresh"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 2. Product grid ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Your products</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Every product here feeds the daily content engine and ad creative.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productsQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded border border-dashed border-border p-8 text-center">
              <Package className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No store connected yet — paste your store URL above.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p?.id ?? p?.external_id ?? i} product={p} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product card
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: StoreProduct }) {
  const image = (product?.image_urls ?? [])[0];
  const price = formatPrice(product?.price, product?.currency);

  return (
    <div className="group overflow-hidden rounded-lg border border-border transition-colors hover:bg-muted/30">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product?.title ?? "Product"}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <Package className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 text-sm font-medium text-foreground">
          {product?.title ?? "Untitled product"}
        </p>
        <div className="flex items-center justify-between">
          {price ? (
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {price}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {product?.vendor && (
            <Badge variant="outline" className="max-w-[50%] truncate text-[9px]">
              {product.vendor}
            </Badge>
          )}
        </div>
        {product?.product_url && (
          <a
            href={product.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            View in store
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(
  price: number | string | undefined,
  currency: string | undefined,
): string | null {
  if (price === undefined || price === null || price === "") return null;
  const n = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(n)) return String(price);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency ?? ""}`.trim();
  }
}

function safeOrigin(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}
