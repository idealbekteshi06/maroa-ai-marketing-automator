import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import { apiFireAndForget } from "@/lib/apiClient";
import { identify, reset, setPersonProperties } from "@/lib/analytics";
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

  const updateBusiness = useCallback(async (userId: string, user?: User | null) => {
    // Deduplicate — skip if already fetching for same user
    if (fetchingRef.current === userId) return;
    fetchingRef.current = userId;
    try {
      const { data, error } = await externalSupabase
        .from("businesses")
        .select("id, onboarding_complete")
        .eq("user_id", userId)
        .order("onboarding_complete", { ascending: false })
        .order("created_at", { ascending: true });
      if (!mountedRef.current) return;
      if (error) { return; }

      // A user can legitimately have more than one businesses row. Do NOT use
      // .maybeSingle() here — it errors on a multi-row read, which left businessId
      // unset and (worse) let a falsy `data` fall through to the insert branch,
      // creating duplicate businesses on load. Read every row, then pick the first
      // onboarded business, else the first (oldest) one.
      const rows = data ?? [];
      const chosen = rows.find((b) => b.onboarding_complete) ?? rows[0] ?? null;

      if (chosen) {
        setBusinessId(chosen.id);
        setOnboardingComplete(chosen.onboarding_complete ?? null);
        setPersonProperties({
          businessId: chosen.id,
          onboardingComplete: chosen.onboarding_complete ?? false,
        });
      } else if (rows.length === 0 && user) {
        // No business row — likely Google OAuth signup. Create one.
        // Guarded on rows.length === 0 so it can never fire on a multi-row read.
        const meta = user.user_metadata || {};
        const email = user.email || meta.email || "";
        const firstName = meta.full_name?.split(" ")[0] || meta.name?.split(" ")[0] || "";
        const businessData = {
          user_id: userId,
          email,
          first_name: firstName,
          business_name: "",
          industry: "",
          location: "",
          target_audience: "",
          brand_tone: "",
          marketing_goal: "",
          is_active: true,
          plan: "free",
          plan_price: 0,
          daily_budget: 0,
          onboarding_complete: false,
          social_accounts_connected: false,
        };
        const { data: inserted, error: insertError } = await externalSupabase
          .from("businesses")
          .insert([businessData])
          .select("id")
          .single();
        if (!mountedRef.current) return;
        if (!insertError && inserted) {
          setBusinessId(inserted.id);
          setOnboardingComplete(false);
          apiFireAndForget("/webhook/new-user-signup", {
            user_id: userId, email, first_name: firstName,
            business_name: "", industry: "", location: "", plan: "free",
          });
        } else {
          setBusinessId(null);
          setOnboardingComplete(null);
        }
      }
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
          void updateBusiness(nextUser.id, nextUser);
          identify(nextUser.id, {
            email: nextUser.email ?? null,
            firstName: (nextUser.user_metadata?.first_name as string) ?? null,
          });
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
      if (u) {
        await updateBusiness(u.id, u);
        identify(u.id, {
          email: u.email ?? null,
          firstName: (u.user_metadata?.first_name as string) ?? null,
        });
      }
      if (mountedRef.current) { setLoading(false); setIsReady(true); }
    });

    return () => { mountedRef.current = false; subscription.unsubscribe(); };
  }, [updateBusiness]);

  const signOut = useCallback(async () => {
    await externalSupabase.auth.signOut();
    setUser(null); setSession(null); setBusinessId(null); setOnboardingComplete(null);
    reset();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, businessId, onboardingComplete, loading, isReady, signOut, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}
