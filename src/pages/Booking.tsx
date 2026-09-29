import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, Star, CheckCircle2, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { TREATMENTS, DOCTORS, BRAND } from "@/lib/data";
import { FadeIn, StaggerGroup, StaggerItem, HoverCard, ScaleIn } from "@/components/Motion";
import { clinicRepository } from "@/clinic/repository";

export default function Booking() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ treatment: -1, doctor: -1, date: "", time: "" });
  const [details, setDetails] = useState({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const times = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","1:00 PM","1:30 PM","2:00 PM","3:00 PM","3:30 PM","4:00 PM"];

  const stepInfo = [
    { n: 1, label: "Treatment" },
    { n: 2, label: "Doctor" },
    { n: 3, label: "Date & Time" },
    { n: 4, label: "Your Details" },
    { n: 5, label: "Confirm" },
  ];

  return (
    <div className="min-h-screen pt-8 pb-24" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <FadeIn className="text-center mb-10">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Online Booking</span>
          <h1 className="text-4xl font-bold mt-2 mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Book Your Consultation
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Free first consultation · No commitment required · Same-day appointments available
          </p>
        </FadeIn>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 z-0" style={{ background: "var(--border)" }} />
          <div className="absolute left-0 top-4 h-0.5 z-0 transition-all duration-500"
            style={{ background: "var(--primary)", width: `${((step - 1) / 4) * 100}%` }} />
          {stepInfo.map(s => (
            <div key={s.n} className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => s.n < step && setStep(s.n)}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: step > s.n ? "var(--primary)" : step === s.n ? "var(--accent)" : "var(--muted)",
                  color: step >= s.n ? "white" : "var(--muted-foreground)",
                  boxShadow: step === s.n ? "0 0 0 3px rgba(185,106,141,0.2)" : "none",
                }}>
                {step > s.n ? <CheckCircle2 size={14} /> : s.n}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: step === s.n ? "var(--primary)" : "var(--muted-foreground)" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {/* Step 1 — Treatment */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>Select a Treatment</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TREATMENTS.map((t, i) => (
                    <button key={t.id} onClick={() => { setSelected(s => ({...s, treatment: i})); }}
                      className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all hover:-translate-y-0.5"
                      style={{
                        background: "var(--card)",
                        borderColor: selected.treatment === i ? "var(--primary)" : "var(--border)",
                        boxShadow: selected.treatment === i ? "0 0 0 2px rgba(59,30,84,0.2)" : "none",
                      }}>
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm flex items-center gap-1" style={{ color: "var(--foreground)" }}>
                          {t.name}
                          {selected.treatment === i && <CheckCircle2 size={13} style={{ color: "var(--accent)" }} />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: "var(--accent)" }}>{t.price}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {t.duration}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => selected.treatment >= 0 && setStep(2)}
                  className="mt-6 w-full py-3.5 rounded-full font-semibold text-sm transition-all"
                  style={{
                    background: selected.treatment >= 0 ? "var(--primary)" : "var(--muted)",
                    color: selected.treatment >= 0 ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  }}>
                  Continue — Choose Doctor <ArrowRight size={15} className="inline ml-1" />
                </button>
              </div>
            )}

            {/* Step 2 — Doctor */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>Choose Your Doctor</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DOCTORS.map((d, i) => (
                    <button key={d.id} onClick={() => setSelected(s => ({...s, doctor: i}))}
                      className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all hover:-translate-y-0.5"
                      style={{
                        background: "var(--card)",
                        borderColor: selected.doctor === i ? "var(--primary)" : "var(--border)",
                      }}>
                      <img src={d.img} alt={d.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{d.name}</div>
                        <div className="text-xs" style={{ color: "var(--accent)" }}>{d.title}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={11} fill="#D7B98E" color="#D7B98E" />
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{d.rating} · {d.reviews} reviews</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button onClick={() => setSelected(s => ({...s, doctor: 99}))}
                    className="flex items-center gap-4 p-4 rounded-2xl border text-left"
                    style={{ background: "var(--card)", borderColor: selected.doctor === 99 ? "var(--primary)" : "var(--border)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: "var(--secondary)" }}>🌟</div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>No Preference</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>We'll match you with the best available specialist</div>
                    </div>
                  </button>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-full text-sm border"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Back</button>
                  <button onClick={() => selected.doctor >= 0 && setStep(3)}
                    className="flex-[2] py-3 rounded-full text-sm font-semibold"
                    style={{
                      background: selected.doctor >= 0 ? "var(--primary)" : "var(--muted)",
                      color: selected.doctor >= 0 ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    }}>
                    Continue — Choose Date <ArrowRight size={15} className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Date & Time */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>Select Date & Time</h2>
                <div className="rounded-2xl border p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <h3 className="font-medium text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>April 2026</h3>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
                      <div key={d} className="text-center text-xs py-1 font-medium" style={{ color: "var(--muted-foreground)" }}>{d}</div>
                    ))}
                    {Array.from({length: 30}, (_, i) => i + 1).map(d => {
                      const isToday = d === 16;
                      const isPast = d < 16;
                      return (
                        <button key={d} onClick={() => !isPast && setSelected(s => ({...s, date: `Apr ${d}`}))}
                          disabled={isPast}
                          className="aspect-square rounded-xl text-xs flex items-center justify-center transition-all"
                          style={{
                            background: selected.date === `Apr ${d}` ? "var(--primary)" : isToday ? "var(--secondary)" : "transparent",
                            color: selected.date === `Apr ${d}` ? "white" : isPast ? "var(--muted-foreground)" : "var(--foreground)",
                            opacity: isPast ? 0.35 : 1,
                            fontWeight: isToday ? 600 : 400,
                          }}>{d}</button>
                      );
                    })}
                  </div>
                  {selected.date && (
                    <div>
                      <h3 className="font-medium text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>Available times for {selected.date}</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {times.map(t => (
                          <button key={t} onClick={() => setSelected(s => ({...s, time: t}))}
                            className="py-2 rounded-xl text-xs font-medium transition-all border"
                            style={{
                              background: selected.time === t ? "var(--primary)" : "var(--muted)",
                              color: selected.time === t ? "white" : "var(--foreground)",
                              borderColor: selected.time === t ? "var(--primary)" : "var(--border)",
                            }}>{t}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-full text-sm border"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Back</button>
                  <button onClick={() => selected.date && selected.time && setStep(4)}
                    className="flex-[2] py-3 rounded-full text-sm font-semibold"
                    style={{
                      background: selected.date && selected.time ? "var(--primary)" : "var(--muted)",
                      color: selected.date && selected.time ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    }}>
                    Continue — Add Details <ArrowRight size={15} className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 — Details */}
            {step === 4 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>Your Details</h2>
                <div className="rounded-2xl border p-5 mb-4 space-y-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      ["First Name","firstName","text","Sofia"],
                      ["Last Name","lastName","text","Anderson"],
                      ["Phone","phone","tel","+1 (310) 555-0192"],
                      ["Email","email","email","sofia@email.com"],
                    ].map(([label,key,type,placeholder]) => (
                      <div key={key}>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                        <input type={type} required={key !== "email"} placeholder={placeholder} value={details[key as keyof typeof details]}
                          onChange={(e) => setDetails((current) => ({ ...current, [key]: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                          style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Notes / Special Requirements</label>
                    <textarea rows={3} placeholder="Any allergies, anxieties, or special requests..." value={details.notes}
                      onChange={(e) => setDetails((current) => ({ ...current, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                  </div>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="consent" className="mt-0.5" defaultChecked />
                    <label htmlFor="consent" className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      I agree to receive appointment reminders and updates via WhatsApp and Email.
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-full text-sm border"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Back</button>
                  <button onClick={() => details.firstName.trim() && details.lastName.trim() && details.phone.trim() && setStep(5)}
                    className="flex-[2] py-3 rounded-full text-sm font-semibold"
                    style={{ background: details.firstName.trim() && details.lastName.trim() && details.phone.trim() ? "var(--primary)" : "var(--muted)", color: details.firstName.trim() && details.lastName.trim() && details.phone.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)" }}>
                    Review Booking <ArrowRight size={15} className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 — Confirm */}
            {step === 5 && (
              <div>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>Confirm Appointment</h2>
                <div className="rounded-2xl border p-5 mb-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3 p-4 rounded-xl mb-4"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "white" }}>
                    <Sparkles size={18} />
                    <div>
                      <div className="font-semibold text-sm">Your LunaDent Appointment</div>
                      <div className="text-xs opacity-80">Summary below — confirm via WhatsApp</div>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Treatment", selected.treatment >= 0 ? TREATMENTS[selected.treatment]?.name : "Not selected"],
                      ["Doctor", selected.doctor === 99 ? "No preference" : selected.doctor >= 0 ? DOCTORS[selected.doctor]?.name : "Not selected"],
                      ["Date", selected.date || "Not selected"],
                      ["Time", selected.time || "Not selected"],
                      ["Patient", `${details.firstName} ${details.lastName}`.trim() || "Not provided"],
                      ["Location", "88 Crescent Ave, Beverly Hills"],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between py-2 border-b" style={{ borderColor: "var(--border)" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>{l}</span>
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {submitError && <div className="rounded-xl px-3 py-2 text-sm bg-red-50 text-red-700">{submitError}</div>}
                  {submitted ? <div className="rounded-2xl p-4 text-center" style={{ background: "#ecfdf3", color: "#15803d" }}><CheckCircle2 size={22} className="mx-auto mb-2" /><div className="font-semibold text-sm">Booking request received</div><div className="text-xs mt-1">The clinic can now see your request even if you close WhatsApp.</div></div> : <button disabled={submitting} onClick={async () => {
                    setSubmitting(true); setSubmitError("");
                    try {
                      const treatment = selected.treatment >= 0 ? TREATMENTS[selected.treatment]?.name : undefined;
                      const doctor = selected.doctor === 99 ? "No preference" : selected.doctor >= 0 ? DOCTORS[selected.doctor]?.name : undefined;
                      await clinicRepository.createBookingRequest({ full_name: `${details.firstName} ${details.lastName}`.trim(), email: details.email, phone: details.phone, requested_treatment: treatment, requested_doctor: doctor, preferred_date: selected.date, preferred_time: selected.time, notes: details.notes });
                      setSubmitted(true);
                      window.open(BRAND.whatsapp, "_blank", "noopener,noreferrer");
                    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Unable to save your booking request."); }
                    finally { setSubmitting(false); }
                  }} className="flex items-center justify-center gap-2 w-full py-4 rounded-full text-sm font-semibold shadow-lg" style={{ background: "#25D366", color: "white" }}>{submitting ? "Saving request..." : "💬 Save Request & Continue to WhatsApp"}</button>}
                  <div className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Your request is stored before WhatsApp opens.
                  </div>
                  <button onClick={() => setStep(4)} className="w-full py-3 rounded-full text-sm border"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Edit Details</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
