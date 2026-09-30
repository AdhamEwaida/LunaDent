import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STAFF_ROLES = ["dentist", "receptionist", "accountant"] as const;

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
    const isOwner = membership?.active === true && membership?.role === "clinic_owner";
    if (!isSuperAdmin && !isOwner) {
      return Response.json({ error: "Clinic owner access required." }, { status: 403, headers: cors });
    }

    if (action === "list") {
      const { data: memberships, error: membershipError } = await admin
        .from("clinic_memberships")
        .select("user_id,role,active,created_at")
        .eq("clinic_id", clinicId)
        .order("created_at");
      if (membershipError) throw membershipError;

      const { data: profiles, error: profileError } = await admin
        .from("profiles")
        .select("id,full_name,phone");
      if (profileError) throw profileError;

      const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (authError) throw authError;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const authMap = new Map(authUsers.users.map((u) => [u.id, u]));

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

      const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;
      let targetUser = listed.users.find((u) => u.email?.toLowerCase() === email);
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
        .select("role")
        .eq("clinic_id", clinicId)
        .eq("user_id", userId)
        .single();
      if (previousError) throw previousError;

      if (previous.role === "clinic_owner") {
        return Response.json({ error: "Clinic owner access cannot be modified here." }, { status: 400, headers: cors });
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
