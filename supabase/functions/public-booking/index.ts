import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_SETTINGS = {
  days: [1, 2, 3, 4, 5],
  start: "09:00",
  end: "17:00",
  slotMinutes: 30,
  leadTimeHours: 2,
  horizonDays: 90,
};

type AdminClient = ReturnType<typeof createClient>;

type BookingSettings = typeof DEFAULT_SETTINGS;

type UnknownRecord = Record<string, unknown>;
type PlanSummary = {
  active?: boolean | null;
  features?: Record<string, unknown> | null;
};
type SubscriptionSummary = {
  status?: string | null;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  plan?: PlanSummary | PlanSummary[] | null;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function normalizeSettings(raw: unknown): BookingSettings {
  const value = asRecord(raw) ?? {};
  const rawDays = Array.isArray(value.days)
    ? value.days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const start = typeof value.start === "string" ? value.start : "";
  const end = typeof value.end === "string" ? value.end : "";
  return {
    days: rawDays.length ? Array.from(new Set(rawDays)) : DEFAULT_SETTINGS.days,
    start: timePattern.test(start) ? start : DEFAULT_SETTINGS.start,
    end: timePattern.test(end) ? end : DEFAULT_SETTINGS.end,
    slotMinutes: clampNumber(value.slotMinutes, DEFAULT_SETTINGS.slotMinutes, 10, 120),
    leadTimeHours: clampNumber(value.leadTimeHours, DEFAULT_SETTINGS.leadTimeHours, 0, 168),
    horizonDays: clampNumber(value.horizonDays, DEFAULT_SETTINGS.horizonDays, 7, 365),
  };
}

function minuteOfDay(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function formatMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
}

function appointmentBoundaryMinutes(iso: string, targetDate: string, timezone: string) {
  const local = localParts(new Date(iso), timezone);
  if (local.date < targetDate) return 0;
  if (local.date > targetDate) return 24 * 60;
  return local.minutes;
}

function subscriptionUsable(subscription: SubscriptionSummary | null | undefined) {
  if (!subscription) return false;
  const now = Date.now();
  const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
  if (!plan?.active || !["trialing", "active"].includes(String(subscription.status))) return false;
  if (subscription.status === "trialing" && subscription.trial_ends_at && new Date(subscription.trial_ends_at).getTime() <= now) return false;
  if (subscription.current_period_end && new Date(subscription.current_period_end).getTime() <= now) return false;
  return Boolean(plan.features?.appointments);
}

async function loadClinic(admin: AdminClient, slug: string) {
  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .select("id,slug,name,status,timezone,whatsapp")
    .eq("slug", slug)
    .in("status", ["trialing", "active"])
    .maybeSingle();
  if (clinicError) throw clinicError;
  if (!clinic) return null;

  const [{ data: site, error: siteError }, { data: subscription, error: subscriptionError }] = await Promise.all([
    admin.from("clinic_site_settings").select("published,content").eq("clinic_id", clinic.id).maybeSingle(),
    admin.from("subscriptions")
      .select("status,trial_ends_at,current_period_end,plan:plans(active,features)")
      .eq("clinic_id", clinic.id)
      .maybeSingle(),
  ]);
  if (siteError) throw siteError;
  if (subscriptionError) throw subscriptionError;
  if (!site?.published || !subscriptionUsable(subscription)) return null;

  const content = asRecord(site.content);
  return {
    ...clinic,
    settings: normalizeSettings(content?.bookingSettings),
  };
}

async function availability(
  admin: AdminClient,
  clinic: Awaited<ReturnType<typeof loadClinic>>,
  date: string,
  doctorId?: string | null,
  treatmentId?: string | null,
) {
  if (!clinic) throw new Error("Clinic is unavailable.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid booking date.");

  const requestedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(requestedDate.getTime())) throw new Error("Invalid booking date.");

  const localNow = localParts(new Date(), clinic.timezone || "UTC");
  const todayNoon = new Date(`${localNow.date}T12:00:00Z`);
  const dayDiff = Math.floor((requestedDate.getTime() - todayNoon.getTime()) / 86400000);
  if (dayDiff < 0 || dayDiff > clinic.settings.horizonDays) return [];

  const weekday = requestedDate.getUTCDay();
  if (!clinic.settings.days.includes(weekday)) return [];

  let duration = clinic.settings.slotMinutes;
  if (treatmentId) {
    const { data: treatment, error } = await admin
      .from("treatments")
      .select("id,duration_minutes")
      .eq("id", treatmentId)
      .eq("clinic_id", clinic.id)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!treatment) throw new Error("Selected treatment is unavailable.");
    duration = Math.max(10, Number(treatment.duration_minutes || duration));
  }

  if (doctorId) {
    const { data: doctor, error } = await admin
      .from("doctors")
      .select("id")
      .eq("id", doctorId)
      .eq("clinic_id", clinic.id)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!doctor) throw new Error("Selected doctor is unavailable.");
  }

  const open = minuteOfDay(clinic.settings.start);
  const close = minuteOfDay(clinic.settings.end);
  if (close <= open) return [];

  const blocked: Array<[number, number]> = [];
  if (doctorId) {
    const broadStart = new Date(requestedDate.getTime() - 86400000).toISOString();
    const broadEnd = new Date(requestedDate.getTime() + 2 * 86400000).toISOString();
    const { data: appointments, error } = await admin
      .from("appointments")
      .select("start_at,end_at")
      .eq("clinic_id", clinic.id)
      .eq("doctor_id", doctorId)
      .not("status", "in", "(cancelled,no_show)")
      .gte("start_at", broadStart)
      .lt("start_at", broadEnd);
    if (error) throw error;
    for (const item of appointments ?? []) {
      blocked.push([
        appointmentBoundaryMinutes(item.start_at, date, clinic.timezone || "UTC"),
        appointmentBoundaryMinutes(item.end_at, date, clinic.timezone || "UTC"),
      ]);
    }
  }

  const slots: string[] = [];
  const leadMinutes = clinic.settings.leadTimeHours * 60;
  for (let start = open; start + duration <= close; start += clinic.settings.slotMinutes) {
    if (date === localNow.date && start < localNow.minutes + leadMinutes) continue;
    const end = start + duration;
    if (blocked.some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart)) continue;
    slots.push(formatMinutes(start));
  }
  return slots;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "availability");
    const clinicSlug = String(body?.clinic_slug || "").trim().toLowerCase();
    if (!clinicSlug) return Response.json({ error: "Clinic is required." }, { status: 400, headers: cors });

    const clinic = await loadClinic(admin, clinicSlug);
    if (!clinic) return Response.json({ error: "Clinic booking is unavailable." }, { status: 404, headers: cors });

    if (action === "availability") {
      const date = String(body?.date || "");
      const doctorId = body?.doctor_id ? String(body.doctor_id) : null;
      const treatmentId = body?.treatment_id ? String(body.treatment_id) : null;
      const slots = await availability(admin, clinic, date, doctorId, treatmentId);
      return Response.json({ slots, settings: clinic.settings }, { headers: cors });
    }

    if (action !== "submit") {
      return Response.json({ error: "Unsupported action." }, { status: 400, headers: cors });
    }

    if (String(body?.website || "").trim()) {
      return Response.json({ ok: true }, { status: 202, headers: cors });
    }

    const fullName = String(body?.full_name || "").trim().replace(/\s+/g, " ");
    const email = String(body?.email || "").trim().toLowerCase();
    const phone = normalizePhone(String(body?.phone || ""));
    const notes = String(body?.notes || "").trim();
    const date = String(body?.preferred_date || "");
    const time = String(body?.preferred_time || "");
    const treatmentId = body?.treatment_id ? String(body.treatment_id) : null;
    const doctorId = body?.doctor_id ? String(body.doctor_id) : null;

    if (fullName.length < 2 || fullName.length > 120) {
      return Response.json({ error: "Enter a valid full name." }, { status: 400, headers: cors });
    }
    if (!phone) return Response.json({ error: "Enter a valid phone number." }, { status: 400, headers: cors });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400, headers: cors });
    }
    if (notes.length > 1500) return Response.json({ error: "Notes are too long." }, { status: 400, headers: cors });
    if (!treatmentId) return Response.json({ error: "Select a treatment." }, { status: 400, headers: cors });

    const validSlots = await availability(admin, clinic, date, doctorId, treatmentId);
    if (!validSlots.includes(time)) {
      return Response.json({ error: "That time is no longer available. Choose another slot." }, { status: 409, headers: cors });
    }

    const [{ data: treatment, error: treatmentError }, doctorResult] = await Promise.all([
      admin.from("treatments").select("id,name_en").eq("id", treatmentId).eq("clinic_id", clinic.id).eq("active", true).single(),
      doctorId
        ? admin.from("doctors").select("id,display_name").eq("id", doctorId).eq("clinic_id", clinic.id).eq("active", true).single()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (treatmentError) throw treatmentError;
    if (doctorResult.error) throw doctorResult.error;

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const phoneCountQuery = admin
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinic.id)
      .eq("phone", phone)
      .gte("created_at", since);
    const emailCountQuery = email
      ? admin.from("booking_requests").select("*", { count: "exact", head: true }).eq("clinic_id", clinic.id).eq("email", email).gte("created_at", since)
      : Promise.resolve({ count: 0, error: null });

    const [phoneCount, emailCount] = await Promise.all([phoneCountQuery, emailCountQuery]);
    if (phoneCount.error) throw phoneCount.error;
    if (emailCount.error) throw emailCount.error;
    if (Number(phoneCount.count || 0) >= 3 || Number(emailCount.count || 0) >= 3) {
      return Response.json({ error: "Too many booking requests. Please wait a few minutes and try again." }, { status: 429, headers: cors });
    }

    const { data: created, error: insertError } = await admin
      .from("booking_requests")
      .insert({
        clinic_id: clinic.id,
        full_name: fullName,
        email: email || null,
        phone,
        treatment_id: treatment.id,
        doctor_id: doctorResult.data?.id ?? null,
        requested_treatment: treatment.name_en,
        requested_doctor: doctorResult.data?.display_name ?? null,
        preferred_date: date,
        preferred_time: time,
        notes: notes || null,
        status: "new",
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    return Response.json({ ok: true, request_id: created.id }, { status: 201, headers: cors });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to process booking." },
      { status: 500, headers: cors },
    );
  }
});
