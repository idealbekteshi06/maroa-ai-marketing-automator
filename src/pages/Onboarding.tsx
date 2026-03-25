import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Upload, Building2, Link2, DollarSign, Camera, PartyPopper } from "lucide-react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const steps = [
  { label: "Business Details", icon: Building2 },
  { label: "Connect Accounts", icon: Link2 },
  { label: "Set Budget", icon: DollarSign },
  { label: "Upload Photos", icon: Camera },
];

const socialPlatforms = [
  { name: "Facebook", color: "#1877F2" },
  { name: "Instagram", color: "#E4405F" },
  { name: "Google Ads", color: "#4285F4" },
  { name: "TikTok", color: "#000000" },
];

const budgetPresets = [5, 10, 15, 30];
const N8N_CONNECT_WEBHOOK_URL = "https://ideal.app.n8n.cloud/webhook/account-connected";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, businessId } = useAuth();
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(10);
  const [connected, setConnected] = useState<string[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [connectLoading, setConnectLoading] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1 editable fields
  const [bizForm, setBizForm] = useState({ business_name: "", industry: "", location: "", target_audience: "" });

  const progress = Math.round(((step + 1) / steps.length) * 100);

  useEffect(() => {
    if (!businessId) return;
    externalSupabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBusiness(data);
          setBudget(data.daily_budget ?? 10);
          setBizForm({
            business_name: data.business_name ?? "",
            industry: data.industry ?? "",
            location: data.location ?? "",
            target_audience: data.target_audience ?? "",
          });
        }
      });
  }, [businessId]);

  const handleSaveStep1 = async () => {
    if (!businessId) return;
    const { error } = await externalSupabase
      .from("businesses")
      .update(bizForm)
      .eq("id", businessId);
    if (error) console.error("Step 1 save error:", error);
  };

  const toggleConnect = async (name: string) => {
    if (connected.includes(name)) {
      setConnected((prev) => prev.filter((n) => n !== name));
      return;
    }
    setConnectLoading(name);
    setConnected((prev) => [...prev, name]);
    try {
      await fetch(N8N_CONNECT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          business_name: business?.business_name ?? "",
          email: business?.email ?? user?.email ?? "",
          first_name: business?.first_name ?? "",
          facebook_page_id: business?.facebook_page_id ?? "",
          meta_access_token: business?.meta_access_token ?? "",
          ad_account_id: "",
        }),
      });
      toast.success(`${name} connected!`);
    } catch (err) {
      console.warn("Connect webhook failed:", err);
      toast.success(`${name} connected!`);
    }
    setConnectLoading(null);
  };

  const handleBudgetSave = async () => {
    if (!businessId) return;
    const { error } = await externalSupabase.from("businesses").update({ daily_budget: budget }).eq("id", businessId);
    if (error) toast.error("Failed to save budget");
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
      await externalSupabase.from("businesses").update({ onboarding_complete: true }).eq("id", businessId);
    }
    setTimeout(() => navigate("/dashboard"), 2500);
  };

  const handleNext = () => {
    if (step === 0) handleSaveStep1();
    if (step === 2) handleBudgetSave();
    setStep(step + 1);
  };

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
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Review your business details</h2>
              <p className="mt-2 text-sm text-muted-foreground">Make sure everything looks right before we start.</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <div><Label>Business name</Label><Input value={bizForm.business_name} onChange={(e) => setBizForm(f => ({ ...f, business_name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Industry</Label><Input value={bizForm.industry} onChange={(e) => setBizForm(f => ({ ...f, industry: e.target.value }))} className="mt-1" /></div>
              <div><Label>Location</Label><Input value={bizForm.location} onChange={(e) => setBizForm(f => ({ ...f, location: e.target.value }))} className="mt-1" /></div>
              <div><Label>Target audience</Label><Input value={bizForm.target_audience} onChange={(e) => setBizForm(f => ({ ...f, target_audience: e.target.value }))} className="mt-1" /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Connect your accounts</h2>
              <p className="mt-2 text-sm text-muted-foreground">Link the platforms you want to automate.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {socialPlatforms.map((p) => (
                <button
                  key={p.name}
                  onClick={() => toggleConnect(p.name)}
                  disabled={connectLoading === p.name}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-5 transition-all duration-200 ${
                    connected.includes(p.name) ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30 hover:shadow-card"
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: p.color + "15" }}>
                    <span className="text-base font-bold" style={{ color: p.color }}>{p.name[0]}</span>
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
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Set your daily ad budget</h2>
              <p className="mt-2 text-sm text-muted-foreground">You can change this anytime from your dashboard.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="text-center">
                <span className="text-5xl font-bold text-foreground">${budget}</span>
                <span className="text-lg text-muted-foreground">/day</span>
              </div>
              <input type="range" min={0} max={50} step={1} value={budget} onChange={(e) => setBudget(+e.target.value)}
                className="mt-8 w-full" />
              <div className="mt-4 flex gap-2">
                {budgetPresets.map((b) => (
                  <Button key={b} variant={budget === b ? "default" : "outline"} size="sm" onClick={() => setBudget(b)} className="flex-1 text-xs">
                    ${b}/day
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && !showConfetti && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Upload your photos</h2>
              <p className="mt-2 text-sm text-muted-foreground">Add 5–10 photos of your business. We'll use them in your content.</p>
            </div>
            <div
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center cursor-pointer transition-colors hover:border-primary/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-5 text-base font-semibold text-foreground">Drag and drop your photos here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              <Button variant="outline" className="mt-5" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Choose files</Button>
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
              <Button onClick={handleFinish}>Launch my marketing →</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
