import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const RAILWAY_URL = "https://maroa-api-production.up.railway.app";
const REDIRECT_URI = "https://maroa-ai-marketing-automator.lovable.app/social-callback";

export default function SocialCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, businessId } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your accounts...");

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  async function handleOAuthCallback() {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Connection denied: ${searchParams.get("error_description") || error}`);
      setTimeout(() => navigate("/dashboard?tab=social"), 3000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received.");
      setTimeout(() => navigate("/dashboard?tab=social"), 3000);
      return;
    }

    try {
      // Get business_id from auth context, localStorage, or query
      let bizId = businessId || localStorage.getItem("meta_oauth_business_id");

      if (!bizId && user) {
        const { data: biz } = await externalSupabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        bizId = biz?.id || null;
      }

      if (!bizId) {
        setStatus("error");
        setMessage("Business not found. Please try connecting again from the dashboard.");
        setTimeout(() => navigate("/dashboard?tab=social"), 3000);
        return;
      }

      setMessage("Exchanging tokens with Facebook...");

      const resp = await fetch(`${RAILWAY_URL}/meta-oauth-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          business_id: bizId,
          redirect_uri: REDIRECT_URI,
        }),
      });

      let result: any;
      try {
        result = await resp.json();
      } catch {
        throw new Error(`Server returned status ${resp.status} with no JSON body`);
      }

      if (!resp.ok || !result.success) {
        throw new Error(result.error || result.message || `OAuth exchange failed (status ${resp.status})`);
      }

      localStorage.removeItem("meta_oauth_business_id");
      setStatus("success");
      setMessage(result.message || "Facebook & Instagram connected!");
      toast.success("Facebook and Instagram connected successfully");
      setTimeout(() => navigate("/dashboard?tab=social"), 2000);
    } catch (err: any) {
      setStatus("error");
      const errorMsg = err?.message || "Something went wrong connecting your account.";
      setMessage(errorMsg);
      toast.error(errorMsg);
      setTimeout(() => navigate("/dashboard?tab=social"), 4000);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
        {status === "processing" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-semibold text-foreground">Connecting...</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">Connected!</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">Connection Failed</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
}
