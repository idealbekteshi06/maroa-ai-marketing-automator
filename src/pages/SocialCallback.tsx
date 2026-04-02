import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SocialCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const businessId = localStorage.getItem("meta_oauth_business_id");

    if (!code) {
      toast.error("No authorization code received");
      navigate("/dashboard?tab=social", { replace: true });
      return;
    }

    if (!businessId) {
      toast.error("No business found for OAuth");
      navigate("/dashboard?tab=social", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await fetch("https://maroa-api-production.up.railway.app/meta-oauth-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            business_id: businessId,
            redirect_uri: "https://maroa-ai-marketing-automator.lovable.app/social-callback",
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "OAuth exchange failed");
        }

        localStorage.removeItem("meta_oauth_business_id");
        setStatus("success");
        toast.success("Facebook & Instagram connected successfully!");
        navigate("/dashboard?tab=social", { replace: true });
      } catch (err: any) {
        console.error("OAuth exchange error:", err);
        setStatus("error");
        toast.error(err.message || "Failed to connect Facebook");
        setTimeout(() => navigate("/dashboard?tab=social", { replace: true }), 2000);
      }
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting your Facebook & Instagram...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-sm text-destructive">Connection failed. Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
