import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock3, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import { clinicPublicHref, getPlatformHomeUrl, usePublicClinicSite } from "@/saas/publicRouting";
import { supabase } from "@/lib/supabase";
import type { BookingSettings } from "@/saas/types";

type AvailabilityResponse = {
  slots: string[];
  settings?: Required<BookingSettings>;
};

async function invokeBooking<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error("Online booking is unavailable.");
  const { data, error } = await supabase.functions.invoke("public-booking", { body });
  if (data?.error) throw new Error(String(data.error));
  if (error) {
    let message = error.message || "Booking service is unavailable.";
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
  return data as T;
}

function friendlyTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ClinicBooking() {
  const { site, loading, error: clinicLoadError } = usePublicClinicSite();
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [horizonDays, setHorizonDays] = useState(90);
  const [saving, setSaving] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [form, setForm] = useState({
    treatment_id: "",
    doctor_id: "",
    preferred_date: "",
    preferred_time: "",
    full_name: "",
    email: "",
    phone: "",
    notes: "",
    website: "",
  });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + horizonDays);
    return date.toISOString().slice(0, 10);
  }, [horizonDays]);

  useEffect(() => {
    if (clinicLoadError) setError(clinicLoadError);
    const configuredHorizon = Number(site?.settings.content.bookingSettings?.horizonDays);
    if (Number.isFinite(configuredHorizon) && configuredHorizon >= 7 && configuredHorizon <= 365) {
      setHorizonDays(configuredHorizon);
    }
  }, [site, clinicLoadError]);

  const selectedTreatment = site?.treatments.find((item) => item.id === form.treatment_id);
  const selectedDoctor = site?.doctors.find((item) => item.id === form.doctor_id);

  useEffect(() => {
    if (!site || !form.preferred_date || !form.treatment_id) {
      setSlots([]);
      setAvailabilityError("");
      return;
    }

    let active = true;
    setSlotsLoading(true);
    setAvailabilityError("");
    setSlots([]);
    setForm((current) => ({ ...current, preferred_time: "" }));

    void invokeBooking<AvailabilityResponse>({
      action: "availability",
      clinic_slug: site.clinic.slug,
      date: form.preferred_date,
      doctor_id: form.doctor_id || null,
      treatment_id: form.treatment_id,
    })
      .then((result) => {
        if (!active) return;
        setSlots(result.slots || []);
        if (result.settings?.horizonDays) setHorizonDays(result.settings.horizonDays);
      })
      .catch((err) => {
        if (!active) return;
        setAvailabilityError(err instanceof Error ? err.message : "Unable to load available times.");
      })
      .finally(() => active && setSlotsLoading(false));

    return () => { active = false; };
  }, [site, form.preferred_date, form.doctor_id, form.treatment_id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!site) return;
    setSaving(true);
    setError("");

    try {
      const result = await invokeBooking<{ ok: boolean; request_id: string }>({
        action: "submit",
        clinic_slug: site.clinic.slug,
        treatment_id: form.treatment_id,
        doctor_id: form.doctor_id || null,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
        website: form.website,
      });
      setRequestId(result.request_id || "submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your booking request.");
      if (form.preferred_date && form.treatment_id) {
        void invokeBooking<AvailabilityResponse>({
          action: "availability",
          clinic_slug: site.clinic.slug,
          date: form.preferred_date,
          doctor_id: form.doctor_id || null,
          treatment_id: form.treatment_id,
        }).then((result) => setSlots(result.slots || [])).catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  };

  const whatsappHref = useMemo(() => {
    if (!site?.clinic.whatsapp || !requestId) return "";
    const digits = site.clinic.whatsapp.replace(/\D/g, "");
    if (!digits) return "";
    const message = [
      `Hello ${site.clinic.name}, I submitted booking request ${requestId === "submitted" ? "" : "#" + requestId.slice(0, 8)}.`,
      selectedTreatment ? `Treatment: ${selectedTreatment.name_en}` : "",
      selectedDoctor ? `Doctor: ${selectedDoctor.display_name}` : "Doctor: No preference",
      form.preferred_date ? `Preferred date: ${form.preferred_date}` : "",
      form.preferred_time ? `Preferred time: ${friendlyTime(form.preferred_time)}` : "",
      `Name: ${form.full_name}`,
    ].filter(Boolean).join("\n");
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }, [site, requestId, selectedTreatment, selectedDoctor, form.preferred_date, form.preferred_time, form.full_name]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="mt-4 text-sm font-medium">Loading secure booking…</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return <div className="min-h-screen grid place-items-center bg-slate-50"><a href={getPlatformHomeUrl()} className="font-semibold">Clinic not found · Back to LunaDent</a></div>;
  }

  if (requestId) {
    return (
      <div className="min-h-screen grid place-items-center px-5" style={{ background: site.settings.tokens?.colors?.background || "#fff" }}>
        <div className="w-full max-w-lg text-center rounded-3xl border bg-white p-8 shadow-sm">
          <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Request saved</p>
          <h1 className="text-3xl font-bold mt-2">We sent it to the clinic</h1>
          <p className="text-slate-600 mt-3 leading-relaxed">
            {site.clinic.name} will review your preferred time and confirm the final appointment. Your request is already stored—you do not need WhatsApp to complete it.
          </p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between gap-4"><span className="text-slate-500">Treatment</span><b>{selectedTreatment?.name_en}</b></div>
            <div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Doctor</span><b>{selectedDoctor?.display_name || "No preference"}</b></div>
            <div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Preferred time</span><b>{form.preferred_date} · {friendlyTime(form.preferred_time)}</b></div>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to={clinicPublicHref(site)} className="px-5 py-3 rounded-xl text-white font-semibold" style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}>
              Back to clinic
            </Link>
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold text-emerald-700">
                <MessageCircle size={17} /> Continue on WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto h-16 px-5 flex items-center justify-between">
          <Link to={clinicPublicHref(site)} className="inline-flex items-center gap-2 font-semibold">
            <ChevronLeft size={16} />{site.clinic.name}
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><ShieldCheck size={14} />Secure booking</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: site.settings.tokens?.colors?.primary || "#2457C5" }}>Appointment request</p>
          <h1 className="text-3xl font-bold mt-2">Choose a preferred appointment time</h1>
          <p className="text-slate-600 mt-2">Available times are checked against the clinic schedule. The clinic confirms the final appointment after review.</p>
        </div>

        <form onSubmit={submit} className="rounded-3xl bg-white border p-6 md:p-8 space-y-7 shadow-sm">
          {error && <div role="alert" className="rounded-xl bg-red-50 border border-red-100 text-red-700 p-3 text-sm">{error}</div>}

          <section>
            <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={18} />Treatment</div>
            {site.treatments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Online booking is not available until the clinic publishes a treatment.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {site.treatments.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={form.treatment_id === item.id}
                    onClick={() => setForm({ ...form, treatment_id: item.id, preferred_time: "" })}
                    className={`text-left p-4 rounded-2xl border transition ${form.treatment_id === item.id ? "ring-2 ring-offset-1" : "hover:border-slate-300"}`}
                    style={form.treatment_id === item.id ? { borderColor: site.settings.tokens?.colors?.primary, boxShadow: `0 0 0 1px ${site.settings.tokens?.colors?.primary || "#2457C5"}` } : {}}
                  >
                    <div className="font-semibold">{item.name_en}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.duration_minutes} minutes</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {site.doctors.length > 0 && (
            <section>
              <div className="flex items-center gap-2 font-bold"><UserRound size={18} />Doctor preference</div>
              <select
                value={form.doctor_id}
                onChange={(event) => setForm({ ...form, doctor_id: event.target.value, preferred_time: "" })}
                className="mt-3 w-full px-4 py-3 rounded-xl border bg-white"
              >
                <option value="">No preference</option>
                {site.doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.display_name}{doctor.specialty ? ` · ${doctor.specialty}` : ""}</option>
                ))}
              </select>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 font-bold"><CalendarDays size={18} />Preferred date & time</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input
                required
                type="date"
                min={today}
                max={maxDate}
                value={form.preferred_date}
                onChange={(event) => setForm({ ...form, preferred_date: event.target.value, preferred_time: "" })}
                className="px-4 py-3 rounded-xl border"
              />
              <select
                required
                disabled={!form.treatment_id || !form.preferred_date || slotsLoading || slots.length === 0}
                value={form.preferred_time}
                onChange={(event) => setForm({ ...form, preferred_time: event.target.value })}
                className="px-4 py-3 rounded-xl border bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {slotsLoading ? "Checking schedule…" : !form.treatment_id ? "Select treatment first" : !form.preferred_date ? "Select date first" : slots.length === 0 ? "No times available" : "Select time"}
                </option>
                {slots.map((time) => <option key={time} value={time}>{friendlyTime(time)}</option>)}
              </select>
            </div>
            {availabilityError && <p role="alert" className="mt-2 text-xs text-red-600">{availabilityError}</p>}
            {!slotsLoading && form.preferred_date && form.treatment_id && !availabilityError && slots.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">No open slots match this selection. Try another date or doctor preference.</p>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 font-bold"><Clock3 size={18} />Your details</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input required autoComplete="name" placeholder="Full name" value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="px-4 py-3 rounded-xl border" />
              <input required autoComplete="tel" inputMode="tel" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="px-4 py-3 rounded-xl border" />
              <input type="email" autoComplete="email" placeholder="Email (optional)" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="px-4 py-3 rounded-xl border sm:col-span-2" />
              <textarea maxLength={1500} placeholder="Notes (optional)" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="px-4 py-3 rounded-xl border sm:col-span-2 min-h-24" />
              <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                Website
                <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} />
              </label>
            </div>
          </section>

          <button
            disabled={saving || !form.treatment_id || !form.preferred_date || !form.preferred_time}
            className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{ background: site.settings.tokens?.colors?.primary || "#2457C5" }}
          >
            {saving ? "Sending securely…" : "Send Booking Request"}
          </button>
          <p className="text-center text-xs text-slate-400">Submitting a request does not create a confirmed appointment. The clinic will confirm it.</p>
        </form>
      </main>
    </div>
  );
}
