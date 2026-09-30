import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock3, UserRound } from "lucide-react";
import { saasRepository } from "@/saas/repository";
import { supabase } from "@/lib/supabase";
import type { PublicClinicSite } from "@/saas/types";

const times = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00"];

export default function ClinicBooking() {
  const { clinicSlug = "" } = useParams();
  const [site, setSite] = useState<PublicClinicSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    treatment_id: "",
    requested_doctor: "",
    preferred_date: "",
    preferred_time: "",
    full_name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const today = useMemo(() => new Date().toISOString().slice(0,10), []);

  useEffect(() => {
    let active = true;
    void saasRepository.getClinicSiteBySlug(clinicSlug)
      .then(data => active && setSite(data))
      .catch(err => active && setError(err instanceof Error ? err.message : "Unable to load clinic."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [clinicSlug]);

  const selectedTreatment = site?.treatments.find(item=>item.id===form.treatment_id);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!site || !supabase) return;
    setSaving(true);
    setError("");

    try {
      const requestId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("booking_requests").insert({
        id: requestId,
        clinic_id: site.clinic.id,
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim(),
        treatment_id: form.treatment_id || null,
        requested_treatment: selectedTreatment?.name_en || null,
        requested_doctor: form.requested_doctor || null,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        notes: form.notes.trim() || null,
      });
      if (insertError) throw insertError;

      setSuccess(true);

      if (site.clinic.whatsapp) {
        const digits = site.clinic.whatsapp.replace(/\D/g,"");
        const message = [
          `Hello ${site.clinic.name}, I sent a booking request.`,
          selectedTreatment ? `Treatment: ${selectedTreatment.name_en}` : "",
          form.preferred_date ? `Preferred date: ${form.preferred_date}` : "",
          form.preferred_time ? `Preferred time: ${form.preferred_time}` : "",
          `Name: ${form.full_name}`,
        ].filter(Boolean).join("\n");
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your booking request.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Loading booking...</div>;
  if (!site) return <div className="min-h-screen grid place-items-center bg-slate-50"><Link to="/" className="font-semibold">Clinic not found · Back to LunaDent</Link></div>;

  if (success) return (
    <div className="min-h-screen grid place-items-center px-5" style={{background:site.settings.tokens?.colors?.background || "#fff"}}>
      <div className="max-w-lg text-center rounded-3xl border bg-white p-8">
        <CheckCircle2 size={46} className="mx-auto text-emerald-600"/>
        <h1 className="text-3xl font-bold mt-4">Request received</h1>
        <p className="text-slate-600 mt-3">{site.clinic.name} can now review your preferred date and time and confirm the appointment.</p>
        <Link to={`/c/${site.clinic.slug}`} className="inline-block mt-6 px-5 py-3 rounded-xl text-white font-semibold" style={{background:site.settings.tokens?.colors?.primary || "#2457C5"}}>Back to clinic website</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto h-16 px-5 flex items-center justify-between">
          <Link to={`/c/${site.clinic.slug}`} className="inline-flex items-center gap-2 font-semibold"><ChevronLeft size={16}/>{site.clinic.name}</Link>
          <span className="text-xs text-slate-500">Secure booking request</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="mb-7"><h1 className="text-3xl font-bold">Request an appointment</h1><p className="text-slate-600 mt-2">Choose your preferences. The clinic will confirm the final appointment.</p></div>
        <form onSubmit={submit} className="rounded-3xl bg-white border p-6 md:p-8 space-y-7">
          {error && <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</div>}

          <section>
            <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={18}/>Treatment</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {site.treatments.map(item=><button type="button" key={item.id} onClick={()=>setForm({...form,treatment_id:item.id})} className={`text-left p-4 rounded-2xl border ${form.treatment_id===item.id?"ring-2 ring-offset-1":""}`} style={form.treatment_id===item.id?{borderColor:site.settings.tokens?.colors?.primary,boxShadow:`0 0 0 1px ${site.settings.tokens?.colors?.primary || "#2457C5"}`}:{}}>
                <div className="font-semibold">{item.name_en}</div><div className="text-xs text-slate-500 mt-1">{item.duration_minutes} minutes</div>
              </button>)}
            </div>
          </section>

          {site.doctors.length>0 && <section>
            <div className="flex items-center gap-2 font-bold"><UserRound size={18}/>Doctor preference</div>
            <select value={form.requested_doctor} onChange={e=>setForm({...form,requested_doctor:e.target.value})} className="mt-3 w-full px-4 py-3 rounded-xl border bg-white">
              <option value="">No preference</option>
              {site.doctors.map(doctor=><option key={doctor.id} value={doctor.display_name}>{doctor.display_name}{doctor.specialty?` · ${doctor.specialty}`:""}</option>)}
            </select>
          </section>}

          <section>
            <div className="flex items-center gap-2 font-bold"><CalendarDays size={18}/>Preferred date & time</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input required type="date" min={today} value={form.preferred_date} onChange={e=>setForm({...form,preferred_date:e.target.value})} className="px-4 py-3 rounded-xl border" />
              <select required value={form.preferred_time} onChange={e=>setForm({...form,preferred_time:e.target.value})} className="px-4 py-3 rounded-xl border bg-white">
                <option value="">Select time</option>
                {times.map(time=><option key={time} value={time}>{time}</option>)}
              </select>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 font-bold"><Clock3 size={18}/>Your details</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input required placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} className="px-4 py-3 rounded-xl border" />
              <input required placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="px-4 py-3 rounded-xl border" />
              <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="px-4 py-3 rounded-xl border sm:col-span-2" />
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="px-4 py-3 rounded-xl border sm:col-span-2 min-h-24" />
            </div>
          </section>

          <button disabled={saving} className="w-full py-3.5 rounded-xl text-white font-semibold" style={{background:site.settings.tokens?.colors?.primary || "#2457C5"}}>
            {saving?"Saving request...":"Send Booking Request"}
          </button>
        </form>
      </main>
    </div>
  );
}
