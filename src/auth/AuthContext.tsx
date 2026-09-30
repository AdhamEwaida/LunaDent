import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AppRole } from "@/clinic/types";
import type { Clinic, ClinicMembership, ClinicRole, PlatformRole } from "@/saas/types";

type AuthState = {
  user: User | null;
  role: AppRole | null;
  platformRole: PlatformRole | null;
  isSuperAdmin: boolean;
  memberships: ClinicMembership[];
  activeClinicId: string | null;
  activeClinic: Clinic | null;
  activeClinicRole: ClinicRole | null;
  loading: boolean;
  accountActive: boolean;
  mustChangePassword: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUpPatient: (input: { email: string; password: string; firstName: string; lastName: string; phone?: string; clinicSlug?: string }) => Promise<{ needsEmailConfirmation: boolean }>;
  changePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  setActiveClinicId: (clinicId: string) => void;
  refreshTenantContext: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);
const ACTIVE_CLINIC_KEY = "lunadent_active_clinic_id";

const demoUser = {
  id: "demo-super-admin",
  email: "admin@lunadent.local",
  app_metadata: {},
  user_metadata: { full_name: "LunaDent Super Admin" },
  aud: "authenticated",
  created_at: new Date(0).toISOString(),
} as User;

function mapClinicRole(role: ClinicRole | null): AppRole | null {
  if (!role) return null;
  if (role === "clinic_owner") return "admin";
  return role;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isSupabaseConfigured ? null : demoUser);
  const [role, setRole] = useState<AppRole | null>(isSupabaseConfigured ? null : "admin");
  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(isSupabaseConfigured ? null : "super_admin");
  const [memberships, setMemberships] = useState<ClinicMembership[]>([]);
  const [activeClinicIdState, setActiveClinicIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [accountActive, setAccountActive] = useState(!isSupabaseConfigured);

  const loadContext = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      setRole(null);
      setPlatformRole(null);
      setMemberships([]);
      setActiveClinicIdState(null);
      setAccountActive(false);
      setLoading(false);
      return;
    }

    if (!supabase) {
      setPlatformRole("super_admin");
      setRole("admin");
      setAccountActive(true);
      setLoading(false);
      return;
    }

    const [{ data: profile, error: profileError }, { data: membershipRows, error: membershipError }] = await Promise.all([
      supabase.from("profiles").select("platform_role,active").eq("id", nextUser.id).maybeSingle(),
      supabase
        .from("clinic_memberships")
        .select("id,clinic_id,user_id,role,active,clinic:clinics(*)")
        .eq("user_id", nextUser.id)
        .eq("active", true)
        .order("created_at"),
    ]);

    if (profileError || membershipError || profile?.active === false) {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      setPlatformRole(null);
      setMemberships([]);
      setActiveClinicIdState(null);
      setAccountActive(false);
      setLoading(false);
      return;
    }

    const nextMemberships = (membershipRows ?? []) as unknown as ClinicMembership[];
    const storedClinicId = localStorage.getItem(ACTIVE_CLINIC_KEY);
    const chosen = nextMemberships.find((membership) => membership.clinic_id === storedClinicId) ?? nextMemberships[0] ?? null;

    setPlatformRole((profile?.platform_role as PlatformRole | undefined) ?? "user");
    setMemberships(nextMemberships);
    setActiveClinicIdState(chosen?.clinic_id ?? null);
    setRole(chosen ? mapClinicRole(chosen.role) : "patient");
    setAccountActive(true);
    setLoading(false);

    if (chosen) localStorage.setItem(ACTIVE_CLINIC_KEY, chosen.clinic_id);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    const load = async (nextUser: User | null) => {
      if (!mounted) return;
      await loadContext(nextUser);
    };

    void supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadContext]);

  const setActiveClinicId = useCallback((clinicId: string) => {
    const membership = memberships.find((item) => item.clinic_id === clinicId && item.active);
    if (!membership) return;
    localStorage.setItem(ACTIVE_CLINIC_KEY, clinicId);
    setActiveClinicIdState(clinicId);
    setRole(mapClinicRole(membership.role));
  }, [memberships]);

  const activeMembership = memberships.find((membership) => membership.clinic_id === activeClinicIdState) ?? null;

  const value = useMemo<AuthState>(() => ({
    user,
    role,
    platformRole,
    isSuperAdmin: platformRole === "super_admin",
    memberships,
    activeClinicId: activeClinicIdState,
    activeClinic: (activeMembership?.clinic as Clinic | null | undefined) ?? null,
    activeClinicRole: activeMembership?.role ?? null,
    loading,
    accountActive,
    mustChangePassword: Boolean(user?.app_metadata?.must_change_password),
    demoMode: !isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) {
        setUser(demoUser);
        setPlatformRole("super_admin");
        setRole("admin");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUpPatient: async ({ email, password, firstName, lastName, phone, clinicSlug }) => {
      if (!supabase) return { needsEmailConfirmation: false };
      const normalizedEmail = email.trim().toLowerCase();
      const first = firstName.trim();
      const last = lastName.trim();
      if (!first || !last) throw new Error("First and last name are required.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: `${first} ${last}`.trim(),
            first_name: first,
            last_name: last,
            phone: phone?.trim() || null,
          },
          emailRedirectTo: `${window.location.origin}${clinicSlug ? `/c/${clinicSlug}/patient/complete-profile` : "/patient-portal/complete-profile"}`,
        },
      });
      if (error) throw error;
      return { needsEmailConfirmation: !data.session };
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
      localStorage.removeItem(ACTIVE_CLINIC_KEY);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    setActiveClinicId,
    refreshTenantContext: async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      await loadContext(data.session?.user ?? null);
    },
  }), [
    user,
    role,
    platformRole,
    memberships,
    activeClinicIdState,
    activeMembership,
    loading,
    accountActive,
    setActiveClinicId,
    loadContext,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
