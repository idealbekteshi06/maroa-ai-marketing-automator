import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Upload } from "lucide-react";

const steps = ["Business Details", "Connect Accounts", "Set Budget", "Upload Photos"];

const socialPlatforms = [
  { name: "Facebook", color: "#1877F2" },
  { name: "Instagram", color: "#E4405F" },
  { name: "Google Ads", color: "#4285F4" },
  { name: "TikTok", color: "#000000" },
];

const budgetPresets = [5, 10, 15, 30];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState(10);
  const [connected, setConnected] = useState<string[]>([]);

  const toggleConnect = (name: string) => {
    setConnected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Progress */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden text-sm text-foreground sm:block">{s}</span>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        {step === 0 && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-bold text-foreground">Review your business details</h2><p className="mt-1 text-muted-foreground">Make sure everything looks right.</p></div>
            <div className="space-y-4 rounded-2xl bg-card p-6">
              <div><Label>Business name</Label><Input defaultValue="My Business" /></div>
              <div><Label>Industry</Label><Input defaultValue="Bakery" /></div>
              <div><Label>Location</Label><Input defaultValue="Austin, TX" /></div>
              <div><Label>Target audience</Label><Input defaultValue="Women 25-45" /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-bold text-foreground">Connect your accounts</h2><p className="mt-1 text-muted-foreground">Link the platforms you want to automate.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {socialPlatforms.map((p) => (
                <button
                  key={p.name}
                  onClick={() => toggleConnect(p.name)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-6 transition-all ${
                    connected.includes(p.name) ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: p.color + "20" }}>
                    <span className="text-lg font-bold" style={{ color: p.color }}>{p.name[0]}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-card-foreground">{p.name}</span>
                    <p className="text-sm text-muted-foreground">{connected.includes(p.name) ? "Connected ✓" : "Click to connect"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-bold text-foreground">Set your daily ad budget</h2><p className="mt-1 text-muted-foreground">You can change this anytime.</p></div>
            <div className="rounded-2xl bg-card p-6">
              <div className="text-center text-4xl font-bold text-foreground">${budget}/day</div>
              <input type="range" min={0} max={50} step={1} value={budget} onChange={(e) => setBudget(+e.target.value)}
                className="mt-6 w-full accent-primary" />
              <div className="mt-4 flex gap-2">
                {budgetPresets.map((b) => (
                  <Button key={b} variant={budget === b ? "default" : "outline"} size="sm" onClick={() => setBudget(b)} className="flex-1">
                    ${b}/day
                  </Button>
                ))}
                <Button variant={!budgetPresets.includes(budget) ? "default" : "outline"} size="sm" className="flex-1">Custom</Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-bold text-foreground">Upload your photos</h2><p className="mt-1 text-muted-foreground">Add 5–10 photos of your business. We'll use them in your content.</p></div>
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 font-medium text-foreground">Drag and drop your photos here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              <Button variant="outline" className="mt-4">Choose files</Button>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="mt-10 flex justify-between">
          <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button>Launch my marketing →</Button>
          )}
        </div>
      </div>
    </div>
  );
}
