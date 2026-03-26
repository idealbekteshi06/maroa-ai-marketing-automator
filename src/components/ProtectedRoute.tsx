import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  allowIncompleteOnboarding?: boolean;
}

export default function ProtectedRoute({ children, allowIncompleteOnboarding = false }: Props) {
  const { user, loading, onboardingComplete } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Force onboarding if not complete (unless we're already going to onboarding)
  if (!allowIncompleteOnboarding && onboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
