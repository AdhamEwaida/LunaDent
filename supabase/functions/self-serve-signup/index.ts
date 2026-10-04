import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Service-role client intentionally spans the complete tenant schema.
type AdminClient = ReturnType<typeof createClient<any>>;

class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function clean(value: unknown, max = 160) {
  return String(value ?? "").trim().slice(0, max);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function randomSuffix() {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function hashValue(value: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

function requestIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, {
      status: 405,
      headers: cors,
    });
  }

  let admin: AdminClient | null = null;
  let attemptId: number | null = null;
  let createdUserId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hashSalt = Deno.env.get("SIGNUP_HASH_SALT") || supabaseUrl;

    admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    if (clean(body?.website, 200)) {
      return Response.json({ ok: true }, { headers: cors });
    }

    const ownerName = clean(body?.owner_name, 120);
    const clinicName = clean(body?.clinic_name, 140);
    const email = clean(body?.email, 254).toLowerCase();
    const password = String(body?.password ?? "");
    const planCode = clean(body?.plan_code, 40).toLowerCase();
    const themeKey = clean(body?.theme_key, 40).toLowerCase();
    const timezone = clean(body?.timezone, 80) || "UTC";
    const currency = (clean(body?.currency, 3) || "USD").toUpperCase();
    const termsAccepted = body?.terms_accepted === true;
    const demoCheckoutAcknowledged = body?.demo_checkout_acknowledged === true;

    if (!ownerName || !clinicName || !email || !planCode || !themeKey) {
      throw new HttpError(
        "Complete the owner, clinic, plan, and theme fields.",
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError("Enter a valid email address.");
    }
    if (password.length < 8 || password.length > 128) {
      throw new HttpError("Password must be between 8 and 128 characters.");
    }
    if (!termsAccepted) {
      throw new HttpError("Accept the Terms and Privacy Policy to continue.");
    }
    if (!demoCheckoutAcknowledged) {
      throw new HttpError(
        "Confirm the demo checkout before creating the clinic.",
      );
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new HttpError("Invalid currency code.");
    }

    const ipHash = await hashValue(requestIp(req), hashSalt);
    const emailHash = await hashValue(email, hashSalt);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: ipAttempts, error: ipError },
      { count: emailAttempts, error: emailError },
    ] = await Promise.all([
      admin.from("saas_signup_attempts").select("id", {
        count: "exact",
        head: true,
      }).eq("ip_hash", ipHash).gte("created_at", oneHourAgo),
      admin.from("saas_signup_attempts").select("id", {
        count: "exact",
        head: true,
      }).eq("email_hash", emailHash).gte("created_at", oneDayAgo),
    ]);
    if (ipError) throw ipError;
    if (emailError) throw emailError;
    if ((ipAttempts || 0) >= 8 || (emailAttempts || 0) >= 3) {
      throw new HttpError(
        "Too many clinic signup attempts. Please try again later.",
        429,
      );
    }

    const { data: attempt, error: attemptError } = await admin
      .from("saas_signup_attempts")
      .insert({ ip_hash: ipHash, email_hash: emailHash, outcome: "started" })
      .select("id")
      .single();
    if (attemptError) throw attemptError;
    attemptId = Number(attempt.id);

    const [
      { data: plan, error: planError },
      { data: theme, error: themeError },
      { data: existingProfile, error: profileError },
    ] = await Promise.all([
      admin.from("plans").select("id,code,active,features").eq("code", planCode)
        .eq("active", true).maybeSingle(),
      admin.from("themes").select("key,active").eq("key", themeKey).eq(
        "active",
        true,
      ).maybeSingle(),
      admin.from("profiles").select("id").eq("email", email).maybeSingle(),
    ]);
    if (planError) throw planError;
    if (themeError) throw themeError;
    if (profileError) throw profileError;
    if (!plan) throw new HttpError("The selected plan is unavailable.");
    if (!theme) throw new HttpError("The selected theme is unavailable.");
    if (!plan.features?.all_themes && theme.key !== "modern") {
      throw new HttpError("The selected plan includes the Modern theme only.");
    }
    if (existingProfile) {
      throw new HttpError(
        "An account already exists for this email. Sign in instead.",
        409,
      );
    }

    const { count: availableDomains, error: domainPoolError } = await admin
      .from("saas_managed_domains")
      .select("hostname", { count: "exact", head: true })
      .eq("active", true)
      .is("clinic_id", null);
    if (domainPoolError) throw domainPoolError;
    if (!availableDomains) {
      throw new HttpError(
        "Clinic URL capacity is temporarily full. Please try again shortly.",
        503,
      );
    }

    const baseSlug = slugify(clinicName) || "clinic";
    let clinicSlug = baseSlug;
    for (let attemptNo = 0; attemptNo < 4; attemptNo += 1) {
      const { data: existingClinic, error: slugError } = await admin
        .from("clinics")
        .select("id")
        .eq("slug", clinicSlug)
        .maybeSingle();
      if (slugError) throw slugError;
      if (!existingClinic) break;
      clinicSlug = `${baseSlug}-${randomSuffix()}`.slice(0, 60);
      if (attemptNo === 3) {
        throw new HttpError(
          "Unable to reserve a clinic address. Please try again.",
          409,
        );
      }
    }

    const { data: created, error: createError } = await admin.auth.admin
      .createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: ownerName },
        app_metadata: {
          signup_source: "self_serve",
          must_change_password: false,
        },
      });
    if (createError || !created.user) {
      throw new HttpError(
        createError?.message || "Unable to create the owner account.",
        400,
      );
    }
    createdUserId = created.user.id;

    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signedIn, error: signInError } = await client.auth
      .signInWithPassword({ email, password });
    if (signInError || !signedIn.session) {
      throw new HttpError("Unable to start the clinic owner session.", 500);
    }

    const { data: provisioned, error: provisionError } = await admin.rpc(
      "provision_self_serve_clinic",
      {
        p_user_id: createdUserId,
        p_owner_name: ownerName,
        p_clinic_name: clinicName,
        p_slug: clinicSlug,
        p_plan_code: planCode,
        p_theme_key: themeKey,
        p_platform_subdomain: null,
        p_timezone: timezone,
        p_currency: currency,
      },
    );
    if (provisionError) throw provisionError;

    const row = Array.isArray(provisioned) ? provisioned[0] : provisioned;
    if (!row?.clinic_id || !row?.platform_subdomain) {
      throw new HttpError(
        "Clinic provisioning did not return a complete tenant.",
        500,
      );
    }

    if (attemptId) {
      await admin.from("saas_signup_attempts").update({ outcome: "success" })
        .eq("id", attemptId);
    }

    return Response.json({
      ok: true,
      clinic: {
        id: row.clinic_id,
        slug: row.clinic_slug || clinicSlug,
        platform_subdomain: row.platform_subdomain,
        plan_code: row.plan_code || planCode,
        theme_key: row.theme_key || themeKey,
      },
      site_url: `https://${row.platform_subdomain}`,
      session: {
        access_token: signedIn.session.access_token,
        refresh_token: signedIn.session.refresh_token,
      },
    }, { headers: cors });
  } catch (error) {
    if (admin && attemptId) {
      await admin.from("saas_signup_attempts").update({
        outcome: error instanceof HttpError && error.status < 500
          ? "rejected"
          : "failed",
      }).eq("id", attemptId);
    }

    if (admin && createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    }

    const status = error instanceof HttpError ? error.status : 500;
    return Response.json(
      {
        error: error instanceof Error
          ? error.message
          : "Unable to create the clinic.",
      },
      { status, headers: cors },
    );
  }
});
