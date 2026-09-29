import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Star, Shield, Award, Users, Clock, ChevronLeft, ChevronRight, Play, Sparkles, CheckCircle2, Calendar, TrendingUp, Heart, Zap, Globe, Smile } from "lucide-react";
import { BRAND, IMAGES, TREATMENTS, DOCTORS, TESTIMONIALS, BLOG_POSTS, METRICS, ACCREDITATIONS, JOURNEY_STEPS } from "@/lib/data";
import { FadeIn, StaggerGroup, StaggerItem, HoverCard, ScaleIn } from "@/components/Motion";

// ===== HERO =====
function Hero() {
  const [imgIdx, setImgIdx] = useState(0);
  const heroImgs = [IMAGES.hero1, IMAGES.hero3, IMAGES.smile4, IMAGES.smile2];
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const t = setInterval(() => setImgIdx(i => (i + 1) % heroImgs.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, #5B2D7E 50%, var(--accent) 100%)" }}>

      {/* Animated BG blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--accent), transparent)" }} />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #D7B98E, transparent)" }} />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.05), transparent)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Text Side */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,248,242,0.9)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <Sparkles size={12} />Beverly Hills Premium Dental Studio
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "#FFF8F2" }}>
              A Softer,{" "}
              <em className="not-italic" style={{ color: "#D7B98E" }}>Smarter</em>
              {" "}Way to Transform Your Smile
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg leading-relaxed mb-8 max-w-lg opacity-80"
              style={{ color: "rgba(255,248,242,0.85)" }}>
              {BRAND.subtitle}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-4 mb-10">
              <Link to="/booking"
                className="flex items-center gap-2 px-7 py-4 rounded-full font-semibold transition-all hover:-translate-y-1 hover:shadow-2xl shadow-lg"
                style={{ background: "#D7B98E", color: "#2E2A2F" }}>
                <Calendar size={16} />Book Consultation
              </Link>
              <Link to="/treatments"
                className="flex items-center gap-2 px-7 py-4 rounded-full font-semibold border transition-all hover:bg-white/10"
                style={{ border: "1px solid rgba(255,255,255,0.35)", color: "#FFF8F2" }}>
                Explore Treatments <ArrowRight size={15} />
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="flex flex-wrap items-center gap-6">
              {[{ icon: <Star size={13} fill="currentColor" />, text: "4.9 / 5 Rating" }, { icon: <Shield size={13} />, text: "ADA Certified" }, { icon: <Users size={13} />, text: "12,400+ Patients" }].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm opacity-75" style={{ color: "#FFF8F2" }}>
                  <span style={{ color: "#D7B98E" }}>{b.icon}</span>{b.text}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Image Side */}
          <motion.div style={{ y, opacity }} className="relative">
            <div className="relative h-[520px] lg:h-[640px]">
              {/* Main image */}
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 85% 100%, 0 100%)" }}>
                <AnimatePresence mode="wait">
                  <motion.img key={imgIdx} src={heroImgs[imgIdx]} alt="LunaDent Hero"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }} />
                </AnimatePresence>
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(59,30,84,0.5) 0%, transparent 60%)" }} />
              </div>

              {/* Floating Booking Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9, duration: 0.6 }}
                className="absolute -bottom-4 -left-4 md:-left-8 w-64 rounded-2xl p-4 shadow-2xl"
                style={{ background: "rgba(255,248,242,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(215,185,142,0.3)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: "var(--primary)", color: "white" }}>✨</div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--primary)" }}>Quick Booking</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Next available: Today 3PM</div>
                  </div>
                </div>
                <Link to="/booking"
                  className="block text-center py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--primary)", color: "white" }}>
                  Book Free Consultation →
                </Link>
              </motion.div>

              {/* Rating Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.5 }}
                className="absolute top-4 -right-4 md:-right-8 rounded-2xl p-3 shadow-xl"
                style={{ background: "rgba(255,248,242,0.95)", backdropFilter: "blur(20px)" }}>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>4.9</div>
                  <div className="flex justify-center gap-0.5 my-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} fill="#D7B98E" color="#D7B98E" />)}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>312 Reviews</div>
                </div>
              </motion.div>

              {/* Image dots */}
              <div className="absolute bottom-4 right-4 flex gap-1.5">
                {heroImgs.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className="w-1.5 h-1.5 rounded-full transition-all"
                    style={{ background: i === imgIdx ? "#D7B98E" : "rgba(255,255,255,0.4)", width: i === imgIdx ? "20px" : "6px" }} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" preserveAspectRatio="none" className="w-full h-16">
          <path d="M0,80 L0,30 Q360,0 720,30 Q1080,60 1440,30 L1440,80 Z" fill="var(--background)" />
        </svg>
      </div>
    </section>
  );
}

// ===== METRICS STRIP =====
function MetricsStrip() {
  const [counts, setCounts] = useState(METRICS.map(() => 0));
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section ref={ref} className="py-10" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {METRICS.map((m, i) => (
            <motion.div key={i}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="text-center p-6 rounded-2xl border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                {m.value}
              </div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{m.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ===== ACCREDITATIONS =====
function AccreditedExcellence() {
  return (
    <section className="py-20 overflow-hidden" style={{ background: "var(--secondary)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn className="text-center mb-12">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Certified & Trusted</span>
          <h2 className="text-4xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Accredited Excellence
          </h2>
        </FadeIn>
        <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {ACCREDITATIONS.map((a, i) => (
            <StaggerItem key={i}>
              <HoverCard className="h-full">
                <div className="p-8 rounded-2xl text-center border-2 h-full"
                  style={{ background: "var(--card)", borderColor: "var(--ring)", boxShadow: "0 4px 24px rgba(215,185,142,0.15)" }}>
                  <div className="text-4xl mb-4">{a.icon}</div>
                  <div className="font-bold text-sm mb-1" style={{ color: "var(--primary)" }}>{a.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.sub}</div>
                  <div className="mt-4 w-8 h-0.5 mx-auto rounded-full" style={{ background: "var(--ring)" }} />
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

// ===== WHY CHOOSE US =====
const WHY_ITEMS = [
  { icon: <Heart size={24} />, title: "Gentle Patient Experience", desc: "Every visit crafted for maximum comfort, calm, and care — from reception to recovery." },
  { icon: <Zap size={24} />, title: "Digital Smile Planning", desc: "See your smile transformation before treatment begins with 3D digital simulation." },
  { icon: <Users size={24} />, title: "Specialist Dental Team", desc: "Board-certified specialists in cosmetics, implants, orthodontics, and pediatric care." },
  { icon: <CheckCircle2 size={24} />, title: "Transparent Treatment Plans", desc: "No surprises. Clear, itemized plans with multiple payment options upfront." },
  { icon: <Award size={24} />, title: "Premium Cosmetic Results", desc: "Award-winning outcomes that look natural, feel confident, and last a lifetime." },
  { icon: <TrendingUp size={24} />, title: "Long-Term Follow-Up", desc: "Your care doesn't stop at treatment. Dedicated follow-up and rewards keep you smiling." },
];

function WhyChooseUs() {
  return (
    <section className="py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Our Promise</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              Why Patients Choose <em className="not-italic" style={{ color: "var(--accent)" }}>LunaDent Studio</em>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--muted-foreground)" }}>
              We've reimagined what dental care feels like — combining world-class clinical expertise with the warmth, elegance, and personal attention of a luxury wellness studio.
            </p>
            <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-lg"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Calendar size={15} />Schedule a Visit
            </Link>
          </FadeIn>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_ITEMS.map((item, i) => (
              <StaggerItem key={i}>
                <HoverCard className="h-full">
                  <div className="p-5 rounded-2xl border h-full"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5" style={{ color: "var(--foreground)" }}>{item.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{item.desc}</p>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}

// ===== TREATMENTS =====
function FeaturedTreatments() {
  const [active, setActive] = useState(0);
  return (
    <section className="py-24" style={{ background: "var(--muted)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>What We Offer</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Premium Treatments
          </h2>
        </FadeIn>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {TREATMENTS.map((t, i) => (
            <button key={t.id} onClick={() => setActive(i)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: active === i ? "var(--primary)" : "var(--card)",
                color: active === i ? "var(--primary-foreground)" : "var(--foreground)",
                border: "1px solid var(--border)"
              }}>
              {t.name}
            </button>
          ))}
        </div>

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TREATMENTS.slice(0, 6).map((t, i) => (
            <StaggerItem key={t.id}>
              <HoverCard className="h-full">
                <div className="rounded-2xl overflow-hidden border h-full flex flex-col"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="relative h-48 overflow-hidden">
                    <img src={t.img} alt={t.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(59,30,84,0.7), transparent 50%)" }} />
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(215,185,142,0.9)", color: "#2E2A2F" }}>{t.price}</span>
                    </div>
                    <div className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-lg"
                      style={{ background: "rgba(255,255,255,0.9)" }}>{t.icon}</div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-base mb-1" style={{ color: "var(--foreground)" }}>{t.name}</h3>
                    <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: "var(--muted-foreground)" }}>{t.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <Clock size={11} />{t.duration}
                      </span>
                      <div className="flex gap-2">
                        <Link to="/treatments" className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                          style={{ color: "var(--primary)", background: "var(--secondary)" }}>Learn More</Link>
                        <Link to="/booking" className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Book</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <FadeIn className="text-center mt-10">
          <Link to="/treatments"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
            View All 9 Treatments <ArrowRight size={14} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ===== PATIENT JOURNEY =====
function PatientJourney() {
  const [active, setActive] = useState(0);
  return (
    <section className="py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Step by Step</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Your Smile Journey, Designed With Care
          </h2>
        </FadeIn>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Timeline Steps */}
          <div className="lg:w-2/5 space-y-2">
            {JOURNEY_STEPS.map((s, i) => (
              <motion.button key={i} onClick={() => setActive(i)}
                className="w-full text-left p-5 rounded-2xl transition-all border flex items-start gap-4"
                style={{
                  background: active === i ? "var(--primary)" : "var(--card)",
                  borderColor: active === i ? "var(--primary)" : "var(--border)",
                  color: active === i ? "var(--primary-foreground)" : "var(--foreground)",
                }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: active === i ? "rgba(255,255,255,0.2)" : "var(--secondary)", color: active === i ? "white" : "var(--primary)" }}>
                  {s.step}
                </div>
                <div>
                  <div className="font-semibold text-sm">{s.title}</div>
                  <div className="text-xs mt-1 opacity-70">{s.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Visual Panel */}
          <div className="lg:w-3/5">
            <AnimatePresence mode="wait">
              <motion.div key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-3xl overflow-hidden relative min-h-80 shadow-xl"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                  <div>
                    <div className="text-8xl mb-6 opacity-30 font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "white" }}>
                      0{active + 1}
                    </div>
                    <h3 className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {JOURNEY_STEPS[active].title}
                    </h3>
                    <p className="text-base opacity-80 text-white leading-relaxed max-w-sm mx-auto">
                      {JOURNEY_STEPS[active].desc}
                    </p>
                    <Link to="/journey"
                      className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full text-sm font-semibold"
                      style={{ background: "#D7B98E", color: "#2E2A2F" }}>
                      Learn More <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== BEFORE & AFTER =====
function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(10, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  };

  return (
    <section className="py-24" style={{ background: "var(--secondary)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Real Results</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Smile Transformations
          </h2>
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
            Drag the slider to reveal the before and after — real patients, real results, zero filters.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Interactive Slider */}
          <ScaleIn>
            <div ref={containerRef}
              className="relative h-80 rounded-3xl overflow-hidden cursor-ew-resize select-none shadow-2xl"
              onMouseMove={handleMove} onTouchMove={handleMove}>
              <img src={IMAGES.smile4} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                <img src={IMAGES.hero1} alt="After" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
                <div className="w-0.5 h-full" style={{ background: "rgba(255,255,255,0.8)" }} />
                <div className="absolute w-10 h-10 rounded-full flex items-center justify-center shadow-xl bg-white">
                  <ChevronLeft size={12} style={{ color: "var(--primary)" }} />
                  <ChevronRight size={12} style={{ color: "var(--primary)" }} />
                </div>
              </div>
              <span className="absolute top-4 left-4 px-2 py-1 rounded-full text-xs font-semibold bg-black/50 text-white">Before</span>
              <span className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-sm" style={{ color: "var(--primary)" }}>After ✨</span>
            </div>
          </ScaleIn>

          {/* Case Cards */}
          <StaggerGroup className="space-y-4">
            {[
              { name: "Amelia R.", treatment: "Hollywood Smile", img: IMAGES.hero1, time: "2 sessions" },
              { name: "Sarah K.", treatment: "Porcelain Veneers", img: IMAGES.smile2, time: "3 sessions" },
              { name: "Maria L.", treatment: "Teeth Whitening", img: IMAGES.hero3, time: "1 session" },
            ].map((c, i) => (
              <StaggerItem key={i}>
                <HoverCard>
                  <div className="flex items-center gap-4 p-4 rounded-2xl border"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="flex gap-2 flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden">
                        <img src={c.img} alt="" className="w-full h-full object-cover grayscale" />
                      </div>
                      <div className="w-14 h-14 rounded-xl overflow-hidden">
                        <img src={c.img} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{c.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>{c.treatment}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(i => <Star key={i} size={9} fill="#D7B98E" color="#D7B98E" />)}
                        <span className="text-xs ml-1" style={{ color: "var(--muted-foreground)" }}>{c.time}</span>
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--muted-foreground)" }} />
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
            <StaggerItem>
              <Link to="/before-after" className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all hover:-translate-y-0.5"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                View All Transformations <ArrowRight size={14} />
              </Link>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}

// ===== SMART BOOKING PREVIEW =====
function SmartBookingPreview() {
  const [step, setStep] = useState(1);
  const steps = ["Treatment", "Doctor", "Date", "Details", "Confirm"];
  return (
    <section className="py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Effortless Booking</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              Book Your Smile Appointment in 5 Easy Steps
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--muted-foreground)" }}>
              Our smart booking system adapts to you — choose your treatment, your preferred doctor, and your ideal time. Confirm via WhatsApp in seconds.
            </p>
            <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Calendar size={15} />Start Booking Now
            </Link>
          </FadeIn>

          <ScaleIn>
            <div className="rounded-3xl p-6 shadow-2xl border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6 relative">
                <div className="absolute left-0 right-0 top-4 h-0.5 -z-0" style={{ background: "var(--border)" }} />
                {steps.map((s, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center gap-1 cursor-pointer" onClick={() => setStep(i + 1)}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: step > i ? "var(--primary)" : step === i + 1 ? "var(--accent)" : "var(--muted)",
                        color: step >= i + 1 ? "white" : "var(--muted-foreground)",
                      }}>
                      {step > i ? "✓" : i + 1}
                    </div>
                    <span className="text-xs hidden sm:block" style={{ color: step === i + 1 ? "var(--primary)" : "var(--muted-foreground)" }}>{s}</span>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}>
                  {step === 1 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>Select a Treatment</p>
                      {TREATMENTS.slice(0, 4).map(t => (
                        <button key={t.id} onClick={() => setStep(2)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:border-primary"
                          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                          <span className="text-lg">{t.icon}</span>
                          <div>
                            <div className="text-sm font-medium">{t.name}</div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t.price}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {step === 2 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>Choose Your Doctor</p>
                      {DOCTORS.map(d => (
                        <button key={d.id} onClick={() => setStep(3)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border text-left hover:border-primary transition-all"
                          style={{ borderColor: "var(--border)" }}>
                          <img src={d.img} alt={d.name} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{d.name}</div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{d.title}</div>
                          </div>
                          <div className="ml-auto text-xs flex items-center gap-1" style={{ color: "#D7B98E" }}>
                            <Star size={10} fill="currentColor" />{d.rating}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {step === 3 && (
                    <div>
                      <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>Select a Date</p>
                      <div className="grid grid-cols-7 gap-1 mb-4">
                        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
                          <div key={d} className="text-center text-xs py-1" style={{ color: "var(--muted-foreground)" }}>{d}</div>
                        ))}
                        {Array.from({length: 30}, (_,i) => i+1).map(d => (
                          <button key={d} onClick={() => setStep(4)}
                            className="aspect-square rounded-lg text-xs flex items-center justify-center transition-all hover:bg-primary hover:text-white"
                            style={{
                              background: d === 16 ? "var(--primary)" : "var(--muted)",
                              color: d === 16 ? "white" : "var(--foreground)",
                            }}>{d}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {step === 4 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>Your Details</p>
                      {[["Full Name","Sofia Anderson"],["Phone","+1 (310) 555-0192"],["Email","sofia@email.com"]].map(([l,p]) => (
                        <div key={l}>
                          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>{l}</label>
                          <input placeholder={p} readOnly
                            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                            style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                        </div>
                      ))}
                      <button onClick={() => setStep(5)} className="w-full py-3 rounded-xl text-sm font-semibold mt-2"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        Continue to Confirm
                      </button>
                    </div>
                  )}
                  {step === 5 && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
                        style={{ background: "var(--secondary)" }}>✅</div>
                      <h3 className="font-bold text-lg mb-2" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>
                        Almost Done!
                      </h3>
                      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                        Confirm your appointment via WhatsApp for instant confirmation.
                      </p>
                      <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold"
                        style={{ background: "#25D366", color: "white" }}>
                        💬 Confirm on WhatsApp
                      </a>
                      <button onClick={() => setStep(1)} className="block mx-auto mt-3 text-xs"
                        style={{ color: "var(--muted-foreground)" }}>Start over</button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}

// ===== SMILE ASSESSMENT CTA =====
function SmileAssessmentCTA() {
  return (
    <section className="py-20" style={{ background: "var(--secondary)" }}>
      <div className="max-w-5xl mx-auto px-4">
        <FadeIn>
          <div className="rounded-3xl p-10 md:p-14 text-center shadow-xl overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #7B3FA0 50%, var(--accent) 100%)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #D7B98E, transparent)", transform: "translate(30%, -30%)" }} />
            <Smile size={40} className="mx-auto mb-4 opacity-80 text-white" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Discover Your Perfect Smile
            </h2>
            <p className="text-white/80 text-base mb-8 max-w-lg mx-auto">
              Take our 3-minute AI Smile Assessment to understand your smile goals and get a personalized treatment recommendation.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/smile-assessment"
                className="px-7 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-lg"
                style={{ background: "#D7B98E", color: "#2E2A2F" }}>
                ✨ Start Free Assessment
              </Link>
              <Link to="/calculator"
                className="px-7 py-3.5 rounded-full font-semibold text-sm border border-white/30 text-white hover:bg-white/10 transition-all">
                💰 Estimate Treatment Cost
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ===== DOCTORS PREVIEW =====
function DoctorsPreview() {
  return (
    <section className="py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Our Team</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Meet Your Specialists
          </h2>
        </FadeIn>
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DOCTORS.map((d, i) => (
            <StaggerItem key={d.id}>
              <HoverCard className="h-full">
                <div className="rounded-2xl overflow-hidden border h-full"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="relative h-56 overflow-hidden">
                    <img src={d.img} alt={d.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(59,30,84,0.7) 0%, transparent 50%)" }} />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} size={9} fill="#D7B98E" color="#D7B98E" />)}
                        <span className="text-xs text-white ml-1">{d.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{d.name}</h3>
                    <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--accent)" }}>{d.title}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {d.specialties.slice(0, 2).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "var(--secondary)", color: "var(--primary)" }}>{s}</span>
                      ))}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{d.exp} experience · {d.reviews} reviews</div>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
        <FadeIn className="text-center mt-10">
          <Link to="/doctors" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
            View All Doctors <ArrowRight size={14} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}

// ===== TECHNOLOGY SECTION =====
const TECH_ITEMS = [
  { icon: "🔬", title: "3D CBCT Scanning", desc: "Ultra-precise cone beam imaging for implant planning and diagnosis" },
  { icon: "💻", title: "Digital Smile Design", desc: "AI-powered simulation software to preview your smile outcome" },
  { icon: "🦷", title: "CEREC Same-Day Crowns", desc: "Ceramic restorations designed and milled in a single visit" },
  { icon: "💡", title: "Laser Dentistry", desc: "Minimally invasive, pain-free soft tissue procedures" },
  { icon: "🌡️", title: "Painless Anesthesia", desc: "Computer-controlled injection system for virtually painless delivery" },
  { icon: "📱", title: "Digital Patient Portal", desc: "Manage your entire dental journey from your phone" },
];

function TechnologySection() {
  return (
    <section className="py-24" style={{ background: "var(--muted)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="right" className="order-2 lg:order-1">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden h-80 shadow-xl">
                <img src={IMAGES.tech1} alt="Technology" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 rounded-2xl p-5 shadow-xl border"
                style={{ background: "var(--card)", borderColor: "var(--ring)" }}>
                <div className="text-3xl font-bold mb-1" style={{ color: "var(--primary)", fontFamily: "'Cormorant Garamond', serif" }}>6+</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Advanced Technologies</div>
              </div>
            </div>
          </FadeIn>
          <div className="order-1 lg:order-2">
            <FadeIn direction="left">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Innovation</span>
              <h2 className="text-4xl font-bold mt-3 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                Technology That Elevates Your Care
              </h2>
            </FadeIn>
            <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TECH_ITEMS.map((t, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-start gap-3 p-4 rounded-xl border"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <span className="text-2xl flex-shrink-0">{t.icon}</span>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{t.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t.desc}</div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== TESTIMONIALS =====
function Testimonials() {
  const [idx, setIdx] = useState(0);
  return (
    <section className="py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Patient Stories</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            Real Patients, Real Results
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.id} delay={i * 0.1}>
              <HoverCard className="h-full">
                <div className="p-7 rounded-2xl border h-full relative"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="absolute top-5 right-6 text-5xl opacity-10 font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                    "
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} size={13} fill="#D7B98E" color="#D7B98E" />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 italic" style={{ color: "var(--foreground)" }}>"{t.review}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                    <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2" style={{ borderColor: "var(--ring)" }} />
                    <div>
                      <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{t.name}</div>
                      <div className="text-xs" style={{ color: "var(--accent)" }}>{t.treatment}</div>
                    </div>
                    <div className="ml-auto text-xs px-2 py-1 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                      Verified Patient
                    </div>
                  </div>
                </div>
              </HoverCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== BLOG PREVIEW =====
function BlogPreview() {
  return (
    <section className="py-24" style={{ background: "var(--secondary)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <FadeIn>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Dental Journal</span>
            <h2 className="text-4xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              Latest from the Studio
            </h2>
          </FadeIn>
          <FadeIn direction="left">
            <Link to="/blog" className="hidden md:inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--primary)" }}>
              View all articles <ArrowRight size={14} />
            </Link>
          </FadeIn>
        </div>
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.map((p, i) => (
            <StaggerItem key={p.id}>
              <HoverCard className="h-full">
                <div className="rounded-2xl overflow-hidden border h-full flex flex-col"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="h-44 overflow-hidden">
                    <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--accent)" }}>{p.category}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {p.readTime} read</span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug mb-2 flex-1" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>{p.excerpt}</p>
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.date}</span>
                      <Link to={`/blog/${p.id}`} className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
                        Read more <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

// ===== MEDIA CENTER PREVIEW =====
function MediaCenter() {
  const videos = [
    { title: "Hollywood Smile: A Patient Journey", thumb: IMAGES.hero1, duration: "3:42", type: "Patient Story" },
    { title: "Digital Smile Design Explained", thumb: IMAGES.clinic1, duration: "5:18", type: "Educational" },
    { title: "LunaDent Studio Tour", thumb: IMAGES.clinic2, duration: "2:55", type: "Studio" },
  ];
  return (
    <section className="py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <FadeIn>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Media Center</span>
            <h2 className="text-4xl font-bold mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              See LunaDent in Action
            </h2>
          </FadeIn>
          <Link to="/media" className="hidden md:inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--primary)" }}>
            All videos <ArrowRight size={14} />
          </Link>
        </div>
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map((v, i) => (
            <StaggerItem key={i}>
              <HoverCard>
                <div className="rounded-2xl overflow-hidden border cursor-pointer" style={{ borderColor: "var(--border)" }}>
                  <div className="relative h-44">
                    <img src={v.thumb} alt={v.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(59,30,84,0.4)" }}>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.9)", color: "var(--primary)" }}>
                        <Play size={22} fill="currentColor" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded text-xs font-medium bg-black/70 text-white">
                      {v.duration}
                    </div>
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs"
                      style={{ background: "var(--accent)", color: "white" }}>{v.type}</div>
                  </div>
                  <div className="p-4" style={{ background: "var(--card)" }}>
                    <h3 className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{v.title}</h3>
                  </div>
                </div>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

// ===== COST CALCULATOR CTA =====
function CostCalculatorCTA() {
  return (
    <section className="py-16" style={{ background: "var(--secondary)" }}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <FadeIn>
          <div className="p-10 rounded-3xl border-2" style={{ background: "var(--card)", borderColor: "var(--ring)" }}>
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              Estimate Your Treatment Cost
            </h2>
            <p className="text-base mb-8" style={{ color: "var(--muted-foreground)" }}>
              Our instant cost calculator gives you a personalized treatment estimate in under 2 minutes — no commitment required.
            </p>
            <Link to="/calculator"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Zap size={16} />Get My Estimate
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ===== PATIENT PORTAL PREVIEW =====
function PatientPortalPreview() {
  return (
    <section className="py-24" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>Patient Portal</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
              Your Dental Life, Organized in One Place
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
              Track appointments, view invoices, manage payments, access documents, and collect reward points — all from your personal patient portal.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {["📅 Appointments","📄 Invoices","💳 Payment Plans","⭐ Reward Points","📁 Documents","💬 Messages"].map(i => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--accent)" }} />{i}
                </div>
              ))}
            </div>
            <Link to="/patient-portal" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              Access Patient Portal
            </Link>
          </FadeIn>
          <ScaleIn>
            <div className="rounded-3xl overflow-hidden shadow-2xl border" style={{ borderColor: "var(--border)" }}>
              <div className="p-4" style={{ background: "var(--primary)" }}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {["bg-red-400","bg-yellow-400","bg-green-400"].map(c => <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
                  </div>
                  <span className="text-xs text-white/60 mx-auto">Patient Portal — LunaDent Studio</span>
                </div>
              </div>
              <div className="p-5" style={{ background: "var(--muted)" }}>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--card)" }}>
                  <div className="w-10 h-10 rounded-full" style={{ background: "var(--accent)" }} />
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Welcome, Sofia ✨</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Next visit: Apr 22 — Veneer Follow-Up</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Next Appt", val: "Apr 22", icon: "📅", color: "#3B1E54" },
                    { label: "Balance", val: "$320", icon: "💳", color: "#B96A8D" },
                    { label: "Rewards", val: "2,450 pts", icon: "⭐", color: "#D7B98E" },
                    { label: "Documents", val: "8 files", icon: "📁", color: "#3B1E54" },
                  ].map((c, i) => (
                    <div key={i} className="p-3 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <div className="text-lg mb-1">{c.icon}</div>
                      <div className="font-bold text-sm" style={{ color: c.color }}>{c.val}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.label}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl" style={{ background: "var(--card)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>Recent Invoice #INV-2612</div>
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>Porcelain Veneer — Upper 4</span><span className="font-medium text-green-600">Paid ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}

// ===== FINAL BOOKING CTA =====
function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, #6B2C8C 50%, var(--accent) 100%)" }}>
      <div className="absolute inset-0">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.1), transparent)" }} />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <FadeIn>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 text-white/80 border border-white/20">
            <Star size={11} fill="currentColor" style={{ color: "#D7B98E" }} />
            Beverly Hills' Most Loved Dental Studio
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Your Dream Smile Starts With One Conversation
          </h2>
          <p className="text-lg text-white/75 mb-10 max-w-2xl mx-auto">
            Book your free consultation today. No commitment. No pressure. Just a genuine conversation about the smile you deserve.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/booking"
              className="px-8 py-4 rounded-full font-semibold text-base transition-all hover:-translate-y-1 shadow-2xl"
              style={{ background: "#D7B98E", color: "#2E2A2F" }}>
              <Calendar className="inline mr-2 mb-0.5" size={16} />
              Book Free Consultation
            </Link>
            <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-full font-semibold text-base border border-white/30 text-white hover:bg-white/10 transition-all">
              💬 Chat on WhatsApp
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-10 text-white/60 text-sm">
            <span className="flex items-center gap-1.5"><Shield size={13} />No charge for consultation</span>
            <span className="flex items-center gap-1.5"><Clock size={13} />Same-day appointments available</span>
            <span className="hidden md:flex items-center gap-1.5"><Globe size={13} />10+ languages spoken</span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ===== MAIN HOME PAGE =====
export default function Home() {
  return (
    <>
      <Hero />
      <MetricsStrip />
      <AccreditedExcellence />
      <WhyChooseUs />
      <FeaturedTreatments />
      <PatientJourney />
      <BeforeAfter />
      <SmartBookingPreview />
      <SmileAssessmentCTA />
      <DoctorsPreview />
      <TechnologySection />
      <Testimonials />
      <MediaCenter />
      <BlogPreview />
      <CostCalculatorCTA />
      <PatientPortalPreview />
      <FinalCTA />
    </>
  );
}
