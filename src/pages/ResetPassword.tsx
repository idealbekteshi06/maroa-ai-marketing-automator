import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { toast } from "sonner";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
    } else {
      toast.error(ERROR_MESSAGES.GENERATION_FAILED);
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(ERROR_MESSAGES.GENERATION_FAILED); return; }
    if (password.length < 6) { toast.error(ERROR_MESSAGES.GENERATION_FAILED); return; }
    setLoading(true);
    try {
      const { error } = await externalSupabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(SUCCESS_MESSAGES.GENERATED);
      navigate("/login");
    } catch (err: unknown) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!valid) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground text-center">Set new password</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">Enter your new password below.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11" required /></div>
          <div><Label>Confirm password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 h-11" required /></div>
          <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
        </form>
      </div>
    </div>
  );
}
