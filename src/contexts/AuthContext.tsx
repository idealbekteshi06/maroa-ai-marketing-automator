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
  user: null,
  session: null,
  businessId: null,
  onboardingComplete: null,
  loading: true,
  isReady: false,
  signOut: async () => {},
  refreshBusiness: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function fetchBusinessWithRetry(userId: string, retries = 1, delay = 2000) {
  const query = () =>
    externalSupabase
      .from("businesses")
      .select("id, onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle();

  let result = await query();
  if (result.error) {
    console.error("Failed to fetch business:", result.error.message);
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, delay));
      return fetchBusinessWithRetry(userId, retries - 1, delay);
    }
    return null;
  }
  // Retry once if data is null (race condition on signup)
  if (!result.data && retries > 0) {
    await new Promise((r) => setTimeout(r, delay));
    result = await query();
    if (result.error) {
      console.error("Retry fetch business error:", result.error.message);
      return null;
    }
  }
  return result.data ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  const updateBusiness = useCallback(async (userId: string) => {
    const biz = await fetchBusinessWithRetry(userId);
    if (!mountedRef.current) return;
    setBusinessId(biz?.id ?? null);
    setOnboardingComplete(biz?.onboarding_complete ?? null);
  }, []);

  const refreshBusiness = useCallback(async () => {
    if (user?.id) await updateBusiness(user.id);
  }, [user?.id, updateBusiness]);

  useEffect(() => {
    mountedRef.current = true;

    // 1. Set up listener FIRST (catches all subsequent events)
    const { data: { subscription } } = externalSupabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mountedRef.current) return;
        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          // Fire and forget — never await inside onAuthStateChange
          void updateBusiness(nextUser.id);
        } else {
          setBusinessId(null);
          setOnboardingComplete(null);
        }
      }
    );

    // 2. Then restore session from storage
    if (!initializedRef.current) {
      initializedRef.current = true;
      externalSupabase.auth.getSession().then(async ({ data: { session: s }, error }) => {
        if (!mountedRef.current) return;
        if (error) {
          console.error("Failed to restore session:", error);
          setLoading(false);
          setIsReady(true);
          return;
        }
        setSession(s);
        const u = s?.user ?? null;
        setUser(u);
        if (u) {
          await updateBusiness(u.id);
        }
        if (mountedRef.current) {
          setLoading(false);
          setIsReady(true);
        }
      });
    }

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [updateBusiness]);

  const signOut = useCallback(async () => {
    await externalSupabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBusinessId(null);
    setOnboardingComplete(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, businessId, onboardingComplete, loading, isReady, signOut, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}
