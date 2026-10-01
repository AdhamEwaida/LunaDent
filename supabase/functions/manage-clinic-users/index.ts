import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STAFF_ROLES = ["dentist", "receptionist", "accountant"] as const;

type AdminClient = ReturnType<typeof createClient>;

async function getClinicEntitlements(admin: AdminClient, clinicId: string) {
  const [{ data: clinic, error: clinicError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    admin.from("clinics").select("id,status").eq("id", clinicId).maybeSingle(),
    admin
      .from("subscriptions")
      .select("status,trial_ends_at,current_period_end,plan:plans(code,name,description,price_monthly,currency,active,features,limits)")
      .eq("clinic_id", clinicId)
      .maybeSingle(),
  ]);

  if (clinicError) throw clinicError;
  if (subscriptionError) throw subscriptionError;
  if (!clinic) throw new Error("Clinic not found.");

  const plan = Array.isArray(subscription?.plan) ? subscription?.plan[0] ?? null : subscription?.plan ?? null;
  const now = Date.now();
  const trialValid = subscription?.status !== "trialing"
    || !subscription?.trial_ends_at
    || new Date(subscription.trial_ends_at).getTime() > now;
  const periodValid = !subscription?.current_period_end
    || new Date(subscription.current_period_end).getTime() > now;
  const clinicUsable = ["trialing", "active"].includes(String(clinic.status));
  const subscriptionUsable = Boolean(
    subscription
    && ["trialing", "active"].includes(String(subscription.status))
    && trialValid
    && periodValid
    && plan?.active !== false,
  );

  return {
    clinic_id: clinicId,
    clinic_status: clinic.status,
    usable: clinicUsable && subscriptionUsable,
    subscription_status: subscription?.status ?? "missing",
    trial_ends_at: subscription?.trial_ends_at ?? null,
    current_period_end: subscription?.current_period_end ?? null,
    plan: plan
      ? {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          price_monthly: Number(plan.price_monthly ?? 0),
          currency: plan.currency,
          active: plan.active,
          features: plan.features ?? {},
          limits: plan.limits ?? {},
        }
      : null,
  };
}

function numericLimit(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

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
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    if (action === "change_password") {
      const newPassword = String(body?.new_password ?? "");
      if (newPassword.length < 8) {
        return Response.json({ error: "Password must be at least 8 characters." }, { status: 400, headers: cors });
      }
      const nextAppMetadata = { ...(identity.user.app_metadata ?? {}), must_change_password: false };
      const { error } = await admin.auth.admin.updateUserById(identity.user.id, {
        password: newPassword,
        app_metadata: nextAppMetadata,
      });
      if (error) throw error;
      return Response.json({ ok: true }, { headers: cors });
    }

    const clinicId = String(body?.clinic_id ?? "");
    if (!clinicId) {
      return Response.json({ error: "clinic_id is required." }, { status: 400, headers: cors });
    }

    const [{ data: profile }, { data: membership }] = await Promise.all([
      admin.from("profiles").select("platform_role,active").eq("id", identity.user.id).maybeSingle(),
      admin.from("clinic_memberships").select("role,active").eq("clinic_id", clinicId).eq("user_id", identity.user.id).maybeSingle(),
    ]);

    const isSuperAdmin = profile?.active === true && profile?.platform_role === "super_admin";
    const isMember = membership?.active === true;

    if (action === "context") {
      if (!isSuperAdmin && !isMember) {
        return Response.json({ error: "Clinic access required." }, { status: 403, headers: cors });
      }
      const entitlements = await getClinicEntitlements(admin, clinicId);
      return Response.json({ entitlements }, { headers: cors });
    }

    const isOwner = isMember && membership?.role === "clinic_owner";
    if (!isSuperAdmin && !isOwner) {
      return Response.json({ error: "Clinic owner access required." }, { status: 403, headers: cors });
    }

    if (action === "audit") {
      const { data: logs, error: logsError } = await admin
        .from("audit_logs")
        .select("id,actor_user_id,action,entity_type,entity_id,metadata,created_at")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (logsError) throw logsError;

      const actorIds = Array.from(new Set((logs ?? []).map((log) => log.actor_user_id).filter(Boolean)));
      const { data: actorProfiles, error: actorProfileError } = actorIds.length
        ? await admin.from("profiles").select("id,full_name").in("id", actorIds)
        : { data: [], error: null };
      if (actorProfileError) throw actorProfileError;

      const profileMap = new Map((actorProfiles ?? []).map((profile) => [profile.id, profile.full_name]));
      const authPairs = await Promise.all(actorIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        return [id, data.user?.email ?? null] as const;
      }));
      const emailMap = new Map(authPairs);

      return Response.json({
        logs: (logs ?? []).map((log) => ({
          ...log,
          actor_name: log.actor_user_id ? profileMap.get(log.actor_user_id) ?? null : null,
          actor_email: log.actor_user_id ? emailMap.get(log.actor_user_id) ?? null : null,
        })),
      }, { headers: cors });
    }

    if (action === "list") {
      const { data: memberships, error: membershipError } = await admin
        .from("clinic_memberships")
        .select("user_id,role,active,created_at")
        .eq("clinic_id", clinicId)
        .order("created_at");
      if (membershipError) throw membershipError;

      const ids = (memberships ?? []).map((item) => item.user_id);
      const { data: profiles, error: profileError } = ids.length
        ? await admin.from("profiles").select("id,full_name,phone").in("id", ids)
        : { data: [], error: null };
      if (profileError) throw profileError;

      const authPairs = await Promise.all(ids.map(async (id) => {
        const { data, error } = await admin.auth.admin.getUserById(id);
        if (error) return [id, null] as const;
        return [id, data.user ?? null] as const;
      }));

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const authMap = new Map(authPairs);

      const users = (memberships ?? []).map((m) => {
        const p = profileMap.get(m.user_id);
        const u = authMap.get(m.user_id);
        return {
          id: m.user_id,
          email: u?.email,
          full_name: p?.full_name,
          phone: p?.phone,
          role: m.role,
          active: m.active,
          last_sign_in_at: u?.last_sign_in_at,
          email_confirmed_at: u?.email_confirmed_at,
          must_change_password: Boolean(u?.app_metadata?.must_change_password),
        };
      });

      return Response.json({ users }, { headers: cors });
    }

    if (action === "create") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const password = String(body?.password ?? "");
      const fullName = String(body?.full_name ?? "").trim();
      const role = String(body?.role ?? "");
      const specialty = String(body?.specialty ?? "").trim();
      const licenseNumber = String(body?.license_number ?? "").trim();

      if (!email || password.length < 8 || !STAFF_ROLES.includes(role as typeof STAFF_ROLES[number])) {
        return Response.json(
          { error: "Valid email, temporary password (8+ chars), and staff role are required." },
          { status: 400, headers: cors },
        );
      }

      const entitlements = await getClinicEntitlements(admin, clinicId);
      if (!entitlements.usable || !entitlements.plan) {
        return Response.json({ error: "This clinic subscription is not active." }, { status: 403, headers: cors });
      }

      const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      let targetUser = listed.users.find((u) => u.email?.toLowerCase() === email);

      const { data: currentMembership } = targetUser
        ? await admin
            .from("clinic_memberships")
            .select("role,active")
            .eq("clinic_id", clinicId)
            .eq("user_id", targetUser.id)
            .maybeSingle()
        : { data: null };

      const [{ count: activeStaffCount }, { count: activeDentistCount }] = await Promise.all([
        admin.from("clinic_memberships").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("active", true),
        admin.from("clinic_memberships").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("active", true).eq("role", "dentist"),
      ]);

      const staffLimit = numericLimit(entitlements.plan.limits?.staff);
      const dentistLimit = numericLimit(entitlements.plan.limits?.dentists);
      const activatesMembership = !currentMembership?.active;
      const addsDentistSeat = role === "dentist" && (!currentMembership?.active || currentMembership?.role !== "dentist");

      if (activatesMembership && staffLimit && Number(activeStaffCount ?? 0) >= staffLimit) {
        return Response.json(
          { error: `Your ${entitlements.plan.name} plan allows up to ${staffLimit} active staff accounts.`, code: "STAFF_LIMIT_REACHED" },
          { status: 409, headers: cors },
        );
      }
      if (addsDentistSeat && dentistLimit && Number(activeDentistCount ?? 0) >= dentistLimit) {
        return Response.json(
          { error: `Your ${entitlements.plan.name} plan allows up to ${dentistLimit} active dentists.`, code: "DENTIST_LIMIT_REACHED" },
          { status: 409, headers: cors },
        );
      }

      let createdNow = false;
      if (!targetUser) {
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName || email },
          app_metadata: { must_change_password: true },
        });
        if (error || !created.user) throw error ?? new Error("User creation failed.");
        targetUser = created.user;
        createdNow = true;
      }

      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({ full_name: fullName || email, active: true })
        .eq("id", targetUser.id);
      if (profileUpdateError) throw profileUpdateError;

      const { error: membershipError } = await admin.from("clinic_memberships").upsert({
        clinic_id: clinicId,
        user_id: targetUser.id,
        role,
        active: true,
      }, { onConflict: "clinic_id,user_id" });
      if (membershipError) throw membershipError;

      if (role === "dentist") {
        const { data: existingDoctor, error: doctorLookupError } = await admin
          .from("doctors")
          .select("id")
          .eq("clinic_id", clinicId)
          .eq("profile_id", targetUser.id)
          .maybeSingle();
        if (doctorLookupError) throw doctorLookupError;

        if (existingDoctor) {
          const { error: updateDoctorError } = await admin.from("doctors").update({
            display_name: fullName || email,
            specialty: specialty || null,
            license_number: licenseNumber || null,
            email,
            active: true,
          }).eq("id", existingDoctor.id);
          if (updateDoctorError) throw updateDoctorError;
        } else {
          const { error: doctorError } = await admin.from("doctors").insert({
            clinic_id: clinicId,
            profile_id: targetUser.id,
            display_name: fullName || email,
            specialty: specialty || null,
            license_number: licenseNumber || null,
            email,
            active: true,
          });
          if (doctorError) throw doctorError;
        }
      }

      return Response.json({
        id: targetUser.id,
        email,
        role,
        temporary_password: createdNow,
      }, { headers: cors });
    }

    if (action === "update") {
      const userId = String(body?.user_id ?? "");
      const role = String(body?.role ?? "");
      const active = Boolean(body?.active);

      if (!userId || !STAFF_ROLES.includes(role as typeof STAFF_ROLES[number])) {
        return Response.json({ error: "Invalid staff user or role." }, { status: 400, headers: cors });
      }

      const { data: previous, error: previousError } = await admin
        .from("clinic_memberships")
        .select("role,active")
        .eq("clinic_id", clinicId)
        .eq("user_id", userId)
        .single();
      if (previousError) throw previousError;

      if (previous.role === "clinic_owner") {
        return Response.json({ error: "Clinic owner access cannot be modified here." }, { status: 400, headers: cors });
      }

      if (active) {
        const entitlements = await getClinicEntitlements(admin, clinicId);
        if (!entitlements.usable || !entitlements.plan) {
          return Response.json({ error: "This clinic subscription is not active." }, { status: 403, headers: cors });
        }
        const [{ count: activeStaffCount }, { count: activeDentistCount }] = await Promise.all([
          admin.from("clinic_memberships").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("active", true),
          admin.from("clinic_memberships").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("active", true).eq("role", "dentist"),
        ]);
        const staffLimit = numericLimit(entitlements.plan.limits?.staff);
        const dentistLimit = numericLimit(entitlements.plan.limits?.dentists);

        if (!previous.active && staffLimit && Number(activeStaffCount ?? 0) >= staffLimit) {
          return Response.json({ error: `Your ${entitlements.plan.name} plan allows up to ${staffLimit} active staff accounts.` }, { status: 409, headers: cors });
        }
        if (role === "dentist" && (!previous.active || previous.role !== "dentist") && dentistLimit && Number(activeDentistCount ?? 0) >= dentistLimit) {
          return Response.json({ error: `Your ${entitlements.plan.name} plan allows up to ${dentistLimit} active dentists.` }, { status: 409, headers: cors });
        }
      }

      const { error: membershipError } = await admin
        .from("clinic_memberships")
        .update({ role, active })
        .eq("clinic_id", clinicId)
        .eq("user_id", userId);
      if (membershipError) throw membershipError;

      const { data: existingDoctor } = await admin
        .from("doctors")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (role === "dentist") {
        if (existingDoctor) {
          const { error } = await admin.from("doctors").update({ active }).eq("id", existingDoctor.id);
          if (error) throw error;
        } else {
          const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
          const { data: userData } = await admin.auth.admin.getUserById(userId);
          const { error } = await admin.from("doctors").insert({
            clinic_id: clinicId,
            profile_id: userId,
            display_name: profile?.full_name || userData.user?.email || "Dentist",
            email: userData.user?.email ?? null,
            active,
          });
          if (error) throw error;
        }
      } else if (existingDoctor) {
        const { error } = await admin.from("doctors").update({ active: false }).eq("id", existingDoctor.id);
        if (error) throw error;
      }

      return Response.json({ ok: true }, { headers: cors });
    }

    return Response.json({ error: "Unsupported action." }, { status: 400, headers: cors });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500, headers: cors },
    );
  }
});
