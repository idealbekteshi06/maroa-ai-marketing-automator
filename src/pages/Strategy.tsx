import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, UserCircle, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CreativeConceptApproval } from "@/components/CreativeConceptApproval";
import { CharacterTrainer } from "@/components/CharacterTrainer";
import { ImageVetter } from "@/components/ImageVetter";

const TAB_KEYS = ["concept", "character", "vetter"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function Strategy() {
  const { businessId, isReady } = useAuth();
  const [tab, setTab] = useState<TabKey>("concept");

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Strategy</CardTitle>
            <CardDescription>Sign in to access the strategy workspace.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Strategy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cannes-grade creative direction · Soul ID character consistency · 8-dimension image vetting
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="concept" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Concept</span>
          </TabsTrigger>
          <TabsTrigger value="character" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span>Soul ID</span>
          </TabsTrigger>
          <TabsTrigger value="vetter" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>Vet asset</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="concept" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                Develop a strategic concept
              </CardTitle>
              <CardDescription>
                Runs the Cannes-calibrated creative-director (Claude Opus 4.5): insight extraction → 3-method ideation →
                6-criteria scoring → P01–P18 pattern saturation cap → kill-argument requirement.
                A/B variant assigned per request for measurement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreativeConceptApproval businessId={businessId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="character" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCircle className="h-4 w-4 text-primary" />
                Train Soul ID characters
              </CardTitle>
              <CardDescription>
                Upload reference photos to train Higgsfield Soul ID. Once trained, the same identity locks across every
                generation — different scenes, lighting, angles. ~40 credits / ~$2.50 per character.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CharacterTrainer businessId={businessId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vetter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-primary" />
                Vet a customer-uploaded image
              </CardTitle>
              <CardDescription>
                8-dimension scoring with per-genre weights. Decides per image: use as-is / enhance via Soul I2I /
                regenerate fresh / reject. Saves credits when an asset is already publishable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageVetter businessId={businessId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
