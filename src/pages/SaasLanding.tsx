import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Building2, CalendarDays, Check, CreditCard, Globe2, Palette, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { saasRepository } from "@/saas/repository";
import { supabase } from "@/lib/supabase";
import type { SaasPlan, ThemeDefinition } from "@/saas/types";
import { useAuth } from "@/auth/AuthContext";

const featureCards = [
  { icon: UsersRound, title: "Patient CRM", text: "Patient records, medical history, documents and secure portal access." },
  { icon: CalendarDays, title: "Appointments", text: "Clinic scheduling, booking requests and role-aware operations." },
  { icon: CreditCard, title: "Accounting", text: "Invoices, payments, balances and finance workflows per clinic." },
  { icon: Palette, title: "Website Builder", text: "Choose a theme and customize colors, fonts, sizes, spacing, images and sections." },
  { icon: ShieldCheck, title: "Tenant Isolation", text: "Every clinic is isolated with clinic-scoped data and Row Level Security." },
  { icon: BarChart3, title: "Operations", text: "Doctors, treatments, inventory and clinic dashboards in one workspace." },
];

const featureLabels: Record<string, string> = {
  website: "Branded clinic website",
  patients: "Patient CRM",
  appointments: "Appointments & booking",
  patient_portal: "Secure patient portal",
  accounting: "Accounting",
  inventory: "Inventory",
  all_themes: "All website themes",
};

const limitLabels: Record<string, string> = {
  staff: "staff accounts",
  dentists: "dentists",
  storage_gb: "GB storage",
};

const themeAccent: Record<string, string> = {
  modern: "#2457C5",
  luxury: "#3E2A7E",
  clinical: "#0F6CBD",
};

export default function SaasLanding() {
  const { isSuperAdmin, role } = useAuth();
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [selectedTheme, setSelectedTheme] = useState("modern");
  const [lead, setLead] = useState({ full_name: "", clinic_name: "", email: "", phone: "", message: "" });
  const [leadState, setLeadState] = useState<"idle" | "sending" | "sent">("idle");
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    void Promise.all([saasRepository.listThemes(), saasRepository.listPlans()])
      .then(([themeRows, planRows]) => {
        setThemes(themeRows);
        setPlans(planRows);
      })
      .catch(() => {});
  }, []);

  const submitLead = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLeadError("");
    setLeadState("sending");
    const { error } = await supabase.from("saas_leads").insert({
      full_name: lead.full_name.trim(),
      clinic_name: lead.clinic_name.trim() || null,
      email: lead.email.trim().toLowerCase(),
      phone: lead.phone.trim() || null,
      message: lead.message.trim() || null,
    });
    if (error) {
      setLeadError(error.message);
      setLeadState("idle");
      return;
    }
    setLeadState("sent");
  };

  const dashboardHref = isSuperAdmin ? "/super-admin" : role && role !== "patient" ? "/admin" : "/staff/login";
  const dashboardLabel = isSuperAdmin ? "Super Admin" : role && role !== "patient" ? "Clinic Workspace" : "Staff Sign In";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-20 px-5 flex items-center justify-between gap-5">
          <Link to="/" className="flex items-center gap-3 font-bold">
            <span className="w-10 h-10 rounded-2xl grid place-items-center bg-gradient-to-br from-violet-500 to-cyan-400">L</span>
            <span>LunaDent <span className="text-slate-400 font-medium">SaaS</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-300">
            <a href="#platform">Platform</a>
            <a href="#themes">Themes</a>
            <a href="#pricing">Pricing</a>
            <a href="#demo">Request Demo</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to={dashboardHref} className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border border-white/15 text-sm font-semibold text-white">
              {dashboardLabel}
            </Link>
            <Link to="/start" className="px-4 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-semibold">
              Start Clinic
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(124,58,237,.28),transparent_32%),radial-gradient(circle_at_82%_30%,rgba(6,182,212,.2),transparent_30%)]" />
          <div className="relative max-w-7xl mx-auto px-5 py-24 md:py-32 grid lg:grid-cols-[1.08fr_.92fr] gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-200 text-xs font-semibold mb-6">
                <Sparkles size={14} /> Dental Clinic SaaS Platform
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[.98]">
                Run every dental clinic from <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">one platform.</span>
              </h1>
              <p className="mt-7 text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
                Sell a complete digital clinic experience: operations, patient portal, accounting, staff access and a customizable branded website for every clinic.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/start?theme=modern&plan=pro" className="px-6 py-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 font-semibold inline-flex items-center gap-2">
                  Start a clinic <ArrowRight size={17} />
                </Link>
                <a href="#themes" className="px-6 py-3.5 rounded-xl border border-white/15 bg-white/5 font-semibold">Explore live themes</a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2"><Check size={15} /> Multi-tenant</span>
                <span className="inline-flex items-center gap-2"><Check size={15} /> Role-based access</span>
                <span className="inline-flex items-center gap-2"><Check size={15} /> Custom clinic websites</span>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[.06] p-4 shadow-2xl">
              <div className="rounded-[24px] bg-white text-slate-950 overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2"><Building2 size={18} /><b>Clinic Workspace</b></div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50">
                  {["Patients","Today","Revenue","Bookings"].map((label,index)=>(
                    <div key={label} className="rounded-2xl bg-white border p-4">
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className="text-2xl font-bold mt-2">{["1,284","18","$8.4k","27"][index]}</div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <div className="rounded-2xl h-36 bg-gradient-to-r from-violet-100 via-fuchsia-50 to-cyan-100 flex items-end p-4">
                    <div><div className="font-bold">Website Builder</div><div className="text-sm text-slate-600">Theme · Colors · Typography · Layout · Sections</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="max-w-7xl mx-auto px-5 py-24">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-cyan-300">One operating system</div>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Everything a clinic needs after you sell the service.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {featureCards.map(({icon:Icon,title,text})=>(
              <div key={title} className="rounded-3xl border border-white/10 bg-white/[.04] p-6">
                <div className="w-11 h-11 rounded-2xl bg-white/10 grid place-items-center mb-5"><Icon size={20} /></div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mt-2">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="themes" className="bg-white text-slate-950 py-24">
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div className="max-w-2xl">
                <div className="text-sm font-semibold text-violet-600">Clinic website themes</div>
                <h2 className="text-4xl md:text-5xl font-bold mt-3">One platform. Different clinic identities.</h2>
                <p className="text-slate-600 mt-4">Owners can switch themes and customize colors, typography, spacing, radii, images, section visibility and page copy without touching code.</p>
              </div>
              <Globe2 size={44} className="text-slate-300" />
            </div>
            <div className="grid lg:grid-cols-3 gap-5 mt-12">
              {themes.map((theme)=>{
                const selected = selectedTheme === theme.key;
                return (
                  <div key={theme.key} className={`rounded-[28px] border overflow-hidden bg-white shadow-sm transition ${selected ? "ring-2 ring-violet-500 border-violet-400" : ""}`}>
                    <div className="h-52 p-5" style={{background:`linear-gradient(135deg,${themeAccent[theme.key] || "#475569"}18,${themeAccent[theme.key] || "#475569"}55)`}}>
                      <div className="h-full rounded-2xl bg-white/90 border p-4 flex flex-col">
                        <div className="h-3 w-28 rounded-full" style={{background:themeAccent[theme.key] || "#475569"}} />
                        <div className="mt-auto">
                          <div className="h-5 w-3/4 bg-slate-900 rounded mb-2" />
                          <div className="h-2 w-full bg-slate-200 rounded mb-1" />
                          <div className="h-2 w-2/3 bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold">{theme.name}</h3>
                        {selected ? <span className="text-[11px] px-2 py-1 rounded-full bg-violet-100 text-violet-800 font-semibold">Selected</span> : theme.premium && <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">Premium</span>}
                      </div>
                      <p className="text-sm text-slate-600 mt-2 min-h-10">{theme.description}</p>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button type="button" onClick={()=>setSelectedTheme(theme.key)} className="rounded-xl border px-3 py-2.5 text-sm font-semibold">
                          {selected ? "Selected" : "Choose theme"}
                        </button>
                        <Link to={`/demo/theme/${theme.key}`} className="rounded-xl bg-slate-950 px-3 py-2.5 text-center text-sm font-semibold text-white">
                          Live demo
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 text-center text-sm text-slate-500">Selected theme: <b className="text-slate-900">{themes.find((theme)=>theme.key===selectedTheme)?.name || "Modern"}</b>. Choose a plan below to continue.</div>
          </div>
        </section>

        <section id="pricing" className="max-w-7xl mx-auto px-5 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-sm font-semibold text-cyan-300">Plans</div>
            <h2 className="text-4xl md:text-5xl font-bold mt-3">Choose the operating level that fits the clinic.</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-5 mt-12">
            {plans.map((plan)=>{
              const compatible = selectedTheme === "modern" || Boolean(plan.features?.all_themes);
              return (
                <div key={plan.code} className={`rounded-3xl border p-7 ${plan.code==="pro"?"border-violet-400 bg-violet-500/10":"border-white/10 bg-white/[.04]"} ${compatible?"":"opacity-60"}`}>
                  <div className="font-bold text-xl">{plan.name}</div>
                  <p className="text-sm text-slate-400 mt-2 min-h-10">{plan.description}</p>
                  <div className="mt-6"><span className="text-4xl font-black">{plan.currency === "USD" ? "$" : ""}{Number(plan.price_monthly).toFixed(0)}</span><span className="text-slate-400"> / month</span></div>
                  <div className="mt-6 space-y-2 text-sm text-slate-300">
                    {Object.entries(plan.features || {}).filter(([,enabled])=>enabled).map(([key])=>(
                      <div key={key} className="flex items-center gap-2"><Check size={14} className="text-emerald-300" />{featureLabels[key] || key.replaceAll("_"," ")}</div>
                    ))}
                    {Object.entries(plan.limits || {}).filter(([key])=>key in limitLabels).map(([key,value])=>(
                      <div key={key} className="flex items-center gap-2 text-slate-400"><Check size={14} />Up to {value} {limitLabels[key]}</div>
                    ))}
                    {compatible ? (
                      <Link to={`/start?plan=${encodeURIComponent(plan.code)}&theme=${encodeURIComponent(selectedTheme)}`} className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-4 py-3 font-semibold text-white hover:bg-white/5">
                        Choose {plan.name}
                      </Link>
                    ) : (
                      <button type="button" onClick={()=>setSelectedTheme("modern")} className="mt-6 w-full rounded-xl border border-amber-300/30 px-4 py-3 font-semibold text-amber-200">
                        Use Modern with {plan.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 text-center text-xs text-slate-500">Prototype checkout: choosing a plan continues to clinic signup. No real payment is collected yet.</div>
        </section>

        <section id="demo" className="bg-gradient-to-br from-violet-600 to-slate-950 py-24">
          <div className="max-w-5xl mx-auto px-5 grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="text-sm font-semibold text-violet-200">Request a demo</div>
              <h2 className="text-4xl md:text-5xl font-bold mt-3">Ready to launch your clinic workspace?</h2>
              <p className="text-violet-100/80 mt-5 leading-relaxed">Send the clinic details. The Super Admin can provision a tenant, owner account, plan and starting theme from the platform console.</p>
            </div>
            <form onSubmit={submitLead} className="rounded-3xl bg-white text-slate-950 p-6 md:p-8">
              {leadState === "sent" ? (
                <div className="py-12 text-center">
                  <Check size={38} className="mx-auto text-emerald-600" />
                  <h3 className="text-2xl font-bold mt-4">Request received</h3>
                  <p className="text-sm text-slate-600 mt-2">The LunaDent team can now follow up from the Super Admin console.</p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input required placeholder="Your name" value={lead.full_name} onChange={e=>setLead({...lead,full_name:e.target.value})} className="px-4 py-3 rounded-xl border" />
                    <input placeholder="Clinic name" value={lead.clinic_name} onChange={e=>setLead({...lead,clinic_name:e.target.value})} className="px-4 py-3 rounded-xl border" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <input required type="email" placeholder="Email" value={lead.email} onChange={e=>setLead({...lead,email:e.target.value})} className="px-4 py-3 rounded-xl border" />
                    <input placeholder="Phone" value={lead.phone} onChange={e=>setLead({...lead,phone:e.target.value})} className="px-4 py-3 rounded-xl border" />
                  </div>
                  <textarea placeholder="Tell us about the clinic" value={lead.message} onChange={e=>setLead({...lead,message:e.target.value})} className="mt-3 w-full px-4 py-3 rounded-xl border min-h-28" />
                  {leadError && <div className="text-sm text-red-600 mt-3">{leadError}</div>}
                  <button disabled={leadState==="sending"} className="mt-4 w-full py-3.5 rounded-xl bg-slate-950 text-white font-semibold">
                    {leadState==="sending" ? "Sending..." : "Request Demo"}
                  </button>
                </>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row gap-4 justify-between md:items-center">
          <span>© 2026 LunaDent SaaS · Multi-tenant dental clinic platform</span>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300">Terms</Link>
            <a href="#demo" className="hover:text-slate-300">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
