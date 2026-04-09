import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  businessId: string | null;
  onboardingComplete: boolean | null;
  loading: boolean;
  isReady: boolean;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, businessId: null, onboardingComplete: null,
  loading: true, isReady: false, signOut: async () => {}, refreshBusiness: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);
  const fetchingRef = useRef<string | null>(null);

  const updateBusiness = useCallback(async (userId: string) => {
    // Deduplicate — skip if already fetching for same user
    if (fetchingRef.current === userId) return;
    fetchingRef.current = userId;
    try {
      const { data, error } = await externalSupabase
        .from("businesses")
        .select("id, onboarding_complete")
        .eq("user_id", userId)
        .maybeSingle();
      if (!mountedRef.current) return;
      if (error) { return; }
      setBusinessId(data?.id ?? null);
      setOnboardingComplete(data?.onboarding_complete ?? null);
    } finally {
      fetchingRef.current = null;
    }
  }, []);

  const refreshBusiness = useCallback(async () => {
    if (user?.id) await updateBusiness(user.id);
  }, [user?.id, updateBusiness]);

  useEffect(() => {
    mountedRef.current = true;

    const { data: { subscription } } = externalSupabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mountedRef.current) return;
        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          void updateBusiness(nextUser.id);
        } else {
          setBusinessId(null);
          setOnboardingComplete(null);
        }
      }
    );

    externalSupabase.auth.getSession().then(async ({ data: { session: s }, error }) => {
      if (!mountedRef.current) return;
      if (error) { setLoading(false); setIsReady(true); return; }
      setSession(s);
      const u = s?.user ?? null;
      setUser(u);
      if (u) await updateBusiness(u.id);
      if (mountedRef.current) { setLoading(false); setIsReady(true); }
    });

    return () => { mountedRef.current = false; subscription.unsubscribe(); };
  }, [updateBusiness]);

  const signOut = useCallback(async () => {
    await externalSupabase.auth.signOut();
    setUser(null); setSession(null); setBusinessId(null); setOnboardingComplete(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, businessId, onboardingComplete, loading, isReady, signOut, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}
