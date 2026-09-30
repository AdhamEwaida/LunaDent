import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppRole } from "@/clinic/types";

type AuthState = {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
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

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const loadRole = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", nextUser.id).maybeSingle();
      if (!active) return;
      setRole((data?.role as AppRole | undefined) ?? "patient");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => loadRole(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadRole(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    role,
    loading,
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
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", refreshedUser.id).maybeSingle();
        setRole((profile?.role as AppRole | undefined) ?? "patient");
      }
    },
    signOut: async () => {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [user, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
