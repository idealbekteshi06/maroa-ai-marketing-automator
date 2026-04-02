import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const RAILWAY_URL = "https://maroa-api-production.up.railway.app";
const REDIRECT_URI = "https://maroa-ai-marketing-automator.lovable.app/social-callback";

export default function SocialCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      setTimeout(() => navigate("/dashboard"), 3000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received.");
      setTimeout(() => navigate("/dashboard"), 3000);
      return;
    }

    try {
      // Get business_id from localStorage or lookup
      let businessId = localStorage.getItem("meta_oauth_business_id");

      if (!businessId && user) {
        const { data: biz } = await externalSupabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        businessId = biz?.id || null;
      }

      if (!businessId) throw new Error("Business not found");

      setMessage("Exchanging tokens with Facebook...");

      const resp = await fetch(`${RAILWAY_URL}/meta-oauth-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          business_id: businessId,
          redirect_uri: REDIRECT_URI,
        }),
      });

      const result = await resp.json();

      if (!resp.ok || !result.success) {
        throw new Error(result.error || "OAuth exchange failed");
      }

      localStorage.removeItem("meta_oauth_business_id");
      setStatus("success");
      setMessage(result.message || "Facebook & Instagram connected!");
      setTimeout(() => navigate("/dashboard?connected=meta"), 2000);
    } catch (err: any) {
      console.error("[SocialCallback]", err);
      setStatus("error");
      setMessage(err.message || "Something went wrong connecting your account.");
      setTimeout(() => navigate("/dashboard"), 4000);
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
