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

    return error.message;
  }

  return "Something went wrong, please try again.";
};

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

      void fetch(N8N_SIGNUP_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId, email: form.email, first_name: form.firstName,
          last_name: form.lastName, business_name: form.businessName,
          industry: form.industry, location: form.location, plan: "free",
        }),
      }).catch((webhookErr) => {
        console.warn("Webhook POST failed:", webhookErr);
      });

      toast.success("Account created! Let's set up your marketing.");
      navigate("/onboarding");
    } catch (error) {
      toast.error(toAuthErrorMessage(error));
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
