import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function SocialCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard social tab with the OAuth code in the URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      navigate(`/dashboard?tab=social&code=${code}`, { replace: true });
    } else {
      navigate("/dashboard?tab=social", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Connecting your account...</p>
      </div>
    </div>
  );
}
