import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";

const industries = ["Bakery", "Restaurant", "Café", "Salon & Spa", "Gym & Fitness", "Boutique & Retail", "Photography", "Real Estate", "Coaching & Consulting", "Medical & Dental", "Auto Services", "Home Services", "Other"];

const N8N_SIGNUP_WEBHOOK_URL = "https://ideal.app.n8n.cloud/webhook/new-user-signup";

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    businessName: "", industry: "", location: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await externalSupabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { first_name: form.firstName, last_name: form.lastName },
        },
      });

      const userId = authData?.user?.id;
      if (authError && !userId) throw authError;
      if (!userId) throw new Error("Signup failed — no user returned.");
      if (authError) console.warn("Auth warning (user created, continuing):", authError.message);

      const businessData = {
        user_id: userId,
        email: form.email,
        first_name: form.firstName,
        business_name: form.businessName,
        industry: form.industry,
        location: form.location,
        target_audience: "",
        brand_tone: "",
        marketing_goal: "",
        is_active: true,
        plan: "free",
        plan_price: 0,
        daily_budget: 0,
        onboarding_complete: false,
        social_accounts_connected: false,
      };

      const { error: bizError } = await externalSupabase.from("businesses").insert([businessData]);
      if (bizError) {
        console.error("Businesses insert error:", bizError);
        throw new Error(`Businesses insert failed: ${bizError.message}`);
      }

      try {
        await fetch(N8N_SIGNUP_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId, email: form.email, first_name: form.firstName,
            last_name: form.lastName, business_name: form.businessName,
            industry: form.industry, location: form.location, plan: "free",
          }),
        });
      } catch (webhookErr) {
        console.warn("Webhook POST failed:", webhookErr);
      }

      toast.success("Account created! Let's set up your marketing.");
      navigate("/onboarding");
    } catch (err: any) {
      toast.error(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await externalSupabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) toast.error(error.message || "Google sign-up failed.");
  };

  const selectClass = "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-foreground p-12 text-background lg:flex">
        <Link to="/" className="text-xl font-bold">
          maroa<span className="text-primary">.ai</span>
        </Link>
        <div>
          <p className="text-4xl font-bold leading-tight">Your marketing,<br />handled by AI.</p>
          <p className="mt-4 text-lg opacity-60">Join 2,000+ small businesses growing on autopilot.</p>
        </div>
        <p className="text-sm opacity-30">© 2026 maroa.ai</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col bg-background">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="text-lg font-bold text-foreground lg:hidden">
            maroa<span className="text-primary">.ai</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-md flex-1 px-6 pb-12 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start your free trial — no credit card needed.</p>

          <div className="mt-8 flex flex-col gap-3">
            <Button variant="outline" size="lg" className="w-full h-11" onClick={handleGoogleSignUp}>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign up with Google
            </Button>
            <Button variant="outline" size="lg" className="w-full h-11" disabled>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Sign up with Apple
            </Button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="fn">First name</Label><Input id="fn" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="mt-1 h-11" required /></div>
              <div><Label htmlFor="ln">Last name</Label><Input id="ln" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="mt-1 h-11" required /></div>
            </div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1 h-11" required /></div>
            <div><Label htmlFor="pass">Password</Label><Input id="pass" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="mt-1 h-11" required /></div>
            <div><Label htmlFor="biz">Business name</Label><Input id="biz" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="mt-1 h-11" required /></div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <select id="industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} required className={selectClass + " mt-1"}>
                <option value="">Select industry</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div><Label htmlFor="loc">Location</Label><Input id="loc" placeholder="City, Country" value={form.location} onChange={(e) => update("location", e.target.value)} className="mt-1 h-11" required /></div>
            <Button type="submit" size="lg" className="mt-4 w-full h-11" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
