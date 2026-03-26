import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

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
    if (error.message.includes("Invalid login") || error.message.includes("invalid_credentials")) {
      return "Incorrect email or password. Please try again.";
    }

    if (error.message.toLowerCase().includes("timed out")) {
      return "Something went wrong, please try again.";
    }

    return error.message;
  }

  return "Something went wrong, please try again.";
};

export default function Login() {
  const navigate = useNavigate();
  const { user, onboardingComplete, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (onboardingComplete === false) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authLoading, onboardingComplete, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: signInError } = await withTimeout(
        externalSupabase.auth.signInWithPassword({ email, password }),
        "Login timed out."
      );

      if (signInError) throw signInError;

      const { data: sessionData, error: sessionError } = await withTimeout(
        externalSupabase.auth.getSession(),
        "Session restore timed out."
      );

      if (sessionError) throw sessionError;

      const sessionUser = sessionData.session?.user;
      if (!sessionUser) {
        throw new Error("Could not create your session. Please try again.");
      }

      const { data: biz, error: bizError } = await withTimeout(
        Promise.resolve(
          externalSupabase
            .from("businesses")
            .select("onboarding_complete")
            .eq("user_id", sessionUser.id)
            .maybeSingle()
        ),
        "Loading your account timed out."
      );

      if (bizError) throw bizError;

      toast.success("Welcome back!");

      if (biz?.onboarding_complete === false) {
        navigate("/onboarding", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(toAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await externalSupabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) toast.error(error.message || "Google sign-in failed.");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    try {
      const { error } = await externalSupabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setForgotOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm animate-fade-in">
        <Link to="/" className="mb-10 block text-center text-xl font-bold text-foreground">
          maroa<span className="text-primary">.ai</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="text-xl font-bold text-card-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>


          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11" required /></div>
            <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11" required /></div>
            <Button type="submit" size="lg" className="w-full h-11" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => { setResetEmail(email); setForgotOpen(true); }} className="text-sm text-primary hover:underline">Forgot password?</button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>Enter your email and we'll send you a reset link.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
            <Input type="email" placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
