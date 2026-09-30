import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppRole } from "@/clinic/types";

type AuthState = {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  accountActive: boolean;
  mustChangePassword: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
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
    mustChangePassword: Boolean(user?.app_metadata?.must_change_password),
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
    changePassword: async (newPassword) => {
      if (!supabase) return;
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
      const { data, error } = await supabase.functions.invoke("manage-clinic-users", {
        body: { action: "change_password", new_password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      if (refreshed.user) setUser(refreshed.user);
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
