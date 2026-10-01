import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const slugify = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Authentication required." }, { status: 401, headers: cors });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.slice(7);

    const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: identity, error: identityError } = await userClient.auth.getUser(token);
    if (identityError || !identity.user) {
      return Response.json({ error: "Invalid session." }, { status: 401, headers: cors });
    }

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: caller } = await admin.from("profiles").select("platform_role,active").eq("id", identity.user.id).maybeSingle();
    if (!caller?.active || caller.platform_role !== "super_admin") {
      return Response.json({ error: "Super Admin access required." }, { status: 403, headers: cors });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "create_clinic") {
      const name = String(body?.name ?? "").trim();
      const slug = slugify(String(body?.slug || name));
      const ownerEmail = String(body?.owner_email ?? "").trim().toLowerCase();
      const ownerName = String(body?.owner_name ?? "").trim();
      const temporaryPassword = String(body?.temporary_password ?? "");
      const themeKey = String(body?.theme_key ?? "modern");
      const planCode = String(body?.plan_code ?? "starter");
      const currency = String(body?.currency ?? "USD").trim().toUpperCase();
      const timezone = String(body?.timezone ?? "UTC").trim();

      if (!name || !slug || !ownerEmail) {
        return Response.json({ error: "Clinic name, slug and owner email are required." }, { status: 400, headers: cors });
      }

      const [{ data: theme, error: themeError }, { data: plan, error: planError }] = await Promise.all([
        admin.from("themes").select("key,default_tokens").eq("key", themeKey).eq("active", true).single(),
        admin.from("plans").select("id,code,features").eq("code", planCode).eq("active", true).single(),
      ]);
      if (themeError || !theme) return Response.json({ error: "Invalid theme." }, { status: 400, headers: cors });
      if (planError || !plan) return Response.json({ error: "Invalid plan." }, { status: 400, headers: cors });
      if (!plan.features?.all_themes && theme.key !== "modern") {
        return Response.json({ error: "The selected plan includes the Modern website theme only." }, { status: 400, headers: cors });
      }

      const { data: existingClinic } = await admin.from("clinics").select("id").eq("slug", slug).maybeSingle();
      if (existingClinic) return Response.json({ error: "Clinic slug is already in use." }, { status: 409, headers: cors });

      const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      let owner = listed.users.find((u) => u.email?.toLowerCase() === ownerEmail);

      if (!owner) {
        if (temporaryPassword.length < 8) {
          return Response.json({ error: "Temporary password must be at least 8 characters for a new owner." }, { status: 400, headers: cors });
        }
        const { data: created, error } = await admin.auth.admin.createUser({
          email: ownerEmail,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: { full_name: ownerName || ownerEmail },
          app_metadata: { must_change_password: true },
        });
        if (error || !created.user) throw error ?? new Error("Owner creation failed.");
        owner = created.user;
      }

      const { error: ownerProfileError } = await admin.from("profiles").update({
        full_name: ownerName || ownerEmail,
        active: true,
      }).eq("id", owner.id);
      if (ownerProfileError) throw ownerProfileError;

      const { data: clinic, error: clinicError } = await admin.from("clinics").insert({
        name,
        slug,
        status: "trialing",
        currency,
        timezone,
        locale: "en",
      }).select("id,name,slug,status,currency,timezone").single();
      if (clinicError || !clinic) throw clinicError ?? new Error("Clinic creation failed.");

      const { error: membershipError } = await admin.from("clinic_memberships").insert({
        clinic_id: clinic.id,
        user_id: owner.id,
        role: "clinic_owner",
        active: true,
      });
      if (membershipError) throw membershipError;

      const { error: settingsError } = await admin.from("clinic_site_settings").insert({
        clinic_id: clinic.id,
        theme_key: theme.key,
        published: false,
        site_title: name,
        tagline: "Modern dental care, built around you.",
        tokens: theme.default_tokens,
        sections: [
          { key: "hero", enabled: true },
          { key: "services", enabled: true },
          { key: "doctors", enabled: true },
          { key: "journey", enabled: true },
          { key: "booking", enabled: true },
          { key: "contact", enabled: true },
        ],
        content: {
          hero: {
            eyebrow: name.toUpperCase(),
            title: "Confident smiles start with thoughtful care.",
            subtitle: "Book online and manage your dental journey securely.",
            primaryCta: "Book Consultation",
            secondaryCta: "Explore Treatments",
          },
        },
      });
      if (settingsError) throw settingsError;

      const { error: subscriptionError } = await admin.from("subscriptions").insert({
        clinic_id: clinic.id,
        plan_id: plan.id,
        status: "trialing",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        billing_provider: "manual",
      });
      if (subscriptionError) throw subscriptionError;

      const defaultTreatments = [
        ["CONSULT", "Consultation", 30],
        ["FILL", "Composite Filling", 45],
        ["RCT", "Root Canal Treatment", 90],
        ["CROWN", "Dental Crown", 60],
        ["IMPLANT", "Dental Implant", 90],
        ["WHITEN", "Teeth Whitening", 60],
      ];
      const { error: treatmentError } = await admin.from("treatments").insert(
        defaultTreatments.map(([code, title, duration]) => ({
          clinic_id: clinic.id,
          code,
          name_en: title,
          duration_minutes: duration,
          default_price: 0,
          active: true,
        })),
      );
      if (treatmentError) throw treatmentError;

      const { error: roomError } = await admin.from("rooms").insert([
        { clinic_id: clinic.id, name: "Chair 1", active: true },
        { clinic_id: clinic.id, name: "Chair 2", active: true },
      ]);
      if (roomError) throw roomError;

      const defaultHours = Array.from({ length: 7 }, (_, weekday) => ({
        clinic_id: clinic.id,
        weekday,
        enabled: weekday >= 1 && weekday <= 6,
        open_time: weekday === 6 ? "10:00" : weekday >= 1 && weekday <= 5 ? "09:00" : null,
        close_time: weekday === 6 ? "14:00" : weekday >= 1 && weekday <= 5 ? "17:00" : null,
        slot_minutes: 30,
      }));
      const { error: hoursError } = await admin.from("clinic_business_hours").insert(defaultHours);
      if (hoursError) throw hoursError;

      return Response.json({ clinic, owner_user_id: owner.id, theme_key: theme.key, plan_code: plan.code }, { headers: cors });
    }

    if (action === "update_clinic_status") {
      const clinicId = String(body?.clinic_id ?? "");
      const status = String(body?.status ?? "");
      if (!clinicId || !["trialing","active","suspended","archived"].includes(status)) {
        return Response.json({ error: "Invalid clinic or status." }, { status: 400, headers: cors });
      }
      const { error } = await admin.from("clinics").update({ status }).eq("id", clinicId);
      if (error) throw error;
      await admin.from("audit_logs").insert({
        clinic_id: clinicId,
        actor_user_id: identity.user.id,
        action: "update",
        entity_type: "clinic",
        entity_id: clinicId,
        metadata: { changed_fields: ["status"] },
      });
      return Response.json({ ok: true }, { headers: cors });
    }

    if (action === "update_subscription_status") {
      const clinicId = String(body?.clinic_id ?? "");
      const status = String(body?.status ?? "");
      if (!clinicId || !["trialing","active","past_due","canceled","suspended"].includes(status)) {
        return Response.json({ error: "Invalid clinic or subscription status." }, { status: 400, headers: cors });
      }

      const patch: Record<string, unknown> = { status };
      if (status === "trialing") {
        const days = Math.min(60, Math.max(1, Number(body?.trial_days ?? 14)));
        patch.trial_ends_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      } else {
        patch.trial_ends_at = null;
      }
      if (status === "active" && body?.current_period_end) {
        patch.current_period_end = String(body.current_period_end);
      }

      const { data: subscription, error } = await admin
        .from("subscriptions")
        .update(patch)
        .eq("clinic_id", clinicId)
        .select("id,status,trial_ends_at,current_period_end")
        .single();
      if (error) throw error;
      await admin.from("audit_logs").insert({
        clinic_id: clinicId,
        actor_user_id: identity.user.id,
        action: "update",
        entity_type: "subscription",
        entity_id: subscription.id,
        metadata: { changed_fields: ["status","trial_ends_at","current_period_end"] },
      });
      return Response.json({ ok: true, subscription }, { headers: cors });
    }

    if (action === "set_plan") {
      const clinicId = String(body?.clinic_id ?? "");
      const planCode = String(body?.plan_code ?? "");
      const { data: plan, error: planError } = await admin
        .from("plans")
        .select("id,code,features")
        .eq("code", planCode)
        .eq("active", true)
        .single();
      if (planError || !plan) return Response.json({ error: "Invalid plan." }, { status: 400, headers: cors });

      const { error } = await admin.from("subscriptions").update({
        plan_id: plan.id,
        status: "active",
      }).eq("clinic_id", clinicId);
      if (error) throw error;

      if (!plan.features?.all_themes) {
        const { data: modernTheme, error: themeLookupError } = await admin
          .from("themes")
          .select("default_tokens")
          .eq("key", "modern")
          .single();
        if (themeLookupError) throw themeLookupError;
        const { error: siteThemeError } = await admin
          .from("clinic_site_settings")
          .update({ theme_key: "modern", tokens: modernTheme.default_tokens })
          .eq("clinic_id", clinicId);
        if (siteThemeError) throw siteThemeError;
      }

      if (!plan.features?.custom_domain) {
        const { error: domainError } = await admin
          .from("clinic_site_settings")
          .update({ custom_domain: null, domain_verified: false })
          .eq("clinic_id", clinicId);
        if (domainError) throw domainError;
      }

      await admin.from("audit_logs").insert({
        clinic_id: clinicId,
        actor_user_id: identity.user.id,
        action: "update",
        entity_type: "subscription",
        entity_id: clinicId,
        metadata: { changed_fields: ["plan_id"] },
      });
      return Response.json({ ok: true, plan_code: plan.code }, { headers: cors });
    }

    return Response.json({ error: "Unsupported action." }, { status: 400, headers: cors });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500, headers: cors },
    );
  }
});
