import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  allowIncompleteOnboarding?: boolean;
}

export default function ProtectedRoute({ children, allowIncompleteOnboarding = false }: Props) {
  const { user, loading, isReady, onboardingComplete } = useAuth();

  // Wait until auth is fully restored from storage
  if (!isReady || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowIncompleteOnboarding && onboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
