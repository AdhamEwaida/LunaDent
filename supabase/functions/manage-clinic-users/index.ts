import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MANAGEABLE_ROLES = ["dentist", "receptionist", "accountant"] as const;

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

    const userClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: identity, error: identityError } = await userClient.auth.getUser(token);
    if (identityError || !identity.user) {
      return Response.json({ error: "Invalid session." }, { status: 401, headers: cors });
    }

    const admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

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

    const { data: caller, error: callerError } = await admin
      .from("profiles")
      .select("role,active")
      .eq("id", identity.user.id)
      .single();

    if (callerError || !caller?.active || caller.role !== "admin") {
      return Response.json({ error: "Administrator access required." }, { status: 403, headers: cors });
    }

    if (action === "list") {
      const { data: authUsers, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;

      const { data: profiles, error: profileError } = await admin
        .from("profiles")
        .select("id,role,full_name,phone,active,created_at")
        .neq("role", "patient");
      if (profileError) throw profileError;

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const users = authUsers.users
        .filter((u) => profileMap.has(u.id))
        .map((u) => ({
          id: u.id,
          email: u.email,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          must_change_password: Boolean(u.app_metadata?.must_change_password),
          ...profileMap.get(u.id),
        }));

      return Response.json({ users }, { headers: cors });
    }

    if (action === "create") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const password = String(body?.password ?? "");
      const fullName = String(body?.full_name ?? "").trim();
      const role = String(body?.role ?? "");
      const specialty = String(body?.specialty ?? "").trim();
      const licenseNumber = String(body?.license_number ?? "").trim();

      if (!email || password.length < 8 || !MANAGEABLE_ROLES.includes(role as typeof MANAGEABLE_ROLES[number])) {
        return Response.json(
          { error: "Valid email, temporary password (8+ chars), and a staff role are required." },
          { status: 400, headers: cors },
        );
      }

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || email },
      });
      if (error || !created.user) throw error ?? new Error("User creation failed.");

      const { error: metadataError } = await admin.auth.admin.updateUserById(created.user.id, {
        app_metadata: { ...(created.user.app_metadata ?? {}), must_change_password: true },
      });
      if (metadataError) throw metadataError;

      const { error: updateError } = await admin
        .from("profiles")
        .update({ role, full_name: fullName || email, active: true })
        .eq("id", created.user.id);
      if (updateError) throw updateError;

      if (role === "dentist") {
        const { error: doctorError } = await admin.from("doctors").insert({
          profile_id: created.user.id,
          display_name: fullName || email,
          specialty: specialty || null,
          email,
          license_number: licenseNumber || null,
          active: true,
        });
        if (doctorError) throw doctorError;
      }

      return Response.json({ id: created.user.id, email, role }, { headers: cors });
    }

    if (action === "update") {
      const userId = String(body?.user_id ?? "");
      const role = String(body?.role ?? "");
      const active = Boolean(body?.active);

      if (!userId || !MANAGEABLE_ROLES.includes(role as typeof MANAGEABLE_ROLES[number])) {
        return Response.json({ error: "Invalid staff user or role." }, { status: 400, headers: cors });
      }
      const { data: previous, error: previousError } = await admin
        .from("profiles")
        .select("role,full_name")
        .eq("id", userId)
        .single();
      if (previousError) throw previousError;

      if (previous.role === "admin") {
        return Response.json(
          { error: "The owner administrator account cannot be modified here." },
          { status: 400, headers: cors },
        );
      }

      const { error } = await admin.from("profiles").update({ role, active }).eq("id", userId);
      if (error) throw error;

      if (role === "dentist") {
        const { data: existingDoctor, error: doctorLookupError } = await admin
          .from("doctors")
          .select("id")
          .eq("profile_id", userId)
          .maybeSingle();
        if (doctorLookupError) throw doctorLookupError;

        if (existingDoctor) {
          const { error: doctorUpdateError } = await admin
            .from("doctors")
            .update({ active })
            .eq("id", existingDoctor.id);
          if (doctorUpdateError) throw doctorUpdateError;
        } else {
          const { data: targetUser, error: targetUserError } = await admin.auth.admin.getUserById(userId);
          if (targetUserError) throw targetUserError;
          const { error: doctorCreateError } = await admin.from("doctors").insert({
            profile_id: userId,
            display_name: previous.full_name || targetUser.user?.email || "Dentist",
            email: targetUser.user?.email ?? null,
            active,
          });
          if (doctorCreateError) throw doctorCreateError;
        }
      } else if (previous.role === "dentist") {
        const { error: deactivateDoctorError } = await admin
          .from("doctors")
          .update({ active: false })
          .eq("profile_id", userId);
        if (deactivateDoctorError) throw deactivateDoctorError;
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
