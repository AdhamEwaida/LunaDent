import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Service-role client intentionally spans the complete tenant schema.
type AdminClient = ReturnType<typeof createClient<any>>;

type ProjectDomain = {
  name: string;
  apexName?: string;
  projectId?: string;
  verified: boolean;
  verification?: Array<{
    type?: string;
    domain?: string;
    value?: string;
    reason?: string;
  }>;
};

type DomainConfig = {
  configuredBy?: string | null;
  acceptedChallenges?: string[];
  recommendedIPv4?: Array<{ rank?: number; value?: string } | string>;
  recommendedCNAME?: Array<{ rank?: number; value?: string } | string>;
  misconfigured?: boolean;
};

class VercelApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "VercelApiError";
    this.status = status;
    this.payload = payload;
  }
}

const PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID") ||
  "prj_qDKByUvOPDnEsAAYBuyHEydmZDXP";
const TEAM_ID = Deno.env.get("VERCEL_TEAM_ID") ||
  "team_8olXV56k0qrxvRAEz0Xtt8dM";
const PLATFORM_DOMAIN =
  (Deno.env.get("LUNADENT_PLATFORM_DOMAIN") || "lunadent.vercel.app")
    .toLowerCase();

function normalizeDomain(value: unknown) {
  let raw = String(value ?? "").trim().toLowerCase();
  if (!raw) throw new Error("Enter a domain name.");

  try {
    const parsed = raw.includes("://")
      ? new URL(raw)
      : new URL(`https://${raw}`);
    raw = parsed.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    throw new Error("Enter a valid domain such as www.example.com.");
  }

  if (
    raw.length > 253 ||
    !raw.includes(".") ||
    raw.includes("*") ||
    raw === "localhost" ||
    raw.endsWith(".localhost") ||
    raw.endsWith(".local") ||
    raw === PLATFORM_DOMAIN ||
    raw.endsWith(".vercel.app") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw)
  ) {
    throw new Error(
      "Enter a public custom domain that is not a LunaDent or Vercel address.",
    );
  }

  const labels = raw.split(".");
  if (
    labels.some((label) =>
      !label ||
      label.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
    )
  ) {
    throw new Error("The domain name contains an invalid label.");
  }

  return raw;
}

function requireVercelToken() {
  const token = Deno.env.get("VERCEL_TOKEN")?.trim();
  if (!token) {
    throw new VercelApiError(
      "Custom domain provisioning is not configured yet. Add VERCEL_TOKEN to the Edge Function secrets.",
      503,
      null,
    );
  }
  return token;
}

function vercelUrl(path: string, extra: Record<string, string> = {}) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (TEAM_ID) url.searchParams.set("teamId", TEAM_ID);
  for (const [key, value] of Object.entries(extra)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

async function vercelRequest<T>(
  path: string,
  init: RequestInit = {},
  extra: Record<string, string> = {},
): Promise<T> {
  const token = requireVercelToken();
  const response = await fetch(vercelUrl(path, extra), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null
      ? String(
        (payload as { error?: { message?: string }; message?: string }).error
          ?.message ||
          (payload as { message?: string }).message ||
          `Vercel API request failed with status ${response.status}.`,
      )
      : `Vercel API request failed with status ${response.status}.`;
    throw new VercelApiError(message, response.status, payload);
  }

  return payload as T;
}

async function getProjectDomain(domain: string) {
  return await vercelRequest<ProjectDomain>(
    `/v9/projects/${encodeURIComponent(PROJECT_ID)}/domains/${
      encodeURIComponent(domain)
    }`,
  );
}

async function getDomainConfig(domain: string) {
  return await vercelRequest<DomainConfig>(
    `/v6/domains/${encodeURIComponent(domain)}/config`,
    {},
    { projectIdOrName: PROJECT_ID },
  );
}

async function removeProjectDomain(domain: string) {
  try {
    await vercelRequest(
      `/v9/projects/${encodeURIComponent(PROJECT_ID)}/domains/${
        encodeURIComponent(domain)
      }`,
      { method: "DELETE" },
    );
  } catch (error) {
    if (error instanceof VercelApiError && error.status === 404) return;
    throw error;
  }
}

function valuesFromRecommendations(
  rows: Array<{ rank?: number; value?: string } | string> | undefined,
) {
  return (rows || []).map((row) =>
    typeof row === "string" ? row : row.value || ""
  ).filter(Boolean);
}

async function loadAccess(
  admin: AdminClient,
  userId: string,
  clinicId: string,
) {
  const [
    { data: profile, error: profileError },
    { data: membership, error: membershipError },
    { data: clinic, error: clinicError },
    { data: subscription, error: subscriptionError },
  ] = await Promise.all([
    admin.from("profiles").select("platform_role,active").eq("id", userId)
      .maybeSingle(),
    admin.from("clinic_memberships").select("role,active").eq(
      "clinic_id",
      clinicId,
    ).eq("user_id", userId).maybeSingle(),
    admin.from("clinics").select("id,status").eq("id", clinicId).maybeSingle(),
    admin.from("subscriptions").select(
      "status,trial_ends_at,current_period_end,plan:plans(code,active,features)",
    ).eq("clinic_id", clinicId).maybeSingle(),
  ]);

  if (profileError) throw profileError;
  if (membershipError) throw membershipError;
  if (clinicError) throw clinicError;
  if (subscriptionError) throw subscriptionError;
  if (!profile?.active) throw new Error("This account is inactive.");
  if (!clinic) throw new Error("Clinic not found.");

  const isSuperAdmin = profile.platform_role === "super_admin";
  const isOwner = membership?.active && membership.role === "clinic_owner";
  if (!isSuperAdmin && !isOwner) {
    throw new VercelApiError("Clinic Owner access required.", 403, null);
  }

  const planValue = subscription?.plan;
  const plan = Array.isArray(planValue) ? planValue[0] : planValue;
  const now = Date.now();
  const usable = ["trialing", "active"].includes(String(clinic.status)) &&
    ["trialing", "active"].includes(String(subscription?.status || "")) &&
    Boolean(plan?.active) &&
    (
      subscription?.status !== "trialing" ||
      !subscription?.trial_ends_at ||
      Date.parse(subscription.trial_ends_at) > now
    ) &&
    (
      !subscription?.current_period_end ||
      Date.parse(subscription.current_period_end) > now
    );

  const features = (plan?.features || {}) as Record<string, boolean>;
  return {
    isSuperAdmin,
    usable,
    customDomainEnabled: Boolean(features.custom_domain),
    planCode: String(plan?.code || ""),
  };
}

async function refreshDomainState(
  admin: AdminClient,
  clinicId: string,
  domain: string,
  verificationError = "",
) {
  let projectDomain: ProjectDomain;
  let config: DomainConfig = {};

  try {
    projectDomain = await getProjectDomain(domain);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Unable to read the domain from Vercel.";
    await admin.from("clinic_site_settings").update({
      domain_status: "failed",
      domain_verified: false,
      domain_last_checked_at: new Date().toISOString(),
      domain_error: message,
    }).eq("clinic_id", clinicId);
    throw error;
  }

  try {
    config = await getDomainConfig(domain);
  } catch {
    config = {};
  }

  const active = Boolean(
    projectDomain.verified && config.misconfigured === false,
  );
  const status = active
    ? "active"
    : (projectDomain.verified ? "dns_required" : "pending");
  const now = new Date().toISOString();
  const errorMessage = active ? null : (verificationError || null);
  const { data: currentSettings, error: currentSettingsError } = await admin
    .from("clinic_site_settings")
    .select("domain_verified_at")
    .eq("clinic_id", clinicId)
    .maybeSingle();
  if (currentSettingsError) throw currentSettingsError;

  const { error: updateError } = await admin.from("clinic_site_settings")
    .update({
      custom_domain: domain,
      domain_status: status,
      domain_verified: active,
      domain_last_checked_at: now,
      domain_verified_at: active
        ? (currentSettings?.domain_verified_at || now)
        : null,
      domain_error: errorMessage,
    }).eq("clinic_id", clinicId);
  if (updateError) throw updateError;

  return {
    domain,
    status,
    verified: active,
    ownership_verified: Boolean(projectDomain.verified),
    configured_by: config.configuredBy || null,
    verification: projectDomain.verification || [],
    dns: {
      misconfigured: config.misconfigured ?? null,
      apex_name: projectDomain.apexName || null,
      record_name:
        projectDomain.apexName && domain.endsWith(`.${projectDomain.apexName}`)
          ? domain.slice(0, -(projectDomain.apexName.length + 1))
          : "@",
      recommended_ipv4: valuesFromRecommendations(config.recommendedIPv4),
      recommended_cname: valuesFromRecommendations(config.recommendedCNAME),
    },
    error: errorMessage,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed." }, {
      status: 405,
      headers: cors,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Authentication required." }, {
        status: 401,
        headers: cors,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.slice(7);

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: identity, error: identityError } = await userClient.auth
      .getUser(token);
    if (identityError || !identity.user) {
      return Response.json({ error: "Invalid session." }, {
        status: 401,
        headers: cors,
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "status");
    const clinicId = String(body?.clinic_id || "");
    if (!clinicId) {
      return Response.json({ error: "clinic_id is required." }, {
        status: 400,
        headers: cors,
      });
    }

    const access = await loadAccess(admin, identity.user.id, clinicId);
    const { data: settings, error: settingsError } = await admin
      .from("clinic_site_settings")
      .select(
        "clinic_id,custom_domain,domain_verified,domain_status,domain_requested_at,domain_verified_at,domain_last_checked_at,domain_error",
      )
      .eq("clinic_id", clinicId)
      .maybeSingle();
    if (settingsError) throw settingsError;
    if (!settings) {
      return Response.json(
        { error: "Clinic website settings were not found." },
        { status: 404, headers: cors },
      );
    }

    if (action === "status") {
      if (!settings.custom_domain) {
        return Response.json({
          domain: null,
          status: "not_configured",
          verified: false,
          entitlement: access.customDomainEnabled,
          plan_code: access.planCode,
        }, { headers: cors });
      }

      try {
        const result = await refreshDomainState(
          admin,
          clinicId,
          settings.custom_domain,
        );
        return Response.json({
          ...result,
          entitlement: access.customDomainEnabled,
          plan_code: access.planCode,
        }, { headers: cors });
      } catch (error) {
        if (error instanceof VercelApiError && error.status === 503) {
          return Response.json({
            domain: settings.custom_domain,
            status: settings.domain_status || "pending",
            verified: Boolean(settings.domain_verified),
            entitlement: access.customDomainEnabled,
            plan_code: access.planCode,
            provider_configured: false,
            error: error.message,
          }, { status: 503, headers: cors });
        }
        throw error;
      }
    }

    if (action === "connect") {
      if (!access.usable) {
        return Response.json({
          error: "The clinic subscription is not active.",
        }, { status: 403, headers: cors });
      }
      if (!access.customDomainEnabled) {
        return Response.json({
          error: "Custom domains are not included in this clinic plan.",
        }, { status: 403, headers: cors });
      }

      const domain = normalizeDomain(body?.domain);
      const { data: duplicate, error: duplicateError } = await admin
        .from("clinic_site_settings")
        .select("clinic_id")
        .ilike("custom_domain", domain)
        .neq("clinic_id", clinicId)
        .maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate) {
        return Response.json({
          error: "This domain is already connected to another clinic.",
        }, { status: 409, headers: cors });
      }

      const previousDomain =
        settings.custom_domain && settings.custom_domain !== domain
          ? settings.custom_domain
          : null;

      let projectDomain: ProjectDomain | null = null;
      try {
        projectDomain = await vercelRequest<ProjectDomain>(
          `/v10/projects/${encodeURIComponent(PROJECT_ID)}/domains`,
          {
            method: "POST",
            body: JSON.stringify({ name: domain }),
          },
        );
      } catch (error) {
        if (
          error instanceof VercelApiError &&
          [400, 409].includes(error.status) &&
          settings.custom_domain === domain
        ) {
          try {
            projectDomain = await getProjectDomain(domain);
          } catch {
            throw error;
          }
        } else if (
          error instanceof VercelApiError && [400, 409].includes(error.status)
        ) {
          return Response.json(
            {
              error:
                "This domain is already attached to a Vercel project. Contact LunaDent support before reassigning it to another clinic.",
            },
            { status: 409, headers: cors },
          );
        } else {
          throw error;
        }
      }

      const requestedAt = new Date().toISOString();
      const { error: saveError } = await admin.from("clinic_site_settings")
        .update({
          custom_domain: domain,
          domain_status: projectDomain?.verified ? "verifying" : "pending",
          domain_verified: false,
          domain_requested_at: requestedAt,
          domain_verified_at: null,
          domain_last_checked_at: requestedAt,
          domain_error: null,
        }).eq("clinic_id", clinicId);
      if (saveError) {
        if (domain !== settings.custom_domain) {
          await removeProjectDomain(domain).catch(() => undefined);
        }
        throw saveError;
      }

      const result = await refreshDomainState(admin, clinicId, domain);
      let warning: string | undefined;
      if (previousDomain) {
        try {
          await removeProjectDomain(previousDomain);
        } catch (error) {
          warning = error instanceof Error
            ? `The new domain is connected, but LunaDent could not remove the previous Vercel domain automatically: ${error.message}`
            : "The new domain is connected, but the previous Vercel domain needs manual cleanup.";
        }
      }

      return Response.json({
        ok: true,
        ...result,
        entitlement: true,
        plan_code: access.planCode,
        ...(warning ? { warning } : {}),
      }, { headers: cors });
    }

    if (action === "verify") {
      if (!settings.custom_domain) {
        return Response.json({ error: "Connect a custom domain first." }, {
          status: 400,
          headers: cors,
        });
      }
      if (!access.usable || !access.customDomainEnabled) {
        return Response.json({
          error:
            "Custom domain verification is not available for this clinic plan.",
        }, { status: 403, headers: cors });
      }

      let verificationError = "";
      await admin.from("clinic_site_settings").update({
        domain_status: "verifying",
        domain_last_checked_at: new Date().toISOString(),
        domain_error: null,
      }).eq("clinic_id", clinicId);

      try {
        await vercelRequest<ProjectDomain>(
          `/v9/projects/${encodeURIComponent(PROJECT_ID)}/domains/${
            encodeURIComponent(settings.custom_domain)
          }/verify`,
          { method: "POST" },
        );
      } catch (error) {
        if (error instanceof VercelApiError && error.status < 500) {
          verificationError = error.message;
        } else {
          throw error;
        }
      }

      const result = await refreshDomainState(
        admin,
        clinicId,
        settings.custom_domain,
        verificationError,
      );
      return Response.json({
        ok: result.verified,
        ...result,
        entitlement: true,
        plan_code: access.planCode,
      }, { headers: cors });
    }

    if (action === "remove") {
      if (!settings.custom_domain) {
        return Response.json({
          ok: true,
          domain: null,
          status: "not_configured",
          verified: false,
        }, { headers: cors });
      }

      const domainToRemove = settings.custom_domain;
      const { error: clearError } = await admin.from("clinic_site_settings")
        .update({
          custom_domain: null,
          domain_status: "not_configured",
          domain_verified: false,
          domain_requested_at: null,
          domain_verified_at: null,
          domain_last_checked_at: new Date().toISOString(),
          domain_error: null,
        }).eq("clinic_id", clinicId);
      if (clearError) throw clearError;

      let warning: string | undefined;
      try {
        await removeProjectDomain(domainToRemove);
      } catch (error) {
        warning = error instanceof Error
          ? `The domain is disconnected from the clinic, but Vercel cleanup still needs attention: ${error.message}`
          : "The domain is disconnected from the clinic, but Vercel cleanup still needs attention.";
      }

      return Response.json({
        ok: true,
        domain: null,
        status: "not_configured",
        verified: false,
        ...(warning ? { warning } : {}),
      }, { headers: cors });
    }

    return Response.json({ error: "Unsupported action." }, {
      status: 400,
      headers: cors,
    });
  } catch (error) {
    const status = error instanceof VercelApiError ? error.status : 500;
    const safeStatus = status >= 400 && status <= 599 ? status : 500;
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: safeStatus, headers: cors },
    );
  }
});
