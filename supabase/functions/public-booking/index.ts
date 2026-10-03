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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Edge admin client intentionally uses the untyped service-role schema boundary.
type AdminClient = ReturnType<typeof createClient<any>>;
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
type DoctorSummary = { id: string; display_name: string };
type AvailabilityResult = {
  slots: string[];
  assignments: Map<string, DoctorSummary[]>;
  durationMinutes: number;
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
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
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

  const [
    { data: site, error: siteError },
    { data: subscription, error: subscriptionError },
    { data: hours, error: hoursError },
  ] = await Promise.all([
    admin.from("clinic_site_settings").select("published,content").eq("clinic_id", clinic.id).maybeSingle(),
    admin.from("subscriptions")
      .select("status,trial_ends_at,current_period_end,plan:plans(active,features)")
      .eq("clinic_id", clinic.id)
      .maybeSingle(),
    admin.from("clinic_business_hours")
      .select("weekday,enabled,open_time,close_time,slot_minutes")
      .eq("clinic_id", clinic.id)
      .order("weekday"),
  ]);
  if (siteError) throw siteError;
  if (subscriptionError) throw subscriptionError;
  if (hoursError) throw hoursError;
  if (!site?.published || !subscriptionUsable(subscription)) return null;

  const content = asRecord(site.content);
  return {
    ...clinic,
    settings: normalizeSettings(content?.bookingSettings),
    hours: hours ?? [],
  };
}

async function loadAvailability(
  admin: AdminClient,
  clinic: Awaited<ReturnType<typeof loadClinic>>,
  date: string,
  doctorId?: string | null,
  treatmentId?: string | null,
): Promise<AvailabilityResult> {
  if (!clinic) throw new Error("Clinic is unavailable.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid booking date.");

  const requestedDate = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(requestedDate.getTime())) throw new Error("Invalid booking date.");

  const localNow = localParts(new Date(), clinic.timezone || "UTC");
  const todayNoon = new Date(`${localNow.date}T12:00:00Z`);
  const dayDiff = Math.floor((requestedDate.getTime() - todayNoon.getTime()) / 86400000);
  if (dayDiff < 0 || dayDiff > clinic.settings.horizonDays) {
    return { slots: [], assignments: new Map(), durationMinutes: 30 };
  }

  const weekday = requestedDate.getUTCDay();
  const schedule = (clinic.hours ?? []).find((row) => Number(row.weekday) === weekday);
  if (!schedule?.enabled || !schedule.open_time || !schedule.close_time) {
    return { slots: [], assignments: new Map(), durationMinutes: 30 };
  }

  const intervalMinutes = Math.max(10, Number(schedule.slot_minutes || 30));
  let durationMinutes = intervalMinutes;
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
    durationMinutes = Math.max(10, Number(treatment.duration_minutes || durationMinutes));
  }

  const { data: activeDoctors, error: doctorsError } = await admin
    .from("doctors")
    .select("id,display_name")
    .eq("clinic_id", clinic.id)
    .eq("active", true)
    .order("display_name");
  if (doctorsError) throw doctorsError;

  const doctors = (activeDoctors ?? []) as DoctorSummary[];
  let candidates: DoctorSummary[] = doctors;
  if (doctorId) {
    const selected = doctors.find((doctor) => doctor.id === doctorId);
    if (!selected) throw new Error("Selected doctor is unavailable.");
    candidates = [selected];
  }

  const open = minuteOfDay(String(schedule.open_time));
  const close = minuteOfDay(String(schedule.close_time));
  if (close <= open) return { slots: [], assignments: new Map(), durationMinutes };

  const blocked = new Map<string, Array<[number, number]>>();
  for (const doctor of candidates) blocked.set(doctor.id, []);

  if (candidates.length > 0) {
    const ids = candidates.map((doctor) => doctor.id);
    const broadStart = new Date(requestedDate.getTime() - 86400000).toISOString();
    const broadEnd = new Date(requestedDate.getTime() + 2 * 86400000).toISOString();

    const [{ data: appointments, error: appointmentsError }, { data: pending, error: pendingError }] = await Promise.all([
      admin
        .from("appointments")
        .select("doctor_id,start_at,end_at")
        .eq("clinic_id", clinic.id)
        .in("doctor_id", ids)
        .not("status", "in", "(cancelled,no_show)")
        .gte("start_at", broadStart)
        .lt("start_at", broadEnd),
      admin
        .from("booking_requests")
        .select("doctor_id,preferred_time,duration_minutes")
        .eq("clinic_id", clinic.id)
        .eq("preferred_date", date)
        .in("doctor_id", ids)
        .in("status", ["new", "contacted"]),
    ]);
    if (appointmentsError) throw appointmentsError;
    if (pendingError) throw pendingError;

    for (const item of appointments ?? []) {
      if (!item.doctor_id || !blocked.has(item.doctor_id)) continue;
      blocked.get(item.doctor_id)!.push([
        appointmentBoundaryMinutes(item.start_at, date, clinic.timezone || "UTC"),
        appointmentBoundaryMinutes(item.end_at, date, clinic.timezone || "UTC"),
      ]);
    }

    for (const item of pending ?? []) {
      if (!item.doctor_id || !item.preferred_time || !blocked.has(item.doctor_id)) continue;
      const start = minuteOfDay(String(item.preferred_time));
      blocked.get(item.doctor_id)!.push([
        start,
        start + Math.max(10, Number(item.duration_minutes || intervalMinutes)),
      ]);
    }
  }

  const slots: string[] = [];
  const assignments = new Map<string, DoctorSummary[]>();
  const leadMinutes = clinic.settings.leadTimeHours * 60;

  for (let start = open; start + durationMinutes <= close; start += intervalMinutes) {
    if (date === localNow.date && start < localNow.minutes + leadMinutes) continue;
    const end = start + durationMinutes;

    if (candidates.length === 0) {
      const slot = formatMinutes(start);
      slots.push(slot);
      assignments.set(slot, []);
      continue;
    }

    const availableDoctors = candidates.filter((doctor) =>
      !(blocked.get(doctor.id) ?? []).some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart)
    );
    if (availableDoctors.length === 0) continue;

    const slot = formatMinutes(start);
    slots.push(slot);
    assignments.set(slot, availableDoctors);
  }

  return { slots, assignments, durationMinutes };
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : "";
}

async function fingerprintRequest(req: Request, clinicId: string, secret: string) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")?.trim()
    || "unknown";
  const userAgent = req.headers.get("user-agent")?.slice(0, 320) || "unknown";
  const raw = `${clinicId}|${forwarded}|${userAgent}|${secret.slice(-48)}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function enforceAbuseLimit(admin: AdminClient, clinicId: string, fingerprint: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const cleanupBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from("booking_abuse_events")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("fingerprint", fingerprint)
    .gte("created_at", since);
  if (error) throw error;
  if (Number(count || 0) >= 10) {
    throw new Error("RATE_LIMITED");
  }

  const [{ error: eventError }] = await Promise.all([
    admin.from("booking_abuse_events").insert({ clinic_id: clinicId, fingerprint }),
    admin.from("booking_abuse_events").delete().lt("created_at", cleanupBefore),
  ]);
  if (eventError) throw eventError;
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
      const result = await loadAvailability(admin, clinic, date, doctorId, treatmentId);
      return Response.json({
        slots: result.slots,
        settings: {
          ...clinic.settings,
          days: (clinic.hours ?? []).filter((row) => row.enabled).map((row) => Number(row.weekday)),
        },
      }, { headers: cors });
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
    const time = String(body?.preferred_time || "").slice(0, 5);
    const treatmentId = body?.treatment_id ? String(body.treatment_id) : null;
    const doctorId = body?.doctor_id ? String(body.doctor_id) : null;

    if (fullName.length < 2 || fullName.length > 120) {
      return Response.json({ error: "Enter a valid full name." }, { status: 400, headers: cors });
    }
    if (!phone) return Response.json({ error: "Enter a valid phone number." }, { status: 400, headers: cors });
    if (email.length > 254) return Response.json({ error: "Email address is too long." }, { status: 400, headers: cors });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400, headers: cors });
    }
    if (notes.length > 1500) return Response.json({ error: "Notes are too long." }, { status: 400, headers: cors });
    if (!treatmentId) return Response.json({ error: "Select a treatment." }, { status: 400, headers: cors });

    const fingerprint = await fingerprintRequest(req, clinic.id, service);
    try {
      await enforceAbuseLimit(admin, clinic.id, fingerprint);
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMITED") {
        return Response.json({ error: "Too many booking attempts. Please wait a few minutes and try again." }, { status: 429, headers: cors });
      }
      throw error;
    }

    const result = await loadAvailability(admin, clinic, date, doctorId, treatmentId);
    const availableDoctors = result.assignments.get(time);
    if (!result.slots.includes(time) || availableDoctors === undefined) {
      return Response.json({ error: "That time is no longer available. Choose another slot." }, { status: 409, headers: cors });
    }

    const [{ data: treatment, error: treatmentError }] = await Promise.all([
      admin.from("treatments").select("id,name_en").eq("id", treatmentId).eq("clinic_id", clinic.id).eq("active", true).single(),
    ]);
    if (treatmentError) throw treatmentError;

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

    const candidates = doctorId
      ? availableDoctors
      : availableDoctors.length > 0
        ? availableDoctors
        : [null];

    for (const candidate of candidates) {
      const { data: created, error: insertError } = await admin
        .from("booking_requests")
        .insert({
          clinic_id: clinic.id,
          full_name: fullName,
          email: email || null,
          phone,
          treatment_id: treatment.id,
          doctor_id: candidate?.id ?? null,
          requested_treatment: treatment.name_en,
          requested_doctor: doctorId ? candidate?.display_name ?? null : null,
          preferred_date: date,
          preferred_time: time,
          duration_minutes: result.durationMinutes,
          notes: notes || null,
          status: "new",
        })
        .select("id")
        .single();

      if (!insertError && created) {
        return Response.json({
          ok: true,
          request_id: created.id,
          assigned_doctor_id: candidate?.id ?? null,
        }, { status: 201, headers: cors });
      }

      if (insertError?.code === "23P01") continue;
      throw insertError;
    }

    return Response.json({ error: "That time was just taken. Choose another slot." }, { status: 409, headers: cors });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to process booking." },
      { status: 500, headers: cors },
    );
  }
});
