import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/errorMessages";
import { apiPost } from "@/lib/apiClient";

const REDIRECT_URI = "https://maroa-ai-marketing-automator.lovable.app/social-callback";

export default function SocialCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, businessId } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Connecting your accounts...");

  const handleOAuthCallback = useCallback(async () => {
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

      if (!user?.id) {
        setStatus("error");
        setMessage("Not signed in.");
        setTimeout(() => navigate("/dashboard?tab=social"), 3000);
        return;
      }

      const result = await apiPost<Record<string, unknown>>("/meta-oauth-exchange", {
        code,
        user_id: user.id, // server expects user_id — this is auth.user.id = businesses.id
        business_id: bizId,
        redirect_uri: REDIRECT_URI,
      });

      if (!result.success) {
        throw new Error(String(result.error || result.message || "OAuth exchange failed"));
      }

      localStorage.removeItem("meta_oauth_business_id");
      setStatus("success");
      setMessage(result.message || "Facebook & Instagram connected!");
      toast.success(SUCCESS_MESSAGES.GENERATED);
      setTimeout(() => navigate("/dashboard?tab=social"), 2000);
    } catch (err: unknown) {
      setStatus("error");
      const errorMsg = err instanceof Error ? err.message : "Something went wrong connecting your account.";
      setMessage(errorMsg);
      toast.error(errorMsg);
      setTimeout(() => navigate("/dashboard?tab=social"), 4000);
    }
  }, [businessId, navigate, searchParams, user, user?.id]);

  useEffect(() => {
    void handleOAuthCallback();
  }, [handleOAuthCallback]);

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
