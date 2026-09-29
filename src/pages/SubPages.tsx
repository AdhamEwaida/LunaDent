import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, Star, Calendar, Sparkles } from "lucide-react";
import { TREATMENTS, DOCTORS, IMAGES, METRICS } from "@/lib/data";
import { FadeIn, StaggerGroup, StaggerItem, HoverCard, ScaleIn } from "@/components/Motion";

// ===== TREATMENTS PAGE =====
export function Treatments() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3 block">Our Services</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Premium Dental Treatments
          </h1>
          <p className="text-base text-white/75 mb-8 max-w-xl mx-auto">
            World-class cosmetic, restorative, and preventive dental care — all under one roof in Beverly Hills.
          </p>
          <Link to="/booking" className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold"
            style={{ background: "#D7B98E", color: "#2E2A2F" }}>
            <Calendar size={15} />Book Free Consultation
          </Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TREATMENTS.map((t, i) => (
            <StaggerItem key={t.id}>
              <HoverCard className="h-full">
                <div className="rounded-2xl overflow-hidden border h-full flex flex-col cursor-pointer"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  onClick={() => setActive(active === i ? null : i)}>
                  <div className="relative h-52 overflow-hidden">
                    <img src={t.img} alt={t.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(59,30,84,0.8) 0%, transparent 50%)" }} />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div>
                        <div className="text-white font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t.name}</div>
                        <div className="text-white/70 text-xs">{t.price} · {t.duration}</div>
                      </div>
                      <span className="text-2xl">{t.icon}</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: "var(--muted-foreground)" }}>{t.desc}</p>
                    {active === i && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        className="mb-4 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                          Our {t.name} treatment combines the latest technology with expert specialist care, ensuring precision, comfort, and stunning long-lasting results. Fully customized to your unique smile goals.
                        </p>
                      </motion.div>
                    )}
                    <div className="flex gap-2">
                      <Link to="/treatments" className="flex-1 py-2 text-center rounded-xl text-xs font-medium"
                        style={{ background: "var(--secondary)", color: "var(--primary)" }}>Details</Link>
                      <Link to="/booking" className="flex-1 py-2 text-center rounded-xl text-xs font-medium"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Book Now</Link>
                    </div>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </div>
  );
}

// ===== DOCTORS PAGE =====
export function Doctors() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <section className="py-20" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3 block">Clinical Team</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            LunaDent Dental Team
          </h1>
          <p className="text-base text-white/75 max-w-xl mx-auto">
            Verified clinician profiles will appear here after they are configured by the clinic administrator.
          </p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl border p-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No public clinician profiles have been published yet.
          </p>
          <Link to="/booking" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full text-sm font-semibold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Calendar size={14} />Request an Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}

// ===== BEFORE & AFTER PAGE =====
export function BeforeAfterPage() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <section className="py-20" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3 block">Treatment Gallery</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Before & After
          </h1>
          <p className="text-base text-white/75 max-w-xl mx-auto">
            Patient cases will only be published with appropriate clinic review and patient consent.
          </p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl border p-10" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No public cases have been published yet.</p>
        </div>
      </div>
    </div>
  );
}

// ===== MEDIA CENTER =====
export function MediaCenter() {
  const videos = Array.from({length: 9}, (_, i) => ({
    title: ["Hollywood Smile: Sofia's Journey","Digital Smile Design Walk-Through","LunaDent Studio Tour 2026","Dr. Laurent on Veneers","Implant Day at LunaDent","Clear Aligner Before & After","Our 3D Technology Explained","Meet Dr. Adebayo","Kids Dentistry at LunaDent"][i],
    thumb: [IMAGES.hero1,IMAGES.clinic1,IMAGES.clinic2,IMAGES.smile2,IMAGES.teeth1,IMAGES.smile3,IMAGES.tech1,IMAGES.doctor2,IMAGES.smile4][i],
    duration: ["3:42","5:18","2:55","4:11","6:03","3:28","7:15","2:40","4:55"][i],
    type: ["Patient Story","Educational","Studio","Interview","Patient Story","Before & After","Technology","Interview","Family"][i],
  }));

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <section className="py-20" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3 block">Media Center</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            LunaDent in Action
          </h1>
          <p className="text-base text-white/75 max-w-xl mx-auto">
            Patient stories, educational videos, studio tours, and doctor interviews.
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v, i) => (
            <StaggerItem key={i}>
              <HoverCard>
                <div className="rounded-2xl overflow-hidden border cursor-pointer" style={{ borderColor: "var(--border)" }}>
                  <div className="relative h-48">
                    <img src={v.thumb} alt={v.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(59,30,84,0.4)" }}>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl bg-white hover:scale-110 transition-transform">
                        <Play size={22} fill="var(--primary)" color="var(--primary)" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-xs bg-black/70 text-white">{v.duration}</div>
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs text-white" style={{ background: "var(--accent)" }}>{v.type}</div>
                  </div>
                  <div className="p-4" style={{ background: "var(--card)" }}>
                    <h3 className="font-medium text-sm leading-snug" style={{ color: "var(--foreground)" }}>{v.title}</h3>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </div>
  );
}

// ===== COST CALCULATOR PAGE =====
export function CostCalculator() {
  const [step, setStep] = useState(1);
  const [treatment, setTreatment] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [
    { id: "urgency", label: "How soon are you looking to start?", opts: ["ASAP","Within 3 months","Within 6 months","Just exploring"] },
    { id: "insurance", label: "Do you have dental insurance?", opts: ["Yes — full coverage","Yes — partial","No insurance","Not sure"] },
    { id: "goal", label: "What is your primary goal?", opts: ["Cosmetic improvement","Fix dental issue","Preventive care","Complete overhaul"] },
  ];

  const estimates = [0, 4200, 1200, 3500, 2400, 3500, 350, 600, 180, 600];
  const baseEst = treatment >= 0 ? estimates[treatment] : 0;
  const range = baseEst > 0 ? `$${Math.round(baseEst * 0.9).toLocaleString()} – $${Math.round(baseEst * 1.2).toLocaleString()}` : "$TBD";

  return (
    <div className="min-h-screen py-12 pb-24" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto px-4">
        <FadeIn className="text-center mb-10">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Cost Estimator</span>
          <h1 className="text-4xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Treatment Cost Calculator
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
            Get a personalized estimate in under 2 minutes. No commitment required.
          </p>
        </FadeIn>

        <FadeIn>
          <div className="rounded-3xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            {step === 1 && (
              <div>
                <h2 className="font-semibold text-base mb-4" style={{ color: "var(--foreground)" }}>Select a Treatment</h2>
                <div className="grid grid-cols-2 gap-2">
                  {TREATMENTS.map((t, i) => (
                    <button key={t.id} onClick={() => setTreatment(i)}
                      className="flex items-center gap-2 p-3 rounded-xl border text-left text-sm"
                      style={{
                        background: treatment === i ? "var(--primary)" : "var(--muted)",
                        color: treatment === i ? "white" : "var(--foreground)",
                        borderColor: treatment === i ? "var(--primary)" : "transparent",
                      }}>
                      <span>{t.icon}</span>{t.name}
                    </button>
                  ))}
                </div>
                <button onClick={() => treatment >= 0 && setStep(2)}
                  className="mt-4 w-full py-3 rounded-full text-sm font-semibold"
                  style={{ background: treatment >= 0 ? "var(--primary)" : "var(--muted)", color: treatment >= 0 ? "white" : "var(--muted-foreground)" }}>
                  Continue
                </button>
              </div>
            )}

            {step > 1 && step <= questions.length + 1 && step < questions.length + 2 && (
              <div>
                <div className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Question {step - 1} of {questions.length}</div>
                <h2 className="font-semibold text-base mb-4" style={{ color: "var(--foreground)" }}>{questions[step - 2].label}</h2>
                <div className="space-y-2">
                  {questions[step - 2].opts.map(o => (
                    <button key={o} onClick={() => { setAnswers(a => ({...a, [questions[step-2].id]: o})); setStep(s => s + 1); }}
                      className="w-full py-3 px-4 rounded-xl text-sm text-left border hover:-translate-y-0.5 transition-all"
                      style={{
                        background: answers[questions[step-2].id] === o ? "var(--primary)" : "var(--muted)",
                        color: answers[questions[step-2].id] === o ? "white" : "var(--foreground)",
                        borderColor: "var(--border)",
                      }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === questions.length + 2 && (
              <div>
                <h2 className="font-semibold text-base mb-2" style={{ color: "var(--foreground)" }}>Your details</h2>
                <div className="space-y-3 mb-4">
                  {[["Name","Your full name"],["Phone","+1 (xxx) xxx-xxxx"],["Email","your@email.com"]].map(([l,p]) => (
                    <div key={l}>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>{l}</label>
                      <input placeholder={p} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                    </div>
                  ))}
                </div>
                <button onClick={() => setStep(s => s + 1)}
                  className="w-full py-3 rounded-full text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  Show My Estimate
                </button>
              </div>
            )}

            {step === questions.length + 3 && (
              <div className="text-center">
                <div className="text-5xl mb-4">💰</div>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>Estimated Cost Range</div>
                <div className="text-4xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                  {range}
                </div>
                <div className="text-sm mb-1" style={{ color: "var(--foreground)" }}>
                  For: {treatment >= 0 ? TREATMENTS[treatment].name : "Your selected treatment"}
                </div>
                <p className="text-xs mb-6" style={{ color: "var(--muted-foreground)" }}>
                  *This is an estimate based on your inputs. A precise quote will be provided at your free consultation.
                </p>
                <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  <Calendar size={14} />Book Free Consultation
                </Link>
                <button onClick={() => { setStep(1); setTreatment(-1); setAnswers({}); }}
                  className="block mx-auto mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Start over
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ===== SMILE ASSESSMENT / SIMULATION =====
export function SmileAssessment() {
  const [step, setStep] = useState(1);
  const questions = [
    { q: "What best describes your smile concern?", opts: ["Discoloration","Crooked teeth","Missing teeth","Chipped or worn","Gum issues","I just want an upgrade!"] },
    { q: "How would you describe your dream smile?", opts: ["Brilliantly white","Naturally subtle","Perfectly straight","Complete transformation","As natural as possible"] },
    { q: "Have you had any dental work in the past 2 years?", opts: ["Yes","No","Not sure"] },
    { q: "What is your timeline for starting treatment?", opts: ["Ready now","Within 3 months","Just exploring","Need financing"] },
  ];
  const [ans, setAns] = useState<number[]>([]);

  return (
    <div className="min-h-screen py-12 pb-24" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto px-4">
        <FadeIn className="text-center mb-10">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>AI Assessment</span>
          <h1 className="text-4xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Discover Your Perfect Smile
          </h1>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "var(--muted-foreground)" }}>
            Answer 4 quick questions to receive a personalized smile treatment recommendation.
          </p>
        </FadeIn>

        <FadeIn>
          <div className="rounded-3xl border p-7" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {questions.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < step - 1 ? "var(--primary)" : i === step - 1 ? "var(--accent)" : "var(--muted)" }} />
              ))}
            </div>

            {step <= questions.length && (
              <div>
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Question {step} of {questions.length}</div>
                <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--foreground)", fontFamily: "'Cormorant Garamond', serif" }}>
                  {questions[step - 1].q}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {questions[step - 1].opts.map((o, i) => (
                    <button key={i} onClick={() => { setAns([...ans, i]); setStep(s => s + 1); }}
                      className="py-3 px-4 rounded-xl text-sm text-left border hover:-translate-y-0.5 transition-all"
                      style={{ background: "var(--muted)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === questions.length + 1 && (
              <div className="text-center">
                <div className="text-5xl mb-4">✨</div>
                <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                  Your Smile Profile
                </h2>
                <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>Based on your answers, we recommend:</p>
                <div className="p-4 rounded-xl mb-6" style={{ background: "var(--secondary)" }}>
                  <div className="font-bold mb-1" style={{ color: "var(--primary)" }}>Hollywood Smile + Teeth Whitening</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>2–3 sessions · From $4,200 · Perfect for your goals</div>
                </div>
                <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  <Calendar size={14} />Book Free Consultation
                </Link>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ===== CONTACT PAGE =====
export function Contact() {
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--background)" }}>
      <section className="py-20" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Contact LunaDent
          </h1>
          <p className="text-base text-white/75">Request an appointment online and the clinic team can follow up with you.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-3xl border p-8 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Appointment Requests
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            Clinic address, phone, email and opening hours will appear here once the clinic administrator publishes verified contact details.
          </p>
          <Link to="/booking" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Calendar size={14} />Request an Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
