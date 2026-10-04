import { supabase } from "@/lib/supabase";
import type {
  Clinic,
  ClinicBusinessHour,
  ClinicCommercialRow,
  ClinicDomainState,
  ClinicMembership,
  ClinicSiteSettings,
  PublicClinicSite,
  SaasPlan,
  SelfServeSignupInput,
  SelfServeSignupResult,
  ThemeDefinition,
} from "./types";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

async function loadPublicClinicSite(clinic: Clinic): Promise<PublicClinicSite | null> {
  const db = requireSupabase();
  const [{ data: settings, error: settingsError }, { data: doctors, error: doctorsError }, { data: treatments, error: treatmentsError }] = await Promise.all([
    db.from("clinic_site_settings").select("*").eq("clinic_id", clinic.id).maybeSingle(),
    db.from("doctors").select("id,display_name,specialty,bio_en").eq("clinic_id", clinic.id).eq("active", true).order("display_name"),
    db.from("treatments").select("id,code,name_en,name_ar,description_en,duration_minutes,default_price").eq("clinic_id", clinic.id).eq("active", true).order("name_en"),
  ]);
  if (settingsError) throw settingsError;
  if (doctorsError) throw doctorsError;
  if (treatmentsError) throw treatmentsError;
  if (!settings?.published) return null;

  const { data: theme, error: themeError } = await db
    .from("themes")
    .select("*")
    .eq("key", settings.theme_key)
    .maybeSingle();
  if (themeError) throw themeError;

  return {
    clinic,
    settings: settings as ClinicSiteSettings,
    theme: (theme as ThemeDefinition | null) ?? null,
    doctors: doctors ?? [],
    treatments: treatments ?? [],
  };
}

export const saasRepository = {
  async listThemes(): Promise<ThemeDefinition[]> {
    const db = requireSupabase();
    const { data, error } = await db.from("themes").select("*").eq("active", true).order("name");
    if (error) throw error;
    return (data ?? []) as ThemeDefinition[];
  },

  async listPlans(): Promise<SaasPlan[]> {
    const db = requireSupabase();
    const { data, error } = await db.from("plans").select("*").eq("active", true).order("price_monthly");
    if (error) throw error;
    return (data ?? []) as SaasPlan[];
  },

  async listMemberships(userId: string): Promise<ClinicMembership[]> {
    const db = requireSupabase();
    const { data, error } = await db
      .from("clinic_memberships")
      .select("id,clinic_id,user_id,role,active,clinic:clinics(*)")
      .eq("user_id", userId)
      .eq("active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as unknown as ClinicMembership[];
  },

  async getClinicSiteBySlug(slug: string): Promise<PublicClinicSite | null> {
    const db = requireSupabase();
    const { data: clinic, error: clinicError } = await db
      .from("clinics")
      .select("*")
      .eq("slug", slug.trim().toLowerCase())
      .in("status", ["trialing", "active"])
      .maybeSingle();
    if (clinicError) throw clinicError;
    if (!clinic) return null;
    return loadPublicClinicSite(clinic as Clinic);
  },

  async getClinicSiteByDomain(domain: string): Promise<PublicClinicSite | null> {
    const db = requireSupabase();
    const hostname = domain.trim().toLowerCase().replace(/\.$/, "");
    if (!hostname) return null;

    const { data: managedSite, error: managedError } = await db
      .from("clinic_site_settings")
      .select("clinic_id")
      .eq("platform_subdomain", hostname)
      .eq("published", true)
      .maybeSingle();
    if (managedError) throw managedError;

    let clinicId = managedSite?.clinic_id || null;
    if (!clinicId) {
      const { data: customSite, error: customError } = await db
        .from("clinic_site_settings")
        .select("clinic_id")
        .eq("custom_domain", hostname)
        .eq("domain_verified", true)
        .eq("published", true)
        .maybeSingle();
      if (customError) throw customError;
      clinicId = customSite?.clinic_id || null;
    }
    if (!clinicId) return null;

    const { data: clinic, error: clinicError } = await db
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .in("status", ["trialing", "active"])
      .maybeSingle();
    if (clinicError) throw clinicError;
    if (!clinic) return null;
    return loadPublicClinicSite(clinic as Clinic);
  },

  async getSiteSettings(clinicId: string): Promise<ClinicSiteSettings> {
    const db = requireSupabase();
    const { data, error } = await db.from("clinic_site_settings").select("*").eq("clinic_id", clinicId).single();
    if (error) throw error;
    return data as ClinicSiteSettings;
  },

  async listBusinessHours(clinicId: string): Promise<ClinicBusinessHour[]> {
    const db = requireSupabase();
    const { data, error } = await db
      .from("clinic_business_hours")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("weekday");
    if (error) throw error;
    return (data ?? []) as ClinicBusinessHour[];
  },

  async saveBusinessHours(clinicId: string, rows: ClinicBusinessHour[]): Promise<ClinicBusinessHour[]> {
    const db = requireSupabase();
    const payload = rows.map((row) => ({
      clinic_id: clinicId,
      weekday: row.weekday,
      enabled: row.enabled,
      open_time: row.enabled ? row.open_time : null,
      close_time: row.enabled ? row.close_time : null,
      slot_minutes: row.slot_minutes,
    }));
    const { data, error } = await db
      .from("clinic_business_hours")
      .upsert(payload, { onConflict: "clinic_id,weekday" })
      .select("*")
      .order("weekday");
    if (error) throw error;
    return (data ?? []) as ClinicBusinessHour[];
  },

  async updateSiteSettings(clinicId: string, patch: Partial<ClinicSiteSettings>): Promise<ClinicSiteSettings> {
    const db = requireSupabase();
    const safePatch = {
      theme_key: patch.theme_key,
      published: patch.published,
      site_title: patch.site_title,
      tagline: patch.tagline,
      logo_url: patch.logo_url,
      favicon_url: patch.favicon_url,
      hero_image_url: patch.hero_image_url,
      tokens: patch.tokens,
      sections: patch.sections,
      content: patch.content,
      assets: patch.assets,
      navigation: patch.navigation,
    };
    const payload = Object.fromEntries(Object.entries(safePatch).filter(([, value]) => value !== undefined));
    const { data, error } = await db.from("clinic_site_settings").update(payload).eq("clinic_id", clinicId).select("*").single();
    if (error) throw error;
    return data as ClinicSiteSettings;
  },

  async updateClinic(clinicId: string, patch: Partial<Clinic>): Promise<Clinic> {
    const db = requireSupabase();
    const allowed = {
      name: patch.name,
      legal_name: patch.legal_name,
      phone: patch.phone,
      whatsapp: patch.whatsapp,
      email: patch.email,
      address: patch.address,
      city: patch.city,
      country: patch.country,
      currency: patch.currency,
      timezone: patch.timezone,
      locale: patch.locale,
      logo_path: patch.logo_path,
      onboarding_completed: patch.onboarding_completed,
    };
    const payload = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
    const { data, error } = await db.from("clinics").update(payload).eq("id", clinicId).select("*").single();
    if (error) throw error;
    return data as Clinic;
  },

  async uploadClinicAsset(clinicId: string, file: File, kind: "logo" | "hero" | "favicon"): Promise<string> {
    const db = requireSupabase();
    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${clinicId}/site/${kind}-${Date.now()}.${extension}`;
    const { error } = await db.storage.from("clinic-assets").upload(path, file, { upsert: false, cacheControl: "3600" });
    if (error) throw error;
    return db.storage.from("clinic-assets").getPublicUrl(path).data.publicUrl;
  },

  async listAllClinics(): Promise<ClinicCommercialRow[]> {
    const db = requireSupabase();
    const { data, error } = await db
      .from("clinics")
      .select("*, subscription:subscriptions(*,plan:plans(*)), site:clinic_site_settings(theme_key,published,custom_domain,domain_verified)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as ClinicCommercialRow[];
  },

  async createClinic(input: {
    name: string;
    slug: string;
    owner_email: string;
    owner_name: string;
    temporary_password: string;
    theme_key: string;
    plan_code: string;
    currency: string;
    timezone: string;
  }) {
    const db = requireSupabase();
    const { data, error } = await db.functions.invoke("manage-saas", { body: { action: "create_clinic", ...input } });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    return data;
  },

  async updateClinicStatus(clinicId: string, status: Clinic["status"]) {
    const db = requireSupabase();
    const { data, error } = await db.functions.invoke("manage-saas", {
      body: { action: "update_clinic_status", clinic_id: clinicId, status },
    });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
  },

  async setClinicPlan(clinicId: string, planCode: string) {
    const db = requireSupabase();
    const { data, error } = await db.functions.invoke("manage-saas", {
      body: { action: "set_plan", clinic_id: clinicId, plan_code: planCode },
    });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
  },

  async updateSubscriptionStatus(clinicId: string, status: "trialing" | "active" | "past_due" | "canceled" | "suspended") {
    const db = requireSupabase();
    const { data, error } = await db.functions.invoke("manage-saas", {
      body: { action: "update_subscription_status", clinic_id: clinicId, status },
    });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    return data;
  },

  async selfServeSignup(input: SelfServeSignupInput): Promise<SelfServeSignupResult> {
    const db = requireSupabase();
    const { data, error } = await db.functions.invoke("self-serve-signup", {
      body: input,
    });
    if (data?.error) throw new Error(String(data.error));
    if (error) {
      let message = error.message || "Unable to create the clinic.";
      const context = typeof error === "object" && error !== null && "context" in error
        ? (error as { context?: unknown }).context
        : undefined;
      if (context instanceof Response) {
        try {
          const payload = await context.clone().json();
          if (payload?.error) message = String(payload.error);
        } catch {
          // Keep the transport message.
        }
      }
      throw new Error(message);
    }
    return data as SelfServeSignupResult;
  },

  async manageClinicDomain(
    clinicId: string,
    action: "status" | "connect" | "verify" | "remove",
    domain?: string,
  ): Promise<ClinicDomainState> {
    const db = requireSupabase();
    const { data, error } = await db.functions.invoke("manage-clinic-domain", {
      body: { action, clinic_id: clinicId, ...(domain ? { domain } : {}) },
    });
    if (data?.error) throw new Error(String(data.error));
    if (error) {
      let message = error.message || "Custom domain service is unavailable.";
      const context = typeof error === "object" && error !== null && "context" in error
        ? (error as { context?: unknown }).context
        : undefined;
      if (context instanceof Response) {
        try {
          const payload = await context.clone().json();
          if (payload?.error) message = String(payload.error);
        } catch {
          // Keep the transport message.
        }
      }
      throw new Error(message);
    }
    return data as ClinicDomainState;
  },
};
