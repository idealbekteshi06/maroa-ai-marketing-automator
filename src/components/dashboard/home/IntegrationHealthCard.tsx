import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/apiClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Circle, Plug, Settings } from "lucide-react";

interface IntegrationItem {
  connected: boolean;
  label: string;
  detail: string;
  status?: "healthy" | "degraded" | "disconnected";
}

interface IntegrationsPayload {
  integrations: IntegrationItem[];
  connected_count: number;
  recommended_action?: string | null;
}

export default function IntegrationHealthCard({
  onNavigateSettings,
}: {
  onNavigateSettings: () => void;
}) {
  const { businessId, isReady } = useAuth();
  const [items, setItems] = useState<IntegrationItem[]>([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!businessId || !isReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<IntegrationsPayload>(`/api/business/${businessId}/integrations`);
      setItems(data.integrations || []);
      setConnectedCount(data.connected_count ?? 0);
    } catch (err) {
      setItems([]);
      setConnectedCount(0);
      // Surface instead of failing silently. Shared id with the other
      // integrations loaders so the app shows at most one such toast.
      toast.error("Couldn't load integration status", {
        id: "integrations-load",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [businessId, isReady]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="h-28 rounded-2xl bg-muted animate-pulse" />;
  }

  const socialConnected = items
    .filter((i) => ["Meta (Facebook & Instagram)", "Google Ads", "LinkedIn", "X / Twitter", "TikTok"].includes(i.label))
    .some((i) => i.connected);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plug className="h-4 w-4 text-primary" />
          Integrations
        </CardTitle>
        <CardDescription className="text-xs">
          {connectedCount > 0
            ? `${connectedCount} channel${connectedCount === 1 ? "" : "s"} connected — Maroa can pull live metrics and optimize ads.`
            : "Connect at least Meta to unlock ads, analytics snapshots, and competitor signals."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const degraded = item.status === "degraded";
            const connected = item.connected && !degraded;
            return (
              <Badge
                key={item.label}
                variant={connected ? "default" : degraded ? "secondary" : "outline"}
                className="text-[10px] font-normal gap-1"
                title={item.detail}
              >
                {connected ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : degraded ? (
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                ) : (
                  <Circle className="h-3 w-3 opacity-40" />
                )}
                {item.label}
              </Badge>
            );
          })}
        </div>
        {!socialConnected && (
          <p className="text-xs text-muted-foreground">
            Paid ads and reach KPIs stay in learning mode until Meta or Google is connected.
          </p>
        )}
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={onNavigateSettings}>
          <Settings className="mr-1.5 h-3.5 w-3.5" />
          Open connection settings
        </Button>
      </CardContent>
    </Card>
  );
}
