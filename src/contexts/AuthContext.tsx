import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { externalSupabase } from "@/integrations/supabase/external-client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  businessId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  businessId: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = externalSupabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data } = await externalSupabase
            .from("businesses")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setBusinessId(data?.id ?? null);
        } else {
          setBusinessId(null);
        }
        setLoading(false);
      }
    );

    externalSupabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        externalSupabase
          .from("businesses")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle()
          .then(({ data }) => setBusinessId(data?.id ?? null));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await externalSupabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, businessId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
