import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppRole } from "@/clinic/types";

type AuthState = {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  accountActive: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ needsEmailConfirmation: boolean }>;
  claimInitialAdmin: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const demoUser = {
  id: "demo-admin",
  email: "admin@lunadent.local",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date(0).toISOString(),
} as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isSupabaseConfigured ? null : demoUser);
  const [role, setRole] = useState<AppRole | null>(isSupabaseConfigured ? null : "admin");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [accountActive, setAccountActive] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    const loadRole = async (nextUser: User | null) => {
      if (!mounted) return;
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setAccountActive(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role,active")
        .eq("id", nextUser.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setRole(null);
        setAccountActive(false);
        setLoading(false);
        return;
      }

      if (data?.active === false) {
        await supabase.auth.signOut();
        if (!mounted) return;
        setUser(null);
        setRole(null);
        setAccountActive(false);
        setLoading(false);
        return;
      }

      setAccountActive(true);
      setRole((data?.role as AppRole | undefined) ?? "patient");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => loadRole(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadRole(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    role,
    loading,
    accountActive,
    demoMode: !isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) {
        setUser(demoUser);
        setRole("admin");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password, fullName) => {
      if (!supabase) return { needsEmailConfirmation: false };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email },
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/staff/login`,
        },
      });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
    },
    claimInitialAdmin: async (code) => {
      if (!supabase) { setRole("admin"); return; }
      const { data, error } = await supabase.functions.invoke("claim-initial-admin", { body: { code } });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        setUser(refreshedUser);
        const { data: profile } = await supabase.from("profiles").select("role,active").eq("id", refreshedUser.id).maybeSingle();
        setAccountActive(profile?.active !== false);
        setRole((profile?.role as AppRole | undefined) ?? "patient");
      }
    },
    signOut: async () => {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [user, role, loading, accountActive]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
