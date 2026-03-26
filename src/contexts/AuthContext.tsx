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
    const { data } = await externalSupabase
      .from("businesses")
      .select("id, onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle();
    setBusinessId(data?.id ?? null);
    setOnboardingComplete(data?.onboarding_complete ?? null);
  };

  const refreshBusiness = async () => {
    if (user?.id) await fetchBusiness(user.id);
  };

  useEffect(() => {
    let initialized = false;

    const { data: { subscription } } = externalSupabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchBusiness(session.user.id);
        } else {
          setBusinessId(null);
          setOnboardingComplete(null);
        }
        initialized = true;
        setLoading(false);
      }
    );

    // Only use getSession as fallback if onAuthStateChange hasn't fired yet
    const timeout = setTimeout(async () => {
      if (!initialized) {
        const { data: { session } } = await externalSupabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchBusiness(session.user.id);
        }
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
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
