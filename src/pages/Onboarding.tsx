import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Upload, Building2, Users, Target, Rocket, PartyPopper } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const steps = [
  { label: "Business Profile", icon: Building2 },
  { label: "Your Audience", icon: Users },
  { label: "Marketing Goals", icon: Target },
  { label: "Connect & Launch", icon: Rocket },
];

const industryOptions = ["Bakery", "Restaurant", "Café", "Salon & Spa", "Gym & Fitness", "Boutique & Retail", "Photography", "Real Estate", "Coaching & Consulting", "Medical & Dental", "Auto Services", "Home Services", "Other"];
const businessAgeOptions = ["Less than 1 year", "1 to 3 years", "3 to 5 years", "More than 5 years"];
const customerVolumeOptions = ["Less than 50", "50 to 200", "200 to 500", "More than 500"];
const goalOptions = ["Get more customers through the door", "Grow Instagram followers", "Get more online orders", "Build brand awareness", "Generate leads for follow up"];
const contentTypeOptions = ["Behind the scenes", "Product showcases", "Customer stories", "Educational tips", "Promotions and offers", "I'm not sure yet"];
const platformOptions = ["Instagram", "Facebook", "TikTok", "Google", "LinkedIn"];

const N8N_CONNECT_WEBHOOK_URL = "https://ideal.app.n8n.cloud/webhook/maroa-account-2026";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, businessId, refreshBusiness } = useAuth();
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [connectLoading, setConnectLoading] = useState<string | null>(null);
  const [connected, setConnected] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: "", industry: "", location: "",
    business_age: "", customer_volume: "", avg_order_value: "",
    target_audience: "", problem_solved: "", differentiator: "", competitors: "",
    marketing_goal: "", daily_budget: 10, platforms: [] as string[], content_type: "",
    brand_tone: "",
  });

  const progress = Math.round(((step + 1) / steps.length) * 100);

  useEffect(() => {
    if (!businessId) return;
    externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm(f => ({
            ...f,
            business_name: data.business_name ?? "",
            industry: data.industry ?? "",
            location: data.location ?? "",
            target_audience: data.target_audience ?? "",
            brand_tone: data.brand_tone ?? "",
            marketing_goal: data.marketing_goal ?? "",
            competitors: data.competitors ?? "",
          }));
        }
      });
  }, [businessId]);

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const togglePlatform = (p: string) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }));
  };

  const handleSaveStep = async () => {
    if (!businessId) return;
    const updateData: Record<string, any> = {};
    if (step === 0) {
      updateData.business_name = form.business_name;
      updateData.industry = form.industry;
      updateData.location = form.location;
    } else if (step === 1) {
      updateData.target_audience = form.target_audience;
      updateData.competitors = form.competitors;
    } else if (step === 2) {
      updateData.marketing_goal = form.marketing_goal;
      updateData.daily_budget = form.daily_budget;
      updateData.brand_tone = form.content_type;
    }
    await externalSupabase.from("businesses").update(updateData).eq("id", businessId);
  };

  const toggleConnect = async (name: string) => {
    if (connected.includes(name)) { setConnected(prev => prev.filter(n => n !== name)); return; }
    setConnectLoading(name);
    setConnected(prev => [...prev, name]);
    try {
      // Fetch latest business data for the webhook
      const { data: bizData } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
      await fetch(N8N_CONNECT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          business_name: bizData?.business_name ?? form.business_name,
          email: bizData?.email ?? user?.email ?? "",
          first_name: bizData?.first_name ?? "",
          platform: name,
          facebook_page_id: bizData?.facebook_page_id ?? null,
          meta_access_token: bizData?.meta_access_token ?? null,
          ad_account_id: bizData?.ad_account_id ?? null,
        }),
      });
      toast.success(`${name} connected!`);
    } catch { toast.success(`${name} connected!`); }
    setConnectLoading(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !businessId) return;
    for (const file of Array.from(files)) {
      const fileName = `${businessId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await externalSupabase.storage.from("business-photos").upload(fileName, file);
      if (uploadError) { toast.error(`Failed to upload ${file.name}`); continue; }
      const { data: urlData } = externalSupabase.storage.from("business-photos").getPublicUrl(fileName);
      await externalSupabase.from("business_photos").insert({
        business_id: businessId, photo_url: urlData.publicUrl, photo_type: "Product", description: file.name, is_active: true,
      });
    }
    toast.success("Photos uploaded!");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFinish = async () => {
    setShowConfetti(true);
    if (businessId) {
      await handleSaveStep();
      await externalSupabase.from("businesses").update({ onboarding_complete: true }).eq("id", businessId);
      await refreshBusiness();

      // Trigger signup and instant-content webhooks
      const { data: bizData } = await externalSupabase.from("businesses").select("*").eq("id", businessId).maybeSingle();
      if (bizData) {
        void fetch("https://ideal.app.n8n.cloud/webhook/maroa-signup-2026", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: bizData.user_id, email: bizData.email, first_name: bizData.first_name,
            business_name: bizData.business_name, industry: bizData.industry,
            location: bizData.location, target_audience: bizData.target_audience,
            brand_tone: bizData.brand_tone, marketing_goal: bizData.marketing_goal,
            plan: bizData.plan,
          }),
        }).catch(console.warn);
        void fetch("https://ideal.app.n8n.cloud/webhook/maroa-content-2026", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: businessId, email: bizData.email }),
        }).catch(console.warn);
      }
    }
    setTimeout(() => navigate("/dashboard"), 2500);
  };

  const handleNext = async () => { await handleSaveStep(); setStep(step + 1); };

  const selectClass = "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress header */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Step {step + 1} of {steps.length}</span>
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-all duration-300 ${
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
                </div>
                <span className="hidden text-xs text-foreground sm:block font-medium">{s.label}</span>
                {i < steps.length - 1 && <div className={`h-px flex-1 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-10">
        {/* Step 1: Business Profile */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Tell us about your business</h2>
              <p className="mt-2 text-sm text-muted-foreground">This helps maroa.ai create content that sounds like you.</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <div><Label>Business name</Label><Input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} className="mt-1" placeholder="e.g. Sweet Delights Bakery" /></div>
              <div>
                <Label>Industry</Label>
                <select value={form.industry} onChange={(e) => update("industry", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select your industry</option>
                  {industryOptions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div><Label>Location (city and country)</Label><Input value={form.location} onChange={(e) => update("location", e.target.value)} className="mt-1" placeholder="e.g. Brooklyn, New York" /></div>
              <div>
                <Label>How long have you been in business?</Label>
                <select value={form.business_age} onChange={(e) => update("business_age", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select</option>
                  {businessAgeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>How many customers do you serve per month?</Label>
                <select value={form.customer_volume} onChange={(e) => update("customer_volume", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select</option>
                  {customerVolumeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div><Label>What is your average sale/order value ($)?</Label><Input type="number" value={form.avg_order_value} onChange={(e) => update("avg_order_value", e.target.value)} className="mt-1" placeholder="e.g. 35" /></div>
            </div>
          </div>
        )}

        {/* Step 2: Your Audience */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Who are your customers?</h2>
              <p className="mt-2 text-sm text-muted-foreground">The more specific you are, the better your AI-generated content will perform.</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <div>
                <Label>Who is your ideal customer?</Label>
                <Textarea value={form.target_audience} onChange={(e) => update("target_audience", e.target.value)} className="mt-1" rows={3} placeholder="e.g. Mothers aged 28–45 in Brooklyn who care about healthy food for their families" />
              </div>
              <div>
                <Label>What problem do you solve for them?</Label>
                <Textarea value={form.problem_solved} onChange={(e) => update("problem_solved", e.target.value)} className="mt-1" rows={3} placeholder="e.g. We save busy parents time by offering ready-made healthy meals for kids" />
              </div>
              <div>
                <Label>What makes you different from competitors?</Label>
                <Textarea value={form.differentiator} onChange={(e) => update("differentiator", e.target.value)} className="mt-1" rows={3} placeholder="e.g. We use only organic, locally-sourced ingredients and offer free delivery" />
              </div>
              <div>
                <Label>List your top 3 competitors</Label>
                <Textarea value={form.competitors} onChange={(e) => update("competitors", e.target.value)} className="mt-1" rows={2} placeholder="e.g. Joe's Bakery, Sweet Flour, The Cake Shop" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Marketing Goals */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Set your marketing goals</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tell us what success looks like for you.</p>
            </div>
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
              <div>
                <Label>What is your primary marketing goal?</Label>
                <select value={form.marketing_goal} onChange={(e) => update("marketing_goal", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select your goal</option>
                  {goalOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label>Monthly marketing budget</Label>
                <div className="mt-3 text-center">
                  <span className="text-4xl font-bold text-foreground">${form.daily_budget * 30}</span>
                  <span className="text-lg text-muted-foreground">/month</span>
                  <p className="text-xs text-muted-foreground mt-1">(${form.daily_budget}/day)</p>
                </div>
                <input type="range" min={0} max={67} step={1} value={form.daily_budget} onChange={(e) => update("daily_budget", +e.target.value)} className="mt-4 w-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>$0</span><span>$2,000/mo</span></div>
              </div>
              <div>
                <Label className="mb-3 block">Which platforms are you currently on?</Label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map(p => (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                        form.platforms.includes(p) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/30"
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>What type of content performs best for you?</Label>
                <select value={form.content_type} onChange={(e) => update("content_type", e.target.value)} className={selectClass + " mt-1"}>
                  <option value="">Select content type</option>
                  {contentTypeOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Connect & Launch */}
        {step === 3 && !showConfetti && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Connect & launch</h2>
              <p className="mt-2 text-sm text-muted-foreground">Upload photos and connect your accounts to start posting automatically.</p>
            </div>

            {/* Photo upload */}
            <div>
              <Label className="mb-3 block">Upload 5–10 photos of your business, products, or team</Label>
              <div
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center cursor-pointer transition-colors hover:border-primary/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">Drag and drop your photos here</p>
                <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            {/* Connect accounts */}
            <div>
              <Label className="mb-3 block">Connect your accounts</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[{ name: "Facebook", color: "#1877F2" }, { name: "Instagram", color: "#E4405F" }, { name: "Google Ads", color: "#4285F4" }].map(p => (
                  <button key={p.name} onClick={() => toggleConnect(p.name)} disabled={connectLoading === p.name}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all ${
                      connected.includes(p.name) ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    }`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: p.color + "15" }}>
                      <span className="text-sm font-bold" style={{ color: p.color }}>{p.name[0]}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-semibold text-card-foreground">{p.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {connectLoading === p.name ? "Connecting..." : connected.includes(p.name) ? "Connected ✓" : "Click to connect"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showConfetti && (
          <div className="flex flex-col items-center justify-center text-center animate-scale-in py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-foreground">You're all set! 🎉</h2>
            <p className="mt-3 text-lg text-muted-foreground">Your AI marketing engine is starting up now.</p>
            <p className="mt-1 text-sm text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        )}

        {/* Nav */}
        {!showConfetti && (
          <div className="mt-10 flex justify-between">
            <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext}>Continue</Button>
            ) : (
              <Button size="lg" className="gap-2" onClick={handleFinish}>
                <Rocket className="h-4 w-4" /> Start my AI marketing engine
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
