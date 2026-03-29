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
const AUTH_TIMEOUT_MS = 10_000;

const withTimeout = <T,>(promise: PromiseLike<T>, message: string): Promise<T> =>
  Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), AUTH_TIMEOUT_MS)
    ),
  ]);

const toAuthErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    if (error.message.includes("User already registered")) {
      return "An account with this email already exists. Please log in instead.";
    }
    if (error.message.toLowerCase().includes("timed out")) {
      return "Something went wrong, please try again.";
    }
    if (error.message.includes("provider is not enabled")) {
      return "This sign-in method is not available yet. Please use email and password.";
    }
    return error.message;
  }
  return "Something went wrong, please try again.";
};

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    businessName: "", industry: "", location: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await withTimeout(
        externalSupabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { first_name: form.firstName, last_name: form.lastName },
          },
        }),
        "Signup timed out."
      );

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

      const { error: bizError } = await withTimeout(
        Promise.resolve(externalSupabase.from("businesses").insert([businessData])),
        "Creating your account timed out."
      );

      if (bizError) {
        console.error("Businesses insert error:", bizError);
        throw new Error(`Businesses insert failed: ${bizError.message}`);
      }

      // Fetch the new business_id for webhooks
      const { data: newBiz } = await externalSupabase
        .from("businesses")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      void fetch(N8N_SIGNUP_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId, email: form.email, first_name: form.firstName,
          last_name: form.lastName, business_name: form.businessName,
          industry: form.industry, location: form.location, plan: "free",
        }),
      }).catch((err) => console.warn("Signup webhook failed:", err));

      // Trigger instant content generation
      if (newBiz?.id) {
        void fetch("https://ideal.app.n8n.cloud/webhook/instant-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ business_id: newBiz.id, email: form.email }),
        }).catch((err) => console.warn("Instant content webhook failed:", err));
      }

      toast.success("Account created! Let's set up your marketing.");
      navigate("/onboarding");
    } catch (error) {
      toast.error(toAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await externalSupabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(toAuthErrorMessage(error));
      setGoogleLoading(false);
    }
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

          <Button
            variant="outline"
            className="mt-6 w-full h-11"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Connecting..." : "Sign up with Google"}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="h-px flex-1 bg-border" />
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
