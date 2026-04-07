import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Clock, Calendar, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function WelcomeModal() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem("maroa-welcome-shown");
    if (!shown) setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem("maroa-welcome-shown", "true");
    setShow(false);
  };

  if (!show) return null;

  const firstName = user?.user_metadata?.first_name || "";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={dismiss} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={dismiss} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-6">
          <p className="text-3xl mb-2">🎉</p>
          <h2 className="text-xl font-bold text-foreground">Welcome to maroa.ai{firstName ? `, ${firstName}` : ""}!</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your AI marketing engine is set up and running. Here's what happens next — no action needed from you:</p>
        </div>

        <div className="space-y-4 mb-6">
          {[
            { icon: Clock, label: "Right now", desc: "AI is analyzing your business and building your strategy" },
            { icon: Calendar, label: "Next 24 hours", desc: "Your first social posts will be generated" },
            { icon: BarChart3, label: "First Sunday", desc: "AI Brain runs competitor analysis and SEO audit" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">We'll notify you when your first posts are ready to review.</p>
          <Button onClick={dismiss} className="w-full h-11">Got it — show me my dashboard</Button>
        </div>
      </div>
    </div>
  );
}
