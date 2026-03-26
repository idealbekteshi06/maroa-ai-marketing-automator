import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  businessId: string | null;
  onboardingComplete: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  businessId: null,
  onboardingComplete: null,
  loading: true,
  signOut: async () => {},
  refreshBusiness: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusiness = async (userId: string) => {
    const { data, error } = await externalSupabase
      .from("businesses")
      .select("id, onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch business:", error.message);
      setBusinessId(null);
      setOnboardingComplete(null);
      return;
    }

    setBusinessId(data?.id ?? null);
    setOnboardingComplete(data?.onboarding_complete ?? null);
  };

  const refreshBusiness = async () => {
    if (user?.id) await fetchBusiness(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = externalSupabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          void fetchBusiness(nextUser.id);
        } else {
          setBusinessId(null);
          setOnboardingComplete(null);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await externalSupabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        setSession(initialSession);
        const initialUser = initialSession?.user ?? null;
        setUser(initialUser);

        if (initialUser) {
          await fetchBusiness(initialUser.id);
        } else {
          setBusinessId(null);
          setOnboardingComplete(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        if (!mounted) return;
        setSession(null);
        setUser(null);
        setBusinessId(null);
        setOnboardingComplete(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await externalSupabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, businessId, onboardingComplete, loading, signOut, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}
